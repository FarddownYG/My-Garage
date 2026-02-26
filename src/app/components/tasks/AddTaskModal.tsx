import React, { useState } from 'react';
import { X, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CustomSelect } from '../ui/CustomSelect';
import { Textarea } from '../ui/textarea';

interface AddTaskModalProps {
  onClose: () => void;
}

export function AddTaskModal({ onClose }: AddTaskModalProps) {
  const { addTask, getUserVehicles } = useApp();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const userVehicles = getUserVehicles();

  const [formData, setFormData] = useState({
    title: '', description: '', vehicleId: userVehicles[0]?.id || '',
    links: [] as { url: string; name: string }[],
  });

  const addLink = () => setFormData({ ...formData, links: [...formData.links, { url: '', name: '' }] });
  const updateLink = (index: number, field: 'url' | 'name', value: string) => {
    const newLinks = [...formData.links]; newLinks[index][field] = value; setFormData({ ...formData, links: newLinks });
  };
  const removeLink = (index: number) => setFormData({ ...formData, links: formData.links.filter((_, i) => i !== index) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.vehicleId) return;
    const validLinks = formData.links.filter(link => link.url.trim() !== '');
    addTask({ id: Date.now().toString(), title: formData.title, description: formData.description.trim() || undefined, links: validLinks.length > 0 ? validLinks : undefined, vehicleId: formData.vehicleId, completed: false, createdAt: new Date().toISOString() });
    onClose();
  };

  const modalBg = isDark ? 'bg-[#12121a]/95 backdrop-blur-2xl border-white/5' : 'bg-white border-gray-200';
  const inputClass = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const labelClass = isDark ? 'text-slate-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-in">
      <div className={`${modalBg} w-full md:max-w-lg md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border animate-scale-in`}>
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('tasks.new')}</h2>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-all duration-300 hover:rotate-90`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <Label htmlFor="title" className={labelClass}>{t('tasks.taskTitle')} *</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Changer les plaquettes de frein" className={inputClass} required autoFocus />
          </div>
          <div>
            <Label htmlFor="description" className={labelClass}>{t('tasks.description')}</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Détails supplémentaires..." className={`${inputClass} min-h-24`} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className={labelClass}>{t('tasks.links')}</Label>
              <Button type="button" onClick={addLink} size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                <Plus className="w-4 h-4 mr-1" />{t('tasks.addLink')}
              </Button>
            </div>
            {formData.links.length > 0 && (
              <div className="space-y-3">
                {formData.links.map((link, index) => (
                  <div key={index} className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-[#1a1a2e]/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <LinkIcon className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                      <Input value={link.name} onChange={(e) => updateLink(index, 'name', e.target.value)} placeholder="Nom du lien" className={`${inputClass} text-sm flex-1`} />
                      <button type="button" onClick={() => removeLink(index)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <Input value={link.url} onChange={(e) => updateLink(index, 'url', e.target.value)} placeholder="https://..." className={`${inputClass} text-sm`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="vehicleId" className={labelClass}>Véhicule *</Label>
            <CustomSelect id="vehicleId" value={formData.vehicleId} onChange={(value) => setFormData({ ...formData, vehicleId: value })} options={userVehicles.map((v) => ({ value: v.id, label: v.name, icon: '🚗' }))} required placeholder={t('tasks.selectVehicle')} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}>{t('common.cancel')}</Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white">{t('tasks.create')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
