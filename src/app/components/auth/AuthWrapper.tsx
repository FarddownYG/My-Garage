import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AuthScreen } from './AuthScreen';
import { MigrationScreen } from './MigrationScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AuthWrapper gère l'authentification et la migration des profils
 * Affiche les écrans appropriés selon l'état de l'utilisateur
 */
export function AuthWrapper({ children }: AuthWrapperProps) {
  const { supabaseUser, isAuthenticated, isMigrationPending, isLoading, refreshAuth, profiles } = useApp();
  const [showAuth, setShowAuth] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [hasSkippedMigration, setHasSkippedMigration] = useState(false);

  useEffect(() => {
    // Déterminer quel écran afficher
    if (isLoading) return;

    console.log('🔐 État Auth:', {
      isAuthenticated,
      isMigrationPending,
      hasProfiles: profiles.length > 0,
      hasSkippedMigration,
    });

    // Cas 1: User connecté et migration nécessaire
    if (isAuthenticated && isMigrationPending && !hasSkippedMigration) {
      setShowMigration(true);
      setShowAuth(false);
      return;
    }

    // Cas 2: Pas de user → forcer auth (obligatoire)
    if (!isAuthenticated) {
      setShowAuth(true);
      setShowMigration(false);
      return;
    }

    // Cas 3: User connecté → app normale
    setShowAuth(false);
    setShowMigration(false);
  }, [isAuthenticated, isMigrationPending, profiles.length, isLoading, hasSkippedMigration]);

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
          await refreshAuth();
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
          await refreshAuth();
          setHasSkippedMigration(false);
          setShowMigration(false);
        }}
        onSkip={() => {
          setHasSkippedMigration(true);
          setShowMigration(false);
        }}
      />
    );
  }

  // App normale
  return <>{children}</>;
}
