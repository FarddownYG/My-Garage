import { supabase } from './supabase';
import type { SupabaseUser } from '../types';

// ======================================
// 🔐 AUTHENTIFICATION SUPABASE
// ======================================

/**
 * Inscription avec email/password
 */
export const signUp = async (email: string, password: string, fullName?: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      throw error;
    }
    
    if (!data.user) {
      throw new Error('Aucun utilisateur créé');
    }

    // Si une session existe (connexion automatique), créer le profil
    if (data.session) {
      // Créer automatiquement un profil pour ce nouvel utilisateur
      const firstName = fullName?.split(' ')[0] || 'Utilisateur';
      const lastName = fullName?.split(' ').slice(1).join(' ') || '';
      
      try {
        await supabase
          .from('profiles')
          .insert({
            first_name: firstName,
            last_name: lastName,
            name: fullName || 'Utilisateur',
            avatar: '👤',
            is_pin_protected: false,
            is_admin: false,
            user_id: data.user.id,
            is_migrated: true,
            migrated_at: new Date().toISOString(),
          });
      } catch (profileErr) {
        // Ne pas bloquer l'inscription si la création du profil échoue
      }
    }
    
    return { 
      user: data.user, 
      session: data.session,
      needsEmailConfirmation: !data.session 
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Connexion avec email/password
 */
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });    
    if (error) {
      // Supabase retourne 'Invalid login credentials' pour :
      // - Email inexistant, mot de passe incorrect, email non confirmé
      if (error.message === 'Invalid login credentials') {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw error;
    }
    
    return data.user;
  } catch (error) {
    // L'erreur sera loggée dans AuthScreen.tsx
    throw error;
  }
};

/**
 * Connexion avec OAuth (Google, Apple, etc.)
 */
export const signInWithOAuth = async (provider: 'google' | 'apple' | 'github') => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    
    console.log(`✅ Connexion ${provider} initiée`);
    return data;
  } catch (error) {
    console.error(`❌ Erreur connexion ${provider}:`, error);
    throw error;
  }
};

/**
 * Déconnexion
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    console.log('✅ Déconnexion réussie');
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    throw error;
  }
};

/**
 * Obtenir l'utilisateur connecté
 * Utilise getSession() au lieu de getUser() pour éviter les erreurs réseau
 */
export const getCurrentUser = async (): Promise<SupabaseUser | null> => {
  try {
    // Utiliser getSession() qui lit le localStorage, pas de requête réseau
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Si erreur de refresh token, nettoyer et retourner null
    if (error) {
      if (error.message?.includes('refresh') || error.message?.includes('token')) {
        console.warn('⚠️ Token invalide détecté, nettoyage de la session...');
        await cleanInvalidSession();
      }
      return null;
    }
    
    // Si pas de session, retourner null silencieusement
    if (!session) {
      return null;
    }
    
    if (session.user) {
      return {
        id: session.user.id,
        email: session.user.email || '',
        user_metadata: session.user.user_metadata,
      };
    }
    
    return null;
  } catch (error) {
    // Échec silencieux - pas de session est normal
    console.log('ℹ️ Pas de session active');
    return null;
  }
};

/**
 * Nettoyer une session invalide
 */
export const cleanInvalidSession = async () => {
  try {
    console.log('🧹 Nettoyage de la session invalide...');
    
    // Déconnexion forcée (ignore les erreurs)
    await supabase.auth.signOut().catch(() => {});
    
    // Nettoyer manuellement le localStorage Supabase
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Session nettoyée');
  } catch (error) {
    console.error('❌ Erreur nettoyage session:', error);
  }
};

/**
 * Réinitialiser le mot de passe
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    
    console.log('✅ Email de réinitialisation envoyé');
  } catch (error) {
    console.error('❌ Erreur réinitialisation:', error);
    throw error;
  }
};

/**
 * Mettre à jour le mot de passe
 */
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    
    console.log('✅ Mot de passe mis à jour');
  } catch (error) {
    console.error('❌ Erreur mise à jour mot de passe:', error);
    throw error;
  }
};

/**
 * Écouter les changements d'authentification
 * ⚠️ TRAITE UNIQUEMENT : SIGNED_OUT (déconnexion)
 * ⚠️ IGNORE : SIGNED_IN (géré par refreshAuth), INITIAL_SESSION (géré par init), etc.
 */
export const onAuthStateChange = (callback: (user: SupabaseUser | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 onAuthStateChange EVENT:', {
      event,
      userEmail: session?.user?.email || 'null',
      hasSession: !!session,
    });
    
    // ⚠️ WHITELIST : SIGNED_OUT uniquement (pour détecter déconnexion)
    if (event !== 'SIGNED_OUT') {
      console.log('🔇 Événement ignoré:', event, '(géré manuellement)');
      return;
    }
    
    console.log('🚨 ATTENTION: Événement SIGNED_OUT détecté - déconnexion de l\'utilisateur');
    console.trace('Stack trace de la déconnexion:');
    
    // Pour SIGNED_OUT, on passe null au callback
    callback(null);
  });
};
