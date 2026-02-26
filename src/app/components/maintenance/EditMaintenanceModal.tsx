import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../ui/button';
import { CustomSelect } from '../ui/CustomSelect';
import { DateInputFR } from '../shared/DateInputFR';
import { defaultMaintenanceTemplates } from '../../data/defaultMaintenanceTemplates';
import type { MaintenanceEntry } from '../../types';

interface EditMaintenanceModalProps {
  entry: MaintenanceEntry;
  onClose: () => void;
  onOpenSettings?: () => void;
}

const builtinTemplates = [
  { id: 'oil', name: 'Vidange', icon: '💧', intervalMonths: 12, intervalKm: 15000 },
  { id: 'tires', name: 'Pneus', icon: '🔩', intervalMonths: 48, intervalKm: 40000 },
  { id: 'brakes', name: 'Freins', icon: '⛔', intervalMonths: 24, intervalKm: 30000 },
];

export function EditMaintenanceModal({ entry, onClose, onOpenSettings }: EditMaintenanceModalProps) {
  const { updateMaintenanceEntry, deleteMaintenanceEntry, maintenanceTemplates, updateReminder, reminders } = useApp();
  const { isDark } = useTheme();
  const { t } = useI18n();

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
      type: formData.type, customType: formData.customType || undefined,
      date: formData.date, mileage: parseInt(formData.mileage),
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      notes: formData.notes || undefined,
    });

    const templateId = formData.customType || formData.type;
    const allTemplates = [...builtinTemplates, ...(defaultMaintenanceTemplates as any[]), ...maintenanceTemplates];
    const template = allTemplates.find(t => t.id === templateId || t.name === templateId);

    if (template && (template.intervalMonths || template.intervalKm)) {
      const entryDate = new Date(formData.date);
      const entryMileage = parseInt(formData.mileage);
      let dueDate: string | undefined;
      let dueMileage: number | undefined;
      if (template.intervalMonths) { const nextDate = new Date(entryDate); nextDate.setMonth(nextDate.getMonth() + template.intervalMonths); dueDate = nextDate.toISOString().split('T')[0]; }
      if (template.intervalKm) { dueMileage = entryMileage + template.intervalKm; }
      const existingReminder = reminders.find(r => r.vehicleId === entry.vehicleId && r.type === template.name);
      if (existingReminder) { updateReminder(existingReminder.id, { dueDate, dueMileage, status: 'ok' }); }
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet entretien ?')) { deleteMaintenanceEntry(entry.id); onClose(); }
  };

  const handleTypeChange = (value: string) => {
    if (value === '_add_new_') { onClose(); onOpenSettings?.(); }
    else {
      const builtinIds = ['oil', 'tires', 'brakes', 'filter', 'battery', 'inspection', 'other'];
      const isCustom = !builtinIds.includes(value);
      setFormData({ ...formData, type: isCustom ? 'other' : value as any, customType: isCustom ? value : '' });
    }
  };

  const modalBg = isDark ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const labelClass = isDark ? 'text-sm text-slate-400 mb-2 block' : 'text-sm text-gray-500 mb-2 block';
  const inputClass = isDark ? 'w-full bg-[#1a1a2e] border border-white/[0.06] text-white rounded-lg px-4 py-2' : 'w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${modalBg} w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border ${borderColor}`}>
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('maintenance.edit')}</h2>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>{t('maintenance.type')} *</label>
            <CustomSelect value={formData.customType || formData.type} onChange={handleTypeChange}
              options={[
                { value: 'oil', label: 'Vidange', icon: '💧' }, { value: 'tires', label: 'Pneus', icon: '🔩' },
                { value: 'brakes', label: 'Freins', icon: '⛔' }, { value: 'filter', label: 'Filtre à air', icon: '🔧' },
                { value: 'battery', label: 'Batterie', icon: '⚡' }, { value: 'inspection', label: 'Contrôle technique', icon: '✅' },
                ...maintenanceTemplates.map(t => ({ value: t.id, label: t.name, icon: t.icon })),
                { value: '_add_new_', label: 'Ajouter un type...', icon: '➕' },
              ]} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('maintenance.date')} *</label>
              <DateInputFR value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} required />
            </div>
            <div>
              <label className={labelClass}>{t('vehicles.mileage')} *</label>
              <input type="number" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: e.target.value })} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('maintenance.cost')}</label>
            <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="150.00" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('maintenance.notes')}</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Détails de l'intervention..." className={`${inputClass} min-h-24 resize-none`} />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-500 rounded-lg hover:bg-red-600/20 transition-colors">{t('maintenance.delete')}</button>
            <button type="button" onClick={onClose} className={`flex-1 py-2 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a2e] hover:bg-[#252540] text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>{t('common.cancel')}</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white py-2 rounded-lg transition-colors">{t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}