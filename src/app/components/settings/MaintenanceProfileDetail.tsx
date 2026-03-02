import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Plus, Edit2, Trash2, Car, Link2, Unlink, Check, X, Pencil, AlertTriangle, Fuel } from 'lucide-react';
import { Card } from '../ui/card';
import { CustomSelect } from '../ui/CustomSelect';
import type { MaintenanceTemplate, Vehicle } from '../../types';

interface MaintenanceProfileDetailProps {
  profileId: string;
  onBack: () => void;
}

export function MaintenanceProfileDetail({ profileId, onBack }: MaintenanceProfileDetailProps) {
  const {
    maintenanceProfiles,
    maintenanceTemplates,
    getUserVehicles,
    updateMaintenanceProfile,
    addMaintenanceTemplate,
    updateMaintenanceTemplate,
    deleteMaintenanceTemplate,
  } = useApp();
  const { isDark } = useTheme();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  // Renommage du profil
  const [isRenamingProfile, setIsRenamingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    icon: '&#x1F527;',
    intervalMonths: '',
    intervalKm: '',
    fuelType: 'both' as 'essence' | 'diesel' | 'both',
    driveType: 'both' as '4x2' | '4x4' | 'both',
  });

  const availableIcons = ['\u{1F527}', '\u2699\uFE0F', '\u{1F529}', '\u26A1', '\u{1F4A1}', '\u{1F525}', '\u2744\uFE0F', '\u{1F4A7}', '\u26D4', '\u2705', '\u274C', '\u2B50'];

  const profile = maintenanceProfiles.find(p => p.id === profileId);
  if (!profile) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Profil introuvable</p>
          <button onClick={onBack} className="mt-4 text-cyan-500">Retour</button>
        </div>
      </div>
    );
  }

  // Templates lies a ce profil
  const profileTemplates = maintenanceTemplates.filter(t => t.profileId === profileId);
  const allUserVehicles = getUserVehicles();
  const linkedVehicles = allUserVehicles.filter(v => profile.vehicleIds.includes(v.id));
  const availableVehicles = allUserVehicles.filter(v => !profile.vehicleIds.includes(v.id));

  // Helper : normaliser le fuelType du vehicule
  const getVehicleFuelType = (v: Vehicle): 'essence' | 'diesel' | undefined => {
    if (v.fuelType) return v.fuelType;
    if (v.engineType === 'gasoline') return 'essence';
    if (v.engineType === 'diesel') return 'diesel';
    return undefined;
  };

  // Helper : verifier compatibilite vehicule/profil
  const isVehicleCompatible = (vehicle: Vehicle): { compatible: boolean; reason?: string } => {
    const vFuel = getVehicleFuelType(vehicle);
    const pFuel = profile.fuelType;

    // Si le profil a une motorisation definie et le vehicule aussi, verifier compatibilite
    if (pFuel && vFuel && pFuel !== vFuel) {
      return {
        compatible: false,
        reason: `Ce vehicule est ${vFuel} mais ce profil est configure pour ${pFuel}. Impossible d'ajouter un vehicule ${vFuel} dans un profil ${pFuel}.`,
      };
    }

    return { compatible: true };
  };

  // Handlers template
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const template = {
      id: editingId || `template-${Date.now()}`,
      name: formData.name,
      icon: formData.icon,
      intervalMonths: formData.intervalMonths ? parseInt(formData.intervalMonths) : undefined,
      intervalKm: formData.intervalKm ? parseInt(formData.intervalKm) : undefined,
      fuelType: formData.fuelType,
      driveType: formData.driveType,
      profileId: profileId,
    };

    try {
      if (editingId) {
        await updateMaintenanceTemplate(editingId, template);
      } else {
        await addMaintenanceTemplate(template);
      }
      setFormData({ name: '', icon: '\u{1F527}', intervalMonths: '', intervalKm: '', fuelType: 'both', driveType: 'both' });
      setShowAddForm(false);
      setEditingId(null);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleEdit = (template: MaintenanceTemplate) => {
    setFormData({
      name: template.name,
      icon: template.icon,
      intervalMonths: template.intervalMonths?.toString() || '',
      intervalKm: template.intervalKm?.toString() || '',
      fuelType: template.fuelType || 'both',
      driveType: template.driveType || 'both',
    });
    setEditingId(template.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce type d\'entretien ?')) {
      try {
        await deleteMaintenanceTemplate(id);
      } catch (err: any) {
        alert(`Erreur: ${err.message}`);
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', icon: '\u{1F527}', intervalMonths: '', intervalKm: '', fuelType: 'both', driveType: 'both' });
  };

  // Handlers vehicules - avec verification de compatibilite
  const handleLinkVehicle = async (vehicle: Vehicle) => {
    const { compatible, reason } = isVehicleCompatible(vehicle);

    if (!compatible) {
      setVehicleError(reason || 'Vehicule incompatible');
      setTimeout(() => setVehicleError(null), 5000);
      return;
    }

    try {
      setVehicleError(null);
      await updateMaintenanceProfile(profileId, {
        vehicleIds: [...profile.vehicleIds, vehicle.id],
      });
      setShowVehicleSelector(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleUnlinkVehicle = async (vehicleId: string) => {
    try {
      await updateMaintenanceProfile(profileId, {
        vehicleIds: profile.vehicleIds.filter(id => id !== vehicleId),
      });
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // Handlers renommage
  const handleStartRename = () => {
    setNewProfileName(profile.name);
    setIsRenamingProfile(true);
  };

  const handleConfirmRename = async () => {
    const trimmed = newProfileName.trim();
    if (!trimmed) return;
    try {
      await updateMaintenanceProfile(profileId, { name: trimmed });
      setIsRenamingProfile(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleCancelRename = () => {
    setIsRenamingProfile(false);
    setNewProfileName('');
  };

  // Couleurs du theme
  const bgMain = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const bgHeader = isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-gradient-to-b from-white to-gray-50';
  const bgCard = isDark ? 'bg-[#12121a]/50 backdrop-blur-sm border-white/[0.06]' : 'bg-white border-gray-200';
  const bgInput = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const textDimmed = isDark ? 'text-slate-500' : 'text-gray-400';

  return (
    <div className={`min-h-screen ${bgMain} pb-24`}>
      {/* Header */}
      <div className={`${bgHeader} px-6 pt-12 pb-8`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-2 ${textMuted} hover:${textMain} transition-all duration-300 mb-6`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        {/* Nom du profil */}
        {isRenamingProfile ? (
          <div className="flex items-center gap-3 mb-2">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename();
                if (e.key === 'Escape') handleCancelRename();
              }}
              autoFocus
              className={`flex-1 ${bgInput} border text-2xl rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
            <button onClick={handleConfirmRename} className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-all active:scale-95">
              <Check className="w-5 h-5 text-white" />
            </button>
            <button onClick={handleCancelRename} className={`p-2 ${isDark ? 'bg-[#1a1a2e] hover:bg-[#252540]' : 'bg-gray-200 hover:bg-gray-300'} rounded-xl transition-all active:scale-95`}>
              <X className={`w-5 h-5 ${textMuted}`} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-2">
            <h1 className={`text-3xl ${textMain}`}>{profile.name}</h1>
            <button
              onClick={handleStartRename}
              className={`p-2 ${textDimmed} hover:${textMain} ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-200'} rounded-xl transition-all duration-300 active:scale-95`}
              title="Renommer le profil"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-3 py-1 rounded-full ${
            profile.isCustom
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          }`}>
            {profile.isCustom ? 'Personnalise' : 'Pre-rempli'}
          </span>
          {profile.fuelType && (
            <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 ${
              profile.fuelType === 'essence'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <Fuel className="w-3 h-3" />
              {profile.fuelType === 'essence' ? 'Essence' : 'Diesel'}
            </span>
          )}
          {profile.is4x4 && (
            <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              4x4
            </span>
          )}
          {profileTemplates.length > 0 && (
            <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-white/5 text-slate-400 border border-white/[0.06]' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
              {profileTemplates.length} entretien{profileTemplates.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Vehicules lies */}
        <div className={`border rounded-2xl p-5 ${bgCard}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg ${textMain} flex items-center gap-2`}>
              <Car className="w-5 h-5" />
              Vehicules associes ({linkedVehicles.length})
            </h2>
            <button
              onClick={() => { setShowVehicleSelector(!showVehicleSelector); setVehicleError(null); }}
              className="text-sm px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white rounded-lg transition-all duration-300 active:scale-95"
            >
              <Plus className="w-4 h-4 inline-block mr-1" />
              Lier un vehicule
            </button>
          </div>

          {/* Erreur compatibilite */}
          {vehicleError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm">{vehicleError}</p>
              </div>
              <button onClick={() => setVehicleError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Selecteur de vehicules */}
          {showVehicleSelector && (
            <div className={`mb-4 p-4 rounded-xl space-y-2 animate-fade-in ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}>
              {availableVehicles.length === 0 ? (
                <p className={`text-sm text-center py-4 ${textMuted}`}>
                  {allUserVehicles.length === 0
                    ? 'Aucun vehicule. Ajoutez d\'abord un vehicule.'
                    : 'Tous vos vehicules sont deja lies a ce profil.'}
                </p>
              ) : (
                availableVehicles.map(vehicle => {
                  const { compatible, reason } = isVehicleCompatible(vehicle);
                  const vFuel = getVehicleFuelType(vehicle);

                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => handleLinkVehicle(vehicle)}
                      disabled={!compatible}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                        compatible
                          ? isDark ? 'bg-[#12121a] hover:bg-white/5' : 'bg-white hover:bg-gray-50'
                          : 'opacity-50 cursor-not-allowed ' + (isDark ? 'bg-[#12121a]' : 'bg-white')
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Car className={`w-4 h-4 ${compatible ? (isDark ? 'text-slate-400' : 'text-gray-500') : 'text-red-400'}`} />
                        <div className="text-left">
                          <span className={`${textMain} ${!compatible ? 'line-through opacity-60' : ''}`}>{vehicle.name}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {vFuel && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                !compatible
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : vFuel === 'essence'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {vFuel}
                              </span>
                            )}
                            {vehicle.driveType && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-slate-500' : 'bg-gray-200 text-gray-500'}`}>
                                {vehicle.driveType}
                              </span>
                            )}
                          </div>
                          {!compatible && reason && (
                            <p className="text-xs text-red-400/80 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Incompatible ({profile.fuelType} uniquement)
                            </p>
                          )}
                        </div>
                      </div>
                      {compatible ? (
                        <Link2 className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {linkedVehicles.length === 0 ? (
            <div className="text-center py-6">
              <Car className={`w-10 h-10 mx-auto mb-2 ${textDimmed}`} />
              <p className={`text-sm ${textMuted}`}>Aucun vehicule associe</p>
              <p className={`text-xs mt-1 ${textDimmed}`}>
                Cliquez sur "Lier un vehicule" pour ajouter un vehicule {profile.fuelType ? profile.fuelType : 'compatible'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {linkedVehicles.map(vehicle => {
                const vFuel = getVehicleFuelType(vehicle);
                return (
                  <div
                    key={vehicle.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Car className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                      <div>
                        <div className={textMain}>{vehicle.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {vFuel && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              vFuel === 'essence'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {vFuel}
                            </span>
                          )}
                          {vehicle.driveType && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-slate-500 border border-white/[0.06]' : 'bg-gray-200 text-gray-500'}`}>
                              {vehicle.driveType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnlinkVehicle(vehicle.id)}
                      className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-all duration-300 active:scale-95"
                      title="Delier ce vehicule"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Templates d'entretien */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg ${textMain}`}>Parametres d'entretien</h2>
            {profile.fuelType && (
              <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 ${
                profile.fuelType === 'essence'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <Fuel className="w-3 h-3" />
                {profile.fuelType === 'essence' ? 'Essence' : 'Diesel'}
                {profile.is4x4 ? ' - 4x4' : ''}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 mb-4"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un type d'entretien</span>
          </button>

          {/* Formulaire ajout/edition */}
          {showAddForm && (
            <Card className={`p-4 mb-4 animate-fade-in ${isDark ? 'bg-[#12121a] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`text-sm ${textMuted} mb-2 block`}>Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Courroie de distribution"
                    className={`w-full ${bgInput} border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={`text-sm ${textMuted} mb-2 block`}>Icone</label>
                  <div className="grid grid-cols-6 gap-2">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-colors ${
                          formData.icon === icon
                            ? 'bg-cyan-600'
                            : isDark ? 'bg-[#1a1a2e] hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-sm ${textMuted} mb-2 block`}>Motorisation</label>
                  <CustomSelect
                    value={formData.fuelType}
                    onChange={(value) => setFormData({ ...formData, fuelType: value as 'essence' | 'diesel' | 'both' })}
                    options={[
                      { value: 'both', label: 'Essence + Diesel', icon: '\u{1F527}' },
                      { value: 'essence', label: 'Essence', icon: '\u26FD' },
                      { value: 'diesel', label: 'Diesel', icon: '\u{1F4A7}' },
                    ]}
                  />
                </div>

                <div>
                  <label className={`text-sm ${textMuted} mb-2 block`}>Type de traction</label>
                  <CustomSelect
                    value={formData.driveType}
                    onChange={(value) => setFormData({ ...formData, driveType: value as '4x2' | '4x4' | 'both' })}
                    options={[
                      { value: 'both', label: '4x2 + 4x4', icon: '\u{1F527}' },
                      { value: '4x2', label: '4x2', icon: '\u2699\uFE0F' },
                      { value: '4x4', label: '4x4', icon: '\u{1F699}' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-sm ${textMuted} mb-2 block`}>Intervalle (mois)</label>
                    <input
                      type="number"
                      value={formData.intervalMonths}
                      onChange={(e) => setFormData({ ...formData, intervalMonths: e.target.value })}
                      placeholder="24"
                      className={`w-full ${bgInput} border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted} mb-2 block`}>Intervalle (km)</label>
                    <input
                      type="number"
                      value={formData.intervalKm}
                      onChange={(e) => setFormData({ ...formData, intervalKm: e.target.value })}
                      placeholder="15000"
                      className={`w-full ${bgInput} border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={`flex-1 py-2 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a2e] hover:bg-white/10 text-slate-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white py-2 rounded-lg transition-colors"
                  >
                    {editingId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* Liste des templates */}
          {profileTemplates.length === 0 ? (
            <div className={`border rounded-2xl p-8 text-center ${bgCard}`}>
              <p className={`text-sm ${textMuted}`}>
                {profile.isCustom
                  ? 'Aucun parametre d\'entretien defini. Ajoutez-en un pour commencer.'
                  : 'Les templates seront charges automatiquement selon la motorisation.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {profileTemplates.map((template) => (
                <Card key={template.id} className={`p-4 ${isDark ? 'bg-[#12121a] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <span className={textMain}>{template.name}</span>
                        <p className={`text-sm ${textMuted} mt-1`}>
                          {template.intervalMonths ? `${template.intervalMonths} mois` : ''}
                          {template.intervalMonths && template.intervalKm ? ' \u2022 ' : ''}
                          {template.intervalKm ? `${template.intervalKm.toLocaleString()} km` : ''}
                          {!template.intervalMonths && !template.intervalKm ? 'Aucun intervalle defini' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-cyan-500 hover:bg-cyan-500/10' : 'text-blue-500 hover:bg-blue-500/10'}`}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
