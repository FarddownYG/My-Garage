import React from 'react';
import { AlertTriangle, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';

interface MileageConfirmModalProps {
  type: 'lower' | 'higher';
  enteredMileage: number;
  vehicleMileage: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MileageConfirmModal({
  type,
  enteredMileage,
  vehicleMileage,
  onConfirm,
  onCancel,
}: MileageConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-zinc-900 w-full max-w-md rounded-2xl overflow-hidden border border-zinc-800">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              type === 'lower' ? 'bg-red-500/10' : 'bg-blue-500/10'
            }`}>
              {type === 'lower' ? (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              ) : (
                <ArrowUpDown className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <h2 className="text-xl text-white">
              {type === 'lower' ? 'Kilométrage incorrect ?' : 'Mettre à jour le kilométrage ?'}
            </h2>
          </div>
          <p className="text-zinc-400 text-sm">
            {type === 'lower'
              ? 'Le kilométrage entré est inférieur au kilométrage actuel du véhicule.'
              : 'Le kilométrage entré est supérieur. Voulez-vous aussi mettre à jour le kilométrage du véhicule ?'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Kilométrage entré</span>
              <span className="text-white font-medium">{enteredMileage.toLocaleString()} km</span>
            </div>
            <div className="h-px bg-zinc-700" />
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Kilométrage voiture</span>
              <span className={`font-medium ${type === 'lower' ? 'text-red-400' : 'text-blue-400'}`}>
                {vehicleMileage.toLocaleString()} km
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 bg-transparent border-zinc-700 text-zinc-400"
            >
              Annuler
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${
                type === 'lower'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {type === 'lower' ? 'Confirmer quand même' : 'Mettre à jour'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
