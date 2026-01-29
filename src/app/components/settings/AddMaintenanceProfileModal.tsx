import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Car, Check, Wrench, FileText } from 'lucide-react';
import type { MaintenanceProfile } from '../../types';
import { defaultMaintenanceTemplates } from '../../data/defaultMaintenanceTemplates';

interface AddMaintenanceProfileModalProps {
  profile?: MaintenanceProfile;
  onClose: () => void;
}

export function AddMaintenanceProfileModal({ profile, onClose }: AddMaintenanceProfileModalProps) {
  const { vehicles, addMaintenanceProfile, updateMaintenanceProfile, currentProfile, addMaintenanceTemplate, maintenanceTemplates } = useApp();
  
  const [name, setName] = useState(profile?.name || '');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(profile?.vehicleIds || []);
  const [profileType, setProfileType] = useState<'custom' | 'essence' | 'diesel'>(
    profile?.isCustom ? 'custom' : 'essence'
  );
  const [error, setError] = useState('');

  // Filtrer les véhicules de l'utilisateur courant
  const userVehicles = vehicles.filter(v => v.ownerId === currentProfile?.id);

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
          ownerId: currentProfile!.id,
          isCustom: profileType === 'custom',
          createdAt: new Date().toISOString(),
        };

        await addMaintenanceProfile(newProfile);

        // Si c'est un profil pré-rempli, créer les templates par défaut
        if (profileType !== 'custom') {
          const selectedVehicles = vehicles.filter(v => selectedVehicleIds.includes(v.id));
          
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
                id: `${template.id}-${newProfile.id}-${index}`, // Utiliser l'index au lieu de Date.now()
                ownerId: currentProfile!.id,
                profileId: newProfile.id,
              });
              
              addedTemplates.add(template.name);
            }
          });
          
          // Ajouter tous les templates en séquence
          for (const template of templatesToAdd) {
            await addMaintenanceTemplate(template);
          }
          
          console.log(`✅ Profil pré-rempli créé avec ${addedTemplates.size} templates`);
        }
      }

      onClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Une erreur est survenue lors de la sauvegarde');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-in">
      <div className="bg-zinc-900/95 backdrop-blur-2xl w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border border-zinc-800/50 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl text-white">
            {profile ? 'Modifier le Profil' : 'Nouveau Profil d\'Entretien'}
          </h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-all duration-300 hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nom du profil */}
          <div>
            <label htmlFor="profile-name" className="block text-sm text-zinc-400 mb-2">
              Nom du Profil *
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Entretien Sportif, Entretien Ville..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300"
              autoFocus
            />
          </div>

          {/* Type de profil */}
          <div>
            <label className="block text-sm text-zinc-400 mb-3">
              Type de Profil
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProfileType('essence')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  profileType === 'essence'
                    ? 'bg-blue-600/20 border-blue-600 shadow-glow-blue'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Pré-rempli</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Templates par défaut selon motorisation
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProfileType('custom')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  profileType === 'custom'
                    ? 'bg-purple-600/20 border-purple-600 shadow-glow-purple'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <Wrench className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Personnalisé</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Créez vos propres entretiens
                </div>
              </button>
            </div>
          </div>

          {/* Sélection des véhicules */}
          <div>
            <label className="block text-sm text-zinc-400 mb-3">
              Véhicules Associés * ({selectedVehicleIds.length} sélectionné{selectedVehicleIds.length > 1 ? 's' : ''})
            </label>
            
            {userVehicles.length === 0 ? (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 text-center">
                <Car className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">
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
                          ? 'bg-blue-600/20 border-blue-600 shadow-lg'
                          : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Car className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-white font-medium">{vehicle.name}</div>
                          <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                            {vehicle.fuelType && (
                              <span className="px-2 py-0.5 bg-zinc-700 rounded-full">
                                {vehicle.fuelType}
                              </span>
                            )}
                            {vehicle.driveType && (
                              <span className="px-2 py-0.5 bg-zinc-700 rounded-full">
                                {vehicle.driveType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4" />
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
                ? 'bg-purple-600/10 border-purple-600/30'
                : 'bg-blue-600/10 border-blue-600/30'
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
                        vehicles
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
        <div className="flex gap-3 p-6 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all duration-300 active:scale-95"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || selectedVehicleIds.length === 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover-glow"
          >
            {profile ? 'Enregistrer' : 'Créer le Profil'}
          </button>
        </div>
      </div>
    </div>
  );
}