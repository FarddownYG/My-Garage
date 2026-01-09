import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CustomSelect } from '../ui/CustomSelect';
import type { Vehicle } from '../../types';

interface EditVehicleModalProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export function EditVehicleModal({ vehicle, onClose }: EditVehicleModalProps) {
  const { updateVehicle } = useApp();
  const [formData, setFormData] = useState({
    name: vehicle.name,
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    year: vehicle.year?.toString() || '',
    licensePlate: vehicle.licensePlate || '',
    mileage: vehicle.mileage.toString(),
    photo: vehicle.photo || '',
    fuelType: vehicle.fuelType || 'essence' as 'essence' | 'diesel',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    updateVehicle(vehicle.id, {
      name: formData.name,
      brand: formData.brand,
      model: formData.model,
      year: formData.year ? parseInt(formData.year) : undefined,
      licensePlate: formData.licensePlate,
      mileage: parseInt(formData.mileage) || 0,
      photo: formData.photo,
      fuelType: formData.fuelType,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl text-white">Modifier le véhicule</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <Label htmlFor="name" className="text-zinc-400">Nom du véhicule *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Ma BMW Série 3"
              className="bg-zinc-800 border-zinc-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="fuelType" className="text-zinc-400">Motorisation *</Label>
            <CustomSelect
              id="fuelType"
              value={formData.fuelType}
              onChange={(value) => setFormData({ ...formData, fuelType: value as 'essence' | 'diesel' })}
              options={[
                { value: 'essence', label: 'Essence', icon: '⛽' },
                { value: 'diesel', label: 'Diesel', icon: '🛢️' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand" className="text-zinc-400">Marque</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="BMW"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="model" className="text-zinc-400">Modèle</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Série 3"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year" className="text-zinc-400">Année</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2020"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="licensePlate" className="text-zinc-400">Immatriculation</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                placeholder="AB-123-CD"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mileage" className="text-zinc-400">Kilométrage actuel</Label>
            <Input
              id="mileage"
              type="number"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              placeholder="50000"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="photo" className="text-zinc-400">URL de la photo</Label>
            <Input
              id="photo"
              type="url"
              value={formData.photo}
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
              placeholder="https://..."
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-400">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
