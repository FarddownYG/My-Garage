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
      if (isRefreshTokenError(error)) {
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
  } catch (error: any) {
    // Catch unhandled AuthApiError from refresh attempts
    if (isRefreshTokenError(error)) {
      console.warn('⚠️ Token invalide (catch), nettoyage...');
      await cleanInvalidSession();
    }
    return null;
  }
};

/**
 * Vérifie si une erreur est liée à un refresh token invalide
 */
const isRefreshTokenError = (error: any): boolean => {
  const msg = error?.message?.toLowerCase() || '';
  return msg.includes('refresh') || msg.includes('token') || msg.includes('invalid');
};

/**
 * Nettoyer une session invalide
 */
export const cleanInvalidSession = async () => {
  try {
    console.log('🧹 Nettoyage de la session invalide...');
    
    // Déconnexion locale uniquement (pas d'appel API qui échouerait aussi)
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    
    // Nettoyer manuellement localStorage ET sessionStorage
    [localStorage, sessionStorage].forEach(storage => {
      try {
        const keys = Object.keys(storage);
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            storage.removeItem(key);
          }
        });
      } catch (_) { /* ignore storage access errors */ }
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
 * ⚠️ TRAITE : SIGNED_OUT (déconnexion) et erreurs de token
 */
export const onAuthStateChange = (callback: (user: SupabaseUser | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    // Traiter SIGNED_OUT (déconnexion ou refresh token échoué)
    if (event === 'SIGNED_OUT') {
      console.log('🚨 Déconnexion détectée');
      callback(null);
      return;
    }

    // Si on reçoit TOKEN_REFRESHED sans session valide, c'est un échec silencieux
    if (event === 'TOKEN_REFRESHED' && !session) {
      console.warn('⚠️ Token refresh sans session, nettoyage...');
      await cleanInvalidSession();
      callback(null);
      return;
    }
  });
};