import { createClient } from '@supabase/supabase-js';

// Configuration Supabase depuis les variables d'environnement Vercel
const supabaseUrl = 'https://uffmwykdfrxwnslhrftw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZm13eWtkZnJ4d25zbGhyZnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjU4NzgsImV4cCI6MjA4MzY0MTg3OH0.eNd7sZOLk_MGtoQGrd6uHNSQXq_TImftE7qC6AnGRuE';

// Créer le client Supabase avec persistance dans sessionStorage
// ✅ SÉCURITÉ : La session est gardée pendant la navigation mais effacée à la fermeture du navigateur
// L'utilisateur devra se reconnecter à chaque nouvelle session de navigation
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// ✅ Global auth error handler: catch invalid refresh token errors early
// When autoRefreshToken fires and the refresh token is stale, Supabase emits
// a TOKEN_REFRESHED event that can fail. We listen here and clean up.
supabase.auth.onAuthStateChange((event, session) => {
  // If we get SIGNED_OUT due to a failed refresh, make sure storage is clean
  if (event === 'SIGNED_OUT' && !session) {
    // Clean any leftover Supabase keys from both storages
    [localStorage, sessionStorage].forEach(storage => {
      try {
        Object.keys(storage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            storage.removeItem(key);
          }
        });
      } catch (_) { /* ignore */ }
    });
  }
});

// Types de base de données pour TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          name: string;
          avatar: string;
          is_pin_protected: boolean;
          pin: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          photo: string;
          mileage: number;
          brand: string | null;
          model: string | null;
          year: number | null;
          license_plate: string | null;
          vin: string | null;
          owner_id: string;
          fuel_type: 'essence' | 'diesel' | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
      };
      maintenance_entries: {
        Row: {
          id: string;
          vehicle_id: string;
          type: string;
          custom_type: string | null;
          custom_icon: string | null;
          date: string;
          mileage: number;
          cost: number | null;
          notes: string | null;
          photos: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['maintenance_entries']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['maintenance_entries']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          vehicle_id: string;
          title: string;
          description: string | null;
          completed: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      reminders: {
        Row: {
          id: string;
          vehicle_id: string;
          type: string;
          due_date: string | null;
          due_mileage: number | null;
          status: 'ok' | 'soon' | 'urgent';
          description: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
      };
      app_config: {
        Row: {
          id: string;
          admin_pin: string;
          current_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['app_config']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['app_config']['Insert']>;
      };
      maintenance_templates: {
        Row: {
          id: string;
          name: string;
          icon: string;
          category: string | null;
          interval_months: number | null;
          interval_km: number | null;
          fuel_type: 'essence' | 'diesel' | 'both' | null;
          drive_type: '4x2' | '4x4' | 'both' | null;
          owner_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['maintenance_templates']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['maintenance_templates']['Insert']>;
      };
    };
  };
}