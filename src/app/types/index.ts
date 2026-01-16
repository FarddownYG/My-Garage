export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Full name for display
  avatar: string;
  isPinProtected: boolean;
  pin?: string;
  isAdmin?: boolean;
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

export interface AppState {
  adminPin: string;
  profiles: Profile[];
  currentProfile: Profile | null;
  vehicles: Vehicle[];
  maintenanceEntries: MaintenanceEntry[];
  reminders: Reminder[];
  tasks: Task[];
  maintenanceTemplates: MaintenanceTemplate[];
}

// Re-export from alerts.ts for convenience
export type { UpcomingAlert } from '../utils/alerts';