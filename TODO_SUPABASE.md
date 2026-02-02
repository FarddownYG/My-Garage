# ✅ TODO SUPABASE - Actions Requises

## 🎯 CE QU'IL RESTE À FAIRE

### ⚡ Actions dans Supabase Dashboard

#### 1️⃣ Ouvrir le SQL Editor
- Aller sur [https://app.supabase.com](https://app.supabase.com)
- Sélectionner votre projet
- Cliquer sur **"SQL Editor"** (menu gauche)
- Cliquer sur **"New query"**

---

#### 2️⃣ Exécuter Script 1 - Colonnes

**Copier-coller ce code dans le SQL Editor :**

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_migrated ON profiles(is_migrated);
```

**Cliquer sur "RUN"** → ✅ Doit afficher "Success"

---

#### 3️⃣ Exécuter Script 2 - Fonction de Migration

**Nouvelle query, copier-coller :**

```sql
CREATE OR REPLACE FUNCTION migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = profile_id_param 
      AND (user_id IS NULL OR user_id = user_id_param)
  ) THEN
    RAISE EXCEPTION 'Profil introuvable ou déjà migré';
  END IF;

  UPDATE profiles
  SET 
    user_id = user_id_param,
    is_migrated = true,
    migrated_at = NOW()
  WHERE id = profile_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION migrate_profile_to_user(UUID, UUID) TO authenticated;
```

**Cliquer sur "RUN"** → ✅ Doit afficher "Success"

---

#### 4️⃣ Exécuter Script 3 - Politiques RLS

**Ouvrir le fichier `/SUPABASE_SQL_SCRIPTS.sql`**

Copier **TOUT** le contenu de la section "SCRIPT 3" (à partir de "ALTER TABLE profiles ENABLE ROW LEVEL SECURITY" jusqu'à la fin des policies)

**Cliquer sur "RUN"** → ✅ Doit afficher "Success"

**OU utiliser le script simplifié ci-dessous** ⬇️

<details>
<summary>📋 Script 3 Complet (Cliquer pour Afficher)</summary>

```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profiles" ON profiles;
CREATE POLICY "Users can view own profiles" ON profiles FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL OR is_admin = true);

DROP POLICY IF EXISTS "Users can insert own profiles" ON profiles;
CREATE POLICY "Users can insert own profiles" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own profiles" ON profiles;
CREATE POLICY "Users can update own profiles" ON profiles FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL OR is_admin = true);

DROP POLICY IF EXISTS "Users can delete own profiles" ON profiles;
CREATE POLICY "Users can delete own profiles" ON profiles FOR DELETE
  USING (auth.uid() = user_id AND is_admin = false);

-- Vehicles Policies
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
CREATE POLICY "Users can view own vehicles" ON vehicles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = vehicles.owner_id AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)));

DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = vehicles.owner_id AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)));

DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = vehicles.owner_id AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)));

DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = vehicles.owner_id AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)));

-- Maintenance Entries Policies
DROP POLICY IF EXISTS "Users can view own maintenance" ON maintenance_entries;
CREATE POLICY "Users can view own maintenance" ON maintenance_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM vehicles v JOIN profiles p ON p.id = v.owner_id WHERE v.id = maintenance_entries.vehicle_id AND (p.user_id = auth.uid() OR p.user_id IS NULL)));

DROP POLICY IF EXISTS "Users can manage own maintenance" ON maintenance_entries;
CREATE POLICY "Users can manage own maintenance" ON maintenance_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM vehicles v JOIN profiles p ON p.id = v.owner_id WHERE v.id = maintenance_entries.vehicle_id AND (p.user_id = auth.uid() OR p.user_id IS NULL)));

-- Tasks Policies
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM vehicles v JOIN profiles p ON p.id = v.owner_id WHERE v.id = tasks.vehicle_id AND (p.user_id = auth.uid() OR p.user_id IS NULL)));

DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM vehicles v JOIN profiles p ON p.id = v.owner_id WHERE v.id = tasks.vehicle_id AND (p.user_id = auth.uid() OR p.user_id IS NULL)));

-- Reminders Policies
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
CREATE POLICY "Users can view own reminders" ON reminders FOR SELECT
  USING (EXISTS (SELECT 1 FROM vehicles v JOIN profiles p ON p.id = v.owner_id WHERE v.id = reminders.vehicle_id AND (p.user_id = auth.uid() OR p.user_id IS NULL)));

DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;
CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL
  USING (EXISTS (SELECT 1 FROM vehicles v JOIN profiles p ON p.id = v.owner_id WHERE v.id = reminders.vehicle_id AND (p.user_id = auth.uid() OR p.user_id IS NULL)));

-- Templates Policies
DROP POLICY IF EXISTS "Users can view own templates" ON maintenance_templates;
CREATE POLICY "Users can view own templates" ON maintenance_templates FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = maintenance_templates.owner_id AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)));

DROP POLICY IF EXISTS "Users can manage own templates" ON maintenance_templates;
CREATE POLICY "Users can manage own templates" ON maintenance_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = maintenance_templates.owner_id AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)));

-- Maintenance Profiles Policies
DROP POLICY IF EXISTS "Users can view own maintenance profiles" ON maintenance_profiles;
CREATE POLICY "Users can view own maintenance profiles" ON maintenance_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = maintenance_profiles.owner_id AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)));

DROP POLICY IF EXISTS "Users can manage own maintenance profiles" ON maintenance_profiles;
CREATE POLICY "Users can manage own maintenance profiles" ON maintenance_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = maintenance_profiles.owner_id AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)));
```

</details>

---

#### 5️⃣ Vérifier que Tout est OK

**Copier-coller cette requête de vérification :**

```sql
SELECT 
  'Colonnes' as type, COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name IN ('user_id', 'is_migrated', 'migrated_at')
UNION ALL
SELECT 'Fonction', COUNT(*)
FROM information_schema.routines
WHERE routine_name = 'migrate_profile_to_user'
UNION ALL
SELECT 'Policies', COUNT(*)
FROM pg_policies
WHERE schemaname = 'public';
```

**Résultat attendu :**
```
Colonnes   | 3
Fonction   | 1
Policies   | 18+
```

✅ **Si vous voyez ces 3 lignes, c'est PARFAIT !**

---

#### 6️⃣ Désactiver Confirmation Email (Optionnel - Dev/Test)

**Si vous voulez tester sans confirmer l'email :**

1. Aller dans **Authentication** → **Providers** → **Email**
2. Désactiver **"Confirm email"**
3. Cliquer sur **"Save"**

⚠️ **En production, gardez la confirmation activée pour la sécurité !**

---

## ✅ C'EST TERMINÉ !

### Prochaines Étapes

1. ✅ Retourner sur l'application
2. ✅ Créer un compte de test
3. ✅ Tester la migration des profils
4. ✅ Vérifier que tout fonctionne

---

## 📚 Fichiers de Référence

- **`/SUPABASE_SQL_SCRIPTS.sql`** → Tous les scripts SQL complets
- **`/GUIDE_EXECUTION_SQL.md`** → Guide détaillé pas-à-pas
- **`/SUPABASE_CONFIG.md`** → Documentation complète
- **`/AUDIT_PRE_DEPLOYMENT.md`** → Audit du code

---

## 🆘 En Cas de Problème

Consultez **`/SUPABASE_CONFIG.md`** section "Dépannage"

---

**Bon développement ! 🚀**
