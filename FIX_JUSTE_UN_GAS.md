# 🔧 PROBLÈME "juste_un_gas" SE LIE AUX NOUVEAUX COMPTES

## 🎯 Le Problème

Le profil "juste_un_gas" n'a **pas de `user_id`** → Les nouveaux comptes le voient comme "profil à migrer" et le lient automatiquement !

---

## ✅ SOLUTION 1 : Lier "juste_un_gas" à TON Compte (1 minute)

### Copie-colle ce script dans Supabase SQL Editor :

```sql
-- 🔧 LIER "juste_un_gas" À TON COMPTE ADMIN

DO $$
DECLARE
  admin_user_id UUID;
  gas_profile_id UUID;
BEGIN
  -- Récupérer ton user_id (le premier profil avec user_id)
  SELECT user_id INTO admin_user_id
  FROM profiles
  WHERE user_id IS NOT NULL AND is_admin = false
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun user_id trouvé. Crée d abord un compte.';
  END IF;
  
  RAISE NOTICE '✅ User ID trouvé: %', admin_user_id;
  
  -- Lier "juste_un_gas" à ce user_id
  UPDATE profiles
  SET 
    user_id = admin_user_id,
    is_migrated = true,
    migrated_at = NOW()
  WHERE name ILIKE '%juste_un_gas%'
    OR name ILIKE '%gas%';
  
  RAISE NOTICE '✅ Profil "juste_un_gas" lié avec succès !';
END $$;
```

✅ **C'est fait !** "juste_un_gas" ne sera plus proposé aux nouveaux comptes.

---

## ✅ SOLUTION 2 : Supprimer "juste_un_gas" (si tu n'en as plus besoin)

### ⚠️ ATTENTION : Cela supprime aussi ses véhicules !

```sql
-- 🗑️ SUPPRIMER "juste_un_gas"
DELETE FROM profiles
WHERE name ILIKE '%juste_un_gas%';
```

---

## 🔍 DIAGNOSTIC : Pourquoi ça arrive ?

### Exécute ça pour voir l'état actuel :

```sql
-- Voir tous les profils orphelins (sans user_id)
SELECT 
  id,
  name,
  user_id,
  created_at
FROM profiles
WHERE user_id IS NULL 
  AND is_admin = false
ORDER BY created_at;
```

**Tous ces profils seront proposés lors de la création d'un nouveau compte !**

---

## ✅ SOLUTION 3 : Lier TOUS les Orphelins à Ton Compte

Si tu as plusieurs profils orphelins que tu veux garder :

```sql
-- 🔗 LIER TOUS LES ORPHELINS À TON COMPTE

DO $$
DECLARE
  admin_user_id UUID;
  linked_count INT;
BEGIN
  -- Récupérer ton user_id
  SELECT user_id INTO admin_user_id
  FROM profiles
  WHERE user_id IS NOT NULL AND is_admin = false
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun user_id trouvé';
  END IF;
  
  -- Lier tous les orphelins
  UPDATE profiles
  SET 
    user_id = admin_user_id,
    is_migrated = true,
    migrated_at = NOW()
  WHERE user_id IS NULL 
    AND is_admin = false;
  
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % profils orphelins liés au user %', linked_count, admin_user_id;
END $$;
```

---

## 🧪 VÉRIFICATION

### Après avoir exécuté une des solutions :

```sql
-- 1. Vérifier que "juste_un_gas" a un user_id
SELECT 
  name,
  user_id,
  is_migrated
FROM profiles
WHERE name ILIKE '%gas%';
```

✅ `user_id` doit être rempli (pas NULL)

```sql
-- 2. Vérifier combien de profils orphelins restent
SELECT COUNT(*) as orphelins
FROM profiles
WHERE user_id IS NULL AND is_admin = false;
```

✅ Idéalement 0 ou seulement les profils que tu veux garder non liés

---

## 🎯 COMMENT ÇA FONCTIONNE

### AVANT ❌

```
Profile "juste_un_gas"
├─ user_id: NULL
├─ is_migrated: false
└─ → Visible pour TOUS les nouveaux comptes !
```

### APRÈS ✅

```
Profile "juste_un_gas"
├─ user_id: abc-123-xyz (TON user_id)
├─ is_migrated: true
└─ → Invisible pour les nouveaux comptes !
```

---

## 🧪 TEST

### Créer un nouveau compte de test :

1. **Déconnecte-toi**
2. **Crée un nouveau compte** (test@example.com)
3. **Lors de la migration** → "juste_un_gas" ne devrait PAS apparaître !

✅ Si tu vois encore "juste_un_gas", exécute la SOLUTION 1 à nouveau

---

## 💡 POURQUOI "juste_un_gas" EXISTE ?

C'est probablement :

1. Un ancien profil de test
2. Un profil créé avant l'authentification Supabase
3. Un profil qui n'a jamais été lié à un compte

**Solution** : Le lier à ton compte ou le supprimer.

---

## 🚀 RÉSUMÉ ULTRA-RAPIDE

```sql
-- COPIE-COLLE ÇA ET C'EST RÉGLÉ
DO $$
DECLARE admin_user_id UUID;
BEGIN
  SELECT user_id INTO admin_user_id FROM profiles WHERE user_id IS NOT NULL LIMIT 1;
  UPDATE profiles SET user_id = admin_user_id, is_migrated = true WHERE name ILIKE '%juste_un_gas%';
  RAISE NOTICE 'Fait !';
END $$;
```

---

**C'est tout ! Le profil "juste_un_gas" ne sera plus proposé aux nouveaux comptes. 🎉**
