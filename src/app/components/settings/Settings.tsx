import React, { useState } from 'react';
import { Users, Shield, Database, ChevronRight, Wrench } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { ProfileManagement } from './ProfileManagement';
import { AdminPinModal } from './AdminPinModal';
import { MaintenanceSettings } from './MaintenanceSettings';
import { Footer } from '../shared/Footer';

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const { currentProfile, resetData } = useApp();
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [showMaintenanceSettings, setShowMaintenanceSettings] = useState(false);

  const handleResetData = () => {
    if (confirm('⚠️ Cette action supprimera TOUTES les données de l\'application. Êtes-vous sûr ?')) {
      if (confirm('Dernière confirmation : toutes les données seront perdues définitivement.')) {
        resetData();
        onLogout();
      }
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
      <Footer />
    </div>
  );
}