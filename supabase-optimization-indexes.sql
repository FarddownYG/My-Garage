-- 🚀 Script d'optimisation Supabase pour Valcar Premium
-- Date: 29 janvier 2026
-- Description: Ajoute des index et contraintes pour améliorer les performances et éviter les doublons

-- ========================================
-- 1. CRÉATION D'INDEX POUR PERFORMANCES
-- ========================================

-- Index pour les requêtes fréquentes sur vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON vehicles(fuel_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_drive_type ON vehicles(drive_type);

-- Index pour les requêtes sur maintenance_entries
CREATE INDEX IF NOT EXISTS idx_maintenance_entries_vehicle_id ON maintenance_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_entries_date ON maintenance_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_entries_type ON maintenance_entries(type);

-- Index pour les requêtes sur maintenance_templates
CREATE INDEX IF NOT EXISTS idx_maintenance_templates_owner_id ON maintenance_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_templates_profile_id ON maintenance_templates(profile_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_templates_name ON maintenance_templates(name);

-- Index pour les requêtes sur maintenance_profiles
CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_owner_id ON maintenance_profiles(owner_id);

-- Index pour les requêtes sur tasks
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle_id ON tasks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Index pour les requêtes sur reminders
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);

-- ========================================
-- 2. CONTRAINTES POUR ÉVITER LES DOUBLONS
-- ========================================

-- Contrainte unique pour éviter les doublons de templates
-- Note: COALESCE est utilisé pour gérer les NULL dans profile_id
DO $$ 
BEGIN
    -- Vérifier si la contrainte existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_template_per_owner_profile'
    ) THEN
        ALTER TABLE maintenance_templates 
        ADD CONSTRAINT unique_template_per_owner_profile 
        UNIQUE (name, owner_id, COALESCE(profile_id, ''));
        
        RAISE NOTICE 'Contrainte unique_template_per_owner_profile créée';
    ELSE
        RAISE NOTICE 'Contrainte unique_template_per_owner_profile existe déjà';
    END IF;
END $$;

-- ========================================
-- 3. STATISTIQUES ET VÉRIFICATIONS
-- ========================================

-- Afficher les statistiques des tables
SELECT 
    'vehicles' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT owner_id) as unique_owners
FROM vehicles
UNION ALL
SELECT 
    'maintenance_templates',
    COUNT(*),
    COUNT(DISTINCT owner_id)
FROM maintenance_templates
UNION ALL
SELECT 
    'maintenance_entries',
    COUNT(*),
    COUNT(DISTINCT vehicle_id)
FROM maintenance_entries
UNION ALL
SELECT 
    'tasks',
    COUNT(*),
    COUNT(DISTINCT vehicle_id)
FROM tasks
UNION ALL
SELECT 
    'reminders',
    COUNT(*),
    COUNT(DISTINCT vehicle_id)
FROM reminders
UNION ALL
SELECT 
    'profiles',
    COUNT(*),
    NULL
FROM profiles;

-- Vérifier les doublons restants après nettoyage
SELECT 
    'Templates avec doublons potentiels' as check_name,
    COUNT(*) as count
FROM (
    SELECT 
        name, 
        owner_id, 
        profile_id,
        COUNT(*) as duplicates
    FROM maintenance_templates
    GROUP BY name, owner_id, profile_id
    HAVING COUNT(*) > 1
) as duplicates;

-- ========================================
-- 4. VACUUM ET ANALYSE
-- ========================================

-- Optimiser les tables après le nettoyage
VACUUM ANALYZE vehicles;
VACUUM ANALYZE maintenance_templates;
VACUUM ANALYZE maintenance_entries;
VACUUM ANALYZE maintenance_profiles;
VACUUM ANALYZE tasks;
VACUUM ANALYZE reminders;
VACUUM ANALYZE profiles;

-- ========================================
-- 5. VÉRIFICATION DES INDEX
-- ========================================

-- Lister tous les index créés sur nos tables
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'vehicles', 
    'maintenance_templates', 
    'maintenance_entries', 
    'maintenance_profiles',
    'tasks', 
    'reminders', 
    'profiles',
    'app_config'
)
ORDER BY tablename, indexname;

-- ========================================
-- FIN DU SCRIPT
-- ========================================

-- Message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE '✅ Script d''optimisation exécuté avec succès!';
    RAISE NOTICE '📊 Vérifiez les résultats ci-dessus pour confirmer';
    RAISE NOTICE '🚀 Les performances devraient être améliorées';
END $$;
