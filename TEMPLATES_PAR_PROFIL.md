# 🎯 Templates d'Entretien Personnalisés par Profil

## 📋 Résumé des Modifications

Les templates d'entretien sont maintenant **propres à chaque profil utilisateur**. Quand un utilisateur modifie ses paramètres d'entretien, cela n'affecte que ses propres templates, et non ceux des autres utilisateurs.

## 🔧 Étapes d'Installation

### 1. Créer la table dans Supabase

Connectez-vous à votre projet Supabase et exécutez le SQL suivant dans l'éditeur SQL :

```sql
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
```

### 2. Vérifier que tout fonctionne

Après avoir créé la table :

1. **Créez un nouveau profil** → Les 41 templates par défaut seront automatiquement créés pour ce profil
2. **Modifiez un template** dans les paramètres → Seul ce profil verra la modification
3. **Connectez-vous avec un autre profil** → Les templates restent inchangés

## ✨ Fonctionnement

### À la création d'un nouveau profil :

- L'application crée automatiquement une copie des 41 templates par défaut
- Chaque template a un `owner_id` qui correspond à l'ID du profil
- Les templates sont différenciés selon la motorisation (essence/diesel) et la transmission (4x2/4x4)

### Lors de la modification des templates :

- L'utilisateur modifie uniquement ses propres templates
- Les autres profils ne sont pas affectés
- Les modifications sont sauvegardées dans Supabase

### Lors du changement de profil :

- L'application charge uniquement les templates du profil actif
- Chaque profil a sa propre configuration d'entretien

## 🗃️ Structure de la Base de Données

```
maintenance_templates
├── id (TEXT, PRIMARY KEY)              # Identifiant unique du template
├── name (TEXT, NOT NULL)               # Nom de l'entretien (ex: "Vidange")
├── icon (TEXT, NOT NULL)               # Emoji/icône (ex: "🛢️")
├── category (TEXT, NULLABLE)           # Catégorie (ex: "Moteur")
├── interval_months (INTEGER, NULLABLE) # Intervalle en mois (ex: 12)
├── interval_km (INTEGER, NULLABLE)     # Intervalle en km (ex: 15000)
├── fuel_type (TEXT, NULLABLE)          # Type de carburant (essence/diesel/both)
├── drive_type (TEXT, NULLABLE)         # Type de transmission (4x2/4x4/both)
├── owner_id (TEXT, NOT NULL)           # Référence au profil propriétaire
└── created_at (TIMESTAMP)              # Date de création
```

## 📝 Notes Importantes

1. **Migration Automatique** : Si vous aviez des données dans `localStorage`, elles seront automatiquement migrées vers Supabase avec des templates pour chaque profil existant.

2. **Profil Admin** : Le profil administrateur n'a pas de templates car il n'a pas accès aux véhicules.

3. **Suppression en Cascade** : Si un profil est supprimé, tous ses templates sont automatiquement supprimés grâce à `ON DELETE CASCADE`.

4. **Sécurité** : Row Level Security (RLS) est activé pour garantir que chaque utilisateur ne peut accéder qu'à ses propres données.

## 🚀 Prochaines Étapes

Une fois la table créée dans Supabase, l'application fonctionnera automatiquement avec les templates personnalisés par profil. Aucune autre configuration n'est nécessaire !

---

**Date de mise à jour** : 16 janvier 2026
**Version** : 1.0.0
