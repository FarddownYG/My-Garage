import React, { useMemo } from 'react';
import { Car, Wrench, AlertTriangle, CheckSquare, LogOut, ChevronRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { calculateUpcomingAlerts } from '../../utils/alerts';

interface DashboardProps {
  onLogout: () => void;
  onViewAlerts: () => void;
  onViewTasks: () => void;
  onViewVehicles: () => void;
}

export function Dashboard({ onLogout, onViewAlerts, onViewTasks, onViewVehicles }: DashboardProps) {
  const { vehicles, tasks, currentProfile, maintenances, maintenanceTemplates } = useApp();

  // Filtrer par profil actuel
  const userVehicles = useMemo(
    () => vehicles.filter(v => v.ownerId === currentProfile?.id),
    [vehicles, currentProfile?.id]
  );
  const userTasks = useMemo(
    () => tasks.filter(t => userVehicles.some(v => v.id === t.vehicleId)),
    [tasks, userVehicles]
  );
  const incompleteTasks = useMemo(
    () => userTasks.filter(t => !t.completed),
    [userTasks]
  );

  // Calculer les alertes d'échéances
  const alerts = useMemo(() => {
    console.log('🔄 [Dashboard] Recalcul des alertes...', {
      vehicles: userVehicles.length,
      maintenances: maintenances.length,
      templates: maintenanceTemplates.length,
    });
    return calculateUpcomingAlerts(userVehicles, maintenances, maintenanceTemplates);
  }, [userVehicles, maintenances, maintenanceTemplates]);

  // Filtrer les alertes proches (2000km ou 60 jours) ou expirées pour le Dashboard
  const MILEAGE_THRESHOLD = 2000; // km
  const DATE_THRESHOLD_DAYS = 60; // ~2 mois

  const nearbyAlerts = useMemo(() => {
    return alerts.filter((alert) => {
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

      return false;
    });
  }, [alerts]);

  return (
    <div className="h-screen overflow-auto bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-4 sm:px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-2xl sm:text-3xl border-2 border-zinc-700 flex-shrink-0">
              {currentProfile?.avatar}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl text-white truncate">Bonjour, {currentProfile?.name}</h1>
              <p className="text-xs sm:text-sm text-zinc-500 truncate">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 sm:px-6 py-6 space-y-4">
        <Card 
          onClick={onViewVehicles}
          className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl flex-shrink-0">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-zinc-500">Véhicules</p>
              <p className="text-xl sm:text-2xl text-white">{userVehicles.length}</p>
            </div>
            <button className="px-2 sm:px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0">
              Voir
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </Card>

        <Card 
          onClick={onViewAlerts}
          className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-orange-500/10 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-zinc-500">Échéances à venir</p>
              <p className="text-xl sm:text-2xl text-white">{nearbyAlerts.length}</p>
            </div>
            <button className="px-2 sm:px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0">
              Voir
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </Card>

        <Card 
          onClick={onViewTasks}
          className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl flex-shrink-0">
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-zinc-500">Tâches en attente</p>
              <p className="text-xl sm:text-2xl text-white">{incompleteTasks.length}</p>
            </div>
            <button className="px-2 sm:px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0">
              Voir
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </Card>
      </div>

      {/* Prochaines échéances */}
      {nearbyAlerts.length > 0 && (
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg text-white">Prochaines échéances</h2>
            <button
              onClick={onViewAlerts}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg text-xs sm:text-sm transition-colors"
            >
              Voir tout
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {nearbyAlerts.slice(0, 3).map((alert) => {
              const urgencyColor = alert.urgency === 'high' ? 'bg-red-500' : 
                                   alert.urgency === 'medium' ? 'bg-orange-500' : 'bg-blue-500';
              return (
                <Card key={alert.id} className="bg-zinc-900 border-zinc-800 p-3 sm:p-4 hover-lift rounded-2xl shadow-soft">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-2 h-2 rounded-full ${urgencyColor} shadow-glow-blue flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-white truncate">{alert.maintenanceName}</p>
                      <p className="text-xs sm:text-sm text-zinc-500 truncate">{alert.vehicleName}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                      {alert.mileageAlert && (
                        <span className="text-xs sm:text-sm text-zinc-400 whitespace-nowrap">{alert.mileageAlert.remainingKm} km</span>
                      )}
                      {alert.dateAlert && (
                        <span className="text-xs sm:text-sm text-zinc-400 whitespace-nowrap">{alert.dateAlert.remainingDays}j</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tâches en attente */}
      {incompleteTasks.length > 0 && (
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg text-white">Tâches en attente</h2>
            <button
              onClick={onViewTasks}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-xs sm:text-sm transition-colors"
            >
              Voir tout
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {incompleteTasks.slice(0, 3).map((task) => {
              const vehicle = vehicles.find(v => v.id === task.vehicleId);
              return (
                <Card key={task.id} className="bg-zinc-900 border-zinc-800 p-4 hover-lift rounded-2xl shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <p className="text-white">{task.title}</p>
                      <p className="text-sm text-zinc-500">{vehicle?.name}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {userVehicles.length === 0 && alerts.length === 0 && incompleteTasks.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-white mb-2">Aucun véhicule</h3>
          <p className="text-zinc-500 text-sm">Ajoutez votre premier véhicule pour commencer</p>
        </div>
      )}
    </div>
  );
}