import React, { useState } from 'react';
import { AlertCircle, Calendar, Gauge, ChevronRight } from 'lucide-react';
import type { UpcomingAlert } from '../../utils/alerts';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useApp } from '../../contexts/AppContext';

interface UpcomingMaintenanceProps {
  alerts: UpcomingAlert[];
  onAlertClick: (alert: UpcomingAlert) => void;
  onBack: () => void;
}

export function UpcomingMaintenance({ alerts, onAlertClick, onBack }: UpcomingMaintenanceProps) {
  const { vehicles, currentProfile } = useApp();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');

  // Filtrer les véhicules de l'utilisateur actuel
  const userVehicles = vehicles.filter(v => v.ownerId === currentProfile?.id);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'expired':
        return 'from-red-600 to-red-700';
      case 'high':
        return 'from-red-500 to-orange-600';
      case 'medium':
        return 'from-orange-500 to-yellow-600';
      default:
        return 'from-blue-500 to-purple-600';
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'expired':
        return 'bg-red-600/20 border-red-600/30';
      case 'high':
        return 'bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'bg-orange-500/10 border-orange-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  // FILTRER les alertes pour n'afficher que celles proches (2000km ou 60 jours) ou expirées
  const MILEAGE_THRESHOLD = 2000; // km
  const DATE_THRESHOLD_DAYS = 60; // ~2 mois

  const filteredAlerts = alerts.filter((alert) => {
    // Filtre par véhicule
    if (selectedVehicleId !== 'all' && alert.vehicleId !== selectedVehicleId) return false;
    
    // Toujours afficher les alertes expirées
    if (alert.isExpired) return true;

    // Vérifier si l'alerte kilométrique est dans le seuil
    if (alert.mileageAlert && alert.mileageAlert.remainingKm <= MILEAGE_THRESHOLD) {
      return true;
    }

    // Vérifier si l'alerte de date est dans le seuil
    if (alert.dateAlert && alert.dateAlert.remainingDays <= DATE_THRESHOLD_DAYS) {
      return true;
    }

    // Si aucune condition n'est remplie, ne pas afficher
    return false;
  });

  // Grouper les alertes filtrées par catégorie
  const alertsByCategory = filteredAlerts.reduce((acc, alert) => {
    if (!acc[alert.category]) {
      acc[alert.category] = [];
    }
    acc[alert.category].push(alert);
    return acc;
  }, {} as Record<string, UpcomingAlert[]>);

  // Ordre de tri personnalisé pour les catégories
  const categoryOrder = [
    'Entretien courant',
    'Fluides',
    'Freinage',
    'Pneus & géométrie',
    'Distribution',
    'Électricité / contrôles',
    'Confort',
    'Transmission',
    'Allumage / carburant',
    'Dépollution',
    'Divers',
  ];

  const sortedCategories = Object.keys(alertsByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8">
        <button
          onClick={onBack}
          className="text-blue-500 hover:text-blue-400 mb-4 flex items-center gap-2"
        >
          ← Retour
        </button>
        <h1 className="text-3xl text-white mb-2">Échéances à venir</h1>
        <p className="text-zinc-500">{filteredAlerts.length} alerte{filteredAlerts.length !== 1 ? 's' : ''} proche{filteredAlerts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Sélecteur de véhicule */}
      {userVehicles.length > 1 && (
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <Button
              onClick={() => setSelectedVehicleId('all')}
              variant={selectedVehicleId === 'all' ? 'default' : 'outline'}
              size="sm"
              className={selectedVehicleId === 'all' ? 'bg-purple-600 whitespace-nowrap' : 'bg-transparent border-zinc-700 text-zinc-400 whitespace-nowrap'}
            >
              Tous les véhicules
            </Button>
            {userVehicles.map(vehicle => (
              <Button
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                variant={selectedVehicleId === vehicle.id ? 'default' : 'outline'}
                size="sm"
                className={selectedVehicleId === vehicle.id ? 'bg-purple-600 whitespace-nowrap' : 'bg-transparent border-zinc-700 text-zinc-400 whitespace-nowrap'}
              >
                {vehicle.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-6 space-y-6">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-white mb-2">Tout va bien !</h3>
            <p className="text-zinc-500 text-sm">Aucune échéance pour l'instant</p>
          </div>
        ) : (
          sortedCategories.map((category) => (
            <div key={category} className="space-y-3">
              {/* En-tête de catégorie */}
              <h2 className="text-zinc-400 text-sm font-medium px-2">
                {category}
              </h2>

              {/* Alertes de cette catégorie */}
              {alertsByCategory[category].map((alert) => (
                <Card
                  key={alert.id}
                  onClick={() => onAlertClick(alert)}
                  className={`bg-zinc-900 border p-4 hover:border-zinc-600 transition-all cursor-pointer rounded-2xl shadow-soft hover-lift ${getUrgencyBg(
                    alert.urgency
                  )}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${getUrgencyColor(
                            alert.urgency
                          )}`}
                        />
                        <h3 className="text-white font-medium">{alert.maintenanceName}</h3>
                      </div>
                      <p className="text-sm text-zinc-500">{alert.vehicleName}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </div>

                  <div className="space-y-2">
                    {alert.mileageAlert && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Gauge className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          {alert.isExpired && alert.mileageAlert.remainingKm === 0 ? (
                            <p className="text-red-400 font-medium">EXPIRÉ - Entretien nécessaire !</p>
                          ) : (
                            <p className="text-zinc-400">
                              Dans <span className="text-white font-medium">{alert.mileageAlert.remainingKm.toLocaleString()} km</span>
                            </p>
                          )}
                          <p className="text-xs text-zinc-600">
                            {alert.mileageAlert.currentMileage.toLocaleString()} / {alert.mileageAlert.targetMileage.toLocaleString()} km
                          </p>
                        </div>
                      </div>
                    )}

                    {alert.dateAlert && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          {alert.isExpired && alert.dateAlert.remainingDays === 0 ? (
                            <p className="text-red-400 font-medium">EXPIRÉ - Entretien nécessaire !</p>
                          ) : (
                            <p className="text-zinc-400">
                              Dans <span className="text-white font-medium">{alert.dateAlert.remainingDays} jour{alert.dateAlert.remainingDays !== 1 ? 's' : ''}</span>
                            </p>
                          )}
                          <p className="text-xs text-zinc-600">
                            Prévu le {alert.dateAlert.targetDate.toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}