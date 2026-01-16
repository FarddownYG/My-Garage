import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { AppState, Profile, Vehicle, MaintenanceEntry, Reminder, Task, MaintenanceTemplate, MaintenanceRecord } from '../types';
import { loadEncryptedFromStorage, exportEncryptedJSON, importEncryptedJSON } from '../utils/encryption';
import { sanitizeInput } from '../utils/security';
import { defaultMaintenanceTemplates } from '../data/defaultMaintenanceTemplates';
import { supabase } from '../utils/supabase';

interface AppContextType extends AppState {
  maintenances: MaintenanceRecord[];
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
  maintenanceTemplates: defaultMaintenanceTemplates,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 MIGRATION localStorage → Supabase (automatique au premier lancement)
  const migrateToSupabase = async () => {
    try {
      const localData = await loadEncryptedFromStorage('valcar-app-state-encrypted-v4');
      if (!localData?.profiles?.length) return;

      const { data: existing } = await supabase.from('profiles').select('id').limit(1);
      if (existing?.length) return;

      console.log('🚀 Migration localStorage → Supabase...');
      
      if (localData.profiles?.length) {
        await supabase.from('profiles').insert(localData.profiles.map(p => ({
          id: p.id, first_name: p.firstName, last_name: p.lastName, name: p.name,
          avatar: p.avatar, is_pin_protected: p.isPinProtected, pin: p.pin || null, is_admin: p.isAdmin || false
        })));
      }
      
      if (localData.vehicles?.length) {
        await supabase.from('vehicles').insert(localData.vehicles.map(v => ({
          id: v.id, name: v.name, photo: v.photo, mileage: v.mileage, brand: v.brand || null,
          model: v.model || null, year: v.year || null, license_plate: v.licensePlate || null,
          vin: v.vin || null, owner_id: v.ownerId, fuel_type: v.fuelType || null, drive_type: v.driveType || '4x2'
        })));
      }
      
      if (localData.maintenanceEntries?.length) {
        await supabase.from('maintenance_entries').insert(localData.maintenanceEntries.map(e => ({
          id: e.id, vehicle_id: e.vehicleId, type: typeof e.type === 'string' ? e.type : 'other',
          custom_type: e.customType || null, custom_icon: e.customIcon || null, date: e.date,
          mileage: e.mileage, cost: e.cost || null, notes: e.notes || null, photos: e.photos || null
        })));
      }
      
      if (localData.tasks?.length) {
        await supabase.from('tasks').insert(localData.tasks.map(t => ({
          id: t.id, vehicle_id: t.vehicleId, title: t.title, description: t.description || null, completed: t.completed
        })));
      }
      
      if (localData.reminders?.length) {
        await supabase.from('reminders').insert(localData.reminders.map(r => ({
          id: r.id, vehicle_id: r.vehicleId, type: r.type, due_date: r.dueDate || null,
          due_mileage: r.dueMileage || null, status: r.status, description: r.description
        })));
      }
      
      await supabase.from('app_config').upsert({
        id: 'global', admin_pin: localData.adminPin || '1234', current_profile_id: localData.currentProfile?.id || null
      });
      
      console.log('✅ Migration terminée !');
      localStorage.removeItem('valcar-app-state-encrypted-v4');
    } catch (error) {
      console.error('Erreur migration:', error);
    }
  };

