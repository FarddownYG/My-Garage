import React, { useMemo, useState } from 'react';
import { Car, Wrench, AlertTriangle, CheckSquare, LogOut, ChevronRight, ExternalLink, BookOpen, Video, Star, Shield } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { calculateUpcomingAlerts } from '../../utils/alerts';
import { getAlertThresholds } from '../settings/AlertThresholdSettings';
import { Footer } from '../shared/Footer';
import { AdminPanel } from '../admin/AdminPanel';

interface DashboardProps {
  onLogout: () => void;
  onViewAlerts: () => void;
  onViewTasks: () => void;
  onViewVehicles: () => void;
}

export function Dashboard({ onLogout, onViewAlerts, onViewTasks, onViewVehicles }: DashboardProps) {
  const { tasks, currentProfile, maintenances, maintenanceTemplates, maintenanceProfiles, supabaseUser, getUserVehicles, vehicles } = useApp();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Email admin
  const ADMIN_EMAIL = 'admin2647595726151748@gmail.com';
  const isAdmin = supabaseUser?.email === ADMIN_EMAIL;

  // 🔧 CORRECTION CRITIQUE : Utiliser getUserVehicles() pour filtrer par user_id
  const userVehicles = useMemo(() => getUserVehicles(), [getUserVehicles]);
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
    return calculateUpcomingAlerts(userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles);
  }, [userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles]);

  // Filtrer les alertes proches (1500km ou 30 jours) ou expirées pour le Dashboard
  const { mileageThreshold: MILEAGE_THRESHOLD, dateThresholdDays: DATE_THRESHOLD_DAYS } = getAlertThresholds();

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
  }, [alerts, MILEAGE_THRESHOLD, DATE_THRESHOLD_DAYS]);

  // Afficher le nom complet depuis user_metadata ou le nom du profil
  const displayName = supabaseUser?.user_metadata?.full_name || currentProfile?.name;

  // Si panneau admin affiché, le rendre
  if (showAdminPanel && isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <AdminPanel />
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setShowAdminPanel(false)}
            className="flex items-center gap-2 px-3 py-2 bg-[#12121a]/90 backdrop-blur-sm border border-white/5 text-slate-300 hover:text-white rounded-xl text-sm transition-colors"
          >
            ← Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto bg-[#0a0a0f] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#12121a] to-[#0a0a0f] px-4 sm:px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-2xl sm:text-3xl border border-cyan-500/20 flex-shrink-0">
              {currentProfile?.avatar}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl text-white truncate">Bonjour, {displayName}</h1>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="p-2 text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                title="Panneau Admin"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ressources Maintenance & Entretiens */}
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-violet-400" />
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
            <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/10 p-4 hover:border-violet-500/25 transition-all hover-lift rounded-2xl">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-gradient-to-br from-violet-500/15 to-purple-500/15 rounded-xl border border-violet-500/10">
                    <Video className="w-5 h-5 text-violet-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                    CarCareKiosk
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-amber-400">4.2</span>
                    </div>
                  </h3>
                  <p className="text-xs text-slate-400">Tutoriels vidéo gratuits et bien faits</p>
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
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/10 p-4 hover:border-cyan-500/25 transition-all hover-lift rounded-2xl">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-xl border border-cyan-500/10">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                    Club Auto-Doc
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-amber-400">4.1</span>
                    </div>
                  </h3>
                  <p className="text-xs text-slate-400">Guides et vidéos solides (connexion requise)</p>
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
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/10 p-4 hover:border-amber-500/25 transition-all hover-lift rounded-2xl">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10">
                    <Wrench className="w-5 h-5 text-amber-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                    Mister-Auto
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-amber-400">3.3</span>
                    </div>
                  </h3>
                  <p className="text-xs text-slate-400">Tutoriels pratiques pour guides et pièces</p>
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
          className="bg-[#12121a]/80 border-white/5 p-4 sm:p-6 cursor-pointer hover:border-cyan-500/15 transition-all rounded-2xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-xl border border-cyan-500/10 flex-shrink-0">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">Véhicules</p>
              <p className="text-xl sm:text-2xl text-white">{userVehicles.length}</p>
            </div>
            <button className="px-2 sm:px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-400 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 border border-cyan-500/10">
              Voir
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </Card>

        <Card 
          onClick={onViewAlerts}
          className="bg-[#12121a]/80 border-white/5 p-4 sm:p-6 cursor-pointer hover:border-amber-500/15 transition-all rounded-2xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">Échéances à venir</p>
              <p className="text-xl sm:text-2xl text-white">{nearbyAlerts.length}</p>
            </div>
            <button className="px-2 sm:px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 border border-amber-500/10">
              Voir
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </Card>

        <Card 
          onClick={onViewTasks}
          className="bg-[#12121a]/80 border-white/5 p-4 sm:p-6 cursor-pointer hover:border-emerald-500/15 transition-all rounded-2xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-xl border border-emerald-500/10 flex-shrink-0">
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">Tâches en attente</p>
              <p className="text-xl sm:text-2xl text-white">{incompleteTasks.length}</p>
            </div>
            <button className="px-2 sm:px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 border border-emerald-500/10">
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
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 rounded-xl text-xs sm:text-sm transition-colors border border-amber-500/10"
            >
              Voir tout
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {nearbyAlerts.slice(0, 3).map((alert) => {
              const urgencyColor = alert.urgency === 'high' ? 'bg-red-400' : 
                                   alert.urgency === 'medium' ? 'bg-amber-400' : 'bg-cyan-400';
              return (
                <Card key={alert.id} className="bg-[#12121a]/80 border-white/5 p-3 sm:p-4 hover-lift rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-2 h-2 rounded-full ${urgencyColor} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-white truncate">{alert.maintenanceName}</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">{alert.vehicleName}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                      {alert.mileageAlert && (
                        <span className="text-xs sm:text-sm text-slate-400 whitespace-nowrap">{alert.mileageAlert.remainingKm} km</span>
                      )}
                      {alert.dateAlert && (
                        <span className="text-xs sm:text-sm text-slate-400 whitespace-nowrap">{alert.dateAlert.remainingDays}j</span>
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
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 rounded-xl text-xs sm:text-sm transition-colors border border-emerald-500/10"
            >
              Voir tout
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {incompleteTasks.slice(0, 3).map((task) => {
              const vehicle = vehicles.find(v => v.id === task.vehicleId);
              return (
                <Card key={task.id} className="bg-[#12121a]/80 border-white/5 p-4 hover-lift rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="flex-1">
                      <p className="text-white">{task.title}</p>
                      <p className="text-sm text-slate-500">{vehicle?.name}</p>
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