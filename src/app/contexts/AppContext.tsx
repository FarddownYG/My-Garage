import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { AppState, Profile, Vehicle, MaintenanceEntry, Reminder, Task, MaintenanceTemplate, MaintenanceRecord, MaintenanceProfile, SupabaseUser } from '../types';
import { loadEncryptedFromStorage, exportEncryptedJSON, importEncryptedJSON } from '../utils/encryption';
import { sanitizeInput } from '../utils/security';
import { defaultMaintenanceTemplates } from '../data/defaultMaintenanceTemplates';
import { supabase } from '../utils/supabase';
import { migrateProfileIds, checkMigrationNeeded } from '../utils/migrateProfileIds';
import { getCurrentUser, onAuthStateChange, signOut as authSignOut } from '../utils/auth';
import { getProfilesByUser } from '../utils/migration';

// v1.2.0 - Supabase Auth integration
interface AppContextType extends AppState {
  maintenances: MaintenanceRecord[];
  getUserVehicles: () => Vehicle[]; // 🔧 Nouvelle fonction pour filtrer par user_id
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
  addMaintenanceProfile: (profile: MaintenanceProfile) => void;
  updateMaintenanceProfile: (id: string, profile: Partial<MaintenanceProfile>) => void;
  deleteMaintenanceProfile: (id: string) => void;
  updateAdminPin: (newPin: string) => Promise<void>;
  updateFontSize: (fontSize: number) => Promise<void>;
  resetData: () => void;
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<void>;
  isLoading: boolean;
  // Auth functions
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
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
  maintenanceProfiles: [],
  // Auth state
  supabaseUser: null,
  isAuthenticated: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// 🔥 Hot-reload protection: Create a global reference to preserve context during dev reloads
if (typeof window !== 'undefined') {
  (window as any).__APP_CONTEXT_INSTANCE__ = AppContext;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // 🔥 Prevent hot-reload errors by tracking mount state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // 🔄 MIGRATION localStorage → Supabase (automatique au premier lancement)
  const migrateToSupabase = async () => {
    try {
      const localData = await loadEncryptedFromStorage('valcar-app-state-encrypted-v4');
      if (!localData?.profiles?.length) return;

      // Vérifier session avant de faire des requêtes
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('ℹ️ Migration Supabase ignorée (pas de session)');
        return;
      }

      const { data: existing, error } = await supabase.from('profiles').select('id').limit(1);
      if (error || existing?.length) return;

      console.log('🚀 Migration localStorage → Supabase...');
      
      if (localData.profiles?.length) {
        await supabase.from('profiles').insert(localData.profiles.map(p => ({
          id: p.id, 
          first_name: p.firstName, 
          last_name: p.lastName || '', // ✅ Chaîne vide au lieu de null
          name: p.name,
          avatar: p.avatar, 
          is_pin_protected: p.isPinProtected, 
          pin: p.pin || null, 
          is_admin: p.isAdmin || false
        })));
        
        // Migrer les templates pour chaque profil
        if (localData.maintenanceTemplates?.length) {
          const templatesWithOwner = localData.profiles.flatMap(profile => 
            localData.maintenanceTemplates.map(t => ({
              id: `${t.id}-${profile.id}`,
              name: t.name,
              icon: t.icon,
              category: t.category || null,
              interval_months: t.intervalMonths || null,
              interval_km: t.intervalKm || null,
              fuel_type: t.fuelType || null,
              drive_type: t.driveType || null,
              owner_id: profile.id
            }))
          );
          await supabase.from('maintenance_templates').insert(templatesWithOwner);
        }
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
          id: t.id, vehicle_id: t.vehicleId, title: t.title, description: t.description || null, links: t.links || null, completed: t.completed
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
      }, { onConflict: 'id' });
      
      console.log('✅ Migration localStorage → Supabase terminée !');
      localStorage.removeItem('valcar-app-state-encrypted-v4');
    } catch (error) {
      // Échec silencieux - migration pas critique
      console.log('ℹ️ Migration localStorage ignorée (pas de session ou déjà migrée)');
    }
  };

  // 📥 CHARGEMENT depuis Supabase
  const loadFromSupabase = async () => {
    try {
      // Vérifier session avant de charger
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('ℹ️ Chargement Supabase ignoré (pas de session)');
        // Charger valeurs par défaut
        setState(prev => ({
          ...prev,
          adminPin: '1234',
          profiles: [],
          vehicles: [],
          maintenanceEntries: [],
          tasks: [],
          reminders: [],
          maintenanceTemplates: [],
          maintenanceProfiles: [],
        }));
        return;
      }

      const userId = session.user.id;

      // 🔧 OPTIMISATION MULTI-USERS : Charger UNIQUEMENT les données de l'utilisateur connecté
      const { data: config, error: configError } = await supabase.from('app_config').select('*').eq('id', 'global').maybeSingle();
      
      // ✅ Charger UNIQUEMENT les profils de cet utilisateur
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      
      // ✅ Charger les véhicules UNIQUEMENT pour les profils de cet utilisateur
      // Récupérer d'abord les profile_ids de l'utilisateur
      const userProfileIds = (profiles || []).map(p => p.id);
      
      const { data: vehicles, error: vehiclesError } = userProfileIds.length > 0
        ? await supabase.from('vehicles').select('*').in('owner_id', userProfileIds).order('name')
        : { data: [], error: null };
      
      // Récupérer les vehicle_ids de l'utilisateur pour filtrer les autres tables
      const userVehicleIds = (vehicles || []).map(v => v.id);
      
      // ✅ Charger UNIQUEMENT les données liées aux véhicules de l'utilisateur
      const { data: maintenanceEntries, error: entriesError } = userVehicleIds.length > 0
        ? await supabase.from('maintenance_entries').select('*').in('vehicle_id', userVehicleIds).order('date', { ascending: false })
        : { data: [], error: null };
        
      const { data: tasks, error: tasksError } = userVehicleIds.length > 0
        ? await supabase.from('tasks').select('*').in('vehicle_id', userVehicleIds).order('created_at', { ascending: false })
        : { data: [], error: null };
        
      const { data: reminders, error: remindersError } = userVehicleIds.length > 0
        ? await supabase.from('reminders').select('*').in('vehicle_id', userVehicleIds).order('created_at', { ascending: false })
        : { data: [], error: null };
      
      // ✅ Charger UNIQUEMENT les templates et profils d'entretien de l'utilisateur
      const { data: templates, error: templatesError } = userProfileIds.length > 0
        ? await supabase.from('maintenance_templates').select('*').in('owner_id', userProfileIds).order('name')
        : { data: [], error: null };
        
      const { data: maintenanceProfiles, error: maintenanceProfilesError } = userProfileIds.length > 0
        ? await supabase.from('maintenance_profiles').select('*').in('owner_id', userProfileIds).order('name')
        : { data: [], error: null };

      // 🔍 DIAGNOSTIC : Afficher les erreurs
      if (configError) console.log('⚠️ Erreur config:', configError.message);
      if (profilesError) console.error('❌ Erreur profils:', profilesError.message);
      if (vehiclesError) console.log('⚠️ Erreur véhicules:', vehiclesError.message);
      if (entriesError) console.log('⚠️ Erreur entretiens:', entriesError.message);
      if (tasksError) console.log('⚠️ Erreur tâches:', tasksError.message);
      if (remindersError) console.log('⚠️ Erreur rappels:', remindersError.message);
      if (templatesError) console.error('❌ Erreur templates:', templatesError.message, '→ Vérifiez que les colonnes profile_id et owner_id existent dans maintenance_templates');
      if (maintenanceProfilesError) console.error('❌ Erreur profils maintenance:', maintenanceProfilesError.message, '→ Vérifiez que les colonnes vehicle_ids, is_custom, owner_id existent dans maintenance_profiles');

      // 🔍 DIAGNOSTIC : Log des données chargées pour les profils perso
      const loadedMProfiles = maintenanceProfiles || [];
      const loadedTemplates = templates || [];
      const customProfileTemplates = loadedTemplates.filter((t: any) => t.profile_id);
      console.log(`📊 Chargement Supabase: ${loadedMProfiles.length} profils maintenance, ${loadedTemplates.length} templates (dont ${customProfileTemplates.length} liés à un profil perso)`);
      if (loadedMProfiles.length > 0) {
        loadedMProfiles.forEach((mp: any) => {
          const mpTemplates = loadedTemplates.filter((t: any) => t.profile_id === mp.id);
          console.log(`  → Profil "${mp.name}" (${mp.id}): ${mpTemplates.length} templates, véhicules: [${(mp.vehicle_ids || []).join(', ')}], is_custom: ${mp.is_custom}`);
        });
      }

      // 🔄 Préserver le profil actuel s'il existe déjà
      const currentProfileId = config?.current_profile_id;
      const savedProfile = currentProfileId 
        ? (profiles || []).find(p => p.id === currentProfileId) 
        : null;

      setState(prev => ({
        ...prev, // ✅ CRITIQUE : Préserver isAuthenticated et autres états
        adminPin: config?.admin_pin || '1234',
        currentProfile: savedProfile ? {
          id: savedProfile.id,
          firstName: savedProfile.first_name,
          lastName: savedProfile.last_name || '',
          name: savedProfile.last_name ? `${savedProfile.first_name} ${savedProfile.last_name}` : savedProfile.first_name,
          avatar: savedProfile.avatar,
          isPinProtected: savedProfile.is_pin_protected,
          pin: savedProfile.pin || undefined,
          isAdmin: savedProfile.is_admin,
          fontSize: 50,
          userId: savedProfile.user_id || undefined, // ✅ camelCase
        } : null,
        profiles: (profiles || []).map(p => ({ 
          id: p.id, 
          firstName: p.first_name, 
          lastName: p.last_name || '', 
          name: p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name, // Reconstruire le nom complet
          avatar: p.avatar, 
          isPinProtected: p.is_pin_protected, 
          pin: p.pin || undefined, 
          isAdmin: p.is_admin,
          fontSize: 50, // Taille par défaut (pas stockée dans Supabase pour l'instant)
          userId: p.user_id || undefined, // ✅ camelCase
        })),
        vehicles: (vehicles || []).map(v => ({ id: v.id, name: v.name, photo: v.photo, mileage: v.mileage,
          brand: v.brand || undefined, model: v.model || undefined, year: v.year || undefined,
          licensePlate: v.license_plate || undefined, vin: v.vin || undefined, ownerId: v.owner_id, 
          fuelType: v.fuel_type || undefined, driveType: v.drive_type || undefined,
          photos: v.photos || undefined, // Galerie photos
          documents: v.documents ? (typeof v.documents === 'string' ? JSON.parse(v.documents) : v.documents) : undefined })),
        maintenanceEntries: (maintenanceEntries || []).map(e => ({ id: e.id, vehicleId: e.vehicle_id, type: e.type as any,
          customType: e.custom_type || undefined, customIcon: e.custom_icon || undefined, date: e.date,
          mileage: e.mileage, cost: e.cost || undefined, notes: e.notes || undefined, photos: e.photos || undefined })),
        tasks: (tasks || []).map(t => ({ id: t.id, vehicleId: t.vehicle_id, title: t.title,
          description: t.description || undefined, links: t.links || undefined, completed: t.completed, createdAt: t.created_at })),
        reminders: (reminders || []).map(r => ({ id: r.id, vehicleId: r.vehicle_id, type: r.type,
          dueDate: r.due_date || undefined, dueMileage: r.due_mileage || undefined, status: r.status as any, description: r.description })),
        maintenanceTemplates: (templates || []).map(t => ({ id: t.id, name: t.name, icon: t.icon,
          category: t.category || undefined, intervalMonths: t.interval_months || undefined, intervalKm: t.interval_km || undefined,
          fuelType: t.fuel_type || undefined, driveType: t.drive_type || undefined, ownerId: t.owner_id, profileId: t.profile_id || undefined })),
        maintenanceProfiles: (maintenanceProfiles || []).map(mp => ({ id: mp.id, name: mp.name,
          vehicleIds: mp.vehicle_ids || [], ownerId: mp.owner_id, isCustom: mp.is_custom || false, createdAt: mp.created_at })),
      }));
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement:', error);
      
      // Si c'est une erreur de refresh token, nettoyer la session
      if (error?.message?.includes('refresh') || error?.message?.includes('Refresh Token')) {
        const { cleanInvalidSession } = await import('../utils/auth');
        await cleanInvalidSession();
        
        // Réinitialiser l'état complet
        setState({
          ...defaultState,
          supabaseUser: null,
          isAuthenticated: false,
        });
        return;
      }
      
      // En cas d'autre erreur, charger valeurs par défaut
      setState(prev => ({
        ...prev,
        adminPin: '1234',
        profiles: [],
        vehicles: [],
        maintenanceEntries: [],
        tasks: [],
        reminders: [],
        maintenanceTemplates: [],
        maintenanceProfiles: [],
      }));
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Vérifier l'authentification
        const user = await getCurrentUser();
        
        setState(prev => ({
          ...prev,
          supabaseUser: user,
          isAuthenticated: !!user,
        }));

        // Si pas de user, arrêter ici
        if (!user) {
          setIsLoading(false);
          return;
        }

        // 2. Migration localStorage → Supabase (si nécessaire)
        await migrateToSupabase();
      
        // 3. Charger les données
        await loadFromSupabase();
        
        // 4. Migration automatique des profile_id manquants
        const needsMigration = await checkMigrationNeeded();
        if (needsMigration) {
          await migrateProfileIds();
          await loadFromSupabase();
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('❌ Erreur initialisation:', error);
        
        // Si c'est une erreur de refresh token, nettoyer la session
        if (error?.message?.includes('refresh') || error?.message?.includes('Refresh Token')) {
          // Importer dynamiquement cleanInvalidSession
          import('../utils/auth').then(({ cleanInvalidSession }) => {
            cleanInvalidSession().then(() => {
              // Réinitialiser l'état
              setState({
                ...defaultState,
                supabaseUser: null,
                isAuthenticated: false,
              });
              setIsLoading(false);
            });
          });
        } else {
          setIsLoading(false);
        }
      }
    };
    
    init();
  }, []);

  // 🎧 Écouter les changements d'authentification (useEffect séparé pour éviter les boucles)
  useEffect(() => {
    const { data: authListener } = onAuthStateChange(async (user) => {
      // Ce callback ne reçoit QUE des événements SIGNED_OUT (user = null)
      
      setState(prev => ({
        ...prev,
        supabaseUser: null,
        isAuthenticated: false,
        currentProfile: null,
        profiles: [],
        vehicles: [],
        maintenanceEntries: [],
        tasks: [],
        reminders: [],
        maintenanceTemplates: [],
        maintenanceProfiles: [],
      }));
    });

    return () => {
      console.log('🔇 Désinstallation listener onAuthStateChange');
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const setCurrentProfile = async (profile: Profile | null) => {
    // ✅ FIX stale closure : lire adminPin depuis le state actuel via setState fonctionnel
    setState(prev => {
      // Fire and forget la sauvegarde Supabase avec la bonne valeur de adminPin
      supabase
        .from('app_config')
        .upsert({ id: 'global', admin_pin: prev.adminPin, current_profile_id: profile?.id || null }, { onConflict: 'id' })
        .then(() => {});
      return { ...prev, currentProfile: profile };
    });
  };

  const addProfile = async (profile: Profile) => {
    const s = { ...profile, firstName: sanitizeInput(profile.firstName), lastName: sanitizeInput(profile.lastName), name: sanitizeInput(profile.name) };
    
    // ✅ VÉRIFIER SI UN PROFIL EXISTE DÉJÀ POUR CET UTILISATEUR
    if (s.userId) {
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', s.userId)
        .eq('is_admin', false);
      
      if (existingProfiles && existingProfiles.length > 0) {
        // Recharger les données pour mettre à jour l'état
        await loadFromSupabase();
        return;
      }
    }
    
    const { error } = await supabase.from('profiles').insert({ 
      id: s.id, 
      first_name: s.firstName, 
      last_name: s.lastName || '', // ✅ Chaîne vide au lieu de null
      name: s.name,
      avatar: s.avatar, 
      is_pin_protected: s.isPinProtected, 
      pin: s.pin || null, 
      is_admin: s.isAdmin || false,
      user_id: s.userId || null // ✅ CRITIQUE : Ajouter le user_id
    });
    
    if (error) {
      throw error;
    }
    
    // Initialiser les templates par défaut pour ce profil
    if (!s.isAdmin) {
      const templatesForNewProfile = defaultMaintenanceTemplates.map(t => ({
        id: `${t.id}-${s.id}`,
        name: t.name,
        icon: t.icon,
        category: t.category || null,
        interval_months: t.intervalMonths || null,
        interval_km: t.intervalKm || null,
        fuel_type: t.fuelType || null,
        drive_type: t.driveType || null,
        owner_id: s.id
      }));
      await supabase.from('maintenance_templates').insert(templatesForNewProfile);
      
      // Ajouter aussi les templates dans le state
      const newTemplates = defaultMaintenanceTemplates.map(t => ({
        ...t,
        id: `${t.id}-${s.id}`,
        ownerId: s.id
      }));
      setState(prev => ({ 
        ...prev, 
        profiles: [...prev.profiles, { ...s, fontSize: 50 }], // Taille par défaut en local
        maintenanceTemplates: [...prev.maintenanceTemplates, ...newTemplates]
      }));
    } else {
      setState(prev => ({ ...prev, profiles: [...prev.profiles, { ...s, fontSize: 50 }] }));
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    const s = { ...updates };
    // ✅ Optimistic update local immédiat
    setState(prev => ({ ...prev, profiles: prev.profiles.map(p => p.id === id ? { ...p, ...updates } : p),
      currentProfile: prev.currentProfile?.id === id ? { ...prev.currentProfile, ...updates } : prev.currentProfile }));
    
    // Sanitize les champs texte
    if (updates.firstName) s.firstName = sanitizeInput(updates.firstName);
    if ('lastName' in updates) {
      s.lastName = updates.lastName ? sanitizeInput(updates.lastName) : ''; 
    }
    if (updates.name) s.name = sanitizeInput(updates.name);
    
    // Préparer les données pour Supabase (sans font_size)
    const db: any = {};
    if (s.firstName !== undefined) db.first_name = s.firstName;
    if ('lastName' in s) db.last_name = s.lastName || ''; // ✅ Chaîne vide au lieu de null
    if (s.name !== undefined) db.name = s.name;
    if (s.avatar !== undefined) db.avatar = s.avatar;
    if (s.isPinProtected !== undefined) db.is_pin_protected = s.isPinProtected;
    if ('pin' in s) db.pin = s.pin || null; // ✅ Convertir undefined en null pour Supabase
    if (s.isAdmin !== undefined) db.is_admin = s.isAdmin;
    // ✅ IMPORTANT : Ne JAMAIS modifier user_id après création
    // fontSize est géré en local uniquement (pas de colonne font_size dans Supabase)
    
    console.log('💾 Mise à jour profil Supabase:', { id, updates: s, db });
    
    // Sauvegarder dans Supabase
    const { data, error } = await supabase.from('profiles').update(db).eq('id', id).select();
    
    if (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      throw error;
    }
    
    console.log('✅ Profil sauvegardé dans Supabase:', data);
    
    // ✅ CRITIQUE : Recharger les données depuis Supabase pour avoir la dernière version
    await loadFromSupabase();
    
    console.log('✅ Données rechargées depuis Supabase');
  };

  const deleteProfile = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    setState(prev => ({ ...prev, profiles: prev.profiles.filter(p => p.id !== id) }));
  };

  const addVehicle = async (vehicle: Vehicle) => {
    const s = { ...vehicle, name: sanitizeInput(vehicle.name), brand: vehicle.brand ? sanitizeInput(vehicle.brand) : vehicle.brand,
      model: vehicle.model ? sanitizeInput(vehicle.model) : vehicle.model };
    
    // ✅ Optimistic update : mettre à jour l'UI immédiatement
    setState(prev => ({ ...prev, vehicles: [...prev.vehicles, s] }));
    
    const { error } = await supabase.from('vehicles').insert({ 
      id: s.id, name: s.name, photo: s.photo, mileage: s.mileage,
      brand: s.brand || null, model: s.model || null, year: s.year || null, 
      license_plate: s.licensePlate || null, vin: s.vin || null, owner_id: s.ownerId, 
      fuel_type: s.fuelType || null, drive_type: s.driveType || null,
      photos: s.photos || null, documents: s.documents ? JSON.stringify(s.documents) : null
    });
    
    if (error) {
      // ✅ Rollback optimistic update
      setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== s.id) }));
      throw error;
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const s = { ...updates };
    if (updates.name) s.name = sanitizeInput(updates.name);
    if (updates.brand !== undefined) s.brand = updates.brand ? sanitizeInput(updates.brand) : updates.brand;
    if (updates.model !== undefined) s.model = updates.model ? sanitizeInput(updates.model) : updates.model;

    // ✅ FIX : utiliser 'key' in updates pour pouvoir vider des champs (null/empty)
    const db: any = {};
    if ('name' in updates && s.name) db.name = s.name;
    if ('photo' in updates) db.photo = s.photo || null;
    if ('mileage' in updates && s.mileage !== undefined) db.mileage = s.mileage;
    if ('brand' in updates) db.brand = s.brand || null;
    if ('model' in updates) db.model = s.model || null;
    if ('year' in updates) db.year = s.year || null;
    if ('licensePlate' in updates) db.license_plate = s.licensePlate || null;
    if ('vin' in updates) db.vin = s.vin || null;
    if ('fuelType' in updates) db.fuel_type = s.fuelType || null;
    if ('driveType' in updates) db.drive_type = s.driveType || null;
    if ('photos' in updates) db.photos = s.photos || null;
    if ('documents' in updates) db.documents = s.documents ? JSON.stringify(s.documents) : null;
    
    // ✅ Optimistic update
    setState(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...s } : v) }));
    
    const { error } = await supabase.from('vehicles').update(db).eq('id', id);
    
    if (error) {
      await loadFromSupabase(); // Recharger en cas d'erreur
      throw error;
    }
  };

  const deleteVehicle = async (id: string) => {
    // ✅ Optimistic update : supprimer aussi les données liées
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id),
      maintenanceEntries: prev.maintenanceEntries.filter(e => e.vehicleId !== id),
      tasks: prev.tasks.filter(t => t.vehicleId !== id),
      reminders: prev.reminders.filter(r => r.vehicleId !== id),
    }));
    
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    
    if (error) {
      await loadFromSupabase(); // Recharger en cas d'erreur
      throw error;
    }
  };

  const addMaintenanceEntry = async (entry: MaintenanceEntry) => {
    // ✅ Optimistic update
    setState(prev => ({ ...prev, maintenanceEntries: [entry, ...prev.maintenanceEntries] }));
    
    const { error } = await supabase.from('maintenance_entries').insert({ 
      id: entry.id, vehicle_id: entry.vehicleId,
      type: typeof entry.type === 'string' ? entry.type : 'other', 
      custom_type: entry.customType || null, custom_icon: entry.customIcon || null, 
      date: entry.date, mileage: entry.mileage, cost: entry.cost || null, 
      notes: entry.notes || null, photos: entry.photos || null 
    });
    
    if (error) {
      // Rollback
      setState(prev => ({ ...prev, maintenanceEntries: prev.maintenanceEntries.filter(e => e.id !== entry.id) }));
      throw error;
    }
  };

  const updateMaintenanceEntry = async (id: string, updates: Partial<MaintenanceEntry>) => {
    const db: any = {};
    if ('type' in updates) db.type = typeof updates.type === 'string' ? updates.type : 'other';
    if ('customType' in updates) db.custom_type = updates.customType || null;
    if ('customIcon' in updates) db.custom_icon = updates.customIcon || null;
    if ('date' in updates) db.date = updates.date;
    if ('mileage' in updates) db.mileage = updates.mileage;
    if ('cost' in updates) db.cost = updates.cost || null;
    if ('notes' in updates) db.notes = updates.notes || null;
    if ('photos' in updates) db.photos = updates.photos || null;

    // ✅ Optimistic update avec snapshot pour rollback
    let snapshot: MaintenanceEntry[] = [];
    setState(prev => {
      snapshot = prev.maintenanceEntries;
      return { ...prev, maintenanceEntries: prev.maintenanceEntries.map(e => e.id === id ? { ...e, ...updates } : e) };
    });
    const { error } = await supabase.from('maintenance_entries').update(db).eq('id', id);
    if (error) {
      setState(prev => ({ ...prev, maintenanceEntries: snapshot }));
      throw error;
    }
  };

  const deleteMaintenanceEntry = async (id: string) => {
    // ✅ Optimistic update
    setState(prev => ({ ...prev, maintenanceEntries: prev.maintenanceEntries.filter(e => e.id !== id) }));
    const { error } = await supabase.from('maintenance_entries').delete().eq('id', id);
    if (error) {
      await loadFromSupabase();
      throw error;
    }
  };

  const addReminder = async (reminder: Reminder) => {
    // ✅ Optimistic update
    setState(prev => ({ ...prev, reminders: [reminder, ...prev.reminders] }));
    
    const { error } = await supabase.from('reminders').insert({ 
      id: reminder.id, vehicle_id: reminder.vehicleId, type: reminder.type,
      due_date: reminder.dueDate || null, due_mileage: reminder.dueMileage || null,
      status: reminder.status, description: reminder.description 
    });
    
    if (error) {
      setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== reminder.id) }));
      throw error;
    }
    // ✅ suppression du log et du reload inutile
    
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const db: any = {};
    if ('type' in updates) db.type = updates.type;
    if ('dueDate' in updates) db.due_date = updates.dueDate || null;
    if ('dueMileage' in updates) db.due_mileage = updates.dueMileage || null;
    if ('status' in updates) db.status = updates.status;
    if ('description' in updates) db.description = updates.description;

    // ✅ Optimistic update avec snapshot pour rollback
    let snapshot: Reminder[] = [];
    setState(prev => {
      snapshot = prev.reminders;
      return { ...prev, reminders: prev.reminders.map(r => r.id === id ? { ...r, ...updates } : r) };
    });
    const { error } = await supabase.from('reminders').update(db).eq('id', id);
    if (error) {
      setState(prev => ({ ...prev, reminders: snapshot }));
      throw error;
    }
  };

  const deleteReminder = async (id: string) => {
    // ✅ Optimistic update
    setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) {
      await loadFromSupabase();
      throw error;
    }
  };

  const addTask = async (task: Task) => {
    const s = { ...task, title: sanitizeInput(task.title), description: task.description ? sanitizeInput(task.description) : undefined };
    
    const optimizedLinks = s.links && s.links.length > 0 
      ? s.links
          .filter(link => link.url.trim() !== '')
          .map(link => ({ url: link.url.trim(), name: link.name.trim() || undefined }))
          .filter(link => link.url)
      : null;
    
    const taskWithLinks = { ...s, links: optimizedLinks || undefined };
    
    // ✅ Optimistic update
    setState(prev => ({ ...prev, tasks: [taskWithLinks, ...prev.tasks] }));
    
    const { error } = await supabase.from('tasks').insert({
      id: s.id, vehicle_id: s.vehicleId, title: s.title,
      description: s.description || null, links: optimizedLinks, completed: s.completed,
      created_at: s.createdAt || new Date().toISOString()
    });
    
    if (error) {
      setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== s.id) }));
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const db: any = {};
    if (updates.title) db.title = updates.title;
    
    // ✅ CORRECTION : Toujours mettre à jour description, même si vide (null)
    if ('description' in updates) {
      db.description = updates.description || null;
    }
    
    // 🚀 OPTIMISATION : Nettoyer les liens lors de la mise à jour
    if ('links' in updates) {
      const optimizedLinks = updates.links && updates.links.length > 0
        ? updates.links
            .filter(link => link.url.trim() !== '')
            .map(link => ({
              url: link.url.trim(),
              name: link.name.trim() || undefined
            }))
            .filter(link => link.url)
        : null;
      db.links = optimizedLinks;
      updates.links = optimizedLinks || undefined;
    }
    
    if (updates.completed !== undefined) db.completed = updates.completed;
    await supabase.from('tasks').update(db).eq('id', id);
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTask = async (id: string) => {
    // ✅ Optimistic update
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      await loadFromSupabase();
      throw error;
    }
  };

  const toggleTaskComplete = async (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', id);
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t) }));
  };

  const addMaintenanceTemplate = async (template: MaintenanceTemplate) => {
    // ✅ FIX : utiliser currentProfile OU le premier profil non-admin disponible
    const ownerProfile = state.currentProfile || state.profiles.find(p => !p.isAdmin);
    if (!ownerProfile) {
      console.error('❌ addMaintenanceTemplate : aucun profil owner disponible');
      return;
    }
    const t = { ...template, ownerId: ownerProfile.id };
    
    // 🔧 FIX: Vérifier si le template existe déjà pour éviter les doublons
    const { data: existing } = await supabase
      .from('maintenance_templates')
      .select('id')
      .eq('id', t.id)
      .maybeSingle();
    
    if (existing) {
      console.warn(`⚠️ Template ${t.id} existe déjà, insertion ignorée`);
      // Mettre à jour l'état local quand même pour éviter les désynchronisations
      setState(prev => {
        const exists = prev.maintenanceTemplates.some(mt => mt.id === t.id);
        if (exists) return prev;
        return { ...prev, maintenanceTemplates: [...prev.maintenanceTemplates, t] };
      });
      return;
    }
    
    const { error } = await supabase.from('maintenance_templates').insert({
      id: t.id, name: t.name, icon: t.icon, category: t.category || null,
      interval_months: t.intervalMonths || null, interval_km: t.intervalKm || null,
      fuel_type: t.fuelType || null, drive_type: t.driveType || null, owner_id: t.ownerId,
      profile_id: t.profileId || null
    });
    if (error) {
      console.error('❌ Erreur insertion maintenance_templates:', error.message, '| Code:', error.code);
      console.error('→ Vérifiez que la colonne profile_id existe et que les policies RLS INSERT sont configurées.');
      console.error('→ Exécutez le SQL de migration dans Supabase SQL Editor !');
      throw new Error(`Impossible d'ajouter le template: ${error.message}`);
    }
    console.log(`✅ Template "${t.name}" ajouté dans Supabase (profile_id: ${t.profileId || 'null'})`);
    setState(prev => ({ ...prev, maintenanceTemplates: [...prev.maintenanceTemplates, t] }));
  };

  const updateMaintenanceTemplate = async (id: string, updates: Partial<MaintenanceTemplate>) => {
    const db: any = {};
    if (updates.name !== undefined) db.name = updates.name;
    if (updates.icon !== undefined) db.icon = updates.icon;
    if (updates.category !== undefined) db.category = updates.category;
    if (updates.intervalMonths !== undefined) db.interval_months = updates.intervalMonths;
    if (updates.intervalKm !== undefined) db.interval_km = updates.intervalKm;
    if (updates.fuelType !== undefined) db.fuel_type = updates.fuelType;
    if (updates.driveType !== undefined) db.drive_type = updates.driveType;
    if (updates.profileId !== undefined) db.profile_id = updates.profileId;
    // ✅ Optimistic update avec snapshot
    let snapshot: MaintenanceTemplate[] = [];
    setState(prev => {
      snapshot = prev.maintenanceTemplates;
      return { ...prev, maintenanceTemplates: prev.maintenanceTemplates.map(t => t.id === id ? { ...t, ...updates } : t) };
    });
    const { error } = await supabase.from('maintenance_templates').update(db).eq('id', id);
    if (error) {
      console.error('❌ Erreur update maintenance_templates:', error.message);
      setState(prev => ({ ...prev, maintenanceTemplates: snapshot }));
      throw new Error(`Impossible de modifier le template: ${error.message}`);
    }
  };

  const deleteMaintenanceTemplate = async (id: string) => {
    // ✅ Optimistic update avec snapshot pour rollback
    let snapshot: MaintenanceTemplate[] = [];
    setState(prev => {
      snapshot = prev.maintenanceTemplates;
      return { ...prev, maintenanceTemplates: prev.maintenanceTemplates.filter(t => t.id !== id) };
    });
    
    const { error } = await supabase.from('maintenance_templates').delete().eq('id', id);
    if (error) {
      console.error('❌ Erreur suppression maintenance_templates:', error.message, '| Code:', error.code);
      console.error('→ Vérifiez les policies RLS DELETE sur maintenance_templates.');
      // ❌ Rollback si Supabase échoue → sinon le template revient au refresh
      setState(prev => ({ ...prev, maintenanceTemplates: snapshot }));
      throw new Error(`Impossible de supprimer le template: ${error.message}`);
    }
    console.log(`✅ Template ${id} supprimé de Supabase`);
  };

  const addMaintenanceProfile = async (profile: MaintenanceProfile) => {
    // ✅ FIX : utiliser currentProfile OU le premier profil non-admin disponible
    const ownerProfile = state.currentProfile || state.profiles.find(p => !p.isAdmin);
    if (!ownerProfile) {
      console.error('❌ addMaintenanceProfile : aucun profil owner disponible');
      return;
    }
    const p = { ...profile, ownerId: ownerProfile.id };
    const { error } = await supabase.from('maintenance_profiles').insert({
      id: p.id, name: p.name, vehicle_ids: p.vehicleIds, owner_id: p.ownerId, is_custom: p.isCustom, created_at: p.createdAt
    });
    if (error) {
      console.error('❌ Erreur insertion maintenance_profiles:', error.message, '| Code:', error.code);
      console.error('→ Vérifiez que les colonnes vehicle_ids/is_custom/owner_id existent dans maintenance_profiles.');
      console.error('→ Exécutez le SQL de migration dans Supabase SQL Editor !');
      throw new Error(`Impossible de créer le profil: ${error.message}`);
    }
    console.log(`✅ Profil maintenance "${p.name}" créé dans Supabase (id: ${p.id})`);
    setState(prev => ({ ...prev, maintenanceProfiles: [...prev.maintenanceProfiles, p] }));
  };

  const updateMaintenanceProfile = async (id: string, updates: Partial<MaintenanceProfile>) => {
    const db: any = {};
    if (updates.name !== undefined) db.name = updates.name;
    if (updates.vehicleIds !== undefined) db.vehicle_ids = updates.vehicleIds;
    if (updates.isCustom !== undefined) db.is_custom = updates.isCustom;
    
    // ✅ Optimistic update avec snapshot pour rollback
    let snapshot: MaintenanceProfile[] = [];
    setState(prev => {
      snapshot = prev.maintenanceProfiles;
      return { ...prev, maintenanceProfiles: prev.maintenanceProfiles.map(p => p.id === id ? { ...p, ...updates } : p) };
    });
    
    const { error } = await supabase.from('maintenance_profiles').update(db).eq('id', id);
    if (error) {
      console.error('❌ Erreur update maintenance_profiles:', error.message, '| Code:', error.code);
      console.error('→ Vérifiez les policies RLS UPDATE sur maintenance_profiles.');
      // Rollback
      setState(prev => ({ ...prev, maintenanceProfiles: snapshot }));
      throw new Error(`Impossible de mettre à jour le profil: ${error.message}`);
    }
    console.log(`✅ Profil maintenance ${id} mis à jour dans Supabase:`, db);
  };

  const deleteMaintenanceProfile = async (id: string) => {
    // Supprimer d'abord tous les templates associés à ce profil
    const { error: templatesError } = await supabase.from('maintenance_templates').delete().eq('profile_id', id);
    if (templatesError) console.error('❌ Erreur suppression templates du profil:', templatesError.message);
    
    const { error } = await supabase.from('maintenance_profiles').delete().eq('id', id);
    if (error) {
      console.error('❌ Erreur suppression maintenance_profiles:', error.message, '| Code:', error.code);
      throw new Error(`Impossible de supprimer le profil: ${error.message}`);
    }
    console.log(`✅ Profil maintenance ${id} supprimé de Supabase`);
    setState(prev => ({
      ...prev,
      maintenanceProfiles: prev.maintenanceProfiles.filter(p => p.id !== id),
      // Supprimer aussi les templates de ce profil du state local
      maintenanceTemplates: prev.maintenanceTemplates.filter(t => t.profileId !== id),
    }));
  };

  const updateAdminPin = async (newPin: string) => {
    try {
      console.log('🔐 Début mise à jour PIN admin:', { newPin });
      
      // 1️⃣ Sauvegarder dans Supabase d'abord
      // 🔧 FIX: Ne mettre à jour QUE le admin_pin, pas current_profile_id
      const payload = { 
        id: 'global', 
        admin_pin: newPin
      };
      
      console.log('📤 Tentative upsert Supabase:', payload);
      
      const { data, error } = await supabase
        .from('app_config')
        .upsert(payload, { onConflict: 'id' });
      
      console.log('📥 Réponse Supabase:', { data, error });
      
      if (error) {
        console.error('❌ Erreur sauvegarde PIN admin:', error);
        throw error;
      }
      
      // 2️⃣ Mettre à jour le state local uniquement si la sauvegarde a réussi
      setState(prev => ({ ...prev, adminPin: newPin }));
      console.log('✅ PIN admin sauvegardé avec succès:', newPin);
    } catch (error) {
      console.error('❌ Échec mise à jour PIN admin:', error);
      console.error('Détails de l\'erreur:', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      throw error;
    }
  };

  const updateFontSize = async (fontSize: number) => {
    try {
      if (!state.currentProfile) return;
      
      console.log('🔤 Mise à jour taille police:', fontSize);
      
      // 💾 Sauvegarder dans Supabase pour le profil courant
      await updateProfile(state.currentProfile.id, { fontSize });
      
      console.log('✅ Taille police sauvegardée:', fontSize);
    } catch (error) {
      console.error('❌ Échec mise à jour taille police:', error);
      throw error;
    }
  };

  const resetData = async () => {
    if (!state.currentProfile) {
      console.error('❌ Aucun profil actif');
      return;
    }

    const profileId = state.currentProfile.id;
    console.log(`🗑️ Réinitialisation des données du profil: ${state.currentProfile.name}`);

    try {
      // Récupérer tous les véhicules du profil
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('owner_id', profileId);

      const vehicleIds = vehicles?.map(v => v.id) || [];

      // Supprimer les entretiens des véhicules du profil
      if (vehicleIds.length > 0) {
        await supabase
          .from('maintenance_entries')
          .delete()
          .in('vehicle_id', vehicleIds);
        
        console.log(`✅ Entretiens supprimés pour ${vehicleIds.length} véhicules`);
      }

      // Supprimer les tâches des véhicules du profil
      if (vehicleIds.length > 0) {
        await supabase
          .from('tasks')
          .delete()
          .in('vehicle_id', vehicleIds);
      }

      // Supprimer les rappels des véhicules du profil
      if (vehicleIds.length > 0) {
        await supabase
          .from('reminders')
          .delete()
          .in('vehicle_id', vehicleIds);
      }

      // Supprimer les véhicules du profil
      await supabase
        .from('vehicles')
        .delete()
        .eq('owner_id', profileId);

      // Supprimer les templates personnalisés (pas les originaux)
      await supabase
        .from('maintenance_templates')
        .delete()
        .eq('owner_id', profileId)
        .eq('is_custom', true);

      console.log(`✅ Toutes les données du profil "${state.currentProfile.name}" ont été supprimées`);
      // ✅ FIX : rechargement filtré correctement par utilisateur connecté
      await loadFromSupabase();
    } catch (error) {
      throw error;
    }
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

  // 🔒 Filtrer les templates par profil actif — avec fallback robuste
  const userMaintenanceTemplates = useMemo(() => {
    // Si un profil est actif, filtrer par son ID
    if (state.currentProfile) {
      const filtered = state.maintenanceTemplates.filter(
        t => t.ownerId === state.currentProfile!.id
      );
      // Si le filtre donne quelque chose, l'utiliser
      if (filtered.length > 0) return filtered;
    }
    // Fallback : retourner tous les templates déjà chargés (déjà scopés à l'utilisateur par Supabase)
    // Cela couvre le cas où currentProfile est null mais les données sont chargées
    return state.maintenanceTemplates;
  }, [state.maintenanceTemplates, state.currentProfile]);

  // ✅ OPTIMISATION : Plus besoin de filtrer, Supabase charge déjà uniquement les données de l'utilisateur
  // Retourner TOUS les véhicules (déjà filtrés au chargement)
  const getUserVehicles = useCallback(() => {
    // Tous les véhicules dans state.vehicles appartiennent déjà à l'utilisateur connecté
    // grâce au filtrage au niveau SQL dans loadFromSupabase()
    return state.vehicles;
  }, [state.vehicles]);

  // ======================================
  // 🔐 AUTH FUNCTIONS
  // ======================================

  const signOut = async () => {
    try {
      await authSignOut();
      
      // Reset local state
      setState({
        ...defaultState,
        supabaseUser: null,
        isAuthenticated: false,
      });
      
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      throw error;
    }
  };

  const refreshAuth = useCallback(async () => {
    try {
      console.log('🔄 Refresh auth après connexion...');
      
      // Vérifier la session avec getUser() (appel API)
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Erreur getUser():', error);
        
        // Si c'est une erreur de token, nettoyer
        if (error.message?.includes('refresh') || error.message?.includes('token')) {
          console.warn('⚠️ Token invalide, nettoyage...');
          const { cleanInvalidSession } = await import('../utils/auth');
          await cleanInvalidSession();
          
          setState({
            ...defaultState,
            supabaseUser: null,
            isAuthenticated: false,
          });
        }
        
        setIsLoading(false);
        return;
      }
      
      const user = authUser ? {
        id: authUser.id,
        email: authUser.email || '',
        user_metadata: authUser.user_metadata,
      } : null;
      
      console.log('🔍 User après getUser():', user?.email || 'null');
      
      if (user) {
        console.log('✅ User connecté, mise à jour de l\'état...');
        
        setState(prev => ({
          ...prev,
          supabaseUser: user,
          isAuthenticated: true,
        }));
        
        console.log('📥 Chargement des données...');
        
        try {
          await loadFromSupabase();
          console.log('✅ Auth et données rechargées');
        } catch (loadError) {
          console.error('❌ Erreur chargement données:', loadError);
          // Continuer quand même, l'utilisateur est connecté
        }
        
        setIsLoading(false); // ✅ CRITIQUE : Masquer le loader
      } else {
        console.warn('⚠️ Aucun user trouvé après refreshAuth()');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Erreur refresh auth:', error);
      
      // Si c'est une erreur de token, nettoyer
      if (error?.message?.includes('refresh') || error?.message?.includes('token')) {
        console.warn('⚠️ Token invalide dans catch, nettoyage...');
        const { cleanInvalidSession } = await import('../utils/auth');
        await cleanInvalidSession();
        
        setState({
          ...defaultState,
          supabaseUser: null,
          isAuthenticated: false,
        });
      }
      
      setIsLoading(false);
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
      ...state, 
      maintenanceTemplates: userMaintenanceTemplates, // Remplacer par la version filtrée
      maintenances, 
      getUserVehicles, // 🔧 Nouvelle fonction pour récupérer les véhicules par user_id
      setCurrentProfile, addProfile, updateProfile, deleteProfile,
      addVehicle, updateVehicle, deleteVehicle, addMaintenanceEntry, updateMaintenanceEntry, deleteMaintenanceEntry,
      addReminder, updateReminder, deleteReminder, addTask, updateTask, deleteTask, toggleTaskComplete,
      addMaintenanceTemplate, updateMaintenanceTemplate, deleteMaintenanceTemplate, addMaintenanceProfile, updateMaintenanceProfile, deleteMaintenanceProfile, updateAdminPin, updateFontSize,
      resetData, exportData, importData, isLoading,
      // Auth functions
      signOut, refreshAuth }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  
  // 🔥 Hot-reload protection: Return default context during development hot-reload
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ AppContext non disponible - Hot-reload détecté');
      console.warn('🔄 Rechargement automatique dans 2 secondes...');
      
      // Recharger automatiquement après 2 secondes si le contexte n'est toujours pas disponible
      setTimeout(() => {
        if (!context) {
          console.log('🔄 Rechargement forcé...');
          window.location.reload();
        }
      }, 2000);
      
      // Retourner un contexte temporaire pour éviter le crash pendant le hot-reload
      return {
        ...defaultState,
        maintenances: [],
        setCurrentProfile: () => Promise.resolve(),
        addProfile: () => Promise.resolve(),
        updateProfile: () => Promise.resolve(),
        deleteProfile: () => Promise.resolve(),
        addVehicle: () => Promise.resolve(),
        updateVehicle: () => Promise.resolve(),
        deleteVehicle: () => Promise.resolve(),
        addMaintenanceEntry: () => Promise.resolve(),
        updateMaintenanceEntry: () => Promise.resolve(),
        deleteMaintenanceEntry: () => Promise.resolve(),
        addReminder: () => Promise.resolve(),
        updateReminder: () => Promise.resolve(),
        deleteReminder: () => Promise.resolve(),
        addTask: () => Promise.resolve(),
        updateTask: () => Promise.resolve(),
        deleteTask: () => Promise.resolve(),
        toggleTaskComplete: () => {},
        addMaintenanceTemplate: () => Promise.resolve(),
        updateMaintenanceTemplate: () => Promise.resolve(),
        deleteMaintenanceTemplate: () => Promise.resolve(),
        addMaintenanceProfile: () => Promise.resolve(),
        updateMaintenanceProfile: () => Promise.resolve(),
        deleteMaintenanceProfile: () => Promise.resolve(),
        updateAdminPin: () => Promise.resolve(),
        updateFontSize: () => Promise.resolve(),
        resetData: () => {},
        exportData: () => Promise.resolve(),
        importData: () => Promise.resolve(),
        isLoading: true, // Force loading state pendant hot-reload
        signOut: () => Promise.resolve(),
        refreshAuth: () => Promise.resolve(),
      } as AppContextType;
    }
    
    throw new Error('useApp must be used within AppProvider');
  }
  
  return context;
}