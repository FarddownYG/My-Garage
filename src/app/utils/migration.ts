import { supabase } from './supabase';
import type { Profile } from '../types';

// ======================================
// 🔄 MIGRATION PROFILS → SUPABASE AUTH
// ======================================

/**
 * Interface pour les profils non migrés
 */
export interface UnmigratedProfile {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatar: string;
  vehicleCount: number;
  isPinProtected: boolean;
  pin?: string;
}

/**
 * Récupérer tous les profils non migrés
 * Nécessite une session active
 */
export const getUnmigratedProfiles = async (): Promise<UnmigratedProfile[]> => {
  try {
    // Vérifier qu'on a une session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('ℹ️ Pas de session, profils non migrés non accessibles');
      return [];
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        name,
        avatar,
        is_pin_protected,
        pin,
        user_id
      `)
      .or('is_migrated.is.null,is_migrated.eq.false')
      .is('user_id', null)
      .eq('is_admin', false);

    // Si erreur RLS, retourner tableau vide
    if (error) {
      console.log('ℹ️ Impossible de récupérer profils non migrés (RLS)');
      return [];
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Compter les véhicules pour chaque profil
    const profilesWithCount = await Promise.all(
      profiles.map(async (p) => {
        const { count } = await supabase
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', p.id);

        return {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name || '',
          name: p.name,
          avatar: p.avatar,
          vehicleCount: count || 0,
          isPinProtected: p.is_pin_protected,
          pin: p.pin,
        };
      })
    );

    return profilesWithCount;
  } catch (error) {
    // Échec silencieux
    return [];
  }
};

/**
 * Vérifier si des profils non migrés existent
 * Retourne false en cas d'erreur (pas de session = pas de migration nécessaire)
 */
export const checkMigrationPending = async (): Promise<boolean> => {
  try {
    // Vérifier d'abord si on a une session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Si pas de session, pas besoin de vérifier la migration
    if (!session) {
      return false;
    }

    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .or('is_migrated.is.null,is_migrated.eq.false')
      .is('user_id', null)
      .eq('is_admin', false);

    // Si erreur (ex: RLS), retourner false silencieusement
    if (error) {
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    // Échec silencieux - erreur de session est normale
    return false;
  }
};

/**
 * Migrer un profil vers un utilisateur Supabase Auth
 */
export const migrateProfileToUser = async (
  profileId: string,
  userId: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Migration profil ${profileId} → user ${userId}...`);

    // Appeler la fonction SQL de migration
    const { error } = await supabase.rpc('migrate_profile_to_user', {
      profile_id_param: profileId,
      user_id_param: userId,
    });

    if (error) {
      console.error('❌ Erreur fonction SQL migration:', error);
      throw error;
    }

    console.log(`✅ Profil ${profileId} migré avec succès !`);
    return true;
  } catch (error) {
    console.error('❌ Erreur migration profil:', error);
    return false;
  }
};

/**
 * Migrer automatiquement TOUS les profils d'un utilisateur
 * Utilisé lors de la première connexion d'un nouvel utilisateur
 */
export const autoMigrateAllProfiles = async (userId: string): Promise<number> => {
  try {
    const unmigratedProfiles = await getUnmigratedProfiles();
    
    if (unmigratedProfiles.length === 0) {
      console.log('✅ Aucun profil à migrer');
      return 0;
    }

    console.log(`🔄 Migration automatique de ${unmigratedProfiles.length} profil(s)...`);

    let migratedCount = 0;
    for (const profile of unmigratedProfiles) {
      const success = await migrateProfileToUser(profile.id, userId);
      if (success) {
        migratedCount++;
      }
    }

    console.log(`✅ ${migratedCount}/${unmigratedProfiles.length} profil(s) migré(s)`);
    return migratedCount;
  } catch (error) {
    console.error('❌ Erreur migration automatique:', error);
    return 0;
  }
};

/**
 * Créer un profil lié à un utilisateur Supabase Auth
 */
export const createProfileForUser = async (
  userId: string,
  firstName: string,
  lastName: string,
  avatar: string = '👤'
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        first_name: firstName,
        last_name: lastName,
        name: lastName ? `${firstName} ${lastName}` : firstName,
        avatar,
        is_pin_protected: false,
        is_admin: false,
        user_id: userId,
        is_migrated: true,
        migrated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Profil créé pour user:', userId);

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name || '',
      name: data.name,
      avatar: data.avatar,
      isPinProtected: data.is_pin_protected,
      isAdmin: data.is_admin,
      userId: data.user_id,
      isMigrated: data.is_migrated,
      migratedAt: data.migrated_at,
    };
  } catch (error) {
    console.error('❌ Erreur création profil:', error);
    return null;
  }
};

/**
 * Obtenir tous les profils d'un utilisateur
 */
export const getProfilesByUser = async (userId: string): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_admin', false)
      .order('name');

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((p) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name || '',
      name: p.name,
      avatar: p.avatar,
      isPinProtected: p.is_pin_protected,
      pin: p.pin,
      isAdmin: p.is_admin,
      userId: p.user_id,
      isMigrated: p.is_migrated,
      migratedAt: p.migrated_at,
    }));
  } catch (error) {
    console.error('❌ Erreur récupération profils user:', error);
    return [];
  }
};
