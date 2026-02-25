import React, { useState } from 'react';
import { AlertCircle, Calendar, Gauge, ChevronRight, CheckCircle } from 'lucide-react';
import type { UpcomingAlert } from '../../utils/alerts';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useApp } from '../../contexts/AppContext';
import { formatDate } from '../../utils/formatDate';
import { getAlertThresholds } from '../settings/AlertThresholdSettings';

interface UpcomingMaintenanceProps {
  alerts: UpcomingAlert[];
  onAlertClick: (alert: UpcomingAlert) => void;
  onBack: () => void;
}

export function UpcomingMaintenance({ alerts, onAlertClick, onBack }: UpcomingMaintenanceProps) {
  const { addMaintenanceEntry, getUserVehicles } = useApp();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 🔧 CORRECTION CRITIQUE : Utiliser getUserVehicles() pour filtrer par user_id
  const userVehicles = getUserVehicles();

  // Fonction pour marquer comme vérifié
  const handleMarkAsChecked = (alert: UpcomingAlert, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher le clic sur la carte
    
    const vehicle = userVehicles.find(v => v.id === alert.vehicleId);
    if (!vehicle) return;

    // Ajouter une entrée d'entretien avec la description "vérifié"
    const newEntry: any = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: alert.vehicleId,
      type: 'other', // Type générique car on utilise customType
      customType: alert.maintenanceName, // 🔧 FIX: Le vrai nom de l'entretien
      date: new Date().toISOString().split('T')[0], // Date du jour
      mileage: vehicle.mileage, // Kilométrage actuel
      // 🔧 FIX: Pas de coût (undefined au lieu de 0)
      notes: '✓ Contrôle effectué - Pièce en bon état, pas de remplacement nécessaire', // 🔧 FIX: notes au lieu de description
      photos: [],
    };

    addMaintenanceEntry(newEntry);
    
    // Feedback visuel
    setToastMessage(`✓ ${alert.maintenanceName} marqué comme vérifié`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'expired':
        return 'from-red-600 to-red-700'; // ROUGE pour expiré
      case 'high':
        return 'from-orange-500 to-orange-600'; // ORANGE pour proche (≤750km ou ≤30j)
      default:
        return 'from-green-500 to-green-600'; // VERT pour le reste
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'expired':
        return 'bg-red-600/20 border-red-600/30'; // ROUGE pour expiré
      case 'high':
        return 'bg-orange-500/10 border-orange-500/20'; // ORANGE pour proche
      default:
        return 'bg-green-500/10 border-green-500/20'; // VERT pour le reste
    }
  };

  // FILTRER les alertes pour n'afficher que celles proches (1500km ou 30 jours) ou expirées
  const { mileageThreshold: MILEAGE_THRESHOLD, dateThresholdDays: DATE_THRESHOLD_DAYS } = getAlertThresholds();

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

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      <div className="bg-gradient-to-b from-[#12121a] to-[#0a0a0f] px-6 pt-12 pb-8">
        <button
          onClick={onBack}
          className="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2 transition-colors"
        >
          ← Retour
        </button>
        <h1 className="text-3xl text-white mb-2">Échéances à venir</h1>
        <p className="text-slate-500">{filteredAlerts.length} alerte{filteredAlerts.length !== 1 ? 's' : ''} proche{filteredAlerts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Sélecteur de véhicule */}
      {userVehicles.length > 1 && (
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <Button
              onClick={() => setSelectedVehicleId('all')}
              variant={selectedVehicleId === 'all' ? 'default' : 'outline'}
              size="sm"
              className={selectedVehicleId === 'all' ? 'bg-violet-600 whitespace-nowrap' : 'bg-transparent border-white/10 text-slate-400 whitespace-nowrap'}
            >
              Tous les véhicules
            </Button>
            {userVehicles.map(vehicle => (
              <Button
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                variant={selectedVehicleId === vehicle.id ? 'default' : 'outline'}
                size="sm"
                className={selectedVehicleId === vehicle.id ? 'bg-violet-600 whitespace-nowrap' : 'bg-transparent border-white/10 text-slate-400 whitespace-nowrap'}
              >
                {vehicle.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-6 space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#12121a] rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/10">
              <AlertCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-white mb-2">Tout va bien !</h3>
            <p className="text-slate-500 text-sm">Aucune échéance pour l'instant</p>
          </div>
        ) : (
          // Affichage simple : déjà trié par couleur (rouge → orange → vert) dans alerts.ts
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              onClick={() => onAlertClick(alert)}
              className={`bg-[#12121a]/80 border p-4 hover:border-white/10 transition-all cursor-pointer rounded-2xl backdrop-blur-sm ${getUrgencyBg(
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
                    <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center border border-white/5">
                      <Gauge className="w-4 h-4 text-cyan-400" />
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
                    <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center border border-white/5">
                      <Calendar className="w-4 h-4 text-violet-400" />
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
                        Prévu le {formatDate(alert.dateAlert.targetDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton pour marquer comme vérifié */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <Button
                  onClick={(e) => handleMarkAsChecked(alert, e)}
                  size="sm"
                  className="w-full bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/15 active:scale-95 transition-transform"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme vérifié
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Toast pour feedback */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 animate-fade-in max-w-sm w-full">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 justify-center">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}