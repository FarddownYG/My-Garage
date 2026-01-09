import React, { useState } from 'react';
import { ArrowLeft, Wrench, Image as ImageIcon, Gauge, Edit, Trash2, Edit2 } from 'lucide-react';
import type { Vehicle } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { MaintenanceLog } from '../maintenance/MaintenanceLog';
import { MaintenanceSettings } from '../settings/MaintenanceSettings';
import { EditVehicleModal } from './EditVehicleModal';
import { EditMileageModal } from './EditMileageModal';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onBack: () => void;
  prefilledMaintenanceType?: string | null;
}

export function VehicleDetail({ vehicle, onBack, prefilledMaintenanceType }: VehicleDetailProps) {
  const { maintenanceEntries, deleteVehicle } = useApp();
  const [activeTab, setActiveTab] = useState<'info' | 'maintenance' | 'gallery'>(() => {
    // Si on a un type pré-rempli, ouvrir directement l'onglet entretien
    return prefilledMaintenanceType ? 'maintenance' : 'info';
  });
  const [showMaintenanceSettings, setShowMaintenanceSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);

  const vehicleMaintenanceEntries = maintenanceEntries
    .filter(e => e.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${vehicle.name} ?`)) {
      deleteVehicle(vehicle.id);
      onBack();
    }
  };

  if (showMaintenanceSettings) {
    return <MaintenanceSettings onBack={() => setShowMaintenanceSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="relative">
        <div className="h-64 bg-zinc-900 flex items-center justify-center">
          {vehicle.photo ? (
            <img src={vehicle.photo} alt={vehicle.name} className="w-full h-full object-cover" />
          ) : (
            <Gauge className="w-24 h-24 text-zinc-700" />
          )}
        </div>
        <button
          onClick={onBack}
          className="absolute top-6 left-6 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Vehicle Info */}
      <div className="px-6 py-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl text-white mb-2">{vehicle.name}</h1>
            {vehicle.licensePlate && (
              <p className="text-zinc-500">{vehicle.licensePlate}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowMileageModal(true)}
              variant="outline" 
              size="sm" 
              className="bg-transparent border-zinc-700 text-green-500 hover:bg-green-500/10"
            >
              <Gauge className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setShowEditModal(true)}
              variant="outline" 
              size="sm" 
              className="bg-transparent border-zinc-700 text-blue-500 hover:bg-blue-500/10"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-transparent border-zinc-700 text-red-500 hover:bg-red-500/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            {vehicle.brand && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Marque</p>
                <p className="text-white">{vehicle.brand}</p>
              </div>
            )}
            {vehicle.model && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Modèle</p>
                <p className="text-white">{vehicle.model}</p>
              </div>
            )}
            {vehicle.year && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Année</p>
                <p className="text-white">{vehicle.year}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-zinc-500 mb-1">Kilométrage</p>
              <p className="text-white">{vehicle.mileage.toLocaleString()} km</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('info')}
            variant={activeTab === 'info' ? 'default' : 'outline'}
            className={activeTab === 'info' ? 'bg-blue-600' : 'bg-transparent border-zinc-700 text-zinc-400'}
          >
            <Gauge className="w-4 h-4 mr-2" />
            Infos
          </Button>
          <Button
            onClick={() => setActiveTab('maintenance')}
            variant={activeTab === 'maintenance' ? 'default' : 'outline'}
            className={activeTab === 'maintenance' ? 'bg-blue-600' : 'bg-transparent border-zinc-700 text-zinc-400'}
          >
            <Wrench className="w-4 h-4 mr-2" />
            Entretien ({vehicleMaintenanceEntries.length})
          </Button>
          <Button
            onClick={() => setActiveTab('gallery')}
            variant={activeTab === 'gallery' ? 'default' : 'outline'}
            className={activeTab === 'gallery' ? 'bg-blue-600' : 'bg-transparent border-zinc-700 text-zinc-400'}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Photos
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'maintenance' && (
          <MaintenanceLog 
            vehicleId={vehicle.id} 
            onOpenSettings={() => setShowMaintenanceSettings(true)}
          />
        )}

        {activeTab === 'gallery' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-white mb-2">Aucune photo</h3>
            <p className="text-zinc-500 text-sm">Ajoutez des photos de votre véhicule</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditVehicleModal vehicle={vehicle} onClose={() => setShowEditModal(false)} />
      )}
      {showMileageModal && (
        <EditMileageModal vehicle={vehicle} onClose={() => setShowMileageModal(false)} />
      )}
    </div>
  );
}