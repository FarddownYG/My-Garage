# Configuration Supabase - Table maintenance_profiles

## Nouvelle table à créer

Exécutez la commande SQL suivante dans l'éditeur SQL de Supabase pour créer la table `maintenance_profiles` :

```sql
-- Créer la table maintenance_profiles
CREATE TABLE IF NOT EXISTS maintenance_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_ids TEXT[] DEFAULT '{}',
  owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_owner ON maintenance_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_created ON maintenance_profiles(created_at DESC);

-- Ajouter une colonne profile_id à la table maintenance_templates (si elle n'existe pas déjà)
ALTER TABLE maintenance_templates 
ADD COLUMN IF NOT EXISTS profile_id TEXT REFERENCES maintenance_profiles(id) ON DELETE CASCADE;

-- Index pour la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_maintenance_templates_profile ON maintenance_templates(profile_id);

-- Commentaires sur les colonnes
COMMENT ON TABLE maintenance_profiles IS 'Profils d''entretien personnalisés pour organiser les types d''entretien par véhicule';
COMMENT ON COLUMN maintenance_profiles.name IS 'Nom du profil (ex: "Ford Focus RS MK3", "Entretien Sportif")';
COMMENT ON COLUMN maintenance_profiles.vehicle_ids IS 'Liste des IDs des véhicules associés à ce profil';
COMMENT ON COLUMN maintenance_profiles.owner_id IS 'ID de l''utilisateur propriétaire du profil';
COMMENT ON COLUMN maintenance_profiles.is_custom IS 'true = entretiens personnalisés, false = basé sur templates pré-remplis';
```

## Vérification

Pour vérifier que la table a bien été créée :

```sql
SELECT * FROM maintenance_profiles;
SELECT * FROM maintenance_templates WHERE profile_id IS NOT NULL;
```

## Fonctionnement

### 1. Profils Pré-remplis
- Lorsqu'un profil est créé avec `is_custom = false`
- Le système crée automatiquement les templates d'entretien par défaut
- Les templates sont filtrés selon la motorisation (essence/diesel) et la transmission (4x2/4x4) des véhicules associés

### 2. Profils Personnalisés
- Lorsqu'un profil est créé avec `is_custom = true`
- L'utilisateur peut ajouter ses propres types d'entretien
- Aucun template n'est créé automatiquement

### 3. Liaison Véhicules
- Un profil peut être associé à plusieurs véhicules
- Les véhicules sont stockés dans `vehicle_ids` (array de TEXT)
- Un véhicule peut appartenir à plusieurs profils

## Exemple de données

```sql
-- Exemple de profil pré-rempli
INSERT INTO maintenance_profiles (id, name, vehicle_ids, owner_id, is_custom, created_at)
VALUES (
  'profile-123',
  'Ford Focus RS MK3',
  ARRAY['vehicle-1', 'vehicle-2'],
  'user-456',
  false,
  NOW()
);

-- Exemple de profil personnalisé
INSERT INTO maintenance_profiles (id, name, vehicle_ids, owner_id, is_custom, created_at)
VALUES (
  'profile-789',
  'Entretien Circuit',
  ARRAY['vehicle-3'],
  'user-456',
  true,
  NOW()
);
```
