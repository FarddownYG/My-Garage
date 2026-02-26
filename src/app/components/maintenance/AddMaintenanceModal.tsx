import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { defaultMaintenanceTemplates } from '../../data/defaultMaintenanceTemplates';
import { DateInputFR } from '../shared/DateInputFR';

interface AddMaintenanceModalProps {
  vehicleId: string;
  onClose: () => void;
  onOpenSettings?: () => void;
}

// Fonction pour normaliser le texte (sans accents, en minuscules)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function AddMaintenanceModal({ vehicleId, onClose, onOpenSettings }: AddMaintenanceModalProps) {
  const { addMaintenanceEntry, vehicles, maintenanceTemplates, addReminder, updateReminder, reminders, maintenanceProfiles, maintenanceEntries } = useApp();
  const vehicle = vehicles.find(v => v.id === vehicleId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]); // Changé en tableau
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: vehicle?.mileage.toString() || '',
    cost: '',
    notes: '',
  });

  // Trouver le profil d'entretien associé à ce véhicule (si existant)
  const assignedProfile = maintenanceProfiles.find(p => p.vehicleIds.includes(vehicleId));

  // Filtrer les templates selon la motorisation ET le type de transmission du véhicule
  const filteredByEngine = useMemo(() => {
    const vehicleFuelType = vehicle?.fuelType || (vehicle?.engineType === 'gasoline' ? 'essence' : vehicle?.engineType);
    const vehicleDriveType = vehicle?.driveType;

    // ✅ Si un profil personnalisé est assigné, afficher UNIQUEMENT ses templates — sans fallback
    if (assignedProfile) {
      const profileTemplates = maintenanceTemplates.filter(t => t.profileId === assignedProfile.id);
      // ⚠️ PAS de fallback sur les defaults : si le profil n'a pas de templates, on retourne []
      // (l'utilisateur doit en ajouter depuis Paramètres > Entretiens Perso)
      const uniqueTemplates = new Map();
      profileTemplates.forEach((t: any) => {
        if (!uniqueTemplates.has(t.name)) uniqueTemplates.set(t.name, t);
      });
      return Array.from(uniqueTemplates.values());
    }

    // Templates généraux (sans profileId) depuis Supabase
    const generalTemplates = maintenanceTemplates.filter(t => !t.profileId);

    // ✅ FALLBACK uniquement pour les templates GÉNÉRAUX (pas de profil perso)
    const source = generalTemplates.length > 0 ? generalTemplates : (defaultMaintenanceTemplates as any[]);

    if (!vehicleFuelType) {
      const uniqueTemplates = new Map();
      source.forEach((t: any) => {
        if (!uniqueTemplates.has(t.name)) uniqueTemplates.set(t.name, t);
      });
      return Array.from(uniqueTemplates.values());
    }

    const filtered = source.filter((template: any) => {
      const tFuelType = template.fuelType || template.engineType || 'both';
      const fuelMatch = tFuelType === 'both' || tFuelType === vehicleFuelType;
      if (!fuelMatch) return false;
      if (!template.driveType || template.driveType === 'both') return true;
      if (!vehicleDriveType) return true;
      return template.driveType === vehicleDriveType;
    });

    const uniqueTemplates = new Map();
    filtered.forEach((t: any) => {
      if (!uniqueTemplates.has(t.name)) uniqueTemplates.set(t.name, t);
    });
    return Array.from(uniqueTemplates.values());
  }, [maintenanceTemplates, vehicle?.fuelType, vehicle?.engineType, vehicle?.driveType, assignedProfile]);

  // Filtrer par recherche — en respectant le profil perso si assigné
  const filteredTemplates = useMemo(() => {
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeText(searchQuery);
      // ✅ Si profil perso, chercher UNIQUEMENT dans ses templates
      const searchPool = assignedProfile
        ? maintenanceTemplates.filter(t => t.profileId === assignedProfile.id)
        : (maintenanceTemplates.filter(t => !t.profileId).length > 0
            ? maintenanceTemplates.filter(t => !t.profileId)
            : (defaultMaintenanceTemplates as any[]));

      return searchPool.filter((template: any) => {
        const normalizedName = normalizeText(template.name);
        const normalizedCategory = normalizeText(template.category || '');
        return normalizedName.includes(normalizedQuery) || normalizedCategory.includes(normalizedQuery);
      });
    }
    return filteredByEngine;
  }, [filteredByEngine, searchQuery, maintenanceTemplates, assignedProfile]);

  // Grouper par catégorie
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, typeof filteredTemplates> = {};
    
    filteredTemplates.forEach(template => {
      const category = template.category || 'Autres';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    });
    
    return groups;
  }, [filteredTemplates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTemplates.length === 0) {
      alert('Veuillez sélectionner un type d\'entretien');
      return;
    }

    // Chercher dans Supabase templates ET dans les defaults (fallback)
    const allTemplates = [
      ...maintenanceTemplates,
      ...(defaultMaintenanceTemplates as any[]),
    ];

    // 🔍 DUPLICATE DETECTION: Check for entries with same type + date + mileage
    const enteredMileage = parseInt(formData.mileage);
    const enteredDate = formData.date;
    const duplicateNames: string[] = [];

    selectedTemplates.forEach((selectedTemplate) => {
      const template = allTemplates.find(t => t.id === selectedTemplate);
      const entryName = template?.name || selectedTemplate;
      
      const isDuplicate = maintenanceEntries.some(existing => {
        const existingName = existing.customType || existing.type;
        return (
          existing.vehicleId === vehicleId &&
          existingName === entryName &&
          existing.date === enteredDate &&
          existing.mileage === enteredMileage
        );
      });

      if (isDuplicate) {
        duplicateNames.push(entryName);
      }
    });

    if (duplicateNames.length > 0) {
      const names = duplicateNames.map(n => `« ${n} »`).join(', ');
      alert(`⚠️ Entretien déjà enregistré\n\nL'entretien ${names} existe déjà avec le même kilométrage (${enteredMileage.toLocaleString()} km) et la même date (${enteredDate}).`);
      return;
    }

    selectedTemplates.forEach((selectedTemplate, index) => {
      const template = allTemplates.find(t => t.id === selectedTemplate);
      
      const entry = {
        id: `${Date.now()}-${index}`, // ID unique pour chaque entrée
        vehicleId,
        type: 'other',
        customType: template?.name || selectedTemplate,
        customIcon: template?.icon || '🔨', // Ajout de l'icône du template
        date: formData.date,
        mileage: parseInt(formData.mileage),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        notes: formData.notes || undefined,
      };

      addMaintenanceEntry(entry);

      // Calculate next reminder based on template intervals
      if (template && (template.intervalMonths || template.intervalKm)) {
        const entryDate = new Date(formData.date);
        const entryMileage = parseInt(formData.mileage);

        let dueDate: string | undefined;
        let dueMileage: number | undefined;

        if (template.intervalMonths) {
          const nextDate = new Date(entryDate);
          nextDate.setMonth(nextDate.getMonth() + template.intervalMonths);
          dueDate = nextDate.toISOString().split('T')[0];
        }

        if (template.intervalKm) {
          dueMileage = entryMileage + template.intervalKm;
        }

        // Check if reminder already exists for this type and vehicle
        const existingReminder = reminders.find(
          r => r.vehicleId === vehicleId && r.type === template.name
        );

        if (existingReminder) {
          // Update existing reminder
          updateReminder(existingReminder.id, {
            dueDate,
            dueMileage,
            status: 'ok',
            description: `Prochain ${template.name.toLowerCase()}`,
          });
        } else {
          // Create new reminder
          addReminder({
            id: `${Date.now()}-${index}-reminder`,
            vehicleId,
            type: template.name,
            dueDate,
            dueMileage,
            status: 'ok',
            description: `Prochain ${template.name.toLowerCase()}`,
          });
        }
      }
    });

    onClose();
  };

  const { isDark } = useTheme();
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`${isDark ? 'bg-[#12121a]/95 backdrop-blur-2xl' : 'bg-white'} w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('maintenance.addTitle')}</h2>
            {selectedTemplates.length > 0 && (
              <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm rounded-full font-medium animate-fade-in">
                {selectedTemplates.length} {selectedTemplates.length > 1 ? t('maintenance.selecteds') : t('maintenance.selected')}
              </span>
            )}
          </div>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-all duration-300 hover:rotate-90`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          {/* Recherche */}
          <div className={`p-6 pb-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
            <Label htmlFor="search" className={`${isDark ? 'text-slate-400' : 'text-gray-500'} mb-2 block`}>
              {t('maintenance.type')} * 
              {assignedProfile && assignedProfile.isCustom ? (
                <span className="ml-2 text-xs text-violet-400">
                  (Profil: {assignedProfile.name})
                </span>
              ) : vehicle?.engineType ? (
                <span className="ml-2 text-xs text-cyan-400">
                  (Filtré: {vehicle.engineType === 'gasoline' ? t('common.gasoline') : t('common.diesel')})
                </span>
              ) : null}
            </Label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                <Input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('maintenance.search')}
                  className={`${isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} pl-10`}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedTemplates.length === filteredTemplates.length) {
                    setSelectedTemplates([]);
                  } else {
                    setSelectedTemplates(filteredTemplates.map(t => t.id));
                  }
                }}
                className={`px-4 py-2 border rounded-lg transition-all duration-300 text-sm whitespace-nowrap ${isDark ? 'bg-[#1a1a2e] hover:bg-[#252540] border-white/[0.06] text-slate-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'}`}
              >
                {selectedTemplates.length === filteredTemplates.length ? t('maintenance.deselectAll') : t('maintenance.selectAll')}
              </button>
            </div>
          </div>

          {/* Liste des entretiens */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
            {/* Info sélection multiple */}
            {selectedTemplates.length === 0 && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 mb-4 animate-fade-in">
                <p className="text-sm text-cyan-300">
                  {t('maintenance.tip')}
                </p>
              </div>
            )}

            {Object.keys(groupedTemplates).length === 0 ? (
              <div className="text-center py-8">
                <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>{t('maintenance.noResult')}</p>
                {assignedProfile && assignedProfile.isCustom && (
                  <div className="mt-4 p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                    <p className="text-sm text-violet-300 mb-2">
                      Ce véhicule est lié au profil personnalisé « {assignedProfile.name} » qui ne contient aucun entretien.
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Ajoutez des entretiens dans <strong>Paramètres → Entretiens Perso → {assignedProfile.name}</strong>, ou déliez ce véhicule du profil pour utiliser les entretiens par défaut.
                    </p>
                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={() => { onClose(); onOpenSettings(); }}
                        className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-all"
                      >
                        Aller dans Paramètres
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={category}>
                  <h3 className={`text-sm mb-2 font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{category}</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplates(prev => prev.includes(template.id) ? prev.filter(id => id !== template.id) : [...prev, template.id])}
                        className={`p-3 rounded-xl border transition-all text-left relative ${
                          selectedTemplates.includes(template.id)
                            ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500 text-white'
                            : isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-slate-300 hover:border-white/20' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium">{template.name}</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {template.intervalKm && `${template.intervalKm.toLocaleString()} km`}
                              {template.intervalKm && template.intervalMonths && ' • '}
                              {template.intervalMonths && `${template.intervalMonths} mois`}
                            </p>
                          </div>
                          {selectedTemplates.includes(template.id) && (
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center animate-fade-in">
                              <Check className="w-4 h-4 text-cyan-600" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Formulaire */}
          <div className={`p-6 pt-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-200'} space-y-4`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('maintenance.date')} *</Label>
                <DateInputFR
                  id="date"
                  value={formData.date}
                  onChange={(v) => setFormData({ ...formData, date: v })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mileage" className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('vehicles.mileage')} *</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="50000"
                  className={isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cost" className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('maintenance.cost')}</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
                className={isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
              />
            </div>

            <div>
              <Label htmlFor="notes" className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('maintenance.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Remarques..."
                className={`${isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} min-h-20`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white"
                disabled={selectedTemplates.length === 0}
              >
                {selectedTemplates.length === 0 
                  ? t('maintenance.add')
                  : `${t('maintenance.add')} ${selectedTemplates.length} entretien${selectedTemplates.length > 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}