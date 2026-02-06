import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AuthScreen } from './AuthScreen';
import { ProfileSelectorAfterAuth } from './ProfileSelectorAfterAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AuthWrapper gère l'authentification
 * Affiche les écrans appropriés selon l'état de l'utilisateur
 */
export function AuthWrapper({ children }: AuthWrapperProps) {
  const { supabaseUser, isAuthenticated, isLoading, refreshAuth, currentProfile } = useApp();
  const [showAuth, setShowAuth] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  useEffect(() => {
    // Déterminer quel écran afficher
    if (isLoading) return;

    console.log('🔐 État Auth:', {
      isAuthenticated,
      hasCurrentProfile: !!currentProfile,
    });

    // Cas 1: Pas de user → forcer auth (obligatoire)
    if (!isAuthenticated) {
      setShowAuth(true);
      setShowProfileSelector(false);
      return;
    }

    // Cas 2: User connecté, pas de profil sélectionné → sélecteur
    if (isAuthenticated && !currentProfile) {
      console.log('👤 Affichage sélection de profil');
      setShowProfileSelector(true);
      setShowAuth(false);
      return;
    }

    // Cas 3: User connecté avec profil → app normale
    if (isAuthenticated && currentProfile) {
      console.log('✅ Affichage app normale');
      setShowAuth(false);
      setShowProfileSelector(false);
      return;
    }

    // Cas 4: Fallback - forcer auth
    console.log('⚠️ État non géré, retour à l\'auth');
    setShowAuth(true);
    setShowProfileSelector(false);
  }, [isAuthenticated, currentProfile, isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Écran d'authentification
  if (showAuth) {
    return (
      <AuthScreen
        onSuccess={async () => {
          console.log('✅ Connexion réussie, rechargement de l\'état...');
          await refreshAuth();
        }}
      />
    );
  }

  // Écran de sélection de profil (après connexion)
  if (showProfileSelector) {
    return (
      <ProfileSelectorAfterAuth
        onProfileSelected={(profile) => {
          console.log('✅ Profil sélectionné:', profile.name);
          setShowProfileSelector(false);
        }}
      />
    );
  }

  // App normale
  return <>{children}</>;
}
