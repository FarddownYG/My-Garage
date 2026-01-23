import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { CustomSelect } from '../ui/CustomSelect';
import type { MaintenanceEntry } from '../../types';

interface EditMaintenanceModalProps {
  entry: MaintenanceEntry;
  onClose: () => void;
  onOpenSettings?: () => void;
}

const defaultTemplates = [
  { id: 'oil', name: 'Vidange', icon: '💧', intervalMonths: 12, intervalKm: 15000 },
  { id: 'tires', name: 'Pneus', icon: '🔩', intervalMonths: 48, intervalKm: 40000 },
  { id: 'brakes', name: 'Freins', icon: '⛔', intervalMonths: 24, intervalKm: 30000 },
  { id: 'filter', name: 'Filtre à air', icon: '🔧', intervalMonths: 12, intervalKm: 20000 },
  { id: 'battery', name: 'Batterie', icon: '⚡', intervalMonths: 48, intervalKm: 0 },
  { id: 'inspection', name: 'Contrôle technique', icon: '✅', intervalMonths: 24, intervalKm: 0 },
];

export function EditMaintenanceModal({ entry, onClose, onOpenSettings }: EditMaintenanceModalProps) {
  const { updateMaintenanceEntry, deleteMaintenanceEntry, maintenanceTemplates, updateReminder, reminders } = useApp();

  const [formData, setFormData] = useState({
    type: entry.type,
    customType: entry.customType || '',
    date: entry.date,
    mileage: entry.mileage.toString(),
    cost: entry.cost?.toString() || '',
    notes: entry.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateMaintenanceEntry(entry.id, {
      type: formData.type,
      customType: formData.customType || undefined,
      date: formData.date,
      mileage: parseInt(formData.mileage),
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      notes: formData.notes || undefined,
    });

    // Update reminder if applicable
    const templateId = formData.customType || formData.type;
    const allTemplates = [...defaultTemplates, ...maintenanceTemplates];
    const template = allTemplates.find(t => t.id === templateId);

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

      const existingReminder = reminders.find(
        r => r.vehicleId === entry.vehicleId && r.type === template.name
      );

      if (existingReminder) {
        updateReminder(existingReminder.id, {
          dueDate,
          dueMileage,
          status: 'ok',
        });
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet entretien ?')) {
      deleteMaintenanceEntry(entry.id);
      onClose();
    }
  };

  const handleTypeChange = (value: string) => {
    if (value === '_add_new_') {
      onClose();
      onOpenSettings?.();
    } else {
      const isCustom = !['oil', 'tires', 'brakes', 'filter', 'battery', 'inspection', 'other'].includes(value);
      setFormData({ 
        ...formData, 
        type: isCustom ? 'other' : value as any,
        customType: isCustom ? value : ''
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl text-white">Modifier l'entretien</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Type d'entretien *</label>
            <CustomSelect
              value={formData.customType || formData.type}
              onChange={handleTypeChange}
              options={[
                { value: 'oil', label: 'Vidange', icon: '💧' },
                { value: 'tires', label: 'Pneus', icon: '🔩' },
                { value: 'brakes', label: 'Freins', icon: '⛔' },
                { value: 'filter', label: 'Filtre à air', icon: '🔧' },
                { value: 'battery', label: 'Batterie', icon: '⚡' },
                { value: 'inspection', label: 'Contrôle technique', icon: '✅' },
                ...maintenanceTemplates.map(template => ({
                  value: template.id,
                  label: template.name,
                  icon: template.icon,
                })),
                { value: '_add_new_', label: 'Ajouter un type...', icon: '➕' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Kilométrage *</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Coût (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="150.00"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Détails de l'intervention..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 min-h-24 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-500 rounded-lg hover:bg-red-600/20 transition-colors"
            >
              Supprimer
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg transition-colors"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}