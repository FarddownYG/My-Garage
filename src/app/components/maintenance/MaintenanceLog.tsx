import React, { useState } from 'react';
import { Plus, Wrench, Calendar, Gauge, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AddMaintenanceModal } from './AddMaintenanceModal';
import { EditMaintenanceModal } from './EditMaintenanceModal';
import { formatDate } from '../../utils/formatDate';
import type { MaintenanceEntry } from '../../types';

interface MaintenanceLogProps {
  vehicleId: string;
  onOpenSettings?: () => void;
}

const maintenanceTypeLabels: Record<string, string> = {
  oil: 'Vidange',
  tires: 'Pneus',
  brakes: 'Freins',
  filter: 'Filtre',
  battery: 'Batterie',
  inspection: 'Contrôle technique',
  other: 'Autre',
};

const maintenanceTypeIcons: Record<string, string> = {
  oil: '💧',
  tires: '🔩',
  brakes: '⚙️',
  filter: '🔧',
  battery: '⚡',
  inspection: '✅',
  other: '🔧',
};

export function MaintenanceLog({ vehicleId, onOpenSettings }: MaintenanceLogProps) {
  const { maintenanceEntries } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MaintenanceEntry | null>(null);

  const vehicleEntries = maintenanceEntries
    .filter(e => e.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-white">Carnet d'entretien</h2>
        <Button
          onClick={() => setShowAddModal(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {vehicleEntries.length > 0 ? (
        <div className="space-y-3">
          {vehicleEntries.map((entry) => (
            <Card key={entry.id} className="bg-zinc-900 border-zinc-800 p-4 rounded-2xl shadow-soft hover-lift">
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {entry.customIcon || maintenanceTypeIcons[entry.type]}
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-1">
                    {entry.customType || maintenanceTypeLabels[entry.type]}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      {entry.mileage.toLocaleString()} km
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-zinc-400 mb-2">{entry.notes}</p>
                  )}
                  {entry.cost && (
                    <p className="text-sm text-green-500">{entry.cost.toFixed(2)} €</p>
                  )}
                  <Button
                    onClick={() => {
                      setEditingEntry(entry);
                      setShowEditModal(true);
                    }}
                    size="sm"
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-white mb-2">Aucun entretien</h3>
          <p className="text-zinc-500 text-sm">Ajoutez votre premier entretien</p>
        </div>
      )}

      {showAddModal && (
        <AddMaintenanceModal 
          vehicleId={vehicleId} 
          onClose={() => setShowAddModal(false)} 
          onOpenSettings={onOpenSettings}
        />
      )}
      {showEditModal && editingEntry && (
        <EditMaintenanceModal
          entry={editingEntry}
          onClose={() => setShowEditModal(false)}
          onOpenSettings={onOpenSettings}
        />
      )}
    </div>
  );
}