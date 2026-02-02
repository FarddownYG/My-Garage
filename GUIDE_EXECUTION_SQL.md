# 📖 GUIDE D'EXÉCUTION DES SCRIPTS SQL

## 🎯 Objectif
Configurer la base de données Supabase pour activer l'authentification et la migration des profils.

---

## ⏱️ Temps Estimé
**5-10 minutes** (3 scripts à exécuter)

---

## 🔧 Prérequis
- ✅ Compte Supabase créé
- ✅ Projet Supabase actif
- ✅ Accès au SQL Editor

---

## 📋 Étapes d'Exécution

### **ÉTAPE 1 : Ouvrir le SQL Editor**

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **"SQL Editor"**
4. Cliquez sur **"New query"**

---

### **ÉTAPE 2 : Exécuter Script 1 - Colonnes d'Authentification**

#### 📋 Script à Copier-Coller

```sql
-- ============================================
-- SCRIPT 1 : AJOUT DES COLONNES
-- ============================================

-- Ajouter les colonnes d'authentification
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_migrated ON profiles(is_migrated);

-- Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('user_id', 'is_migrated', 'migrated_at');
```

#### ✅ Résultat Attendu
Vous devriez voir **3 lignes** :
```
user_id        | uuid                     | YES
is_migrated    | boolean                  | YES
migrated_at    | timestamp with time zone | YES
```

#### ⚠️ Si Erreur
- **"relation profiles does not exist"** → Votre table n'existe pas encore, créez-la d'abord
- **"column already exists"** → Normal, les colonnes existent déjà, continuez

---

### **ÉTAPE 3 : Exécuter Script 2 - Fonction de Migration**

#### 📋 Script à Copier-Coller

```sql
-- ============================================
-- SCRIPT 2 : FONCTION DE MIGRATION
-- ============================================

-- Supprimer l'ancienne version
DROP FUNCTION IF EXISTS migrate_profile_to_user(UUID, UUID);

-- Créer la fonction
CREATE OR REPLACE FUNCTION migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que le profil existe
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = profile_id_param 
      AND (user_id IS NULL OR user_id = user_id_param)
  ) THEN
    RAISE EXCEPTION 'Profil introuvable ou déjà migré vers un autre compte';
  END IF;

  -- Migrer le profil
  UPDATE profiles
  SET 
    user_id = user_id_param,
    is_migrated = true,
    migrated_at = NOW()
  WHERE id = profile_id_param;

  RAISE NOTICE 'Profil % migré vers user %', profile_id_param, user_id_param;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION migrate_profile_to_user(UUID, UUID) TO authenticated;
```

#### ✅ Résultat Attendu
Message : **"Success. No rows returned"** ou similaire

#### 🧪 Test de la Fonction
```sql
-- Vérifier que la fonction existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'migrate_profile_to_user';
```

Résultat : **1 ligne** avec `migrate_profile_to_user | FUNCTION`

---

### **ÉTAPE 4 : Exécuter Script 3 - Politiques RLS**

#### 📋 Script à Copier-Coller (COMPLET)

