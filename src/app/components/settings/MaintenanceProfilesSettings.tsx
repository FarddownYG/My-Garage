import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Edit2, Trash2, Car, Wrench } from 'lucide-react';
import { AddMaintenanceProfileModal } from './AddMaintenanceProfileModal';
import type { MaintenanceProfile } from '../../types';

export function MaintenanceProfilesSettings() {
  const { maintenanceProfiles, vehicles, deleteMaintenanceProfile, currentProfile } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MaintenanceProfile | null>(null);

  // Filtrer les profils par utilisateur courant
  const userProfiles = maintenanceProfiles.filter(p => p.ownerId === currentProfile?.id);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le profil d'entretien "${name}" ?`)) {
      deleteMaintenanceProfile(id);
    }
  };

  const handleEdit = (profile: MaintenanceProfile) => {
    setEditingProfile(profile);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-white">Profils d'Entretien</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Créez des profils d'entretien personnalisés pour vos véhicules
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Profil</span>
        </button>
      </div>

      {/* Liste des profils */}
      {userProfiles.length === 0 ? (
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-12 text-center animate-fade-in">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-10 h-10 text-zinc-600" />
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
        <div className="space-y-4">
          {userProfiles.map((profile) => {
            const profileVehicles = vehicles.filter(v => profile.vehicleIds.includes(v.id));
            
            return (
              <div
                key={profile.id}
                className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 group animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg text-white">{profile.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          profile.isCustom 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {profile.isCustom ? 'Personnalisé' : 'Pré-rempli'}
                        </span>
                      </div>
                    </div>

                    {/* Véhicules associés */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Car className="w-4 h-4" />
                        <span>{profileVehicles.length} véhicule(s) associé(s)</span>
                      </div>
                      {profileVehicles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
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
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(profile)}
                      className="p-2 bg-zinc-800 hover:bg-blue-600/20 text-zinc-400 hover:text-blue-400 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id, profile.name)}
                      className="p-2 bg-zinc-800 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
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

      {/* Modals */}
      {showAddModal && (
        <AddMaintenanceProfileModal
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingProfile && (
        <AddMaintenanceProfileModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
        />
      )}
    </div>
  );
}
