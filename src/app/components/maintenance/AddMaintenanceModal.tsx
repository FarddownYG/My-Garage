import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

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
  const { addMaintenanceEntry, vehicles, maintenanceTemplates, addReminder, updateReminder, reminders } = useApp();
  const vehicle = vehicles.find(v => v.id === vehicleId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]); // Changé en tableau
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: vehicle?.mileage.toString() || '',
    cost: '',
    notes: '',
  });

  // Filtrer les templates selon la motorisation ET le type de transmission du véhicule
  const filteredByEngine = useMemo(() => {
    const vehicleFuelType = vehicle?.engineType || vehicle?.fuelType;
    const vehicleDriveType = vehicle?.driveType;
    
    if (!vehicleFuelType) return maintenanceTemplates;
    
    return maintenanceTemplates.filter(template => {
      // Filtrage par motorisation (essence/diesel)
      const fuelMatch = template.fuelType === 'both' || 
        template.fuelType === (vehicleFuelType === 'gasoline' ? 'essence' : vehicleFuelType);
      
      if (!fuelMatch) return false;
      
      // Filtrage par transmission (4x2/4x4)
      // Si le template n'a pas de driveType ou est "both", toujours l'afficher
      if (!template.driveType || template.driveType === 'both') {
        return true;
      }
      
      // Si le template a un driveType spécifique, vérifier la compatibilité
      // Si le véhicule n'a pas de driveType, afficher quand même
      if (!vehicleDriveType) {
        return true;
      }
      
      // Vérifier la correspondance
      return template.driveType === vehicleDriveType;
    });
  }, [maintenanceTemplates, vehicle?.engineType, vehicle?.fuelType, vehicle?.driveType]);

  // Filtrer par recherche
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return filteredByEngine;
    
    const normalizedQuery = normalizeText(searchQuery);
    
    return filteredByEngine.filter(template => {
      const normalizedName = normalizeText(template.name);
      const normalizedCategory = normalizeText(template.category || '');
      
      return normalizedName.includes(normalizedQuery) || normalizedCategory.includes(normalizedQuery);
    });
  }, [filteredByEngine, searchQuery]);

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

    selectedTemplates.forEach((selectedTemplate, index) => {
      const template = maintenanceTemplates.find(t => t.id === selectedTemplate);
      
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl text-white">Ajouter un entretien</h2>
            {selectedTemplates.length > 0 && (
              <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full font-medium animate-fade-in">
                {selectedTemplates.length} sélectionné{selectedTemplates.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          {/* Recherche */}
          <div className="p-6 pb-4 border-b border-zinc-800">
            <Label htmlFor="search" className="text-zinc-400 mb-2 block">
              Type d'entretien * 
              {vehicle?.engineType && (
                <span className="ml-2 text-xs text-blue-400">
                  (Filtré: {vehicle.engineType === 'gasoline' ? 'Essence' : 'Diesel'})
                </span>
              )}
            </Label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un entretien..."
                  className="bg-zinc-800 border-zinc-700 text-white pl-10"
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
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition-all duration-300 text-sm whitespace-nowrap"
              >
                {selectedTemplates.length === filteredTemplates.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
          </div>

          {/* Liste des entretiens */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
            {/* Info sélection multiple */}
            {selectedTemplates.length === 0 && (
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-3 mb-4 animate-fade-in">
                <p className="text-sm text-blue-300">
                  💡 <strong>Astuce :</strong> Vous pouvez sélectionner plusieurs entretiens pour les ajouter en une seule fois !
                </p>
              </div>
            )}

            {Object.keys(groupedTemplates).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">Aucun entretien trouvé</p>
              </div>
            ) : (
              Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={category}>
                  <h3 className="text-sm text-zinc-500 mb-2 font-medium">{category}</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplates(prev => prev.includes(template.id) ? prev.filter(id => id !== template.id) : [...prev, template.id])}
                        className={`p-3 rounded-xl border transition-all text-left relative ${
                          selectedTemplates.includes(template.id)
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {template.intervalKm && `${template.intervalKm.toLocaleString()} km`}
                              {template.intervalKm && template.intervalMonths && ' • '}
                              {template.intervalMonths && `${template.intervalMonths} mois`}
                            </p>
                          </div>
                          {selectedTemplates.includes(template.id) && (
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center animate-fade-in">
                              <Check className="w-4 h-4 text-blue-600" />
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
          <div className="p-6 pt-4 border-t border-zinc-800 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-zinc-400">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="mileage" className="text-zinc-400">Kilométrage *</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="50000"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cost" className="text-zinc-400">Coût (€)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-zinc-400">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Remarques..."
                className="bg-zinc-800 border-zinc-700 text-white min-h-20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={selectedTemplates.length === 0}
              >
                {selectedTemplates.length === 0 
                  ? 'Ajouter' 
                  : `Ajouter ${selectedTemplates.length} entretien${selectedTemplates.length > 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}