```sql
-- ============================================
-- SCRIPT 3 : POLITIQUES RLS
-- ============================================

-- 1. ACTIVER RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_profiles ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES PROFILES
DROP POLICY IF EXISTS "Users can view own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON profiles;

CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL OR is_admin = true);

CREATE POLICY "Users can insert own profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL OR is_admin = true);

CREATE POLICY "Users can delete own profiles"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id AND is_admin = false);

-- 3. POLICIES VEHICLES
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;

CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = vehicles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert own vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = vehicles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = vehicles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = vehicles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- 4. POLICIES MAINTENANCE_ENTRIES
DROP POLICY IF EXISTS "Users can view own maintenance" ON maintenance_entries;
DROP POLICY IF EXISTS "Users can manage own maintenance" ON maintenance_entries;

CREATE POLICY "Users can view own maintenance"
  ON maintenance_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = maintenance_entries.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

CREATE POLICY "Users can manage own maintenance"
  ON maintenance_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = maintenance_entries.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- 5. POLICIES TASKS
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = tasks.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = tasks.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- 6. POLICIES REMINDERS
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = reminders.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

CREATE POLICY "Users can manage own reminders"
  ON reminders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = reminders.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- 7. POLICIES MAINTENANCE_TEMPLATES
DROP POLICY IF EXISTS "Users can view own templates" ON maintenance_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON maintenance_templates;

CREATE POLICY "Users can view own templates"
  ON maintenance_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = maintenance_templates.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

CREATE POLICY "Users can manage own templates"
  ON maintenance_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = maintenance_templates.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- 8. POLICIES MAINTENANCE_PROFILES
DROP POLICY IF EXISTS "Users can view own maintenance profiles" ON maintenance_profiles;
DROP POLICY IF EXISTS "Users can manage own maintenance profiles" ON maintenance_profiles;

CREATE POLICY "Users can view own maintenance profiles"
  ON maintenance_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = maintenance_profiles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

CREATE POLICY "Users can manage own maintenance profiles"
  ON maintenance_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = maintenance_profiles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );
```

#### ✅ Résultat Attendu
Message : **"Success. No rows returned"**

#### 🧪 Test des Policies
```sql
-- Compter les policies par table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 
    'vehicles', 
    'maintenance_entries', 
    'tasks', 
    'reminders',
    'maintenance_templates',
    'maintenance_profiles'
  )
GROUP BY tablename
ORDER BY tablename;
```

Résultat attendu :
```
maintenance_entries      | 2
maintenance_profiles     | 2
maintenance_templates    | 2
profiles                 | 4
reminders                | 2
tasks                    | 2
vehicles                 | 4
```

**Total : 18 policies** ✅

---

## ✅ VÉRIFICATION FINALE

Exécutez cette requête pour tout vérifier :

```sql
-- Vérifier TOUT
SELECT 
  'Colonnes profiles' as check_type,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('user_id', 'is_migrated', 'migrated_at')

UNION ALL

SELECT 
  'Fonction migration',
  COUNT(*)
FROM information_schema.routines
WHERE routine_name = 'migrate_profile_to_user'

UNION ALL

SELECT 
  'Policies RLS',
  COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'vehicles', 'maintenance_entries', 
    'tasks', 'reminders', 'maintenance_templates',
    'maintenance_profiles'
  );
```

### ✅ Résultat Attendu
```
Colonnes profiles       | 3
Fonction migration      | 1
Policies RLS            | 18
```

**Si vous voyez ces 3 lignes, TOUT EST BON ! 🎉**

---

## 🎊 Configuration Terminée !

Votre base de données Supabase est maintenant prête pour :
- ✅ Authentification email/password
- ✅ Migration des profils existants
- ✅ Isolation des données par utilisateur
- ✅ Sécurité RLS activée

---

## 🚀 Prochaines Étapes

1. **Retourner sur l'application**
2. **Créer un compte de test**
3. **Tester la migration de profils**
4. **Vérifier que tout fonctionne**

---

## 🆘 En Cas de Problème

### Erreur : "relation X does not exist"
→ La table n'existe pas, vérifiez votre schéma de base de données

### Erreur : "column already exists"
→ Normal, la colonne a déjà été créée, continuez

### Erreur : "permission denied"
→ Vérifiez que vous êtes bien connecté avec un compte admin du projet

### Policies ne fonctionnent pas
→ Vérifiez que RLS est activé : `SELECT * FROM pg_tables WHERE rowsecurity = true;`

---

## 📞 Support

En cas de blocage :
1. Vérifiez les logs dans le SQL Editor
2. Relisez attentivement les messages d'erreur
3. Vérifiez que toutes les tables existent

**Bon développement ! 🚀**
