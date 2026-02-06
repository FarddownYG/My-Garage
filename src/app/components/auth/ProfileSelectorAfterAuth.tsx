import { useState, useEffect, useCallback } from 'react';
import { Lock, User } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useApp } from '../../contexts/AppContext';
import type { Profile } from '../../types';
import { generateId } from '../../utils/generateId';

interface ProfileSelectorAfterAuthProps {
  onProfileSelected: (profile: Profile) => void;
}

/**
 * Sélection de profil APRÈS connexion Supabase
 * Affiche uniquement les profils liés au user actuel
 */
export function ProfileSelectorAfterAuth({ onProfileSelected }: ProfileSelectorAfterAuthProps) {
  const { profiles, supabaseUser, setCurrentProfile, addProfile } = useApp();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);

  // Filtrer les profils non-admin liés à ce user
  // 🔒 SÉCURITÉ : Ne montrer QUE les profils de l'utilisateur actuel
  const userProfiles = profiles.filter(p => 
    !p.isAdmin && 
    p.userId === supabaseUser?.id // UNIQUEMENT les profils liés à l'utilisateur actuel
  );

  console.log('🔍 ProfileSelector - Filtrage profils:', {
    totalProfiles: profiles.length,
    currentUserId: supabaseUser?.id,
    userProfiles: userProfiles.map(p => ({
      name: p.name,
      userId: p.userId,
      match: p.userId === supabaseUser?.id ? '✅' : '❌'
    }))
  });

  // 🔧 CRÉATION AUTOMATIQUE DU PROFIL SI AUCUN N'EXISTE
  const handleCreateProfile = useCallback(async () => {
    if (!supabaseUser?.email) return;
    
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
      
      console.log('🆕 Création automatique du profil:', newProfile);
      await addProfile(newProfile);
      
      // Sélectionner automatiquement le nouveau profil
      await setCurrentProfile(newProfile);
      onProfileSelected(newProfile);
    } catch (error) {
      console.error('❌ Erreur création profil:', error);
      setError('Impossible de créer le profil');
    } finally {
      setIsCreatingProfile(false);
    }
  }, [supabaseUser, addProfile, setCurrentProfile, onProfileSelected]);

  // 🔧 CRÉATION AUTOMATIQUE AU CHARGEMENT si aucun profil
  useEffect(() => {
    if (userProfiles.length === 0 && !isCreatingProfile && !autoCreateAttempted && supabaseUser) {
      console.log('🆕 Aucun profil trouvé, création automatique...');
      setAutoCreateAttempted(true);
      handleCreateProfile();
    }
  }, [userProfiles.length, supabaseUser, isCreatingProfile, autoCreateAttempted, handleCreateProfile]);

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setPin('');
    setError('');
  };

  const handleConfirm = () => {
    if (!selectedProfile) return;

    // Vérifier le PIN si protégé
    if (selectedProfile.isPinProtected) {
      if (!pin) {
        setError('Veuillez entrer le code PIN');
        return;
      }
      if (pin !== selectedProfile.pin) {
        setError('Code PIN incorrect');
        return;
      }
    }

    setCurrentProfile(selectedProfile);
    onProfileSelected(selectedProfile);
  };

  // Si aucun profil, créer automatiquement
  if (userProfiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 p-8 text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Bienvenue !
          </h1>
          <p className="text-zinc-400 mb-6">
            Création de votre profil utilisateur...
          </p>
          {!isCreatingProfile && (
            <Button
              onClick={handleCreateProfile}
              disabled={isCreatingProfile}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Créer mon profil
            </Button>
          )}
          {isCreatingProfile && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-zinc-400">Création en cours...</span>
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-400 text-sm">
              {error}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Sélectionnez un profil
          </h1>
          <p className="text-zinc-400 text-sm">
            Connecté en tant que <span className="text-blue-400">{supabaseUser?.email}</span>
          </p>
        </div>

        {/* Liste des profils */}
        <div className="space-y-3 mb-6">
          {userProfiles.map((profile) => (
            <Card
              key={profile.id}
              className={`
                bg-zinc-800 border-zinc-700 p-4 cursor-pointer transition-all
                ${selectedProfile?.id === profile.id ? 'border-blue-500 bg-blue-500/10' : 'hover:border-zinc-600'}
              `}
              onClick={() => handleSelectProfile(profile)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  {profile.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    {profile.name}
                    {profile.isPinProtected && (
                      <Lock className="w-4 h-4 text-yellow-500" />
                    )}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {profile.firstName}
                  </p>
                </div>

                {/* Radio */}
                <div className="flex-shrink-0">
                  {selectedProfile?.id === profile.id ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-zinc-600 rounded-full" />
                  )}
                </div>
              </div>

              {/* PIN Input (si sélectionné et protégé) */}
              {selectedProfile?.id === profile.id && profile.isPinProtected && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <label className="block text-sm text-zinc-400 mb-2">
                    Code PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Bouton de confirmation */}
        <Button
          onClick={handleConfirm}
          disabled={!selectedProfile}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
        >
          Continuer avec {selectedProfile?.firstName || 'ce profil'}
        </Button>
      </Card>
    </div>
  );
}
