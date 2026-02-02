# 🔧 Résolution des Problèmes de Migration

## 🐛 Problèmes Identifiés

### 1. **Profils liés à plusieurs comptes**
Un même profil peut être lié à plusieurs utilisateurs différents.

### 2. **AdminPanel affiche 0 utilisateurs**
Le panneau admin ne charge pas correctement la liste des utilisateurs.

---

## ✅ SOLUTION 1 : Corriger la Fonction SQL de Migration

### Étape 1 : Ouvrir SQL Editor

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Menu **SQL Editor**

### Étape 2 : Exécuter ce script

```sql
-- 🔧 CORRECTION : Fonction de migration sécurisée
CREATE OR REPLACE FUNCTION public.migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Vérifier si le profil existe
  SELECT user_id INTO existing_user_id
  FROM public.profiles
  WHERE id = profile_id_param AND is_admin = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found or is admin', profile_id_param;
  END IF;
  
  -- ✅ REFUSER si déjà lié à un autre utilisateur
  IF existing_user_id IS NOT NULL AND existing_user_id != user_id_param THEN
    RAISE EXCEPTION 'Profile % is already linked to user %', 
      profile_id_param, existing_user_id;
  END IF;
  
  -- ✅ IGNORER si déjà lié au bon utilisateur
  IF existing_user_id = user_id_param THEN
    RAISE NOTICE 'Profile % already linked to this user', profile_id_param;
    RETURN TRUE;
  END IF;
  
  -- Lier le profil à l'utilisateur
  UPDATE public.profiles
  SET 
    user_id = user_id_param,
    is_migrated = true,
    migrated_at = NOW()
  WHERE id = profile_id_param;
  
  RAISE NOTICE 'Profile % successfully linked to user %', 
    profile_id_param, user_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

✅ **Vérification** : La fonction refusera maintenant de lier un profil déjà lié.

---

## ✅ SOLUTION 2 : Nettoyer les Profils Mal Liés

### Étape 1 : Diagnostiquer

Exécutez dans SQL Editor :

```sql
-- Voir tous les profils avec leur user_id
SELECT 
  id,
  name,
  first_name,
  user_id,
  is_migrated,
  created_at
FROM public.profiles
WHERE is_admin = false
ORDER BY created_at DESC;
```

### Étape 2 : Identifier les Doublons

```sql
-- Trouver les utilisateurs avec plusieurs profils
SELECT 
  user_id,
  array_agg(name) as profile_names,
  COUNT(*) as count
FROM public.profiles
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id
HAVING COUNT(*) > 1;
```

Si cette requête retourne des résultats, vous avez des doublons !

### Étape 3 : Corriger

**Option A : Délier le profil mal lié**

```sql
-- Remplacez 'PROFILE_ID_ICI' par l'ID réel du profil à délier
UPDATE public.profiles
SET 
  user_id = NULL,
  is_migrated = false,
  migrated_at = NULL
WHERE id = 'PROFILE_ID_ICI';
```

**Option B : Supprimer le profil en double**

⚠️ **ATTENTION** : Cela supprime aussi les véhicules liés !

```sql
-- Remplacez 'PROFILE_ID_ICI' par l'ID réel
DELETE FROM public.profiles WHERE id = 'PROFILE_ID_ICI';
```

### Étape 4 : Vérifier

```sql
-- Cette requête doit retourner 0 lignes
SELECT 
  user_id,
  COUNT(*) as profile_count
