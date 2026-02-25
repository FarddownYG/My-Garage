import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ArrowLeft, Plus, Car, ChevronRight, Trash2 } from 'lucide-react';
import { AddMaintenanceProfileModal } from './AddMaintenanceProfileModal';
import type { MaintenanceProfile } from '../../types';

interface CustomMaintenanceProfilesProps {
  onBack: () => void;
  onOpenProfileDetail: (profileId: string) => void;
}

export function CustomMaintenanceProfiles({ onBack, onOpenProfileDetail }: CustomMaintenanceProfilesProps) {
  const { maintenanceProfiles, deleteMaintenanceProfile, currentProfile, getUserVehicles } = useApp();
  
  // 🔧 Utiliser getUserVehicles() pour filtrer par user_id
  const vehicles = getUserVehicles();
  const [showAddModal, setShowAddModal] = useState(false);

  // Filtrer les profils par utilisateur courant
  const userProfiles = maintenanceProfiles.filter(p => p.ownerId === currentProfile?.id);

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Voulez-vous vraiment supprimer le profil d'entretien "${name}" ?`)) {
      try {
        await deleteMaintenanceProfile(id);
      } catch (err: any) {
        alert(`❌ Erreur: ${err.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all duration-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 className="text-3xl text-white mb-2">Entretiens Perso</h1>
        <p className="text-zinc-500">Gérez vos profils d'entretien personnalisés</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Bouton d'ajout */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Créer un profil d'entretien</span>
        </button>

        {/* Liste des profils */}
        {userProfiles.length === 0 ? (
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg text-white mb-2">Aucun profil d'entretien</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Créez votre premier profil pour organiser les entretiens de vos véhicules
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-300 active:scale-95"
            >
              Créer un Profil
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {userProfiles.map((profile) => {
              const profileVehicles = vehicles.filter(v => profile.vehicleIds.includes(v.id));
              
              return (
                <div
                  key={profile.id}
                  className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all duration-300 group animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onOpenProfileDetail(profile.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          profile.isCustom 
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                            : 'bg-gradient-to-br from-blue-600 to-purple-600'
                        }`}>
                          <Car className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg text-white font-medium">{profile.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              profile.isCustom 
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {profile.isCustom ? 'Personnalisé' : 'Pré-rempli'}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {profileVehicles.length} véhicule{profileVehicles.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Véhicules associés */}
                      {profileVehicles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {profileVehicles.map(vehicle => (
                            <span
                              key={vehicle.id}
                              className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300 border border-zinc-700"
                            >
                              {vehicle.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(profile.id, profile.name, e)}
                        className="p-2 bg-zinc-800 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 rounded-lg transition-all duration-300 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/30 rounded-xl p-4">
          <p className="text-sm text-blue-300">
            💡 <strong>Astuce :</strong> Créez des profils d'entretien différents pour chaque type de véhicule (sportif, utilitaire, etc.) et assignez-les facilement à vos voitures.
          </p>
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <AddMaintenanceProfileModal
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}