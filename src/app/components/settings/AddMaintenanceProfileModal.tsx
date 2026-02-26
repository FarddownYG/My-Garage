import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Car, Check, Wrench, FileText } from 'lucide-react';
import type { MaintenanceProfile } from '../../types';
import { defaultMaintenanceTemplates } from '../../data/defaultMaintenanceTemplates';

interface AddMaintenanceProfileModalProps {
  profile?: MaintenanceProfile;
  onClose: () => void;
}

export function AddMaintenanceProfileModal({ profile, onClose }: AddMaintenanceProfileModalProps) {
  const { addMaintenanceProfile, updateMaintenanceProfile, currentProfile, profiles, addMaintenanceTemplate, maintenanceTemplates, getUserVehicles } = useApp();
  const { isDark } = useTheme();
  
  const [name, setName] = useState(profile?.name || '');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(profile?.vehicleIds || []);
  const [profileType, setProfileType] = useState<'custom' | 'essence' | 'diesel'>(
    profile?.isCustom ? 'custom' : 'essence'
  );
  const [error, setError] = useState('');

  // 🔧 CORRECTION CRITIQUE : Utiliser getUserVehicles() pour filtrer par user_id
  const userVehicles = getUserVehicles();

  const handleToggleVehicle = (vehicleId: string) => {
    setSelectedVehicleIds(prev => 
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Le nom du profil est requis');
      return;
    }

    if (selectedVehicleIds.length === 0) {
      setError('Sélectionnez au moins un véhicule');
      return;
    }

    // ✅ FIX : utiliser currentProfile OU le premier profil non-admin disponible
    const ownerProfile = currentProfile || profiles.find((p: any) => !p.isAdmin);
    if (!ownerProfile) {
      setError('Aucun profil utilisateur trouvé');
      return;
    }

    try {
      if (profile) {
        // Mode édition
        await updateMaintenanceProfile(profile.id, {
          name: name.trim(),
          vehicleIds: selectedVehicleIds,
          isCustom: profileType === 'custom',
        });
      } else {
        // Mode création
        const newProfile: MaintenanceProfile = {
          id: `profile-${Date.now()}`,
          name: name.trim(),
          vehicleIds: selectedVehicleIds,
          ownerId: ownerProfile.id,
          isCustom: profileType === 'custom',
          createdAt: new Date().toISOString(),
        };

        await addMaintenanceProfile(newProfile);

        // Si c'est un profil pré-rempli, créer les templates par défaut
        if (profileType !== 'custom') {
          const selectedVehicles = userVehicles.filter(v => selectedVehicleIds.includes(v.id));
          
          // Détecter les types de carburant et transmission des véhicules sélectionnés
          const fuelTypes = new Set(selectedVehicles.map(v => v.fuelType).filter(Boolean));
          const driveTypes = new Set(selectedVehicles.map(v => v.driveType).filter(Boolean));
          
          // Si aucun type n'est défini, inclure tous les templates
          const shouldIncludeAll = fuelTypes.size === 0 && driveTypes.size === 0;
          
          // Créer un Set pour éviter les doublons de templates
          const addedTemplates = new Set<string>();
          const templatesToAdd: any[] = [];
          
          // Parcourir tous les templates par défaut
          defaultMaintenanceTemplates.forEach((template, index) => {
            // Vérifier si ce template correspond à au moins un véhicule
            const isApplicable = shouldIncludeAll || selectedVehicles.some(vehicle => {
              const vehicleFuelType = vehicle.fuelType;
              const vehicleDriveType = vehicle.driveType;
              
              // Vérifier correspondance motorisation
              const fuelMatch = !template.fuelType || 
                template.fuelType === 'both' || 
                template.fuelType === vehicleFuelType;
              
              // Vérifier correspondance transmission
              const driveMatch = !template.driveType || 
                template.driveType === 'both' || 
                template.driveType === vehicleDriveType;
              
              return fuelMatch && driveMatch;
            });
            
            // Ajouter le template s'il est applicable et pas déjà ajouté
            if (isApplicable && !addedTemplates.has(template.name)) {
              templatesToAdd.push({
                ...template,
                id: `${template.id}-${newProfile.id}-${index}`,
                ownerId: ownerProfile.id,
                profileId: newProfile.id,
              });
              
              addedTemplates.add(template.name);
            }
          });
          
          // Ajouter tous les templates en séquence
          for (const template of templatesToAdd) {
            await addMaintenanceTemplate(template);
          }
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      const msg = err?.message || 'Une erreur est survenue lors de la sauvegarde';
      if (msg.includes('column') || msg.includes('relation') || msg.includes('policy')) {
        setError(`${msg}\n\n💡 Exécutez le SQL de migration dans Supabase SQL Editor pour créer les colonnes manquantes.`);
      } else {
        setError(msg);
      }
    }
  };

  const modalBg = isDark ? 'bg-[#12121a]/95 backdrop-blur-2xl' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#1a1a2e] border border-white/[0.06] text-white placeholder-slate-500' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400';
  const labelColor = isDark ? 'text-slate-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-[#1a1a2e]' : 'bg-gray-50';
  const cardBorder = isDark ? 'border-white/[0.06]' : 'border-gray-200';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-in">
      <div className={`${modalBg} w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border ${borderColor} animate-scale-in`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {profile ? 'Modifier le Profil' : 'Nouveau Profil d\'Entretien'}
          </h2>
          <button 
            onClick={onClose}
            className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-all duration-300 hover:rotate-90`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nom du profil */}
          <div>
            <label htmlFor="profile-name" className={`block text-sm ${labelColor} mb-2`}>
              Nom du Profil *
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Entretien Sportif, Entretien Ville..."
              className={`w-full ${inputBg} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300`}
              autoFocus
            />
          </div>

          {/* Type de profil */}
          <div>
            <label className={`block text-sm ${labelColor} mb-3`}>
              Type de Profil
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProfileType('essence')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  profileType === 'essence'
                    ? 'bg-cyan-500/20 border-cyan-500 shadow-glow-blue'
                    : `${cardBg} ${cardBorder} border ${isDark ? 'hover:border-white/20' : 'hover:border-gray-300'}`
                }`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${profileType === 'essence' ? 'text-cyan-400' : isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Pré-rempli</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Templates par défaut selon motorisation
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProfileType('custom')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  profileType === 'custom'
                    ? 'bg-violet-500/20 border-violet-500 shadow-glow-purple'
                    : `${cardBg} ${cardBorder} border ${isDark ? 'hover:border-white/20' : 'hover:border-gray-300'}`
                }`}
              >
                <Wrench className={`w-6 h-6 mx-auto mb-2 ${profileType === 'custom' ? 'text-violet-400' : isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Personnalisé</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Créez vos propres entretiens
                </div>
              </button>
            </div>
          </div>

          {/* Sélection des véhicules */}
          <div>
            <label className={`block text-sm ${labelColor} mb-3`}>
              Véhicules Associés * ({selectedVehicleIds.length} sélectionné{selectedVehicleIds.length > 1 ? 's' : ''})
            </label>
            
            {userVehicles.length === 0 ? (
              <div className={`${cardBg} border ${cardBorder} rounded-xl p-6 text-center`}>
                <Car className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Aucun véhicule disponible. Ajoutez d'abord un véhicule.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userVehicles.map((vehicle) => {
                  const isSelected = selectedVehicleIds.includes(vehicle.id);
                  
                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => handleToggleVehicle(vehicle.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 shadow-lg'
                          : `${cardBg} border ${cardBorder} ${isDark ? 'hover:border-white/20' : 'hover:border-gray-300'}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Car className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                        <div className="text-left">
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{vehicle.name}</div>
                          <div className={`text-xs flex items-center gap-2 mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {vehicle.fuelType && (
                              <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
                                {vehicle.fuelType}
                              </span>
                            )}
                            {vehicle.driveType && (
                              <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
                                {vehicle.driveType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info sur le type de profil */}
          {selectedVehicleIds.length > 0 && (
            <div className={`p-4 rounded-xl border ${
              profileType === 'custom'
                ? 'bg-violet-500/10 border-violet-500/30'
                : 'bg-cyan-500/10 border-cyan-500/30'
            }`}>
              <div className="flex gap-3">
                {profileType === 'custom' ? (
                  <Wrench className="w-5 h-5 text-purple-400 flex-shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                )}
                <div className="text-sm">
                  {profileType === 'custom' ? (
                    <p className="text-purple-300">
                      Profil personnalisé : Vous pourrez ajouter vos propres types d'entretien après la création.
                    </p>
                  ) : (
                    <p className="text-blue-300">
                      Profil pré-rempli : Les templates d'entretien seront automatiquement créés selon la motorisation ({
                        userVehicles
                          .filter(v => selectedVehicleIds.includes(v.id))
                          .map(v => v.fuelType)
                          .filter((v, i, a) => v && a.indexOf(v) === i)
                          .join(', ') || 'non définie'
                      }) de vos véhicules.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-600/20 border border-red-600/30 rounded-xl p-4 text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className={`flex gap-3 p-6 border-t ${borderColor}`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 px-4 py-3 rounded-xl transition-all duration-300 active:scale-95 ${isDark ? 'bg-[#1a1a2e] hover:bg-[#252540] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || selectedVehicleIds.length === 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {profile ? 'Enregistrer' : 'Créer le Profil'}
          </button>
        </div>
      </div>
    </div>
  );
}