import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { Dashboard } from './components/home/Dashboard';
import { VehicleList } from './components/vehicles/VehicleList';
import { VehicleDetail } from './components/vehicles/VehicleDetail';
import { MaintenanceLog } from './components/maintenance/MaintenanceLog';
import { UpcomingMaintenance } from './components/maintenance/UpcomingMaintenance';
import { TaskList } from './components/tasks/TaskList';
import { Settings } from './components/settings/Settings';
import { BottomNav } from './components/shared/BottomNav';
import type { UpcomingAlert } from './types';
import { initializeSecurity } from './utils/security';
import { calculateUpcomingAlerts } from './utils/alerts';
import './utils/hotReloadHandler'; // 🔥 Import hot-reload handler

// v1.2.0 - Supabase Auth Only (plus de sélection de profils)
type AppTab = 'home' | 'vehicles' | 'maintenance' | 'tasks' | 'settings';
type AppView = 'main' | 'upcoming-alerts' | 'vehicle-detail';

function AppContent() {
  const { currentProfile, setCurrentProfile, isLoading, vehicles, maintenances, maintenanceTemplates, maintenanceProfiles, signOut } = useApp();
  
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const savedTab = localStorage.getItem('valcar-active-tab');
    return (savedTab as AppTab) || 'home';
  });

  // View management for nested screens
  const [currentView, setCurrentView] = useState<AppView>('main');
  const [selectedVehicleIdForAlert, setSelectedVehicleIdForAlert] = useState<string | null>(null);
  const [prefilledMaintenanceType, setPrefilledMaintenanceType] = useState<string | null>(null);

  // Calculate alerts
  const userVehicles = useMemo(() => 
    vehicles.filter(v => v.ownerId === currentProfile?.id),
    [vehicles, currentProfile?.id]
  );
  
  const alerts = useMemo(() => {
    console.log('🔄 Recalcul des alertes...', {
      vehicles: userVehicles.length,
      maintenances: maintenances.length,
      templates: maintenanceTemplates.length,
      profiles: maintenanceProfiles.length,
    });
    return calculateUpcomingAlerts(userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles);
  }, [userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles]);
  
  // Apply font size globally via CSS variable (seulement si un profil est connecté)
  useEffect(() => {
    if (currentProfile) {
      const fontSize = currentProfile.fontSize || 50;
      document.documentElement.style.setProperty('--font-size-scale', `${fontSize}%`);
      console.log('🔤 Taille de police appliquée:', `${fontSize}%`);
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
      <div className="min-h-screen bg-black">
        <UpcomingMaintenance
          alerts={alerts}
          onAlertClick={handleAlertClick}
          onBack={() => setCurrentView('main')}
        />
      </div>
    );
  }

  // Handle vehicle detail view from alert
  if (currentView === 'vehicle-detail' && selectedVehicleIdForAlert) {
    const vehicle = vehicles.find(v => v.id === selectedVehicleIdForAlert);
    if (vehicle) {
      return (
        <div className="min-h-screen bg-black">
          <VehicleDetail
            vehicle={vehicle}
            onBack={() => {
              setCurrentView('main');
              setSelectedVehicleIdForAlert(null);
              setPrefilledMaintenanceType(null);
            }}
            prefilledMaintenanceType={prefilledMaintenanceType}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {activeTab === 'home' && (
        <Dashboard
          onLogout={handleLogout}
          onViewAlerts={() => setCurrentView('upcoming-alerts')}
          onViewTasks={() => setActiveTab('tasks')}
          onViewVehicles={() => setActiveTab('vehicles')}
        />
      )}
      {activeTab === 'vehicles' && <VehicleList />}
      {activeTab === 'maintenance' && <MaintenanceLog />}
      {activeTab === 'tasks' && <TaskList />}
      {activeTab === 'settings' && <Settings onLogout={handleLogout} />}
      
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