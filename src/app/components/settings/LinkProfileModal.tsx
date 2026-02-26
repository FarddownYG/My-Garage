import { useState, useEffect } from 'react';
import { X, Lock, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { getUnmigratedProfiles, migrateProfileToUser, type UnmigratedProfile } from '../../utils/migration';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

interface LinkProfileModalProps {
  onClose: () => void;
}

/**
 * Modal pour lier manuellement un ancien profil au compte Supabase
 * Accessible depuis Paramètres → Lier un profil
 */
export function LinkProfileModal({ onClose }: LinkProfileModalProps) {
  const { supabaseUser, refreshAuth } = useApp();
  const { isDark } = useTheme();
  const [unmigratedProfiles, setUnmigratedProfiles] = useState<UnmigratedProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UnmigratedProfile | null>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUnmigratedProfiles();
  }, []);

  const loadUnmigratedProfiles = async () => {
    setIsLoading(true);
    try {
      const profiles = await getUnmigratedProfiles();
      setUnmigratedProfiles(profiles);
      console.log(`✅ ${profiles.length} profil(s) non lié(s) trouvé(s)`);
    } catch (err) {
      console.error('❌ Erreur chargement profils:', err);
      setError('Erreur lors du chargement des profils');
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
    if (!selectedProfile || !supabaseUser) return;

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
      console.log(`🔄 Liaison du profil ${selectedProfile.name}...`);
      
      const success = await migrateProfileToUser(selectedProfile.id, supabaseUser.id);
      
      if (success) {
        console.log(`✅ Liaison réussie pour ${selectedProfile.name} !`);
        setSuccessMessage(`✅ Le profil ${selectedProfile.name} a été lié avec succès !`);
        
        // Attendre un peu puis rafraîchir
        setTimeout(async () => {
          await refreshAuth();
          onClose();
        }, 1500);
      } else {
        setError('Erreur lors de la liaison du profil');
      }
    } catch (err) {
      console.error('❌ Erreur migration:', err);
      setError('Une erreur est survenue lors de la liaison');
    } finally {
      setIsMigrating(false);
    }
  };

  const modalBg = isDark ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#1a1a2e]' : 'bg-gray-50';
  const cardBorder = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-lg ${modalBg} border ${borderColor} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 ${modalBg} border-b ${borderColor} p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <LinkIcon className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h2 className={`text-xl ${textPrimary}`}>Lier un profil</h2>
              <p className={`text-sm ${textMuted}`}>
                Compte : {supabaseUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-6 h-6 ${textMuted}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message de succès */}
          {successMessage && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-emerald-400 font-medium">{successMessage}</p>
                <p className="text-sm text-emerald-400/70 mt-1">
                  Redirection en cours...
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className={textMuted}>Chargement des profils...</p>
            </div>
          )}

          {/* Aucun profil */}
          {!isLoading && unmigratedProfiles.length === 0 && (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className={`font-semibold mb-2 ${textPrimary}`}>
                Tous vos profils sont déjà liés !
              </h3>
              <p className={`text-sm ${textMuted}`}>
                Aucun profil non lié trouvé.
              </p>
            </div>
          )}

          {/* Liste des profils */}
          {!isLoading && unmigratedProfiles.length > 0 && (
            <>
              <div className="mb-6">
                <p className={`text-sm mb-4 ${textMuted}`}>
                  Sélectionnez un profil à lier à votre compte Supabase :
                </p>
                
                <div className="space-y-3">
                  {unmigratedProfiles.map((profile) => (
                    <Card
                      key={profile.id}
                      className={`
                        p-4 cursor-pointer transition-all
                        ${selectedProfile?.id === profile.id 
                          ? 'border-cyan-500 bg-cyan-500/10' 
                          : `${cardBg} border ${cardBorder} ${isDark ? 'hover:border-white/20' : 'hover:border-gray-300'}`}
                      `}
                      onClick={() => handleSelectProfile(profile)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                          {profile.avatar}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold mb-1 flex items-center gap-2 ${textPrimary}`}>
                            {profile.name}
                            {profile.isPinProtected && (
                              <Lock className="w-4 h-4 text-amber-500" />
                            )}
                          </h3>
                          <p className={`text-sm ${textMuted}`}>
                            {profile.vehicleCount} véhicule{profile.vehicleCount > 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Radio */}
                        <div className="flex-shrink-0">
                          {selectedProfile?.id === profile.id ? (
                            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          ) : (
                            <div className={`w-6 h-6 border-2 rounded-full ${isDark ? 'border-white/20' : 'border-gray-300'}`} />
                          )}
                        </div>
                      </div>

                      {/* PIN Input (si sélectionné et protégé) */}
                      {selectedProfile?.id === profile.id && profile.isPinProtected && (
                        <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                          <label className={`block text-sm mb-2 ${textMuted}`}>
                            Code PIN du profil
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="••••"
                            className={`w-full rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-cyan-500 ${isDark ? 'bg-[#12121a] border border-white/[0.06] text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}
                  disabled={isMigrating}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleMigrate}
                  disabled={!selectedProfile || isMigrating}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white disabled:opacity-50"
                >
                  {isMigrating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Liaison en cours...
                    </>
                  ) : (
                    `Lier ${selectedProfile?.firstName || 'ce profil'}`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}