FROM public.profiles
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id
HAVING COUNT(*) > 1;
```

---

## ✅ SOLUTION 3 : Comprendre le Problème

### Scénario qui a causé le bug

1. **User A** crée un compte et lie le profil "Sarah"
   - `profiles.user_id` = `user_a_id`

2. **User B** crée un compte
   - Il ne devrait voir AUCUN profil (car "Sarah" a déjà `user_id`)
   
3. **Mais** : Si la fonction SQL `migrate_profile_to_user` n'a pas de vérification...
   - User B peut forcer le lien
   - `profiles.user_id` = `user_b_id` (écrase l'ancien)

### Solution Implémentée

Maintenant, si User B essaie de lier "Sarah" :
```
❌ Erreur : "Profile is already linked to another user"
```

---

## ✅ SOLUTION 4 : Corriger AdminPanel (Déjà fait)

Le fichier `/src/app/components/admin/AdminPanel.tsx` a été modifié pour :

1. **Logger** les étapes de chargement
2. **Exclure** les profils admin
3. **Afficher** le nom complet du profil

### Vérification

1. Connectez-vous avec le compte admin
2. Ouvrez la console (F12)
3. Cliquez sur Shield (🛡️)
4. Vous devriez voir :

```
🔍 Chargement des utilisateurs...
✅ 2 profils trouvés
👥 2 utilisateurs uniques
👤 User abc12345: 1 profils
👤 User def67890: 1 profils
✅ 2 utilisateurs chargés
```

---

## 🧪 TESTS

### Test 1 : Créer un Nouveau Compte

1. Déconnectez-vous
2. Créez un compte avec un email différent
3. Lors de la migration, vous ne devriez voir QUE les profils non liés
4. Essayez de lier un profil déjà lié → **Erreur attendue**

### Test 2 : AdminPanel

1. Connectez-vous avec le compte admin
2. Cliquez sur Shield (🛡️)
3. Vous devriez voir tous les utilisateurs avec profils

### Test 3 : Vérifier les Profils

```sql
-- Tous les profils doivent avoir un user_id unique
SELECT 
  user_id,
  COUNT(*) 
FROM profiles 
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id;
```

Chaque `user_id` doit apparaître **1 seule fois**.

---

## 📋 Checklist de Réparation

- [ ] **Étape 1** : Exécuter le script SQL de correction de fonction
- [ ] **Étape 2** : Diagnostiquer les profils mal liés
- [ ] **Étape 3** : Délier ou supprimer les doublons
- [ ] **Étape 4** : Vérifier qu'il n'y a plus de doublons
- [ ] **Étape 5** : Tester la création d'un nouveau compte
- [ ] **Étape 6** : Vérifier que AdminPanel affiche les utilisateurs
- [ ] **Étape 7** : Vérifier que les profils sont bien filtrés

---

## 🚨 Prévention Future

### Option 1 : Contrainte UNIQUE (Recommandé)

Empêche un utilisateur d'avoir plusieurs profils :

```sql
-- À exécuter APRÈS avoir nettoyé les doublons
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_one_per_user
UNIQUE (user_id)
WHERE user_id IS NOT NULL AND is_admin = false;
```

### Option 2 : Trigger de Vérification

Vérifie avant chaque UPDATE :

```sql
CREATE OR REPLACE FUNCTION check_profile_not_stolen()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on essaie de changer le user_id
  IF OLD.user_id IS NOT NULL 
     AND NEW.user_id IS NOT NULL 
     AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot steal profile from another user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_profile_steal
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_not_stolen();
```

---

## 🆘 Dépannage

### "Profile is already linked to another user"

✅ **C'est normal maintenant !** La fonction SQL empêche les doublons.

**Solution** : L'utilisateur doit créer son propre profil ou lier un profil non utilisé.

### AdminPanel affiche toujours 0 utilisateurs

**Vérification** :

```sql
SELECT COUNT(*) 
FROM profiles 
WHERE user_id IS NOT NULL AND is_admin = false;
```

Si c'est 0, aucun utilisateur n'a de profil lié.

**Solution** : Créez un compte et liez un profil.

### Les profils apparaissent en double dans la migration

**Cause** : La base de données a des profils orphelins.

**Solution** :

```sql
-- Supprimer les profils sans véhicules
DELETE FROM profiles 
WHERE user_id IS NULL 
  AND is_admin = false
  AND id NOT IN (SELECT DISTINCT owner_id FROM vehicles);
```

---

## 📞 Support

Si les problèmes persistent après ces corrections :

1. Vérifiez les logs Supabase (Dashboard → Logs)
2. Vérifiez la console navigateur (F12)
3. Exécutez les requêtes de diagnostic ci-dessus
4. Partagez les résultats pour un diagnostic plus précis

---

**Bon courage ! 🚀**
