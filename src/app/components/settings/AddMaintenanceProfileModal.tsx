import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Wrench, FileText, Fuel, Check } from 'lucide-react';
import type { MaintenanceProfile } from '../../types';
import { defaultMaintenanceTemplates } from '../../data/defaultMaintenanceTemplates';

interface AddMaintenanceProfileModalProps {
  profile?: MaintenanceProfile;
  onClose: () => void;
}

export function AddMaintenanceProfileModal({ profile, onClose }: AddMaintenanceProfileModalProps) {
  const { addMaintenanceProfile, updateMaintenanceProfile, currentProfile, profiles, addMaintenanceTemplate } = useApp();
  const { isDark } = useTheme();
  
  const [name, setName] = useState(profile?.name || '');
  const [profileType, setProfileType] = useState<'custom' | 'prefilled'>(
    profile ? (profile.isCustom ? 'custom' : 'prefilled') : 'custom'
  );
  const [fuelType, setFuelType] = useState<'essence' | 'diesel'>(profile?.fuelType || 'essence');
  const [is4x4, setIs4x4] = useState(profile?.is4x4 || false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Le nom du profil est requis');
      return;
    }

    const ownerProfile = currentProfile || profiles.find((p: any) => !p.isAdmin);
    if (!ownerProfile) {
      setError('Aucun profil utilisateur trouve');
      return;
    }

    setSaving(true);

    try {
      if (profile) {
        // Mode edition
        await updateMaintenanceProfile(profile.id, {
          name: name.trim(),
          isCustom: profileType === 'custom',
          fuelType,
          is4x4,
        });
      } else {
        // Mode creation - vehicleIds vide, on ajoutera les vehicules apres
        const newProfile: MaintenanceProfile = {
          id: `profile-${Date.now()}`,
          name: name.trim(),
          vehicleIds: [],
          ownerId: ownerProfile.id,
          isCustom: profileType === 'custom',
          fuelType,
          is4x4,
          createdAt: new Date().toISOString(),
        };

        await addMaintenanceProfile(newProfile);

        // Si profil pre-rempli, creer les templates par defaut selon fuelType/is4x4
        if (profileType === 'prefilled') {
          const addedTemplates = new Set<string>();
          const templatesToAdd: any[] = [];

          defaultMaintenanceTemplates.forEach((template, index) => {
            // Verifier compatibilite motorisation
            const fuelMatch = !template.fuelType ||
              template.fuelType === 'both' ||
              template.fuelType === fuelType;

            // Verifier compatibilite transmission
            const driveMatch = !template.driveType ||
              template.driveType === 'both' ||
              (is4x4 ? template.driveType === '4x4' : template.driveType === '4x2');

            if (fuelMatch && driveMatch && !addedTemplates.has(template.name)) {
              templatesToAdd.push({
                ...template,
                id: `${template.id}-${newProfile.id}-${index}`,
                ownerId: ownerProfile.id,
                profileId: newProfile.id,
              });
              addedTemplates.add(template.name);
            }
          });

          for (const template of templatesToAdd) {
            await addMaintenanceTemplate(template);
          }
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      const msg = err?.message || 'Une erreur est survenue lors de la sauvegarde';
      setError(msg);
    } finally {
      setSaving(false);
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
              placeholder="Ex: Entretien Ville, Entretien Sportif..."
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
                onClick={() => setProfileType('prefilled')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  profileType === 'prefilled'
                    ? 'bg-cyan-500/20 border-cyan-500 shadow-glow-blue'
                    : `${cardBg} ${cardBorder} border ${isDark ? 'hover:border-white/20' : 'hover:border-gray-300'}`
                }`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${profileType === 'prefilled' ? 'text-cyan-400' : isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Pre-rempli</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Templates par defaut
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
                <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Personnalise</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Creez vos propres entretiens
                </div>
              </button>
            </div>
          </div>

          {/* Motorisation */}
          <div>
            <label className={`block text-sm ${labelColor} mb-3`}>
              Motorisation *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFuelType('essence')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                  fuelType === 'essence'
                    ? 'bg-emerald-500/20 border-emerald-500'
                    : `${cardBg} ${cardBorder} border ${isDark ? 'hover:border-white/20' : 'hover:border-gray-300'}`
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  fuelType === 'essence' ? 'bg-emerald-500/30' : isDark ? 'bg-white/5' : 'bg-gray-200'
                }`}>
                  <Fuel className={`w-5 h-5 ${fuelType === 'essence' ? 'text-emerald-400' : isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                </div>
                <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Essence</div>
                {fuelType === 'essence' && (
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFuelType('diesel')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                  fuelType === 'diesel'
                    ? 'bg-amber-500/20 border-amber-500'
                    : `${cardBg} ${cardBorder} border ${isDark ? 'hover:border-white/20' : 'hover:border-gray-300'}`
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  fuelType === 'diesel' ? 'bg-amber-500/30' : isDark ? 'bg-white/5' : 'bg-gray-200'
                }`}>
                  <Fuel className={`w-5 h-5 ${fuelType === 'diesel' ? 'text-amber-400' : isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                </div>
                <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Diesel</div>
                {fuelType === 'diesel' && (
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Checkbox 4x4 */}
          <div>
            <button
              type="button"
              onClick={() => setIs4x4(!is4x4)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                is4x4
                  ? 'bg-cyan-500/20 border-cyan-500'
                  : `${cardBg} border ${cardBorder} ${isDark ? 'hover:border-white/20' : 'hover:border-gray-300'}`
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  is4x4 ? 'bg-cyan-500/30' : isDark ? 'bg-white/5' : 'bg-gray-200'
                }`}>
                  <span className="text-lg">&#x1F699;</span>
                </div>
                <div className="text-left">
                  <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Transmission 4x4</div>
                  <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Active les entretiens specifiques 4x4 (ponts, transfert...)
                  </div>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                is4x4
                  ? 'bg-cyan-500 border-cyan-500'
                  : isDark ? 'border-white/20' : 'border-gray-300'
              }`}>
                {is4x4 && <Check className="w-4 h-4 text-white" />}
              </div>
            </button>
          </div>

          {/* Info resume */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex gap-3">
              <Wrench className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
              <div className={`text-sm ${isDark ? 'text-cyan-300/80' : 'text-blue-700'}`}>
                <p>
                  Profil <strong>{fuelType === 'essence' ? 'Essence' : 'Diesel'}</strong>
                  {is4x4 ? ' - 4x4' : ' - 4x2'} 
                  {profileType === 'custom' ? ' (personnalise)' : ' (pre-rempli)'}.
                </p>
                <p className="mt-1 opacity-80">
                  Vous pourrez ajouter des vehicules compatibles apres la creation.
                  Les vehicules incompatibles (mauvaise motorisation) seront bloques.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-600/20 border border-red-600/30 rounded-xl p-4 text-red-400 text-sm animate-fade-in whitespace-pre-line">
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
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : profile ? 'Enregistrer' : 'Creer le Profil'}
          </button>
        </div>
      </div>
    </div>
  );
}
