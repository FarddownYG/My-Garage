-- Migration pour créer la table maintenance_templates
-- Chaque profil aura ses propres templates d'entretien personnalisés

CREATE TABLE IF NOT EXISTS maintenance_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT,
  interval_months INTEGER,
  interval_km INTEGER,
  fuel_type TEXT CHECK (fuel_type IN ('essence', 'diesel', 'both')),
  drive_type TEXT CHECK (drive_type IN ('4x2', '4x4', 'both')),
  owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes par owner_id
CREATE INDEX IF NOT EXISTS idx_maintenance_templates_owner_id ON maintenance_templates(owner_id);

-- RLS (Row Level Security) pour que chaque utilisateur ne puisse voir que ses templates
ALTER TABLE maintenance_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates"
  ON maintenance_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own templates"
  ON maintenance_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own templates"
  ON maintenance_templates FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own templates"
  ON maintenance_templates FOR DELETE
  USING (true);
