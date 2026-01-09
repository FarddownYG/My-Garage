import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { AppState, Profile, Vehicle, MaintenanceEntry, Reminder, Task, MaintenanceTemplate, MaintenanceRecord } from '../types';
import { saveEncryptedToStorage, loadEncryptedFromStorage, exportEncryptedJSON, importEncryptedJSON } from '../utils/encryption';
import { sanitizeInput } from '../utils/security';
import { defaultMaintenanceTemplates } from '../data/defaultMaintenanceTemplates';

interface AppContextType extends AppState {
  maintenances: MaintenanceRecord[]; // Calculé dynamiquement
  setCurrentProfile: (profile: Profile | null) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, profile: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  addMaintenanceEntry: (entry: MaintenanceEntry) => void;
  updateMaintenanceEntry: (id: string, entry: Partial<MaintenanceEntry>) => void;
  deleteMaintenanceEntry: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  addMaintenanceTemplate: (template: MaintenanceTemplate) => void;
  updateMaintenanceTemplate: (id: string, template: Partial<MaintenanceTemplate>) => void;
  deleteMaintenanceTemplate: (id: string) => void;
  updateAdminPin: (newPin: string) => void;
  resetData: () => void;
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<void>;
  isLoading: boolean;
}

const defaultState: AppState = {
  adminPin: '1234',
  profiles: [],
  currentProfile: null,
  vehicles: [],
  maintenanceEntries: [],
  reminders: [],
  tasks: [],
  maintenanceTemplates: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load encrypted data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Chargement des données cryptées...');
        console.log('🌍 Environnement:', window.location.href);
        const loaded = await loadEncryptedFromStorage('valcar-app-state-encrypted-v4'); // v4 pour forcer reload templates
        
        if (loaded) {
          console.log('📦 Données décryptées:', {
            profiles: loaded.profiles?.length || 0,
            vehicles: loaded.vehicles?.length || 0,
            currentProfile: loaded.currentProfile?.name || 'Aucun',
            templates: loaded.maintenanceTemplates?.length || 0,
          });
          
          // Migration: add firstName and lastName to old profiles
          if (loaded.profiles) {
            loaded.profiles = loaded.profiles.map((profile: any) => {
              if (!profile.firstName || !profile.lastName) {
                const nameParts = (profile.name || '').split(' ');
                return {
                  ...profile,
                  firstName: nameParts[0] || 'User',
                  lastName: nameParts.slice(1).join(' ') || '',
                  name: profile.name || 'User',
                };
              }
              return profile;
            });
          }
          
          // TOUJOURS charger les templates par défaut (35 templates essence/diesel)
          loaded.maintenanceTemplates = defaultMaintenanceTemplates;
          console.log('✅ Templates d\'entretien par défaut chargés (v4):', defaultMaintenanceTemplates.length);
          
          setState(loaded);
          console.log('✅ État restauré avec succès');
        } else {
          console.log('✨ Aucune donnée sauvegardée - initialisation avec templates par défaut');
          // Initialize with default templates
          setState(prev => ({
            ...prev,
            maintenanceTemplates: defaultMaintenanceTemplates,
          }));
          console.log('✅ Templates d\'entretien par défaut chargés:', defaultMaintenanceTemplates.length);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        // On error, still load default templates
        setState(prev => ({
          ...prev,
          maintenanceTemplates: defaultMaintenanceTemplates,
        }));
        console.log('✅ Templates d\'entretien par défaut chargés (fallback):', defaultMaintenanceTemplates.length);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  // Save encrypted data whenever state changes (but not on first load)
  useEffect(() => {
    if (!isInitialized) return;

    const saveData = async () => {
      try {
        await saveEncryptedToStorage('valcar-app-state-encrypted-v4', state);
        console.log('💾 État actuel sauvegardé:', {
          profiles: state.profiles.length,
          vehicles: state.vehicles.length,
          currentProfile: state.currentProfile?.name || 'Aucun',
          templates: state.maintenanceTemplates?.length || 0,
        });
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
      }
    };

    saveData();
  }, [state, isInitialized]);

  const setCurrentProfile = (profile: Profile | null) => {
    setState(prev => ({ ...prev, currentProfile: profile }));
  };

  const addProfile = (profile: Profile) => {
    // Sanitize profile data
    const sanitized = {
      ...profile,
      firstName: sanitizeInput(profile.firstName),
      lastName: sanitizeInput(profile.lastName),
      name: sanitizeInput(profile.name),
    };
    setState(prev => ({ ...prev, profiles: [...prev.profiles, sanitized] }));
  };

  const updateProfile = (id: string, updates: Partial<Profile>) => {
    // Sanitize updates
    const sanitized = { ...updates };
    if (updates.firstName) sanitized.firstName = sanitizeInput(updates.firstName);
    if (updates.lastName) sanitized.lastName = sanitizeInput(updates.lastName);
    if (updates.name) sanitized.name = sanitizeInput(updates.name);
    
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => (p.id === id ? { ...p, ...sanitized } : p)),
    }));
  };

  const deleteProfile = (id: string) => {
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.filter(p => p.id !== id),
    }));
  };

  const addVehicle = (vehicle: Vehicle) => {
    // Sanitize vehicle data
    const sanitized = {
      ...vehicle,
      name: sanitizeInput(vehicle.name),
      brand: vehicle.brand ? sanitizeInput(vehicle.brand) : vehicle.brand,
      model: vehicle.model ? sanitizeInput(vehicle.model) : vehicle.model,
    };
    setState(prev => ({ ...prev, vehicles: [...prev.vehicles, sanitized] }));
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    // Sanitize updates
    const sanitized = { ...updates };
    if (updates.name) sanitized.name = sanitizeInput(updates.name);
    if (updates.brand) sanitized.brand = sanitizeInput(updates.brand);
    if (updates.model) sanitized.model = sanitizeInput(updates.model);
    
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => (v.id === id ? { ...v, ...sanitized } : v)),
    }));
  };

  const deleteVehicle = (id: string) => {
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id),
      maintenanceEntries: prev.maintenanceEntries.filter(e => e.vehicleId !== id),
      reminders: prev.reminders.filter(r => r.vehicleId !== id),
      tasks: prev.tasks.filter(t => t.vehicleId !== id),
    }));
  };

  const addMaintenanceEntry = (entry: MaintenanceEntry) => {
    setState(prev => ({ ...prev, maintenanceEntries: [...prev.maintenanceEntries, entry] }));
  };

  const updateMaintenanceEntry = (id: string, updates: Partial<MaintenanceEntry>) => {
    setState(prev => ({
      ...prev,
      maintenanceEntries: prev.maintenanceEntries.map(e => (e.id === id ? { ...e, ...updates } : e)),
    }));
  };

  const deleteMaintenanceEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      maintenanceEntries: prev.maintenanceEntries.filter(e => e.id !== id),
    }));
  };

  const addReminder = (reminder: Reminder) => {
    setState(prev => ({ ...prev, reminders: [...prev.reminders, reminder] }));
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const deleteReminder = (id: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== id),
    }));
  };

  const addTask = (task: Task) => {
    // Sanitize task data
    const sanitized = {
      ...task,
      title: sanitizeInput(task.title),
      description: task.description ? sanitizeInput(task.description) : undefined,
    };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, sanitized] }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
    }));
  };

  const toggleTaskComplete = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  };

  const addMaintenanceTemplate = (template: MaintenanceTemplate) => {
    setState(prev => ({ ...prev, maintenanceTemplates: [...prev.maintenanceTemplates, template] }));
  };

  const updateMaintenanceTemplate = (id: string, updates: Partial<MaintenanceTemplate>) => {
    setState(prev => ({
      ...prev,
      maintenanceTemplates: prev.maintenanceTemplates.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteMaintenanceTemplate = (id: string) => {
    setState(prev => ({
      ...prev,
      maintenanceTemplates: prev.maintenanceTemplates.filter(t => t.id !== id),
    }));
  };

  const updateAdminPin = (newPin: string) => {
    setState(prev => ({ ...prev, adminPin: newPin }));
  };

  const resetData = () => {
    setState(defaultState);
    localStorage.removeItem('valcar-app-state');
  };

  const exportData = async () => {
    try {
      await exportEncryptedJSON(state, `valcar-backup-${new Date().toISOString().split('T')[0]}.json`);
      console.log('✅ Export réussi');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      throw error;
    }
  };

  const importData = async (file: File) => {
    try {
      const imported = await importEncryptedJSON(file);
      setState(imported);
      console.log('✅ Import réussi');
    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      throw error;
    }
  };

  // Calculer les maintenances dynamiquement
  const maintenances: MaintenanceRecord[] = useMemo(() => {
    console.log('🔄 [Context] Recalcul des maintenances...', {
      entries: state.maintenanceEntries.length,
      templates: state.maintenanceTemplates.length,
    });
    return state.maintenanceEntries.map(entry => {
      // Trouver le template correspondant pour obtenir intervalKm et intervalMonths
      const template = state.maintenanceTemplates.find(t => t.name === (entry.customType || entry.type));
      
      return {
        id: entry.id,
        vehicleId: entry.vehicleId,
        type: entry.customType || (typeof entry.type === 'string' ? entry.type : 'other'),
        date: entry.date,
        mileage: entry.mileage,
        intervalKm: template?.intervalKm,
        intervalMonths: template?.intervalMonths,
        cost: entry.cost,
        notes: entry.notes,
      };
    });
  }, [state.maintenanceEntries, state.maintenanceTemplates]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        maintenances,
        setCurrentProfile,
        addProfile,
        updateProfile,
        deleteProfile,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addMaintenanceEntry,
        updateMaintenanceEntry,
        deleteMaintenanceEntry,
        addReminder,
        updateReminder,
        deleteReminder,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addMaintenanceTemplate,
        updateMaintenanceTemplate,
        deleteMaintenanceTemplate,
        updateAdminPin,
        resetData,
        exportData,
        importData,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}