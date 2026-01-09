import React, { useState } from 'react';
import { X } from 'lucide-react';
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.vehicleId) return;

    addTask({
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description || undefined,
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