# ⚡ RÉPARATION RAPIDE - EN 2 MINUTES

## 🎯 Le Problème

- ✅ Nouveau compte lie automatiquement les profils déjà liés
- ✅ AdminPanel affiche 0 utilisateurs

---

## 🔧 La Solution (2 minutes)

### ÉTAPE 1 : Exécuter le Script SQL (1 min)

1. **Ouvrez** [app.supabase.com](https://app.supabase.com)
2. **Sélectionnez** votre projet
3. **Cliquez** sur **SQL Editor**
4. **Copiez-collez** ce script et **cliquez sur RUN** :

```sql
-- 🔧 CORRECTION RAPIDE
CREATE OR REPLACE FUNCTION public.migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_user_id UUID;
  profile_name TEXT;
BEGIN
  SELECT user_id, name INTO existing_user_id, profile_name
  FROM public.profiles
  WHERE id = profile_id_param AND is_admin = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- ✅ REFUSE si déjà lié à quelqu'un d'autre
  IF existing_user_id IS NOT NULL AND existing_user_id != user_id_param THEN
    RAISE EXCEPTION 'Profile already linked to another user';
  END IF;
  
  IF existing_user_id = user_id_param THEN
    RETURN TRUE;
  END IF;
  
  UPDATE public.profiles
  SET 
    user_id = user_id_param,
    is_migrated = true,
    migrated_at = NOW()
  WHERE id = profile_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

✅ **C'est fait !** Les nouveaux comptes ne peuvent plus voler les profils.

---

### ÉTAPE 2 : Nettoyer les Profils Mal Liés (1 min)

#### A. Diagnostiquer

Exécutez dans SQL Editor :

```sql
-- Voir tous les profils
SELECT 
  name,
  user_id,
  created_at
FROM profiles
WHERE is_admin = false
ORDER BY created_at;
```

#### B. Identifier les Doublons

```sql
-- Trouver les doublons
SELECT 
  user_id,
  array_agg(name) as profiles,
  COUNT(*) as count
FROM profiles
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Si cette requête retourne des lignes → Vous avez des doublons !**

#### C. Délier le Profil Mal Lié

Remplacez `ID_DU_PROFIL_A_DELIER` par l'ID réel :

```sql
-- Délier un profil
UPDATE profiles
SET 
  user_id = NULL,
  is_migrated = false
WHERE id = 'ID_DU_PROFIL_A_DELIER';
```

**Comment trouver l'ID ?**

```sql
-- Voir les IDs de tous les profils
SELECT id, name, user_id FROM profiles WHERE is_admin = false;
```

---

## 🧪 VÉRIFICATION

### Test 1 : Plus de Doublons

```sql
-- Cette requête doit retourner 0 lignes
SELECT user_id, COUNT(*) 
FROM profiles 
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id
HAVING COUNT(*) > 1;
```

✅ **0 lignes = OK**

### Test 2 : AdminPanel

1. Connectez-vous avec le compte admin
2. Cliquez sur Shield (🛡️)
3. Vous devriez voir les utilisateurs maintenant

### Test 3 : Nouveau Compte

1. Créez un nouveau compte de test
2. Essayez de lier un profil déjà lié
3. ❌ **Erreur attendue** : "Profile already linked to another user"

---

## 🎉 TERMINÉ !

Votre app est maintenant sécurisée contre les doublons !

---

## 📚 Documentation Complète

- **Guide détaillé** : `/FIX_MIGRATION_ISSUES.md`
- **Script automatique** : `/SUPABASE_COMPLETE_FIX.sql`
- **Scripts manuels** : `/SUPABASE_FIX_PROFILES.sql`

---

## ❓ Problèmes ?

### AdminPanel affiche toujours 0

**Vérification** :

```sql
SELECT COUNT(*) 
FROM profiles 
WHERE user_id IS NOT NULL AND is_admin = false;
```

Si c'est 0 → Aucun utilisateur n'a de profil lié.

**Solution** : Créez un compte et liez un profil.

### "Profile already linked to another user"

✅ **C'EST NORMAL !** La protection fonctionne.

**Solution** : Créez votre propre profil ou liez un profil non utilisé.

---

**Bon courage ! 🚀**
