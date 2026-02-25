import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ArrowLeft, Plus, Edit2, Trash2, Car, Link2, Unlink, Check, X, Pencil } from 'lucide-react';
import { Card } from '../ui/card';
import { CustomSelect } from '../ui/CustomSelect';
import type { MaintenanceTemplate } from '../../types';

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

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  // ✅ État pour le renommage du profil
  const [isRenamingProfile, setIsRenamingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    icon: '🔧',
    intervalMonths: '',
    intervalKm: '',
    fuelType: 'both' as 'essence' | 'diesel' | 'both',
    driveType: 'both' as '4x2' | '4x4' | 'both',
  });

  // ⚠️ EMOJIS UNIVERSELS uniquement (compatibles toutes plateformes)
  const availableIcons = ['🔧', '⚙️', '🔩', '⚡', '💡', '🔥', '❄️', '💧', '⛔', '✅', '❌', '⭐'];

  const profile = maintenanceProfiles.find(p => p.id === profileId);
  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Profil introuvable</p>
          <button onClick={onBack} className="mt-4 text-blue-500">Retour</button>
        </div>
      </div>
    );
  }

  // Templates liés à ce profil
  const profileTemplates = maintenanceTemplates.filter(t => t.profileId === profileId);

  // ✅ FIX : Utiliser getUserVehicles() qui fonctionne même si currentProfile est null
  const allUserVehicles = getUserVehicles();

  // Véhicules liés à ce profil
  const linkedVehicles = allUserVehicles.filter(v => profile.vehicleIds.includes(v.id));

  // Véhicules disponibles (non liés)
  const availableVehicles = allUserVehicles.filter(v => !profile.vehicleIds.includes(v.id));

  // 🔧 Détecter la motorisation dominante des véhicules liés
  const profileFuelType = (() => {
    if (linkedVehicles.length === 0) return 'both';
    const fuelTypes = linkedVehicles.map(v => v.engineType || v.fuelType).filter(Boolean);
    if (fuelTypes.length === 0) return 'both';
    const hasEssence = fuelTypes.some(f => f === 'gasoline' || f === 'essence');
    const hasDiesel = fuelTypes.some(f => f === 'diesel');
    if (hasEssence && hasDiesel) return 'both';
    if (hasEssence) return 'essence';
    if (hasDiesel) return 'diesel';
    return 'both';
  })();

  // ── Handlers template ──────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (profileFuelType !== 'both' && formData.fuelType !== 'both' && formData.fuelType !== profileFuelType) {
      alert(`⚠️ Ce profil est lié à des véhicules ${profileFuelType === 'essence' ? 'essence' : 'diesel'}. Vous ne pouvez pas ajouter un template ${formData.fuelType === 'essence' ? 'essence' : 'diesel'}.`);
      return;
    }

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

    if (editingId) {
      updateMaintenanceTemplate(editingId, template);
    } else {
      addMaintenanceTemplate(template);
    }

    setFormData({ name: '', icon: '🔧', intervalMonths: '', intervalKm: '', fuelType: 'both', driveType: 'both' });
    setShowAddForm(false);
    setEditingId(null);
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

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type d\'entretien ?')) {
      deleteMaintenanceTemplate(id);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', icon: '🔧', intervalMonths: '', intervalKm: '', fuelType: 'both', driveType: 'both' });
  };

  // ── Handlers véhicules ─────────────────────────────────────────
  const handleLinkVehicle = (vehicleId: string) => {
    updateMaintenanceProfile(profileId, {
      vehicleIds: [...profile.vehicleIds, vehicleId],
    });
    setShowVehicleSelector(false);
  };

  const handleUnlinkVehicle = (vehicleId: string) => {
    updateMaintenanceProfile(profileId, {
      vehicleIds: profile.vehicleIds.filter(id => id !== vehicleId),
    });
  };

  // ── Handlers renommage profil ──────────────────────────────────
  const handleStartRename = () => {
    setNewProfileName(profile.name);
    setIsRenamingProfile(true);
  };

  const handleConfirmRename = () => {
    const trimmed = newProfileName.trim();
    if (!trimmed) return;
    updateMaintenanceProfile(profileId, { name: trimmed });
    setIsRenamingProfile(false);
  };

  const handleCancelRename = () => {
    setIsRenamingProfile(false);
    setNewProfileName('');
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all duration-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        {/* Nom du profil avec bouton renommer */}
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
              className="flex-1 bg-zinc-800 border border-blue-500 text-white text-2xl rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleConfirmRename}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all active:scale-95"
            >
              <Check className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleCancelRename}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all active:scale-95"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl text-white">{profile.name}</h1>
            <button
              onClick={handleStartRename}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all duration-300 active:scale-95"
              title="Renommer le profil"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${
            profile.isCustom
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {profile.isCustom ? 'Personnalisé' : 'Pré-rempli'}
          </span>
          {profileTemplates.length > 0 && (
            <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {profileTemplates.length} entretien{profileTemplates.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ── Véhicules liés ────────────────────────────────────── */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-white font-medium flex items-center gap-2">
              <Car className="w-5 h-5" />
              Véhicules associés ({linkedVehicles.length})
            </h2>
            {availableVehicles.length > 0 && (
              <button
                onClick={() => setShowVehicleSelector(!showVehicleSelector)}
                className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 active:scale-95"
              >
                <Plus className="w-4 h-4 inline-block mr-1" />
                Lier un véhicule
              </button>
            )}
          </div>

          {/* Sélecteur de véhicules */}
          {showVehicleSelector && availableVehicles.length > 0 && (
            <div className="mb-4 p-4 bg-zinc-800 rounded-xl space-y-2 animate-fade-in">
              {availableVehicles.map(vehicle => (
                <button
                  key={vehicle.id}
                  onClick={() => handleLinkVehicle(vehicle.id)}
                  className="w-full flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-700 rounded-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Car className="w-4 h-4 text-zinc-400" />
                    <div className="text-left">
                      <span className="text-white">{vehicle.name}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {vehicle.fuelType && (
                          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{vehicle.fuelType}</span>
                        )}
                        {vehicle.driveType && (
                          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{vehicle.driveType}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link2 className="w-4 h-4 text-blue-400" />
                </button>
              ))}
            </div>
          )}

          {linkedVehicles.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-500">Aucun véhicule associé</p>
              {availableVehicles.length === 0 && (
                <p className="text-xs text-zinc-600 mt-1">Ajoutez d'abord un véhicule dans l'application</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {linkedVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-zinc-400" />
                    <div>
                      <div className="text-white">{vehicle.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {vehicle.fuelType && (
                          <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded-full text-zinc-400">
                            {vehicle.fuelType}
                          </span>
                        )}
                        {vehicle.driveType && (
                          <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded-full text-zinc-400">
                            {vehicle.driveType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlinkVehicle(vehicle.id)}
                    className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-all duration-300 active:scale-95"
                    title="Délier ce véhicule"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Templates d'entretien ─────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-white font-medium">Paramètres d'entretien</h2>
            {linkedVehicles.length > 0 && profileFuelType !== 'both' && (
              <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                🔧 {profileFuelType === 'essence' ? '⛽ Essence' : '💧 Diesel'}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 mb-4"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un type d'entretien</span>
          </button>

          {/* Formulaire ajout/édition */}
          {showAddForm && (
            <Card className="bg-zinc-900 border-zinc-800 p-4 mb-4 animate-fade-in">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Courroie de distribution"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Icône</label>
                  <div className="grid grid-cols-6 gap-2">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-colors ${
                          formData.icon === icon ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Motorisation</label>
                  <CustomSelect
                    value={formData.fuelType}
                    onChange={(value) => setFormData({ ...formData, fuelType: value as 'essence' | 'diesel' | 'both' })}
                    options={[
                      { value: 'both', label: 'Essence + Diesel', icon: '🔧' },
                      { value: 'essence', label: 'Essence', icon: '⛽' },
                      { value: 'diesel', label: 'Diesel', icon: '💧' },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Type de traction</label>
                  <CustomSelect
                    value={formData.driveType}
                    onChange={(value) => setFormData({ ...formData, driveType: value as '4x2' | '4x4' | 'both' })}
                    options={[
                      { value: 'both', label: '4x2 + 4x4', icon: '🔧' },
                      { value: '4x2', label: '4x2', icon: '⚙️' },
                      { value: '4x4', label: '4x4', icon: '🚙' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Intervalle (mois)</label>
                    <input
                      type="number"
                      value={formData.intervalMonths}
                      onChange={(e) => setFormData({ ...formData, intervalMonths: e.target.value })}
                      placeholder="24"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Intervalle (km)</label>
                    <input
                      type="number"
                      value={formData.intervalKm}
                      onChange={(e) => setFormData({ ...formData, intervalKm: e.target.value })}
                      placeholder="15000"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                  >
                    {editingId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* Liste des templates */}
          {profileTemplates.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
              <p className="text-zinc-500 text-sm">
                {profile.isCustom
                  ? 'Aucun paramètre d\'entretien défini. Ajoutez-en un pour commencer.'
                  : 'Les templates seront chargés automatiquement selon la motorisation des véhicules liés.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {profileTemplates.map((template) => (
                <Card key={template.id} className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <span className="text-white">{template.name}</span>
                        <p className="text-sm text-zinc-500 mt-1">
                          {template.intervalMonths ? `${template.intervalMonths} mois` : ''}
                          {template.intervalMonths && template.intervalKm ? ' • ' : ''}
                          {template.intervalKm ? `${template.intervalKm.toLocaleString()} km` : ''}
                          {!template.intervalMonths && !template.intervalKm ? 'Aucun intervalle défini' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
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