  // 📥 CHARGEMENT depuis Supabase
  const loadFromSupabase = async () => {
    try {
      const { data: config } = await supabase.from('app_config').select('*').eq('id', 'global').single();
      const { data: profiles } = await supabase.from('profiles').select('*').order('name');
      const { data: vehicles } = await supabase.from('vehicles').select('*').order('name');
      const { data: maintenanceEntries } = await supabase.from('maintenance_entries').select('*').order('date', { ascending: false });
      const { data: tasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const { data: reminders } = await supabase.from('reminders').select('*').order('created_at', { ascending: false });

      let currentProfile = null;
      if (config?.current_profile_id && profiles) {
        const p = profiles.find(p => p.id === config.current_profile_id);
        if (p) currentProfile = { id: p.id, firstName: p.first_name, lastName: p.last_name, name: p.name,
          avatar: p.avatar, isPinProtected: p.is_pin_protected, pin: p.pin || undefined, isAdmin: p.is_admin };
      }

      setState({
        adminPin: config?.admin_pin || '1234',
        currentProfile,
        profiles: (profiles || []).map(p => ({ id: p.id, firstName: p.first_name, lastName: p.last_name, name: p.name,
          avatar: p.avatar, isPinProtected: p.is_pin_protected, pin: p.pin || undefined, isAdmin: p.is_admin })),
        vehicles: (vehicles || []).map(v => ({ id: v.id, name: v.name, photo: v.photo, mileage: v.mileage,
          brand: v.brand || undefined, model: v.model || undefined, year: v.year || undefined,
          licensePlate: v.license_plate || undefined, vin: v.vin || undefined, ownerId: v.owner_id, 
          fuelType: v.fuel_type || undefined, driveType: v.drive_type || undefined })),
        maintenanceEntries: (maintenanceEntries || []).map(e => ({ id: e.id, vehicleId: e.vehicle_id, type: e.type as any,
          customType: e.custom_type || undefined, customIcon: e.custom_icon || undefined, date: e.date,
          mileage: e.mileage, cost: e.cost || undefined, notes: e.notes || undefined, photos: e.photos || undefined })),
        tasks: (tasks || []).map(t => ({ id: t.id, vehicleId: t.vehicle_id, title: t.title,
          description: t.description || undefined, completed: t.completed, createdAt: t.created_at })),
        reminders: (reminders || []).map(r => ({ id: r.id, vehicleId: r.vehicle_id, type: r.type,
          dueDate: r.due_date || undefined, dueMileage: r.due_mileage || undefined, status: r.status as any, description: r.description })),
        maintenanceTemplates: defaultMaintenanceTemplates,
      });
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await migrateToSupabase();
      await loadFromSupabase();
      setIsLoading(false);
    };
    init();
  }, []);

  const setCurrentProfile = async (profile: Profile | null) => {
    setState(prev => ({ ...prev, currentProfile: profile }));
    await supabase.from('app_config').upsert({ id: 'global', admin_pin: state.adminPin, current_profile_id: profile?.id || null });
  };

  const addProfile = async (profile: Profile) => {
    const s = { ...profile, firstName: sanitizeInput(profile.firstName), lastName: sanitizeInput(profile.lastName), name: sanitizeInput(profile.name) };
    await supabase.from('profiles').insert({ id: s.id, first_name: s.firstName, last_name: s.lastName, name: s.name,
      avatar: s.avatar, is_pin_protected: s.isPinProtected, pin: s.pin || null, is_admin: s.isAdmin || false });
    setState(prev => ({ ...prev, profiles: [...prev.profiles, s] }));
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    const s = { ...updates };
    if (updates.firstName) s.firstName = sanitizeInput(updates.firstName);
    if (updates.lastName) s.lastName = sanitizeInput(updates.lastName);
    if (updates.name) s.name = sanitizeInput(updates.name);
    const db: any = {};
    if (s.firstName) db.first_name = s.firstName;
    if (s.lastName) db.last_name = s.lastName;
    if (s.name) db.name = s.name;
    if (s.avatar) db.avatar = s.avatar;
    if (s.isPinProtected !== undefined) db.is_pin_protected = s.isPinProtected;
    if (s.pin !== undefined) db.pin = s.pin;
    if (s.isAdmin !== undefined) db.is_admin = s.isAdmin;
    await supabase.from('profiles').update(db).eq('id', id);
    setState(prev => ({ ...prev, profiles: prev.profiles.map(p => p.id === id ? { ...p, ...s } : p) }));
  };

