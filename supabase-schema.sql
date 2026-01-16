-- =====================================================
-- SCHÉMA SUPABASE POUR VALCAR APP
-- Carnet d'entretien véhicules - Base de données complète
-- =====================================================

-- 🔒 Activer Row Level Security (RLS) sur toutes les tables
-- Pour l'instant, on autorise tout en mode public (pas d'auth user)
-- Vous pourrez ajouter une authentification utilisateur plus tard

-- =====================================================
-- 1️⃣ TABLE : profiles (Profils utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    is_pin_protected BOOLEAN DEFAULT false,
    pin TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);

-- Row Level Security (tout le monde peut lire/écrire pour l'instant)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles access"
ON public.profiles
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- 2️⃣ TABLE : vehicles (Véhicules)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    photo TEXT NOT NULL,
    mileage INTEGER NOT NULL DEFAULT 0,
    brand TEXT,
    model TEXT,
    year INTEGER,
    license_plate TEXT,
    vin TEXT,
    owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fuel_type TEXT CHECK (fuel_type IN ('essence', 'diesel')),
    drive_type TEXT CHECK (drive_type IN ('4x2', '4x4')) DEFAULT '4x2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche par propriétaire
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_name ON public.vehicles(name);

-- Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public vehicles access"
ON public.vehicles
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- 3️⃣ TABLE : maintenance_entries (Entretiens)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.maintenance_entries (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    custom_type TEXT,
    custom_icon TEXT,
    date TEXT NOT NULL,
    mileage INTEGER NOT NULL,
    cost DECIMAL(10,2),
    notes TEXT,
    photos TEXT[], -- Array PostgreSQL pour stocker les URLs des photos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche par véhicule et date
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance_entries(date DESC);

-- Row Level Security
ALTER TABLE public.maintenance_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public maintenance access"
ON public.maintenance_entries
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- 4️⃣ TABLE : tasks (Tâches)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche par véhicule
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle ON public.tasks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);

-- Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public tasks access"
ON public.tasks
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5️⃣ TABLE : reminders (Rappels)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reminders (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    due_date TEXT,
    due_mileage INTEGER,
    status TEXT NOT NULL CHECK (status IN ('ok', 'soon', 'urgent')),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche par véhicule et statut
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle ON public.reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.reminders(status);

-- Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reminders access"
ON public.reminders
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- 6️⃣ TABLE : app_config (Configuration globale)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.app_config (
    id TEXT PRIMARY KEY DEFAULT 'global',
    admin_pin TEXT NOT NULL DEFAULT '1234',
    current_profile_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_config_updated_at 
BEFORE UPDATE ON public.app_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public config access"
ON public.app_config
FOR ALL
USING (true)
WITH CHECK (true);

-- Insérer la configuration par défaut
INSERT INTO public.app_config (id, admin_pin, current_profile_id)
VALUES ('global', '1234', NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ✅ SCHÉMA CRÉÉ AVEC SUCCÈS !
-- =====================================================

-- PROCHAINES ÉTAPES :
-- 1. Exécutez ce script SQL dans l'éditeur SQL de Supabase
-- 2. Vérifiez que toutes les tables sont créées dans le Table Editor
-- 3. Redémarrez votre application React
-- 4. Les données localStorage seront migrées automatiquement !