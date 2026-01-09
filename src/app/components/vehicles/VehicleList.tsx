import React, { useState } from 'react';
import { Plus, Car as CarIcon, Trash2, Edit2, Gauge } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { VehicleDetail } from './VehicleDetail';
import { AddVehicleModal } from './AddVehicleModal';
import { EditVehicleModal } from './EditVehicleModal';
import { EditMileageModal } from './EditMileageModal';

export function VehicleList() {
  const { vehicles, currentProfile, deleteVehicle } = useApp();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingMileageVehicle, setEditingMileageVehicle] = useState<any>(null);

  const userVehicles = vehicles.filter(v => v.ownerId === currentProfile?.id);
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  if (selectedVehicle) {
    return <VehicleDetail vehicle={selectedVehicle} onBack={() => setSelectedVehicleId(null)} />;
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8">
        <h1 className="text-3xl text-white mb-2">Mes Véhicules</h1>
        <p className="text-zinc-500">{userVehicles.length} véhicule{userVehicles.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {userVehicles.map((vehicle) => (
          <Card
            key={vehicle.id}
            className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden relative hover-lift rounded-2xl shadow-soft"
          >
            <div className="flex items-center gap-4" onClick={() => setSelectedVehicleId(vehicle.id)}>
              <div className="w-32 h-32 bg-zinc-800 flex items-center justify-center flex-shrink-0 cursor-pointer">
                {vehicle.photo ? (
                  <img src={vehicle.photo} alt={vehicle.name} className="w-full h-full object-cover" />
                ) : (
                  <CarIcon className="w-12 h-12 text-zinc-600" />
                )}
              </div>
              <div className="flex-1 py-4 pr-4 cursor-pointer">
                <h3 className="text-xl text-white mb-1">{vehicle.name}</h3>
                {vehicle.licensePlate && (
                  <p className="text-sm text-zinc-500 mb-2">{vehicle.licensePlate}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400">
                    {vehicle.mileage.toLocaleString()} km
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Supprimer ${vehicle.name} ?`)) {
                    deleteVehicle(vehicle.id);
                  }
                }}
                className="absolute top-3 right-3 p-2 bg-zinc-800/80 hover:bg-red-600/20 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingVehicle(vehicle);
                }}
                className="absolute top-3 right-12 p-2 bg-zinc-800/80 hover:bg-blue-600/20 text-zinc-500 hover:text-blue-500 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingMileageVehicle(vehicle);
                }}
                className="absolute top-3 right-24 p-2 bg-zinc-800/80 hover:bg-green-600/20 text-zinc-500 hover:text-green-500 rounded-lg transition-colors"
              >
                <Gauge className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}

        {userVehicles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CarIcon className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-white mb-2">Aucun véhicule</h3>
            <p className="text-zinc-500 text-sm mb-6">Ajoutez votre premier véhicule</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-28 right-6">
        <Button
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-glow-blue hover:shadow-2xl transition-all"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {showAddModal && (
        <AddVehicleModal onClose={() => setShowAddModal(false)} />
      )}
      {editingVehicle && (
        <EditVehicleModal vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} />
      )}
      {editingMileageVehicle && (
        <EditMileageModal vehicle={editingMileageVehicle} onClose={() => setEditingMileageVehicle(null)} />
      )}
    </div>
  );
}