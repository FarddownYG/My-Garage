import React, { useState } from 'react';
import { Users, Shield, Database, ChevronRight, Wrench, User, Type, Lock, LockOpen } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { ProfileManagement } from './ProfileManagement';
import { AdminPinModal } from './AdminPinModal';
import { MaintenanceSettings } from './MaintenanceSettings';
import { EditProfileModal } from './EditProfileModal';
import { UserPinModal } from './UserPinModal';
import { PinSetupModal } from './PinSetupModal';
import { Footer } from '../shared/Footer';
import { Switch } from '../ui/switch';

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const { currentProfile, resetData, updateFontSize, updateProfile } = useApp();
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [showMaintenanceSettings, setShowMaintenanceSettings] = useState(false);
  const [showUserPinModal, setShowUserPinModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  
  // Utiliser le fontSize du profil courant
  const fontSize = currentProfile?.fontSize || 50;

  const handleResetData = () => {
    if (confirm('⚠️ Cette action supprimera TOUTES les données de l\'application. Êtes-vous sûr ?')) {
      if (confirm('Dernière confirmation : toutes les données seront perdues définitivement.')) {
        resetData();
        onLogout();
      }
    }
  };

  const handleTogglePinProtection = async () => {
    if (!currentProfile) return;

    if (currentProfile.isPinProtected) {
      // Désactiver le verrouillage
      if (confirm('Êtes-vous sûr de vouloir désactiver le verrouillage par PIN ?')) {
        try {
          await updateProfile(currentProfile.id, {
            isPinProtected: false,
            pin: undefined
          });
          console.log('✅ Verrouillage désactivé');
        } catch (error) {
          console.error('❌ Erreur désactivation verrouillage:', error);
          alert('Erreur lors de la désactivation du verrouillage');
        }
      }
    } else {
      // Activer le verrouillage - ouvrir le modal pour définir le PIN
      setShowPinSetupModal(true);
    }
  };

  if (showProfileManagement) {
    return <ProfileManagement onBack={() => setShowProfileManagement(false)} />;
  }

  if (showMaintenanceSettings) {
    return <MaintenanceSettings onBack={() => setShowMaintenanceSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8">
        <h1 className="text-3xl text-white mb-2">Paramètres</h1>
        <p className="text-zinc-500">{currentProfile?.name}</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Admin Section */}
        {currentProfile?.isAdmin && (
          <div>
            <h2 className="text-sm text-zinc-500 mb-3">ADMINISTRATION</h2>
            <div className="space-y-2">
              <Card
                className="bg-zinc-900 border-zinc-800 p-4 cursor-pointer hover:bg-zinc-800 transition-colors"
                onClick={() => setShowProfileManagement(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-white">Gérer les profils</p>
                      <p className="text-sm text-zinc-500">Créer, modifier, supprimer</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600" />
                </div>
              </Card>

              <Card
                className="bg-zinc-900 border-zinc-800 p-4 cursor-pointer hover:bg-zinc-800 transition-colors"
                onClick={() => setShowAdminPinModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-white">Modifier le PIN admin</p>
                      <p className="text-sm text-zinc-500">Sécurité</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600" />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* User Profile Section */}
        <div>
          <h2 className="text-sm text-zinc-500 mb-3">PROFIL</h2>
          <div className="space-y-2">
            <Card
              className="bg-zinc-900 border-zinc-800 p-4 cursor-pointer hover:bg-zinc-800 transition-colors"
              onClick={() => setShowEditProfileModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <User className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white">Modifier mon profil</p>
                    <p className="text-sm text-zinc-500">Nom, prénom, avatar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* User Security Section */}
        {!currentProfile?.isAdmin && (
          <div>
            <h2 className="text-sm text-zinc-500 mb-3">SÉCURITÉ</h2>
            <div className="space-y-2">
              {/* Toggle verrouillage */}
              <Card className="bg-zinc-900 border-zinc-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${currentProfile?.isPinProtected ? 'bg-green-500/10' : 'bg-zinc-700/30'}`}>
                      {currentProfile?.isPinProtected ? (
                        <Lock className="w-5 h-5 text-green-500" />
                      ) : (
                        <LockOpen className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white">Verrouillage du profil</p>
                      <p className="text-sm text-zinc-500">
                        {currentProfile?.isPinProtected ? 'Profil protégé par PIN' : 'Profil non protégé'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={currentProfile?.isPinProtected || false}
                    onCheckedChange={handleTogglePinProtection}
                  />
                </div>
              </Card>

              {/* Modifier le PIN (uniquement si activé) */}
              {currentProfile?.isPinProtected && (
                <Card
                  className="bg-zinc-900 border-zinc-800 p-4 cursor-pointer hover:bg-zinc-800 transition-colors"
                  onClick={() => setShowUserPinModal(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-white">Modifier mon code PIN</p>
                        <p className="text-sm text-zinc-500">Changer le code de connexion</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Display Section */}
        <div>
          <h2 className="text-sm text-zinc-500 mb-3">AFFICHAGE</h2>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg flex-shrink-0">
                <Type className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white">Taille de police</p>
                    <p className="text-sm text-zinc-500">Ajuster la taille du texte</p>
                  </div>
                  <div className="text-white font-semibold text-lg">{fontSize}%</div>
                </div>
                
                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={fontSize}
                    onChange={(e) => updateFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${fontSize}%, rgb(39 39 42) ${fontSize}%, rgb(39 39 42) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                {/* Preview */}
                <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-zinc-400 text-xs mb-2">Aperçu:</p>
                  <p className="text-white" style={{ fontSize: `${fontSize}%` }}>
                    Exemple de texte
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Maintenance Section */}
        <div>
          <h2 className="text-sm text-zinc-500 mb-3">ENTRETIEN</h2>
          <div className="space-y-2">
            <Card
              className="bg-zinc-900 border-zinc-800 p-4 cursor-pointer hover:bg-zinc-800 transition-colors"
              onClick={() => setShowMaintenanceSettings(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Wrench className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white">Paramètres d'entretien</p>
                    <p className="text-sm text-zinc-500">Types et intervalles</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Data Section */}
        <div>
          <h2 className="text-sm text-zinc-500 mb-3">DONNÉES</h2>
          <div className="space-y-2">
            <Card
              className="bg-zinc-900 border-zinc-800 p-4 cursor-pointer hover:bg-zinc-800 transition-colors"
              onClick={handleResetData}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Database className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-white">Réinitialiser les données</p>
                    <p className="text-sm text-zinc-500">Supprimer toutes les données</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* App Info */}
        <div className="pt-8 text-center">
          <p className="text-zinc-600 text-sm mb-1">Valcar 🔒</p>
          <p className="text-zinc-700 text-xs">Version 1.0.0 - Données cryptées</p>
          <p className="text-zinc-700 text-xs mt-4">
            Gestion de véhicules personnelle
          </p>
        </div>
      </div>

      {showAdminPinModal && (
        <AdminPinModal onClose={() => setShowAdminPinModal(false)} />
      )}
      
      {showUserPinModal && currentProfile && (
        <UserPinModal 
          profile={currentProfile}
          onClose={() => setShowUserPinModal(false)} 
        />
      )}
      
      {showEditProfileModal && currentProfile && (
        <EditProfileModal 
          profile={currentProfile}
          onClose={() => setShowEditProfileModal(false)} 
        />
      )}
      
      {showPinSetupModal && currentProfile && (
        <PinSetupModal 
          onClose={() => setShowPinSetupModal(false)} 
        />
      )}
      
      <Footer />
    </div>
  );
}