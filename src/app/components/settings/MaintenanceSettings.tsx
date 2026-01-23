import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { CustomSelect } from '../ui/CustomSelect';
import type { MaintenanceTemplate } from '../../types';

interface MaintenanceSettingsProps {
  onBack: () => void;
  onOpenCustomProfiles: () => void;
}

export function MaintenanceSettings({ onBack, onOpenCustomProfiles }: MaintenanceSettingsProps) {
  const { maintenanceTemplates, addMaintenanceTemplate, deleteMaintenanceTemplate, updateMaintenanceTemplate } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFuelType, setSelectedFuelType] = useState<'essence' | 'diesel'>('essence');
  const [formData, setFormData] = useState({ 
    name: '', 
    icon: '🔧',
    intervalMonths: '',
    intervalKm: '',
    fuelType: 'both' as 'essence' | 'diesel' | 'both',
    driveType: 'both' as '4x2' | '4x4' | 'both',
  });

  // ⚠️ EMOJIS UNIVERLS uniquement (compatibles toutes plateformes)
  const availableIcons = ['🔧', '⚙️', '🔩', '⚡', '💡', '🔥', '❄️', '💧', '⛔', '✅', '❌', '⭐'];

  // Debug : afficher le nombre de templates chargés
  console.log('🔧 MaintenanceSettings - Templates chargés:', maintenanceTemplates.length);
  console.log('🔧 Templates:', maintenanceTemplates);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const template = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      icon: formData.icon,
      intervalMonths: formData.intervalMonths ? parseInt(formData.intervalMonths) : undefined,
      intervalKm: formData.intervalKm ? parseInt(formData.intervalKm) : undefined,
      fuelType: formData.fuelType,
      driveType: formData.driveType,
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

  // Filtrer les templates selon la motorisation sélectionnée
  const filteredTemplates = maintenanceTemplates.filter(
    t => t.fuelType === 'both' || t.fuelType === selectedFuelType
  );

  // Grouper les templates par catégorie
  const groupedTemplates = groupByCategory(filteredTemplates, selectedFuelType);

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 className="text-3xl text-white mb-2">Paramètres d'entretien</h1>
        <p className="text-zinc-500">Intervalles par type de motorisation</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Bouton Entretiens Perso */}
        <button
          onClick={onOpenCustomProfiles}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl animate-fade-in"
        >
          <User className="w-5 h-5" />
          <span className="font-medium">Entretiens Perso</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Nouveau</span>
        </button>

        {/* Filtres motorisation */}
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedFuelType('essence')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              selectedFuelType === 'essence'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            ⛽ Essence
          </button>
          <button
            onClick={() => setSelectedFuelType('diesel')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              selectedFuelType === 'diesel'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            💧 Diesel
          </button>
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un type d'entretien</span>
        </button>

        {/* Add/Edit form */}
        {showAddForm && (
          <Card className="bg-zinc-900 border-zinc-800 p-4">
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

        {/* Info box */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-500">
            💡 <strong className="text-zinc-400">
              {selectedFuelType === 'essence' ? 'Motorisation essence' : 'Motorisation diesel'}
            </strong> - Ces intervalles s'appliqueront automatiquement lors de l'ajout d'un entretien.
          </p>
        </div>

        {/* Templates groupés par catégorie */}
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-white font-medium px-2">{category}</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-zinc-900 border-zinc-800 p-4"
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
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper pour grouper par catégorie
function groupByCategory(templates: MaintenanceTemplate[], fuelType: 'essence' | 'diesel'): Record<string, MaintenanceTemplate[]> {
  const categories: Record<string, MaintenanceTemplate[]> = {};
  
  templates.forEach(template => {
    const category = getCategoryForTemplate(template, fuelType);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(template);
  });
  
  return categories;
}

function getCategoryForTemplate(template: MaintenanceTemplate, fuelType: 'essence' | 'diesel'): string {
  const icon = template.icon;
  const name = template.name.toLowerCase();

  // 🔧 Entretien courant (vidange, filtres, révision)
  if (icon === '🔧' && (name.includes('vidange') || name.includes('filtre') || name.includes('révision'))) {
    return '🔧 Entretien courant';
  }
  
  // 💧 Fluides
  if (icon === '💧') return '💧 Fluides';
  
  // 🔥 Allumage / carburant
  if (icon === '🔥') {
    if (fuelType === 'essence') return '🔥 Allumage / carburant';
    if (fuelType === 'diesel') return '🔥 Spécifique diesel';
  }
  
  // ⛔ Freinage
  if (icon === '⛔') return '⛔ Freinage';
  
  // 🔩 Pneus & géométrie
  if (icon === '🔩') return '🔩 Pneus & géométrie';
  
  // ⚙️ Distribution / Suspension / Dépollution
  if (icon === '⚙️') {
    if (name.includes('courroie') || name.includes('distribution')) return '⚙️ Distribution';
    if (name.includes('amortisseur') || name.includes('rotule') || name.includes('silent-bloc')) {
      return '⚙️ Suspension / structure';
    }
    if (name.includes('fap') || name.includes('egr') || name.includes('dépollution')) {
      return '⚙️ Dépollution (diesel)';
    }
    if (name.includes('catalyseur')) return '⚙️ Transmission';
    return '⚙️ Mécanique';
  }
  
  // ⚡ Électricité / contrôles
  if (icon === '⚡') return '⚡ Électricité';
  if (icon === '✅') return '✅ Contrôles';
  
  // ❄️ Confort
  if (icon === '❄️') return '❄️ Confort';
  
  // 🔧 Transmission / 4x4
  if (icon === '🔧' && (name.includes('boîte') || name.includes('pont') || name.includes('transfert') || name.includes('4x4'))) {
    return '🔧 Transmission / 4x4';
  }

  return '🔧 Autre';
}