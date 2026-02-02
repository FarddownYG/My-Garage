import { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle, ArrowRight, Car } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { getUnmigratedProfiles, migrateProfileToUser, type UnmigratedProfile } from '../../utils/migration';
import { useApp } from '../../contexts/AppContext';

interface MigrationScreenProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function MigrationScreen({ userId, userEmail, onComplete, onSkip }: MigrationScreenProps) {
  const { profiles } = useApp();
  const [unmigratedProfiles, setUnmigratedProfiles] = useState<UnmigratedProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UnmigratedProfile | null>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [migratedProfiles, setMigratedProfiles] = useState<string[]>([]);

  useEffect(() => {
    loadUnmigratedProfiles();
  }, []);

  const loadUnmigratedProfiles = async () => {
    setIsLoading(true);
    try {
      const profiles = await getUnmigratedProfiles();
      setUnmigratedProfiles(profiles);
      console.log(`✅ ${profiles.length} profil(s) non migré(s) trouvé(s)`);
      
      // Si plus de profils à migrer, terminer automatiquement
      if (profiles.length === 0) {
        console.log('🎉 Plus de profils à migrer, fermeture automatique...');
        setTimeout(() => onComplete(), 500);
      }
    } catch (err) {
      console.error('❌ Erreur chargement profils:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfile = (profile: UnmigratedProfile) => {
    setSelectedProfile(profile);
    setPin('');
    setError('');
    setSuccessMessage('');
  };

  const handleMigrate = async () => {
    if (!selectedProfile) return;

    // Vérifier le PIN si le profil est protégé
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

    setIsMigrating(true);
    setError('');

    try {
      console.log(`🔄 Migration du profil ${selectedProfile.name}...`);
      
      const success = await migrateProfileToUser(selectedProfile.id, userId);
      
      if (success) {
        console.log(`✅ Migration réussie pour ${selectedProfile.name} !`);
        setMigratedProfiles([...migratedProfiles, selectedProfile.id]);
        setSuccessMessage(`✅ Profil "${selectedProfile.name}" migré avec succès !`);
        setSelectedProfile(null);
        setPin('');
        
        // Masquer le message après 3s
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Recharger les profils non migrés
        const remaining = await getUnmigratedProfiles();
        console.log(`🔄 Profils restants à migrer: ${remaining.length}`);
        setUnmigratedProfiles(remaining);
        
        // Si plus de profils à migrer, terminer automatiquement
        if (remaining.length === 0) {
          console.log('🎉 Tous les profils ont été migrés ! Redirection...');
          setTimeout(() => onComplete(), 1000);
        }
      } else {
        setError('Échec de la migration');
      }
    } catch (err: any) {
      console.error('❌ Erreur migration:', err);
      setError(err.message || 'Erreur lors de la migration');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCompleteAll = async () => {
    setIsMigrating(true);
    try {
      // Migrer tous les profils non protégés par PIN
      const unprotectedProfiles = unmigratedProfiles.filter(p => !p.isPinProtected);
      
      for (const profile of unprotectedProfiles) {
        await migrateProfileToUser(profile.id, userId);
        setMigratedProfiles(prev => [...prev, profile.id]);
      }
      
      console.log(`✅ ${unprotectedProfiles.length} profil(s) migré(s) automatiquement`);
      
      // Recharger
      await loadUnmigratedProfiles();
      
      // Si tous les profils sont migrés, terminer
      const remaining = await getUnmigratedProfiles();
      if (remaining.length === 0) {
        onComplete();
      }
    } catch (err) {
      console.error('❌ Erreur migration automatique:', err);
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement des profils...</p>
        </div>
      </div>
    );
  }

  // Si plus de profils non migrés, afficher écran de succès
  if (unmigratedProfiles.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ✅ Migration terminée !
          </h1>
          <p className="text-zinc-400 mb-6">
            Tous vos profils sont maintenant liés à votre compte
            <br />
            <span className="text-blue-400">{userEmail}</span>
          </p>
          <Button
            onClick={onComplete}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continuer vers l'app
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-xl border-zinc-800 p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowRight className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            🔗 Lier vos profils
          </h1>
          <p className="text-zinc-400 text-sm">
            Connectez vos profils existants à votre compte
            <br />
            <span className="text-blue-400">{userEmail}</span>
          </p>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">✅ Toutes vos données seront conservées</p>
              <p className="text-blue-400">
                Véhicules, entretiens, photos, documents... rien ne sera perdu !
              </p>
            </div>
          </div>
        </div>

        {/* Liste des profils */}
        <div className="space-y-3 mb-6">
          {unmigratedProfiles.map((profile) => (
            <Card
              key={profile.id}
              className={`
                bg-zinc-800 border-zinc-700 p-4 cursor-pointer transition-all
                ${selectedProfile?.id === profile.id ? 'border-blue-500 bg-blue-500/10' : 'hover:border-zinc-600'}
                ${migratedProfiles.includes(profile.id) ? 'opacity-50' : ''}
              `}
              onClick={() => !migratedProfiles.includes(profile.id) && handleSelectProfile(profile)}
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
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Car className="w-4 h-4" />
                    <span>{profile.vehicleCount} véhicule{profile.vehicleCount > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* État */}
                <div className="flex-shrink-0">
                  {migratedProfiles.includes(profile.id) ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : selectedProfile?.id === profile.id ? (
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
                    Code PIN de {profile.name}
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
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm mb-4">
            {successMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleMigrate}
            disabled={!selectedProfile || isMigrating}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {isMigrating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowRight className="w-5 h-5 mr-2" />
                Lier ce profil
              </>
            )}
          </Button>

          <Button
            onClick={handleCompleteAll}
            disabled={isMigrating}
            variant="outline"
            className="flex-1 bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
          >
            Tout lier automatiquement
          </Button>
        </div>

        {/* Actions secondaires */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onSkip}
            disabled={isMigrating}
            className="flex-1 px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
          >
            ❌ Pas d'ancien profil
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={isMigrating}
            className="flex-1 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-400 disabled:opacity-50"
          >
            ⏭️ Plus tard
          </button>
        </div>
      </Card>
    </div>
  );
}