  const deleteProfile = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    setState(prev => ({ ...prev, profiles: prev.profiles.filter(p => p.id !== id) }));
  };

  const addVehicle = async (vehicle: Vehicle) => {
    const s = { ...vehicle, name: sanitizeInput(vehicle.name), brand: vehicle.brand ? sanitizeInput(vehicle.brand) : vehicle.brand,
      model: vehicle.model ? sanitizeInput(vehicle.model) : vehicle.model };
    await supabase.from('vehicles').insert({ id: s.id, name: s.name, photo: s.photo, mileage: s.mileage,
      brand: s.brand || null, model: s.model || null, year: s.year || null, license_plate: s.licensePlate || null,
      vin: s.vin || null, owner_id: s.ownerId, fuel_type: s.fuelType || null, drive_type: s.driveType || null });
    setState(prev => ({ ...prev, vehicles: [...prev.vehicles, s] }));
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const s = { ...updates };
    if (updates.name) s.name = sanitizeInput(updates.name);
    if (updates.brand) s.brand = sanitizeInput(updates.brand);
    if (updates.model) s.model = sanitizeInput(updates.model);
    const db: any = {};
    if (s.name) db.name = s.name;
    if (s.photo) db.photo = s.photo;
    if (s.mileage !== undefined) db.mileage = s.mileage;
    if (s.brand) db.brand = s.brand;
    if (s.model) db.model = s.model;
    if (s.year) db.year = s.year;
    if (s.licensePlate) db.license_plate = s.licensePlate;
    if (s.vin) db.vin = s.vin;
    if (s.fuelType) db.fuel_type = s.fuelType;
    if (s.driveType) db.drive_type = s.driveType;
    await supabase.from('vehicles').update(db).eq('id', id);
    setState(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...s } : v) }));
  };

  const deleteVehicle = async (id: string) => {
    await supabase.from('vehicles').delete().eq('id', id);
    setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id),
      maintenanceEntries: prev.maintenanceEntries.filter(e => e.vehicleId !== id),
      reminders: prev.reminders.filter(r => r.vehicleId !== id),
      tasks: prev.tasks.filter(t => t.vehicleId !== id) }));
  };

  const addMaintenanceEntry = async (entry: MaintenanceEntry) => {
    await supabase.from('maintenance_entries').insert({ id: entry.id, vehicle_id: entry.vehicleId,
      type: typeof entry.type === 'string' ? entry.type : 'other', custom_type: entry.customType || null,
      custom_icon: entry.customIcon || null, date: entry.date, mileage: entry.mileage,
      cost: entry.cost || null, notes: entry.notes || null, photos: entry.photos || null });
    setState(prev => ({ ...prev, maintenanceEntries: [...prev.maintenanceEntries, entry] }));
  };

  const updateMaintenanceEntry = async (id: string, updates: Partial<MaintenanceEntry>) => {
    const db: any = {};
    if (updates.type) db.type = typeof updates.type === 'string' ? updates.type : 'other';
    if (updates.customType !== undefined) db.custom_type = updates.customType;
    if (updates.customIcon !== undefined) db.custom_icon = updates.customIcon;
    if (updates.date) db.date = updates.date;
    if (updates.mileage !== undefined) db.mileage = updates.mileage;
    if (updates.cost !== undefined) db.cost = updates.cost;
    if (updates.notes !== undefined) db.notes = updates.notes;
    if (updates.photos !== undefined) db.photos = updates.photos;
    await supabase.from('maintenance_entries').update(db).eq('id', id);
    setState(prev => ({ ...prev, maintenanceEntries: prev.maintenanceEntries.map(e => e.id === id ? { ...e, ...updates } : e) }));
  };

  const deleteMaintenanceEntry = async (id: string) => {
    await supabase.from('maintenance_entries').delete().eq('id', id);
    setState(prev => ({ ...prev, maintenanceEntries: prev.maintenanceEntries.filter(e => e.id !== id) }));
  };

  const addReminder = async (reminder: Reminder) => {
    await supabase.from('reminders').insert({ id: reminder.id, vehicle_id: reminder.vehicleId, type: reminder.type,
      due_date: reminder.dueDate || null, due_mileage: reminder.dueMileage || null,
      status: reminder.status, description: reminder.description });
    setState(prev => ({ ...prev, reminders: [...prev.reminders, reminder] }));
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const db: any = {};
    if (updates.type) db.type = updates.type;
    if (updates.dueDate !== undefined) db.due_date = updates.dueDate;
    if (updates.dueMileage !== undefined) db.due_mileage = updates.dueMileage;
    if (updates.status) db.status = updates.status;
    if (updates.description) db.description = updates.description;
    await supabase.from('reminders').update(db).eq('id', id);
    setState(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === id ? { ...r, ...updates } : r) }));
  };

  const deleteReminder = async (id: string) => {
    await supabase.from('reminders').delete().eq('id', id);
    setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
  };

  const addTask = async (task: Task) => {
    const s = { ...task, title: sanitizeInput(task.title), description: task.description ? sanitizeInput(task.description) : undefined };
    await supabase.from('tasks').insert({ id: s.id, vehicle_id: s.vehicleId, title: s.title,
      description: s.description || null, completed: s.completed });
    setState(prev => ({ ...prev, tasks: [...prev.tasks, s] }));
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const db: any = {};
    if (updates.title) db.title = updates.title;
    if (updates.description !== undefined) db.description = updates.description;
    if (updates.completed !== undefined) db.completed = updates.completed;
    await supabase.from('tasks').update(db).eq('id', id);
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  const toggleTaskComplete = async (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', id);
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t) }));
  };

  const addMaintenanceTemplate = (template: MaintenanceTemplate) => {
    setState(prev => ({ ...prev, maintenanceTemplates: [...prev.maintenanceTemplates, template] }));
  };

  const updateMaintenanceTemplate = (id: string, updates: Partial<MaintenanceTemplate>) => {
    setState(prev => ({ ...prev, maintenanceTemplates: prev.maintenanceTemplates.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteMaintenanceTemplate = (id: string) => {
    setState(prev => ({ ...prev, maintenanceTemplates: prev.maintenanceTemplates.filter(t => t.id !== id) }));
  };

  const updateAdminPin = async (newPin: string) => {
    await supabase.from('app_config').upsert({ id: 'global', admin_pin: newPin, current_profile_id: state.currentProfile?.id || null });
    setState(prev => ({ ...prev, adminPin: newPin }));
  };

  const resetData = async () => {
    await supabase.from('tasks').delete().neq('id', '');
    await supabase.from('reminders').delete().neq('id', '');
    await supabase.from('maintenance_entries').delete().neq('id', '');
    await supabase.from('vehicles').delete().neq('id', '');
    await supabase.from('profiles').delete().neq('id', '');
    await supabase.from('app_config').delete().eq('id', 'global');
    setState(defaultState);
  };

  const exportData = async () => {
    await exportEncryptedJSON(state, `valcar-backup-${new Date().toISOString().split('T')[0]}.json`);
  };

  const importData = async (file: File) => {
    const imported = await importEncryptedJSON(file);
    setState(imported);
  };

  const maintenances: MaintenanceRecord[] = useMemo(() => {
    return state.maintenanceEntries.map(entry => {
      const template = state.maintenanceTemplates.find(t => t.name === (entry.customType || entry.type));
      return { id: entry.id, vehicleId: entry.vehicleId, type: entry.customType || (typeof entry.type === 'string' ? entry.type : 'other'),
        date: entry.date, mileage: entry.mileage, intervalKm: template?.intervalKm, intervalMonths: template?.intervalMonths,
        cost: entry.cost, notes: entry.notes };
    });
  }, [state.maintenanceEntries, state.maintenanceTemplates]);

  return (
    <AppContext.Provider value={{ ...state, maintenances, setCurrentProfile, addProfile, updateProfile, deleteProfile,
      addVehicle, updateVehicle, deleteVehicle, addMaintenanceEntry, updateMaintenanceEntry, deleteMaintenanceEntry,
      addReminder, updateReminder, deleteReminder, addTask, updateTask, deleteTask, toggleTaskComplete,
      addMaintenanceTemplate, updateMaintenanceTemplate, deleteMaintenanceTemplate, updateAdminPin,
      resetData, exportData, importData, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}