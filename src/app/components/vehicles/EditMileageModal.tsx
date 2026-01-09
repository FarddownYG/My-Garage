import React, { useState } from 'react';
import { X, Gauge } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Vehicle } from '../../types';

interface EditMileageModalProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export function EditMileageModal({ vehicle, onClose }: EditMileageModalProps) {
  const { updateVehicle } = useApp();
  const [mileage, setMileage] = useState(vehicle.mileage.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateVehicle(vehicle.id, {
      mileage: parseInt(mileage) || 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-md md:rounded-2xl rounded-t-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl text-white">Kilométrage</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="mileage" className="text-zinc-400 mb-2 block">{vehicle.name}</Label>
            <div className="relative">
              <Input
                id="mileage"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="50000"
                className="bg-zinc-800 border-zinc-700 text-white text-2xl pr-16 h-14"
                autoFocus
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">km</span>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Kilométrage actuel : {vehicle.mileage.toLocaleString()} km
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-400">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
