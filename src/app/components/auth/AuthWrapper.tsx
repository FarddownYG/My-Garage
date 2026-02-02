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
  // ⚠️ IMPORTANT: Tous les hooks DOIVENT être appelés dans le même ordre à chaque render
  // Ne JAMAIS mettre de return conditionnel AVANT les hooks
  const { supabaseUser, isAuthenticated, isMigrationPending, isLoading, refreshAuth, profiles } = useApp();
  const [showAuth, setShowAuth] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [hasSkippedMigration, setHasSkippedMigration] = useState(false);
  const [hasCheckedMigration, setHasCheckedMigration] = useState(false);

  useEffect(() => {
    // Déterminer quel écran afficher
    if (isLoading) return;

    console.log('🔐 État Auth:', {
      isAuthenticated,
      isMigrationPending,
      hasProfiles: profiles.length > 0,
      hasSkippedMigration,
      hasCheckedMigration,
    });

    // Cas 1: User connecté et migration nécessaire (une seule fois)
    if (isAuthenticated && isMigrationPending && !hasSkippedMigration && !hasCheckedMigration) {
      console.log('📋 Affichage écran migration');
      setShowMigration(true);
      setShowAuth(false);
      setHasCheckedMigration(true);
      return;
    }

    // Cas 2: Pas de user → forcer auth (obligatoire)
    if (!isAuthenticated) {
      setShowAuth(true);
      setShowMigration(false);
      setHasCheckedMigration(false);
      return;
    }

    // Cas 3: User connecté → app normale
    console.log('✅ Affichage app normale');
    setShowAuth(false);
    setShowMigration(false);
  }, [isAuthenticated, isMigrationPending, profiles.length, isLoading, hasSkippedMigration, hasCheckedMigration]);

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

  // App normale
  return <>{children}</>;
}
