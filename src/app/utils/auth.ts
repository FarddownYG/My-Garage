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
    console.log('📡 Envoi requête signUp à Supabase...', { email, fullName });
    
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

    console.log('📡 Réponse Supabase signUp:', { 
      user: data.user?.email, 
      session: data.session ? 'Oui' : 'Non',
      error: error 
    });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }
    
    if (!data.user) {
      throw new Error('Aucun utilisateur créé');
    }

    // Vérifier si une session a été créée (= utilisateur connecté automatiquement)
    if (data.session) {
      console.log('✅ Inscription réussie avec session (connecté automatiquement)');
    } else {
      console.log('⚠️ Inscription réussie mais SANS session (confirmation email requise)');
      console.log('📧 Vérifiez votre boîte mail pour confirmer votre compte');
    }
    
    return { 
      user: data.user, 
      session: data.session,
      needsEmailConfirmation: !data.session 
    };
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

    if (error) {
      // Détecter si c'est un problème d'email non confirmé
      if (error.message === 'Invalid login credentials') {
        console.error('❌ Identifiants invalides OU email non confirmé');
        const customError: any = new Error(
          'Identifiants incorrects. Si vous venez de créer votre compte, vérifiez d\'abord votre email de confirmation ou demandez à un administrateur de confirmer votre compte.'
        );
        customError.code = 'EMAIL_NOT_CONFIRMED_OR_INVALID';
        throw customError;
      }
      throw error;
    }
    
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
 * ⚠️ ULTRA-FILTRÉ : Traite UNIQUEMENT SIGNED_IN et SIGNED_OUT
 * ⚠️ DEBOUNCED : Ignore les événements duplicatas qui arrivent en rafale
 */
let lastEventTime = 0;
let lastEventType: string | null = null;

export const onAuthStateChange = (callback: (user: SupabaseUser | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 onAuthStateChange EVENT:', event, session?.user?.email || 'null');
    
    // ⚠️ WHITELIST : UNIQUEMENT SIGNED_IN et SIGNED_OUT
    // Tous les autres événements sont ignorés (INITIAL_SESSION, TOKEN_REFRESHED, USER_UPDATED, etc.)
    if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
      console.log('🔇 Événement ignoré:', event);
      return;
    }
    
    // ⚠️ DEBOUNCE : Ignorer les duplicatas en moins de 1 seconde
    const now = Date.now();
    if (lastEventType === event && now - lastEventTime < 1000) {
      console.log('🔇 Événement duplicata ignoré (debounce):', event);
      return;
    }
    
    lastEventTime = now;
    lastEventType = event;
    
    console.log('✅ Événement traité:', event);
    
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
