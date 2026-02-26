import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Plus, Edit2, Trash2, Car, Wrench } from 'lucide-react';
import { AddMaintenanceProfileModal } from './AddMaintenanceProfileModal';
import type { MaintenanceProfile } from '../../types';

export function MaintenanceProfilesSettings() {
  const { maintenanceProfiles, deleteMaintenanceProfile, currentProfile, getUserVehicles } = useApp();
  const { isDark } = useTheme();
  
  // 🔧 Utiliser getUserVehicles() pour filtrer par user_id
  const vehicles = getUserVehicles();
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
          <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Profils d'Entretien</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Créez des profils d'entretien personnalisés pour vos véhicules
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 rounded-xl transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Profil</span>
        </button>
      </div>

      {/* Liste des profils */}
      {userProfiles.length === 0 ? (
        <div className={`backdrop-blur-sm border rounded-2xl p-12 text-center animate-fade-in ${isDark ? 'bg-[#12121a]/50 border-white/[0.06]' : 'bg-white border-gray-200'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}>
            <Wrench className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Aucun profil d'entretien</h3>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Créez votre premier profil pour organiser les entretiens de vos véhicules
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white rounded-xl transition-all duration-300 active:scale-95"
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
                className={`backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 group animate-fade-in ${isDark ? 'bg-[#12121a]/50 border-white/[0.06] hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Wrench className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          profile.isCustom 
                            ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {profile.isCustom ? 'Personnalisé' : 'Pré-rempli'}
                        </span>
                      </div>
                    </div>

                    {/* Véhicules associés */}
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <Car className="w-4 h-4" />
                        <span>{profileVehicles.length} véhicule(s) associé(s)</span>
                      </div>
                      {profileVehicles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profileVehicles.map(vehicle => (
                            <span
                              key={vehicle.id}
                              className={`px-3 py-1 rounded-full text-xs border ${isDark ? 'bg-white/5 text-slate-300 border-white/[0.06]' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
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
                      className={`p-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 ${isDark ? 'bg-[#1a1a2e] hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400' : 'bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-500'}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id, profile.name)}
                      className={`p-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 ${isDark ? 'bg-[#1a1a2e] hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500'}`}
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