import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './contexts/AppContext';
import { I18nProvider } from './contexts/I18nContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { Dashboard } from './components/home/Dashboard';
import { BottomNav } from './components/shared/BottomNav';
import { Onboarding } from './components/shared/Onboarding';
import { LoadingSpinner } from './components/shared/FeedbackComponents';
import type { UpcomingAlert } from './types';
import { initializeSecurity } from './utils/security';
import { calculateUpcomingAlerts } from './utils/alerts';
import { pageTransitions } from './utils/animations';
import './utils/hotReloadHandler'; // 🔥 Import hot-reload handler

// 🔇 SÉCURITÉ : Silencer console en production IMMÉDIATEMENT (avant tout log)
import { silenceConsoleInProduction } from './utils/security';
silenceConsoleInProduction();

// 🚀 Lazy load heavy components for better performance
const VehicleList = lazy(() => import('./components/vehicles/VehicleList').then(m => ({ default: m.VehicleList })));
const VehicleDetail = lazy(() => import('./components/vehicles/VehicleDetail').then(m => ({ default: m.VehicleDetail })));
const UpcomingMaintenance = lazy(() => import('./components/maintenance/UpcomingMaintenance').then(m => ({ default: m.UpcomingMaintenance })));
const TaskList = lazy(() => import('./components/tasks/TaskList').then(m => ({ default: m.TaskList })));
const Settings = lazy(() => import('./components/settings/Settings').then(m => ({ default: m.Settings })));

// v1.2.0 - Supabase Auth Only (plus de sélection de profils)
type AppTab = 'home' | 'vehicles' | 'tasks' | 'settings';
type AppView = 'main' | 'upcoming-alerts' | 'vehicle-detail';

function AppContent() {
  const { currentProfile, isLoading, vehicles, maintenances, maintenanceTemplates, maintenanceProfiles, signOut, getUserVehicles } = useApp();
  const { isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const savedTab = localStorage.getItem('valcar-active-tab');
    const validTabs: AppTab[] = ['home', 'vehicles', 'tasks', 'settings'];
    return validTabs.includes(savedTab as AppTab) ? (savedTab as AppTab) : 'home';
  });

  // View management for nested screens
  const [currentView, setCurrentView] = useState<AppView>('main');
  const [selectedVehicleIdForAlert, setSelectedVehicleIdForAlert] = useState<string | null>(null);
  const [prefilledMaintenanceType, setPrefilledMaintenanceType] = useState<string | null>(null);
  
  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('valcar-onboarding-done');
  });

  const userVehicles = useMemo(() => getUserVehicles(), [getUserVehicles]);
  
  const alerts = useMemo(() => {
    return calculateUpcomingAlerts(userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles);
  }, [userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles]);
  
  useEffect(() => {
    if (currentProfile) {
      const fontSize = currentProfile.fontSize || 50;
      document.documentElement.style.setProperty('--font-size-scale', `${fontSize}%`);
    } else {
      document.documentElement.style.setProperty('--font-size-scale', '50%');
    }
  }, [currentProfile]);
  
  useEffect(() => {
    const isProduction = process.env.NODE_ENV === 'production';
    initializeSecurity(isProduction);
  }, []);
  
  useEffect(() => {
    localStorage.setItem('valcar-active-tab', activeTab);
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await signOut();
      setActiveTab('home');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const bgColor = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';

  // Onboarding
  if (showOnboarding && currentProfile) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  // Handle upcoming alerts view
  if (currentView === 'upcoming-alerts') {
    const handleAlertClick = (alert: UpcomingAlert) => {
      setSelectedVehicleIdForAlert(alert.vehicleId);
      setPrefilledMaintenanceType(alert.maintenanceName);
      setCurrentView('vehicle-detail');
    };

    return (
      <motion.div className={`min-h-screen ${bgColor}`} initial="initial" animate="animate" exit="exit" variants={pageTransitions}>
        <Suspense fallback={<div className={`min-h-screen ${bgColor} flex items-center justify-center`}><LoadingSpinner size="lg" message="Chargement..." /></div>}>
          <UpcomingMaintenance alerts={alerts} onAlertClick={handleAlertClick} onBack={() => setCurrentView('main')} />
        </Suspense>
      </motion.div>
    );
  }

  // Handle vehicle detail view from alert
  if (currentView === 'vehicle-detail' && selectedVehicleIdForAlert) {
    const vehicle = vehicles.find(v => v.id === selectedVehicleIdForAlert);
    if (vehicle) {
      return (
        <motion.div className={`min-h-screen ${bgColor}`} initial="initial" animate="animate" exit="exit" variants={pageTransitions}>
          <Suspense fallback={<div className={`min-h-screen ${bgColor} flex items-center justify-center`}><LoadingSpinner size="lg" message="Chargement..." /></div>}>
            <VehicleDetail
              vehicle={vehicle}
              onBack={() => { setCurrentView('main'); setSelectedVehicleIdForAlert(null); setPrefilledMaintenanceType(null); }}
              prefilledMaintenanceType={prefilledMaintenanceType}
            />
          </Suspense>
        </motion.div>
      );
    }
  }

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <AnimatePresence mode="wait">
        <Suspense fallback={<div className={`min-h-screen ${bgColor} flex items-center justify-center`}><LoadingSpinner size="lg" message="Chargement..." /></div>}>
          {activeTab === 'home' && (
            <motion.div key="home" initial="initial" animate="animate" exit="exit" variants={pageTransitions}>
              <Dashboard onLogout={handleLogout} onViewAlerts={() => setCurrentView('upcoming-alerts')} onViewTasks={() => setActiveTab('tasks')} onViewVehicles={() => setActiveTab('vehicles')} />
            </motion.div>
          )}
          {activeTab === 'vehicles' && (
            <motion.div key="vehicles" initial="initial" animate="animate" exit="exit" variants={pageTransitions}>
              <VehicleList />
            </motion.div>
          )}
          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial="initial" animate="animate" exit="exit" variants={pageTransitions}>
              <TaskList />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial="initial" animate="animate" exit="exit" variants={pageTransitions}>
              <Settings onLogout={handleLogout} />
            </motion.div>
          )}
        </Suspense>
      </AnimatePresence>
      
      {!currentProfile?.isAdmin && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab as any} />
      )}
      
      {currentProfile?.isAdmin && (
        <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t ${isDark ? 'bg-[#0a0a0f]/90 border-white/[0.06]' : 'bg-white/90 border-gray-200'}`}>
          <div className="max-w-md mx-auto px-6 h-20 flex items-center justify-center">
            <button onClick={handleLogout}
              className={`px-6 py-3 rounded-xl font-medium active:scale-95 transition-all ${isDark ? 'bg-[#12121a] hover:bg-[#1a1a2e] border border-white/5 text-white' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700'}`}>
              Quitter l'Admin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AppProvider>
          <ErrorBoundary>
            <AuthWrapper>
              <AppContent />
            </AuthWrapper>
          </ErrorBoundary>
        </AppProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}