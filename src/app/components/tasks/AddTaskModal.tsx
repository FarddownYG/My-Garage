import React, { useState } from 'react';
import { X, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CustomSelect } from '../ui/CustomSelect';
import { Textarea } from '../ui/textarea';

interface AddTaskModalProps {
  onClose: () => void;
}

export function AddTaskModal({ onClose }: AddTaskModalProps) {
  const { addTask, vehicles, currentProfile } = useApp();
  const userVehicles = vehicles.filter(v => v.ownerId === currentProfile?.id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    vehicleId: userVehicles[0]?.id || '',
    links: [] as { url: string; name: string }[],
  });

  const addLink = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { url: '', name: '' }],
    });
  };

  const updateLink = (index: number, field: 'url' | 'name', value: string) => {
    const newLinks = [...formData.links];
    newLinks[index][field] = value;
    setFormData({ ...formData, links: newLinks });
  };

  const removeLink = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.vehicleId) return;

    // Filtrer les liens valides (avec au moins une URL)
    const validLinks = formData.links.filter(link => link.url.trim() !== '');

    addTask({
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description.trim() || undefined,
      links: validLinks.length > 0 ? validLinks : undefined,
      vehicleId: formData.vehicleId,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-lg md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl text-white">Nouvelle tâche</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <Label htmlFor="title" className="text-zinc-400">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Changer les plaquettes de frein"
              className="bg-zinc-800 border-zinc-700 text-white"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-zinc-400">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails supplémentaires..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-24"
            />
          </div>

          {/* Section Liens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-zinc-400">Liens</Label>
              <Button
                type="button"
                onClick={addLink}
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un lien
              </Button>
            </div>
            {formData.links.length > 0 && (
              <div className="space-y-3">
                {formData.links.map((link, index) => (
                  <div key={index} className="bg-zinc-800/50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <Input
                        value={link.name}
                        onChange={(e) => updateLink(index, 'name', e.target.value)}
                        placeholder="Nom du lien (ex: Tutorial YouTube)"
                        className="bg-zinc-800 border-zinc-700 text-white text-sm flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      value={link.url}
                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="bg-zinc-800 border-zinc-700 text-white text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="vehicleId" className="text-zinc-400">Véhicule *</Label>
            <CustomSelect
              id="vehicleId"
              value={formData.vehicleId}
              onChange={(value) => setFormData({ ...formData, vehicleId: value })}
              options={userVehicles.map((vehicle) => ({
                value: vehicle.id,
                label: vehicle.name,
                icon: '🚗',
              }))}
              required
              placeholder="Sélectionner un véhicule"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-400">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}