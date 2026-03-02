import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { CustomSelect } from '../ui/CustomSelect';
import type { MaintenanceTemplate } from '../../types';

interface MaintenanceSettingsProps {
  onBack: () => void;
  onOpenCustomProfiles?: () => void;
}

export function MaintenanceSettings({ onBack, onOpenCustomProfiles }: MaintenanceSettingsProps) {
  const { maintenanceTemplates, addMaintenanceTemplate, deleteMaintenanceTemplate, updateMaintenanceTemplate } = useApp();
  const { isDark } = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFuelType, setSelectedFuelType] = useState<'essence' | 'diesel'>('essence');
  const [formData, setFormData] = useState({ 
    name: '', 
    icon: '\u{1F527}',
    intervalMonths: '',
    intervalKm: '',
    fuelType: 'both' as 'essence' | 'diesel' | 'both',
    driveType: 'both' as '4x2' | '4x4' | 'both',
  });

  const availableIcons = ['\u{1F527}', '\u2699\uFE0F', '\u{1F529}', '\u26A1', '\u{1F4A1}', '\u{1F525}', '\u2744\uFE0F', '\u{1F4A7}', '\u26D4', '\u2705', '\u274C', '\u2B50'];

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

    setFormData({ name: '', icon: '\u{1F527}', intervalMonths: '', intervalKm: '', fuelType: 'both', driveType: 'both' });
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
    if (confirm('Supprimer ce type d\'entretien ?')) {
      deleteMaintenanceTemplate(id);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', icon: '\u{1F527}', intervalMonths: '', intervalKm: '', fuelType: 'both', driveType: 'both' });
  };

  // Filtrer les templates selon la motorisation selectionnee
  const filteredTemplates = maintenanceTemplates.filter(
    t => t.fuelType === 'both' || t.fuelType === selectedFuelType
  );

  // Grouper les templates par categorie
  const groupedTemplates = groupByCategory(filteredTemplates, selectedFuelType);

  const bgMain = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const bgHeader = isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-gradient-to-b from-white to-gray-50';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const textDimmed = isDark ? 'text-slate-500' : 'text-gray-400';
  const cardBg = isDark ? 'bg-[#12121a] border-white/[0.06]' : 'bg-white border-gray-200';
  const inputBg = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';

  return (
    <div className={`min-h-screen ${bgMain} pb-24`}>
      <div className={`${bgHeader} px-6 pt-12 pb-8`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-2 ${textMuted} hover:${textMain} transition-colors mb-6`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 className={`text-3xl ${textMain} mb-2`}>Parametres d'entretien</h1>
        <p className={textDimmed}>Intervalles par type de motorisation</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Bouton Entretiens Perso */}
        {onOpenCustomProfiles && (
          <button
            onClick={onOpenCustomProfiles}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl animate-fade-in"
          >
            <User className="w-5 h-5" />
            <span>Entretiens Perso</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Nouveau</span>
          </button>
        )}

        {/* Filtres motorisation */}
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedFuelType('essence')}
            className={`flex-1 px-4 py-3 rounded-xl transition-all ${
              selectedFuelType === 'essence'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : isDark ? 'bg-[#12121a] border border-white/[0.06] text-slate-400 hover:border-white/20' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {'\u26FD'} Essence
          </button>
          <button
            onClick={() => setSelectedFuelType('diesel')}
            className={`flex-1 px-4 py-3 rounded-xl transition-all ${
              selectedFuelType === 'diesel'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : isDark ? 'bg-[#12121a] border border-white/[0.06] text-slate-400 hover:border-white/20' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {'\u{1F4A7}'} Diesel
          </button>
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un type d'entretien</span>
        </button>

        {/* Add/Edit form */}
        {showAddForm && (
          <Card className={`${cardBg} p-4`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`text-sm ${textMuted} mb-2 block`}>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Courroie de distribution"
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
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
                    className={`w-full ${inputBg} border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                  />
                </div>
                <div>
                  <label className={`text-sm ${textMuted} mb-2 block`}>Intervalle (km)</label>
                  <input
                    type="number"
                    value={formData.intervalKm}
                    onChange={(e) => setFormData({ ...formData, intervalKm: e.target.value })}
                    placeholder="15000"
                    className={`w-full ${inputBg} border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
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

        {/* Info box */}
        <div className={`border rounded-xl p-4 ${isDark ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-sm ${isDark ? 'text-cyan-300/80' : 'text-blue-700'}`}>
            <strong>{selectedFuelType === 'essence' ? 'Motorisation essence' : 'Motorisation diesel'}</strong> - Ces intervalles s'appliqueront automatiquement lors de l'ajout d'un entretien.
          </p>
        </div>

        {/* Templates groupes par categorie */}
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category} className="space-y-3">
            <h3 className={`${textMain} px-2`}>{category}</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`${cardBg} p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={textMain}>{template.name}</span>
                          {template.driveType === '4x4' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">4x4</span>
                          )}
                        </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper pour grouper par categorie
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

  // Transmission / 4x4 - check first to catch 4x4 templates
  if (template.driveType === '4x4' || (name.includes('pont') || name.includes('transfert') || name.includes('awd') || name.includes('arbre') || name.includes('moyeu'))) {
    return '\u{1F527} Transmission / 4x4';
  }

  // Entretien courant
  if (icon === '\u{1F527}' && (name.includes('vidange') || name.includes('filtre') || name.includes('revision'))) {
    return '\u{1F527} Entretien courant';
  }
  
  // Fluides
  if (icon === '\u{1F4A7}') return '\u{1F4A7} Fluides';
  
  // Allumage / carburant
  if (icon === '\u{1F525}') {
    if (fuelType === 'essence') return '\u{1F525} Allumage / carburant';
    if (fuelType === 'diesel') return '\u{1F525} Specifique diesel';
  }
  
  // Freinage
  if (icon === '\u26D4') return '\u26D4 Freinage';
  
  // Pneus
  if (icon === '\u{1F529}') return '\u{1F529} Pneus & geometrie';
  
  // Distribution / Suspension / Depollution
  if (icon === '\u2699\uFE0F') {
    if (name.includes('courroie') || name.includes('distribution')) return '\u2699\uFE0F Distribution';
    if (name.includes('amortisseur') || name.includes('rotule') || name.includes('silent-bloc')) {
      return '\u2699\uFE0F Suspension / structure';
    }
    if (name.includes('fap') || name.includes('egr') || name.includes('depollution')) {
      return '\u2699\uFE0F Depollution (diesel)';
    }
    if (name.includes('catalyseur')) return '\u2699\uFE0F Transmission';
    return '\u2699\uFE0F Mecanique';
  }
  
  // Electricite / controles
  if (icon === '\u26A1') return '\u26A1 Electricite';
  if (icon === '\u2705') return '\u2705 Controles';
  
  // Confort
  if (icon === '\u2744\uFE0F') return '\u2744\uFE0F Confort';
  
  // Transmission
  if (icon === '\u{1F527}' && (name.includes('boite') || name.includes('pont') || name.includes('transfert') || name.includes('4x4'))) {
    return '\u{1F527} Transmission / 4x4';
  }

  return '\u{1F527} Autre';
}
