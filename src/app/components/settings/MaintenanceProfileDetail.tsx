import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ArrowLeft, Plus, Edit2, Trash2, Car, Link2, Unlink } from 'lucide-react';
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
    vehicles,
    updateMaintenanceProfile,
    addMaintenanceTemplate,
    updateMaintenanceTemplate,
    deleteMaintenanceTemplate,
    currentProfile
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    icon: '🔧',
    intervalMonths: '',
    intervalKm: '',
    fuelType: 'both' as 'essence' | 'diesel' | 'both',
    driveType: 'both' as '4x2' | '4x4' | 'both',
  });

  const availableIcons = ['🔧', '🛠️', '⚙️', '🔩', '⚡', '💡', '🧰', '🪛', '⛽', '🧪', '🔌', '🌡️', '🛢️', '🧴', '🔥', '🛑', '🛞', '⛓️', '🌫️', '🔋', '❄️', '🚗', '🚙', '🧼'];

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
  
  // Véhicules liés à ce profil
  const linkedVehicles = vehicles.filter(v => profile.vehicleIds.includes(v.id));
  
  // Véhicules disponibles (non liés) du même utilisateur
  const availableVehicles = vehicles.filter(
    v => v.ownerId === currentProfile?.id && !profile.vehicleIds.includes(v.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
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
      profileId: profileId, // Associer au profil
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

  const handleLinkVehicle = (vehicleId: string) => {
    updateMaintenanceProfile(profileId, {
      vehicleIds: [...profile.vehicleIds, vehicleId]
    });
  };

  const handleUnlinkVehicle = (vehicleId: string) => {
    updateMaintenanceProfile(profileId, {
      vehicleIds: profile.vehicleIds.filter(id => id !== vehicleId)
    });
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
        <h1 className="text-3xl text-white mb-2">{profile.name}</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${
            profile.isCustom 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {profile.isCustom ? 'Personnalisé' : 'Pré-rempli'}
          </span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Véhicules liés */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-white font-medium flex items-center gap-2">
              <Car className="w-5 h-5" />
              Véhicules associés ({linkedVehicles.length})
            </h2>
            <button
              onClick={() => setShowVehicleSelector(!showVehicleSelector)}
              className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 active:scale-95"
            >
              <Plus className="w-4 h-4 inline-block mr-1" />
              Lier un véhicule
            </button>
          </div>

          {/* Sélecteur de véhicules */}
          {showVehicleSelector && availableVehicles.length > 0 && (
            <div className="mb-4 p-4 bg-zinc-800 rounded-xl space-y-2 animate-fade-in">
              {availableVehicles.map(vehicle => (
                <button
                  key={vehicle.id}
                  onClick={() => {
                    handleLinkVehicle(vehicle.id);
                    setShowVehicleSelector(false);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-700 rounded-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Car className="w-4 h-4 text-zinc-400" />
                    <span className="text-white">{vehicle.name}</span>
                  </div>
                  <Link2 className="w-4 h-4 text-blue-400" />
                </button>
              ))}
            </div>
          )}

          {linkedVehicles.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun véhicule associé</p>
          ) : (
            <div className="space-y-2">
              {linkedVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl group"
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
                    className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates d'entretien */}
        <div>
          <h2 className="text-lg text-white font-medium mb-4">Paramètres d'entretien</h2>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 mb-4"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un type d'entretien</span>
          </button>

          {/* Add/Edit form */}
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
                          formData.icon === icon
                            ? 'bg-blue-600'
                            : 'bg-zinc-800 hover:bg-zinc-700'
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
                      { value: 'diesel', label: 'Diesel', icon: '🛢️' },
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
                Aucun paramètre d'entretien défini. Ajoutez-en un pour commencer.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {profileTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-zinc-900 border-zinc-800 p-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{template.name}</span>
                        </div>
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
