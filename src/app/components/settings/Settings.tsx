import React, { useState } from 'react';
import { Users, Shield, Database, ChevronRight, Wrench, User, Type, Link as LinkIcon, Bell } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { ProfileManagement } from './ProfileManagement';
import { AdminPinModal } from './AdminPinModal';
import { MaintenanceSettings } from './MaintenanceSettings';
import { CustomMaintenanceProfiles } from './CustomMaintenanceProfiles';
import { MaintenanceProfileDetail } from './MaintenanceProfileDetail';
import { EditProfileModal } from './EditProfileModal';
import { LinkProfileModal } from './LinkProfileModal';
import { AlertThresholdSettings } from './AlertThresholdSettings';
import { Footer } from '../shared/Footer';

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const { currentProfile, resetData, updateFontSize } = useApp();
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [showMaintenanceSettings, setShowMaintenanceSettings] = useState(false);
  const [showCustomProfiles, setShowCustomProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLinkProfileModal, setShowLinkProfileModal] = useState(false);
  const [showAlertThresholds, setShowAlertThresholds] = useState(false);
  
  // Utiliser le fontSize du profil courant
  const fontSize = currentProfile?.fontSize || 50;

  const handleResetData = () => {
    if (!currentProfile) return;
    
    const message = `⚠️ Cette action supprimera TOUTES les données du profil "${currentProfile.name}" :\n\n` +
      `• Tous les véhicules\n` +
      `• Tous les entretiens\n` +
      `• Toutes les tâches\n` +
      `• Tous les rappels\n` +
      `• Les templates personnalisés\n\n` +
      `Le profil lui-même sera conservé.\n\n` +
      `Êtes-vous sûr ?`;
    
    if (confirm(message)) {
      if (confirm(`Dernière confirmation : toutes les données de "${currentProfile.name}" seront perdues définitivement.`)) {
        resetData();
        // Ne pas se déconnecter, juste recharger
        alert('✅ Données du profil réinitialisées avec succès !');
      }
    }
  };

  if (showAlertThresholds) {
    return <AlertThresholdSettings onBack={() => setShowAlertThresholds(false)} />;
  }

  if (showProfileManagement) {
    return <ProfileManagement onBack={() => setShowProfileManagement(false)} />;
  }

  if (showMaintenanceSettings) {
    return <MaintenanceSettings 
      onBack={() => setShowMaintenanceSettings(false)} 
      onOpenCustomProfiles={() => {
        setShowMaintenanceSettings(false);
        setShowCustomProfiles(true);
      }}
    />;
  }

  if (selectedProfileId) {
    return <MaintenanceProfileDetail
      profileId={selectedProfileId}
      onBack={() => {
        setSelectedProfileId(null);
      }}
    />;
  }

  if (showCustomProfiles) {
    return <CustomMaintenanceProfiles
      onBack={() => setShowCustomProfiles(false)}
      onOpenProfileDetail={(id) => {
        setSelectedProfileId(id);
      }}
    />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      <div className="bg-gradient-to-b from-[#12121a] to-[#0a0a0f] px-6 pt-12 pb-8">
        <h1 className="text-3xl text-white mb-2">Paramètres</h1>
        <p className="text-slate-500">{currentProfile?.name}</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Admin Section */}
        {currentProfile?.isAdmin && (
          <div>
            <h2 className="text-sm text-slate-500 mb-3">ADMINISTRATION</h2>
            <div className="space-y-2">
              <Card
                className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl"
                onClick={() => setShowProfileManagement(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-xl border border-cyan-500/10">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white">Gérer les profils</p>
                      <p className="text-sm text-slate-500">Créer, modifier, supprimer</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </Card>

              <Card
                className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl"
                onClick={() => setShowAdminPinModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500/15 to-purple-500/15 rounded-xl border border-violet-500/10">
                      <Shield className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white">Modifier le PIN admin</p>
                      <p className="text-sm text-slate-500">Sécurité</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </Card>

              <Card
                className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl"
                onClick={() => setShowLinkProfileModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10">
                      <LinkIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white">Lier un profil ancien</p>
                      <p className="text-sm text-slate-500">Récupérer mes données</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* User Profile Section */}
        <div>
          <h2 className="text-sm text-slate-500 mb-3">PROFIL</h2>
          <div className="space-y-2">
            <Card
              className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl"
              onClick={() => setShowEditProfileModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-xl border border-emerald-500/10">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white">Modifier mon profil</p>
                    <p className="text-sm text-slate-500">Nom, prénom, avatar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Display Section */}
        <div>
          <h2 className="text-sm text-slate-500 mb-3">AFFICHAGE</h2>
          <Card className="bg-[#12121a]/80 border-white/5 p-4 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500/15 to-indigo-500/15 rounded-xl border border-violet-500/10 flex-shrink-0">
                <Type className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white">Taille de police</p>
                    <p className="text-sm text-slate-500">Ajuster la taille du texte</p>
                  </div>
                  <div className="text-cyan-400 font-semibold text-lg">{fontSize}%</div>
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
                    className="w-full h-2 bg-[#1a1a2e] rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, rgb(34 211 238) 0%, rgb(34 211 238) ${fontSize}%, rgb(26 26 46) ${fontSize}%, rgb(26 26 46) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Maintenance Section */}
        <div>
          <h2 className="text-sm text-slate-500 mb-3">ENTRETIEN</h2>
          <div className="space-y-2">
            <Card
              className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl"
              onClick={() => setShowMaintenanceSettings(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500/15 to-amber-500/15 rounded-xl border border-orange-500/10">
                    <Wrench className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white">Paramètres d'entretien</p>
                    <p className="text-sm text-slate-500">Types et intervalles</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>
            </Card>

            <Card
              className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl"
              onClick={() => setShowCustomProfiles(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500/15 to-amber-500/15 rounded-xl border border-orange-500/10">
                    <Wrench className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white">Profils d'entretien personnalisés</p>
                    <p className="text-sm text-slate-500">Types et intervalles</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>
            </Card>

            <Card
              className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl"
              onClick={() => setShowAlertThresholds(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-xl border border-cyan-500/10">
                    <Bell className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white">Seuils d'alertes</p>
                    <p className="text-sm text-slate-500">Km et mois avant échéance</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Data Section */}
        <div>
          <h2 className="text-sm text-slate-500 mb-3">DONNÉES</h2>
          <div className="space-y-2">
            {/* Lier un profil - disponible pour tous */}
            <Card
              className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl relative"
              onClick={() => setShowLinkProfileModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10">
                    <LinkIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white">Lier un profil ancien</p>
                    <p className="text-sm text-slate-500">Récupérer mes anciennes données</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>
            </Card>

            <Card
              className="bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl"
              onClick={handleResetData}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500/15 to-rose-500/15 rounded-xl border border-red-500/10">
                    <Database className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white">Réinitialiser les données du profil</p>
                    <p className="text-sm text-slate-500">Supprimer véhicules, entretiens et tâches</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* App Info */}
        <div className="pt-8 text-center">
          <p className="text-slate-600 text-sm mb-1">Valcar</p>
          <p className="text-slate-700 text-xs">Version 1.0.0 - Données cryptées</p>
          <p className="text-slate-700 text-xs mt-4">
            Gestion de véhicules personnelle
          </p>
        </div>
      </div>

      {showAdminPinModal && (
        <AdminPinModal onClose={() => setShowAdminPinModal(false)} />
      )}
      
      {showEditProfileModal && currentProfile && (
        <EditProfileModal 
          profile={currentProfile}
          onClose={() => setShowEditProfileModal(false)} 
        />
      )}
      
      {showLinkProfileModal && (
        <LinkProfileModal 
          onClose={() => setShowLinkProfileModal(false)} 
        />
      )}
      
      <Footer />
    </div>
  );
}