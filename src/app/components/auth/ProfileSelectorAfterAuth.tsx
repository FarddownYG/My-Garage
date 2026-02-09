import { useState, useEffect, useCallback } from 'react';
import { User } from 'lucide-react';
import { Card } from '../ui/card';
import { useApp } from '../../contexts/AppContext';
import type { Profile } from '../../types';
import { generateId } from '../../utils/generateId';
import { LoadingScreen } from '../shared/LoadingScreen';

interface ProfileSelectorAfterAuthProps {
  onProfileSelected: (profile: Profile) => void;
}

/**
 * Gestion automatique du profil APRÈS connexion Supabase
 * 1 compte = 1 profil (pas de sélection manuelle)
 */
export function ProfileSelectorAfterAuth({ onProfileSelected }: ProfileSelectorAfterAuthProps) {
  const { profiles, supabaseUser, setCurrentProfile, addProfile, isLoading } = useApp();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Filtrer les profils non-admin liés à ce user
  const userProfiles = profiles.filter(p => 
    !p.isAdmin && 
    p.userId === supabaseUser?.id
  );

  console.log('🔍 ProfileSelector - État:', {
    isLoading,
    hasInitialized,
    totalProfiles: profiles.length,
    userProfiles: userProfiles.length,
    userId: supabaseUser?.id,
  });

  // 🔧 GESTION AUTOMATIQUE DU PROFIL
  const initializeProfile = useCallback(async () => {
    if (!supabaseUser?.email || hasInitialized || isLoading) return;

    console.log('🚀 Initialisation du profil...', { 
      userProfilesCount: userProfiles.length 
    });

    // Cas 1 : L'utilisateur a déjà un profil → le sélectionner automatiquement
    if (userProfiles.length > 0) {
      console.log('✅ Profil existant trouvé, sélection automatique');
      const existingProfile = userProfiles[0]; // Prendre le premier (et unique) profil
      await setCurrentProfile(existingProfile);
      setHasInitialized(true);
      onProfileSelected(existingProfile);
      return;
    }

    // Cas 2 : Aucun profil → en créer un automatiquement
    console.log('🆕 Aucun profil, création automatique...');
    setIsCreatingProfile(true);
    
    try {
      // Extraire le prénom depuis l'email (partie avant le @)
      const emailUsername = supabaseUser.email.split('@')[0];
      const firstName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
      
      // Créer le profil automatiquement
      const newProfile: Profile = {
        id: generateId(),
        firstName,
        lastName: '',
        name: firstName,
        avatar: '👤',
        isPinProtected: false,
        isAdmin: false,
        fontSize: 50,
        userId: supabaseUser.id,
      };
      
      console.log('🆕 Création du profil:', newProfile);
      await addProfile(newProfile);
      
      // Sélectionner automatiquement le nouveau profil
      await setCurrentProfile(newProfile);
      setHasInitialized(true);
      onProfileSelected(newProfile);
      
      console.log('✅ Profil créé et sélectionné');
    } catch (error) {
      console.error('❌ Erreur création profil:', error);
    } finally {
      setIsCreatingProfile(false);
    }
  }, [supabaseUser, userProfiles, hasInitialized, isLoading, addProfile, setCurrentProfile, onProfileSelected]);

  // 🔄 Exécuter l'initialisation dès que les données sont chargées
  useEffect(() => {
    if (!isLoading && !hasInitialized && supabaseUser) {
      // Petit délai pour s'assurer que les profils sont bien chargés
      const timer = setTimeout(() => {
        initializeProfile();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasInitialized, supabaseUser, initializeProfile]);

  // Affichage pendant le chargement ou la création
  if (isLoading || isCreatingProfile || !hasInitialized) {
    return (
      <LoadingScreen 
        message={
          isCreatingProfile 
            ? 'Création de votre profil...' 
            : 'Chargement de votre profil...'
        } 
      />
    );
  }

  // Normalement, on ne devrait jamais arriver ici car le profil est sélectionné automatiquement
  // Mais au cas où, afficher un message
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 p-8 text-center">
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <User className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Initialisation...
        </h1>
        <p className="text-zinc-400">
          Configuration de votre profil en cours...
        </p>
      </Card>
    </div>
  );
}
