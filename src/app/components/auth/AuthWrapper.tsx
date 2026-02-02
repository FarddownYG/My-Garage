import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AuthScreen } from './AuthScreen';
import { MigrationScreen } from './MigrationScreen';
import { ProfileSelectorAfterAuth } from './ProfileSelectorAfterAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AuthWrapper gère l'authentification et la migration des profils
 * Affiche les écrans appropriés selon l'état de l'utilisateur
 */
export function AuthWrapper({ children }: AuthWrapperProps) {
  // ⚠️ IMPORTANT: Tous les hooks DOIVENT être appelés dans le même ordre à chaque render
  // Ne JAMAIS mettre de return conditionnel AVANT les hooks
  const { supabaseUser, isAuthenticated, isMigrationPending, isLoading, refreshAuth, profiles, currentProfile, setCurrentProfile } = useApp();
  const [showAuth, setShowAuth] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [hasSkippedMigration, setHasSkippedMigration] = useState(false);
  const [hasCheckedMigration, setHasCheckedMigration] = useState(false);

  useEffect(() => {
    // Déterminer quel écran afficher
    if (isLoading) return;

    console.log('🔐 État Auth:', {
      isAuthenticated,
      isMigrationPending,
      hasCurrentProfile: !!currentProfile,
      hasProfiles: profiles.length > 0,
      hasSkippedMigration,
      hasCheckedMigration,
    });

    // Cas 1: Pas de user → forcer auth (obligatoire)
    if (!isAuthenticated) {
      setShowAuth(true);
      setShowMigration(false);
      setShowProfileSelector(false);
      setHasCheckedMigration(false);
      return;
    }

    // Cas 2: User connecté, pas de profil sélectionné
    // Afficher le sélecteur de profil dans TOUS les cas où currentProfile est null
    if (isAuthenticated && !currentProfile) {
      console.log('👤 Affichage sélection de profil (profils:', profiles.length, ')');
      setShowProfileSelector(true);
      setShowAuth(false);
      setShowMigration(false);
      return;
    }

    // Cas 3: User connecté avec profil → app normale
    if (isAuthenticated && currentProfile) {
      console.log('✅ Affichage app normale');
      setShowAuth(false);
      setShowMigration(false);
      setShowProfileSelector(false);
      return;
    }

    // Cas 4: Fallback - forcer auth
    console.log('⚠️ État non géré, retour à l\'auth');
    setShowAuth(true);
    setShowMigration(false);
    setShowProfileSelector(false);
  }, [isAuthenticated, isMigrationPending, currentProfile, isLoading, hasSkippedMigration]);

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
          // ⚠️ NE PAS appeler refreshAuth() ici !
          // onAuthStateChange dans auth.ts va automatiquement déclencher SIGNED_IN
          // et init() dans AppContext va charger les données
          console.log('✅ Connexion réussie, attente de onAuthStateChange...');
        }}
      />
    );
  }

  // Écran de migration
  if (showMigration && supabaseUser) {
    return (
      <MigrationScreen
        userId={supabaseUser.id}
        userEmail={supabaseUser.email}
        onComplete={async () => {
          console.log('✅ Migration complétée');
          setHasSkippedMigration(false);
          setShowMigration(false);
          setHasCheckedMigration(true);
          await refreshAuth();
        }}
        onSkip={() => {
          console.log('⏭️ Migration ignorée');
          setHasSkippedMigration(true);
          setShowMigration(false);
          setHasCheckedMigration(true);
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
          setCurrentProfile(profile);
          setShowProfileSelector(false);
        }}
      />
    );
  }

  // App normale
  return <>{children}</>;
}
