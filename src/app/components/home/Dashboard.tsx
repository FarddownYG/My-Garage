import React, { useMemo, useState } from 'react';
import { Car, Wrench, AlertTriangle, CheckSquare, LogOut, ChevronRight, ExternalLink, BookOpen, Video, Star, Shield } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { calculateUpcomingAlerts } from '../../utils/alerts';
import { Footer } from '../shared/Footer';
import { AdminPanel } from '../admin/AdminPanel';

interface DashboardProps {
  onLogout: () => void;
  onViewAlerts: () => void;
  onViewTasks: () => void;
  onViewVehicles: () => void;
}

export function Dashboard({ onLogout, onViewAlerts, onViewTasks, onViewVehicles }: DashboardProps) {
  const { vehicles, tasks, currentProfile, maintenances, maintenanceTemplates, maintenanceProfiles, supabaseUser } = useApp();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Email admin
  const ADMIN_EMAIL = 'admin2647595726151748@gmail.com';
  const isAdmin = supabaseUser?.email === ADMIN_EMAIL;

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
      profiles: maintenanceProfiles.length,
    });
    return calculateUpcomingAlerts(userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles);
  }, [userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles]);

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

  // Afficher le nom complet depuis user_metadata ou le nom du profil
  const displayName = supabaseUser?.user_metadata?.full_name || currentProfile?.name;

  // Si panneau admin affiché, le rendre
  if (showAdminPanel && isAdmin) {
    return (
      <div className="min-h-screen bg-black">
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4">
          <button
            onClick={() => setShowAdminPanel(false)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-2"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-bold">Panneau Admin</h1>
        </div>
        <div className="p-4">
          <AdminPanel />
        </div>
      </div>
    );
  }

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
              <h1 className="text-lg sm:text-2xl text-white truncate">Bonjour, {displayName}</h1>
              <p className="text-xs sm:text-sm text-zinc-500 truncate">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="p-2 text-red-500 hover:text-red-400 transition-colors flex-shrink-0"
                title="Panneau Admin"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ressources Maintenance & Entretiens */}
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-purple-500" />
          <h2 className="text-base sm:text-lg text-white">Maintenance & Entretiens</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* CarCareKiosk */}
          <a
            href="https://www.carcarekiosk.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-800/30 p-4 hover:border-purple-600/50 transition-all hover-lift">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Video className="w-5 h-5 text-purple-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                    CarCareKiosk
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-yellow-500">4.2</span>
                    </div>
                  </h3>
                  <p className="text-xs text-zinc-400">Tutoriels vidéo gratuits et bien faits</p>
                </div>
              </div>
            </Card>
          </a>

          {/* Auto-Doc */}
          <a
            href="https://club.autodoc.fr/entretien"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800/30 p-4 hover:border-blue-600/50 transition-all hover-lift">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                    Club Auto-Doc
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-yellow-500">4.1</span>
                    </div>
                  </h3>
                  <p className="text-xs text-zinc-400">Guides et vidéos solides (connexion requise)</p>
                </div>
              </div>
            </Card>
          </a>

          {/* Mister-Auto */}
          <a
            href="https://www.mister-auto.com/tutoriels/"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-800/30 p-4 hover:border-orange-600/50 transition-all hover-lift">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Wrench className="w-5 h-5 text-orange-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                    Mister-Auto
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-yellow-500">3.3</span>
                    </div>
                  </h3>
                  <p className="text-xs text-zinc-400">Tutoriels pratiques pour guides et pièces</p>
                </div>
              </div>
            </Card>
          </a>
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

      {/* Footer */}
      <Footer />
    </div>
  );
}