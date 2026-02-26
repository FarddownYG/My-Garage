import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Car, Wrench, AlertTriangle, CheckSquare, LogOut, ChevronRight, ExternalLink, BookOpen, Video, Star, Shield } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { calculateUpcomingAlerts } from '../../utils/alerts';
import { getAlertThresholds } from '../settings/AlertThresholdSettings';
import { Footer } from '../shared/Footer';
import { AdminPanel } from '../admin/AdminPanel';
import { listTransitions } from '../../utils/animations';

interface DashboardProps {
  onLogout: () => void;
  onViewAlerts: () => void;
  onViewTasks: () => void;
  onViewVehicles: () => void;
}

export function Dashboard({ onLogout, onViewAlerts, onViewTasks, onViewVehicles }: DashboardProps) {
  const { tasks, currentProfile, maintenances, maintenanceTemplates, maintenanceProfiles, supabaseUser, getUserVehicles, vehicles } = useApp();
  const { t } = useI18n();
  const { isDark } = useTheme();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const ADMIN_EMAIL = 'admin2647595726151748@gmail.com';
  const isAdmin = supabaseUser?.email === ADMIN_EMAIL;

  const userVehicles = useMemo(() => getUserVehicles(), [getUserVehicles]);
  const userTasks = useMemo(() => tasks.filter(t => userVehicles.some(v => v.id === t.vehicleId)), [tasks, userVehicles]);
  const incompleteTasks = useMemo(() => userTasks.filter(t => !t.completed), [userTasks]);

  const alerts = useMemo(() => calculateUpcomingAlerts(userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles), [userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles]);

  const { mileageThreshold: MILEAGE_THRESHOLD, dateThresholdDays: DATE_THRESHOLD_DAYS } = getAlertThresholds();

  const nearbyAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (alert.isExpired) return true;
      if (alert.mileageAlert && alert.mileageAlert.remainingKm <= MILEAGE_THRESHOLD) return true;
      if (alert.dateAlert && alert.dateAlert.remainingDays <= DATE_THRESHOLD_DAYS) return true;
      return false;
    });
  }, [alerts, MILEAGE_THRESHOLD, DATE_THRESHOLD_DAYS]);

  const displayName = supabaseUser?.user_metadata?.full_name || currentProfile?.name;

  if (showAdminPanel && isAdmin) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
        <AdminPanel />
        <div className="fixed top-4 left-4 z-50">
          <button onClick={() => setShowAdminPanel(false)}
            className={`flex items-center gap-2 px-3 py-2 backdrop-blur-sm rounded-xl text-sm transition-colors ${isDark ? 'bg-[#12121a]/90 border border-white/5 text-slate-300 hover:text-white' : 'bg-white/90 border border-gray-200 text-gray-600 hover:text-gray-900'}`}>
            ← {t('alerts.back')}
          </button>
        </div>
      </div>
    );
  }

  const cardBg = isDark ? 'bg-[#12121a]/80 border-white/5' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className={`h-screen overflow-auto pb-24 ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-4 sm:px-6 pt-12 pb-8 ${isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-gradient-to-b from-white to-gray-50'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20' : 'bg-gradient-to-br from-blue-100 to-violet-100 border border-blue-200'}`}>
              {currentProfile?.avatar}
            </div>
            <div className="min-w-0">
              <h1 className={`text-lg sm:text-2xl truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.hello')}, {displayName}</h1>
              <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => setShowAdminPanel(true)} className="p-2 text-red-400 hover:text-red-300 transition-colors flex-shrink-0" title="Panneau Admin">
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button onClick={onLogout} className={`p-2 transition-colors flex-shrink-0 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-violet-400" />
          <h2 className={`text-base sm:text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.maintenance')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href="https://www.carcarekiosk.com/" target="_blank" rel="noopener noreferrer" className="group">
            <Card className={`p-4 transition-all hover-lift rounded-2xl ${isDark ? 'bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/10 hover:border-violet-500/25' : 'bg-violet-50 border-violet-200 hover:border-violet-300'}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-gradient-to-br from-violet-500/15 to-purple-500/15 rounded-xl border border-violet-500/10">
                    <Video className="w-5 h-5 text-violet-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className={`font-medium mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    CarCareKiosk
                    <div className="flex items-center gap-1 text-xs"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-amber-400">4.2</span></div>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.freeVideoTutorials')}</p>
                </div>
              </div>
            </Card>
          </a>
          <a href="https://club.autodoc.fr/entretien" target="_blank" rel="noopener noreferrer" className="group">
            <Card className={`p-4 transition-all hover-lift rounded-2xl ${isDark ? 'bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/10 hover:border-cyan-500/25' : 'bg-cyan-50 border-cyan-200 hover:border-cyan-300'}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-xl border border-cyan-500/10">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className={`font-medium mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Club Auto-Doc
                    <div className="flex items-center gap-1 text-xs"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-amber-400">4.1</span></div>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.solidGuides')}</p>
                </div>
              </div>
            </Card>
          </a>
          <a href="https://www.mister-auto.com/tutoriels/" target="_blank" rel="noopener noreferrer" className="group">
            <Card className={`p-4 transition-all hover-lift rounded-2xl ${isDark ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/10 hover:border-amber-500/25' : 'bg-amber-50 border-amber-200 hover:border-amber-300'}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10">
                    <Wrench className="w-5 h-5 text-amber-400" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className={`font-medium mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Mister-Auto
                    <div className="flex items-center gap-1 text-xs"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-amber-400">3.3</span></div>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.practicalTutorials')}</p>
                </div>
              </div>
            </Card>
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div className="px-4 sm:px-6 py-6 space-y-4" variants={listTransitions.container} initial="initial" animate="animate">
        <motion.div variants={listTransitions.item} whileTap={{ scale: 0.98 }}>
          <Card onClick={onViewVehicles} className={`${cardBg} p-4 sm:p-6 cursor-pointer hover:border-cyan-500/15 transition-all rounded-2xl backdrop-blur-sm`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-xl border border-cyan-500/10 flex-shrink-0">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('dashboard.vehicles')}</p>
                <p className={`text-xl sm:text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{userVehicles.length}</p>
              </div>
              <button className="px-2 sm:px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-400 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 border border-cyan-500/10">
                {t('dashboard.view')}<ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={listTransitions.item} whileTap={{ scale: 0.98 }}>
          <Card onClick={onViewAlerts} className={`${cardBg} p-4 sm:p-6 cursor-pointer hover:border-amber-500/15 transition-all rounded-2xl backdrop-blur-sm`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('dashboard.upcomingAlerts')}</p>
                <p className={`text-xl sm:text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{nearbyAlerts.length}</p>
              </div>
              <button className="px-2 sm:px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 border border-amber-500/10">
                {t('dashboard.view')}<ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={listTransitions.item} whileTap={{ scale: 0.98 }}>
          <Card onClick={onViewTasks} className={`${cardBg} p-4 sm:p-6 cursor-pointer hover:border-emerald-500/15 transition-all rounded-2xl backdrop-blur-sm`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-xl border border-emerald-500/10 flex-shrink-0">
                <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('dashboard.pendingTasks')}</p>
                <p className={`text-xl sm:text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{incompleteTasks.length}</p>
              </div>
              <button className="px-2 sm:px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 border border-emerald-500/10">
                {t('dashboard.view')}<ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Upcoming alerts */}
      {nearbyAlerts.length > 0 && (
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-base sm:text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.nextDeadlines')}</h2>
            <button onClick={onViewAlerts} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 rounded-xl text-xs sm:text-sm transition-colors border border-amber-500/10">
              {t('dashboard.viewAll')}<ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {nearbyAlerts.slice(0, 3).map((alert) => {
              const urgencyColor = alert.urgency === 'high' ? 'bg-red-400' : alert.urgency === 'medium' ? 'bg-amber-400' : 'bg-cyan-400';
              return (
                <motion.div key={alert.id} whileTap={{ scale: 0.98 }}>
                  <Card className={`${cardBg} p-3 sm:p-4 hover-lift rounded-2xl backdrop-blur-sm`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-2 h-2 rounded-full ${urgencyColor} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{alert.maintenanceName}</p>
                        <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{alert.vehicleName}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                        {alert.mileageAlert && <span className={`text-xs sm:text-sm whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{alert.mileageAlert.remainingKm} km</span>}
                        {alert.dateAlert && <span className={`text-xs sm:text-sm whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{alert.dateAlert.remainingDays}j</span>}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending tasks */}
      {incompleteTasks.length > 0 && (
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-base sm:text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.pendingTasks')}</h2>
            <button onClick={onViewTasks} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 rounded-xl text-xs sm:text-sm transition-colors border border-emerald-500/10">
              {t('dashboard.viewAll')}<ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {incompleteTasks.slice(0, 3).map((task) => {
              const vehicle = vehicles.find(v => v.id === task.vehicleId);
              return (
                <Card key={task.id} className={`${cardBg} p-4 hover-lift rounded-2xl backdrop-blur-sm`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="flex-1">
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>{task.title}</p>
                      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{vehicle?.name}</p>
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
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#12121a] border border-white/5' : 'bg-gray-100'}`}>
            <Wrench className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.noVehicle')}</h3>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('dashboard.addFirstVehicle')}</p>
        </div>
      )}

      <Footer />
    </div>
  );
}
