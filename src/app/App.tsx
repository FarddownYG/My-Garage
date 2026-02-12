import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { Dashboard } from './components/home/Dashboard';
import { BottomNav } from './components/shared/BottomNav';
import { LoadingSpinner } from './components/shared/FeedbackComponents';
import type { UpcomingAlert } from './types';
import { initializeSecurity } from './utils/security';
import { calculateUpcomingAlerts } from './utils/alerts';
import { pageTransitions } from './utils/animations';
import './utils/hotReloadHandler'; // 🔥 Import hot-reload handler

// 🚀 Lazy load heavy components for better performance
const VehicleList = lazy(() => import('./components/vehicles/VehicleList').then(m => ({ default: m.VehicleList })));
const VehicleDetail = lazy(() => import('./components/vehicles/VehicleDetail').then(m => ({ default: m.VehicleDetail })));
const MaintenanceLog = lazy(() => import('./components/maintenance/MaintenanceLog').then(m => ({ default: m.MaintenanceLog })));
const UpcomingMaintenance = lazy(() => import('./components/maintenance/UpcomingMaintenance').then(m => ({ default: m.UpcomingMaintenance })));
const TaskList = lazy(() => import('./components/tasks/TaskList').then(m => ({ default: m.TaskList })));
const Settings = lazy(() => import('./components/settings/Settings').then(m => ({ default: m.Settings })));

// v1.2.0 - Supabase Auth Only (plus de sélection de profils)
type AppTab = 'home' | 'vehicles' | 'maintenance' | 'tasks' | 'settings';
type AppView = 'main' | 'upcoming-alerts' | 'vehicle-detail';

function AppContent() {
  const { currentProfile, setCurrentProfile, isLoading, vehicles, maintenances, maintenanceTemplates, maintenanceProfiles, signOut, getUserVehicles } = useApp();
  
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const savedTab = localStorage.getItem('valcar-active-tab');
    return (savedTab as AppTab) || 'home';
  });

  // View management for nested screens
  const [currentView, setCurrentView] = useState<AppView>('main');
  const [selectedVehicleIdForAlert, setSelectedVehicleIdForAlert] = useState<string | null>(null);
  const [prefilledMaintenanceType, setPrefilledMaintenanceType] = useState<string | null>(null);

  // 🔧 CORRECTION CRITIQUE : Utiliser getUserVehicles() qui filtre par user_id
  const userVehicles = useMemo(() => getUserVehicles(), [getUserVehicles]);
  
  const alerts = useMemo(() => {
    return calculateUpcomingAlerts(userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles);
  }, [userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles]);
  
  // Apply font size globally via CSS variable (seulement si un profil est connecté)
  useEffect(() => {
    if (currentProfile) {
      const fontSize = currentProfile.fontSize || 50;
      document.documentElement.style.setProperty('--font-size-scale', `${fontSize}%`);
    } else {
      // Réinitialiser à 50% (normal) quand déconnecté (page de connexion)
      document.documentElement.style.setProperty('--font-size-scale', '50%');
    }
  }, [currentProfile]);
  
  // Initialize security measures on mount
  useEffect(() => {
    // Set to 'false' during development, 'true' for production
    const isProduction = process.env.NODE_ENV === 'production';
    initializeSecurity(isProduction);
    
    // 🔥 Hot-reload information message (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('%c🔥 Mode Développement', 'background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
      console.log('%cℹ️ Si vous voyez une erreur "useApp must be used within AppProvider" après un hot-reload, faites simplement un hard refresh (Ctrl+Shift+R ou Cmd+Shift+R).', 'color: #10b981; font-size: 12px;');
      console.log('%cℹ️ Cette erreur est normale en développement et disparaîtra en production.', 'color: #10b981; font-size: 12px;');
    }
  }, []);
  
  // Save activeTab to localStorage whenever it changes
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

  // Main app
  // Handle upcoming alerts view
  if (currentView === 'upcoming-alerts') {
    const handleAlertClick = (alert: UpcomingAlert) => {
      setSelectedVehicleIdForAlert(alert.vehicleId);
      setPrefilledMaintenanceType(alert.maintenanceName);
      setCurrentView('vehicle-detail');
    };

    return (
      <motion.div 
        className="min-h-screen bg-black"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransitions}
      >
        <Suspense fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <LoadingSpinner size="lg" message="Chargement..." />
          </div>
        }>
          <UpcomingMaintenance
            alerts={alerts}
            onAlertClick={handleAlertClick}
            onBack={() => setCurrentView('main')}
          />
        </Suspense>
      </motion.div>
    );
  }

  // Handle vehicle detail view from alert
  if (currentView === 'vehicle-detail' && selectedVehicleIdForAlert) {
    const vehicle = vehicles.find(v => v.id === selectedVehicleIdForAlert);
    if (vehicle) {
      return (
        <motion.div 
          className="min-h-screen bg-black"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageTransitions}
        >
          <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
              <LoadingSpinner size="lg" message="Chargement..." />
            </div>
          }>
            <VehicleDetail
              vehicle={vehicle}
              onBack={() => {
                setCurrentView('main');
                setSelectedVehicleIdForAlert(null);
                setPrefilledMaintenanceType(null);
              }}
              prefilledMaintenanceType={prefilledMaintenanceType}
            />
          </Suspense>
        </motion.div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        <Suspense fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <LoadingSpinner size="lg" message="Chargement..." />
          </div>
        }>
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransitions}
            >
              <Dashboard
                onLogout={handleLogout}
                onViewAlerts={() => setCurrentView('upcoming-alerts')}
                onViewTasks={() => setActiveTab('tasks')}
                onViewVehicles={() => setActiveTab('vehicles')}
              />
            </motion.div>
          )}
          {activeTab === 'vehicles' && (
            <motion.div
              key="vehicles"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransitions}
            >
              <VehicleList />
            </motion.div>
          )}
          {activeTab === 'maintenance' && (
            <motion.div
              key="maintenance"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransitions}
            >
              <MaintenanceLog />
            </motion.div>
          )}
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransitions}
            >
              <TaskList />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransitions}
            >
              <Settings onLogout={handleLogout} />
            </motion.div>
          )}
        </Suspense>
      </AnimatePresence>
      
      {/* Hide bottom nav for admin */}
      {!currentProfile?.isAdmin && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
      
      {/* Admin only has settings */}
      {currentProfile?.isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800">
          <div className="max-w-md mx-auto px-6 h-20 flex items-center justify-center">
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium active:scale-95 transition-all"
            >
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
    <AppProvider>
      <ErrorBoundary>
        <AuthWrapper>
          <AppContent />
        </AuthWrapper>
      </ErrorBoundary>
    </AppProvider>
  );
}