export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Full name for display
  avatar: string;
  isPinProtected: boolean;
  pin?: string;
  isAdmin?: boolean;
  fontSize?: number; // Taille de police personnalisée (0-100%, défaut: 50)
  userId?: string; // Lien vers auth.users (Supabase Auth)
  isMigrated?: boolean; // Profil migré vers Supabase Auth
  migratedAt?: string; // Date de migration
}

export interface Vehicle {
  id: string;
  name: string;
  photo: string;
  mileage: number;
  brand?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  ownerId: string;
  fuelType?: 'essence' | 'diesel'; // Type de motorisation
  driveType?: '4x2' | '4x4'; // Type de transmission (nouveau)
  engineType?: 'gasoline' | 'diesel'; // Alias pour compatibilité (à migrer vers fuelType)
  photos?: string[]; // Galerie de photos du véhicule
  documents?: VehicleDocument[]; // Documents (factures, papiers, etc.)
}

export interface VehicleDocument {
  id: string;
  name: string;
  url: string;
  type: 'photo' | 'pdf' | 'document'; // Type de fichier
  uploadedAt: string;
  size?: number; // Taille en bytes
}

export interface MaintenanceEntry {
  id: string;
  vehicleId: string;
  type: 'oil' | 'tires' | 'brakes' | 'filter' | 'battery' | 'inspection' | 'other';
  customType?: string;
  customIcon?: string; // Icône du template
  date: string;
  mileage: number;
  cost?: number;
  notes?: string;
  photos?: string[];
}

export interface MaintenanceTemplate {
  id: string;
  name: string;
  icon: string;
  category?: string; // Catégorie pour regrouper les templates
  intervalMonths?: number;
  intervalKm?: number;
  fuelType?: 'essence' | 'diesel' | 'both'; // Compatibilité motorisation
  driveType?: '4x2' | '4x4' | 'both'; // Compatibilité transmission (nouveau)
  engineType?: 'gasoline' | 'diesel' | 'both'; // Alias pour compatibilité
  ownerId: string; // Propriétaire du template (profil)
  profileId?: string; // ID du profil d'entretien auquel ce template appartient (optionnel)
}

export interface MaintenanceProfile {
  id: string;
  name: string; // Nom du profil (ex: "Entretien Sportif", "Entretien Ville")
  vehicleIds: string[]; // Liste des IDs des véhicules associés
  ownerId: string; // Propriétaire du profil (utilisateur)
  isCustom: boolean; // true = entretiens personnalisés, false = basé sur templates
  createdAt: string;
}

export interface Reminder {
  id: string;
  vehicleId: string;
  type: string;
  dueDate?: string;
  dueMileage?: number;
  status: 'ok' | 'soon' | 'urgent';
  description: string;
}

export interface Task {
  id: string;
  vehicleId: string;
  title: string;
  description?: string;
  links?: { url: string; name: string }[];
  completed: boolean;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  date: string;
  mileage: number;
  intervalKm?: number;
  intervalMonths?: number;
  cost?: number;
  notes?: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AppState {
  adminPin: string;
  profiles: Profile[];
  currentProfile: Profile | null;
  vehicles: Vehicle[];
  maintenanceEntries: MaintenanceEntry[];
  reminders: Reminder[]
  tasks: Task[];
  maintenanceTemplates: MaintenanceTemplate[];
  maintenanceProfiles: MaintenanceProfile[];
  // Supabase Auth
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
}

// Re-export from alerts.ts for convenience
export type { UpcomingAlert } from '../utils/alerts';