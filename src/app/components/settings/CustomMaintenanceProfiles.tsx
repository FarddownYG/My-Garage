import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Plus, Car, Trash2, Fuel } from 'lucide-react';
import { AddMaintenanceProfileModal } from './AddMaintenanceProfileModal';
import type { MaintenanceProfile } from '../../types';

interface CustomMaintenanceProfilesProps {
  onBack: () => void;
  onOpenProfileDetail: (profileId: string) => void;
}

export function CustomMaintenanceProfiles({ onBack, onOpenProfileDetail }: CustomMaintenanceProfilesProps) {
  const { maintenanceProfiles, deleteMaintenanceProfile, currentProfile, getUserVehicles } = useApp();
  const { isDark } = useTheme();
  
  const vehicles = getUserVehicles();
  const [showAddModal, setShowAddModal] = useState(false);

  const userProfiles = maintenanceProfiles.filter(p => p.ownerId === currentProfile?.id);

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Voulez-vous vraiment supprimer le profil d'entretien "${name}" ?`)) {
      try {
        await deleteMaintenanceProfile(id);
      } catch (err: any) {
        alert(`Erreur: ${err.message}`);
      }
    }
  };

  const bgMain = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const bgHeader = isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-gradient-to-b from-white to-gray-50';
  const bgCard = isDark ? 'bg-[#12121a]/50 backdrop-blur-sm border-white/[0.06] hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const textDimmed = isDark ? 'text-slate-600' : 'text-gray-400';

  return (
    <div className={`min-h-screen ${bgMain} pb-24`}>
      <div className={`${bgHeader} px-6 pt-12 pb-8`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-2 ${textMuted} hover:${textMain} transition-all duration-300 mb-6`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 className={`text-3xl ${textMain} mb-2`}>Entretiens Perso</h1>
        <p className={textMuted}>Gerez vos profils d'entretien personnalises</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Bouton d'ajout */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Creer un profil d'entretien</span>
        </button>

        {/* Liste des profils */}
        {userProfiles.length === 0 ? (
          <div className={`border rounded-2xl p-12 text-center animate-fade-in ${isDark ? 'bg-[#12121a]/50 border-white/[0.06]' : 'bg-white border-gray-200'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}>
              <Car className={`w-10 h-10 ${textDimmed}`} />
            </div>
            <h3 className={`text-lg ${textMain} mb-2`}>Aucun profil d'entretien</h3>
            <p className={`text-sm mb-6 ${textMuted}`}>
              Creez votre premier profil pour organiser les entretiens de vos vehicules
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white rounded-xl transition-all duration-300 active:scale-95"
            >
              Creer un Profil
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {userProfiles.map((profile) => {
              const profileVehicles = vehicles.filter(v => profile.vehicleIds.includes(v.id));
              
              return (
                <div
                  key={profile.id}
                  className={`w-full border rounded-2xl p-5 transition-all duration-300 group animate-fade-in ${bgCard}`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onOpenProfileDetail(profile.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          profile.isCustom 
                            ? 'bg-gradient-to-br from-violet-600 to-purple-600'
                            : 'bg-gradient-to-br from-cyan-600 to-violet-600'
                        }`}>
                          <Car className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg ${textMain}`}>{profile.name}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              profile.isCustom 
                                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}>
                              {profile.isCustom ? 'Personnalise' : 'Pre-rempli'}
                            </span>
                            {profile.fuelType && (
                              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                profile.fuelType === 'essence'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                <Fuel className="w-3 h-3" />
                                {profile.fuelType === 'essence' ? 'Essence' : 'Diesel'}
                              </span>
                            )}
                            {profile.is4x4 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                4x4
                              </span>
                            )}
                            <span className={`text-xs ${textMuted}`}>
                              {profileVehicles.length} vehicule{profileVehicles.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicules associes */}
                      {profileVehicles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
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

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(profile.id, profile.name, e)}
                        className={`p-2 rounded-lg transition-all duration-300 active:scale-95 ${isDark ? 'bg-[#1a1a2e] hover:bg-red-600/20 text-slate-400 hover:text-red-400' : 'bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500'}`}
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
        <div className={`border rounded-xl p-4 ${isDark ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-sm ${isDark ? 'text-cyan-300/80' : 'text-blue-700'}`}>
            <strong>Astuce :</strong> Creez des profils pour chaque motorisation (essence/diesel) et assignez vos vehicules apres. Les vehicules incompatibles seront automatiquement bloques.
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
