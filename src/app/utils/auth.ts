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
      },
    });

    if (error) throw error;
    
    console.log('✅ Inscription réussie:', data.user?.email);
    return data.user;
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
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

    if (error) throw error;
    
    console.log('✅ Connexion réussie:', data.user?.email);
    return data.user;
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
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
    
    // Si erreur ou pas de session, retourner null silencieusement
    if (error || !session) {
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
    return null;
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
 */
export const onAuthStateChange = (callback: (user: SupabaseUser | null) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        user_metadata: session.user.user_metadata,
      });
    } else {
      callback(null);
    }
  });
};
