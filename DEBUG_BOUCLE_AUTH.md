# 🔧 DEBUG : Boucle de Redirection Infinie

## ❌ PROBLÈME

Vous vous connectez mais l'app vous redirige constamment entre :
- Page de connexion
- Sélection de profil (ancienne version)
- Page de connexion (encore)

**Boucle infinie** 🔄

---

## ✅ SOLUTION APPLIQUÉE

J'ai ajouté un flag `hasCheckedMigration` pour éviter que l'écran de migration ne s'affiche en boucle.

### Changements :

1. **AuthWrapper** : N'affiche l'écran de migration qu'**une seule fois** par session
2. **RefreshAuth** : Ajout de logs détaillés pour debug
3. **Protection contre les boucles** : Le flag `hasCheckedMigration` empêche les vérifications multiples

---

## 🧪 TEST

### Étape 1 : Hard Refresh

**CTRL + SHIFT + R** (ou CMD + SHIFT + R sur Mac)

### Étape 2 : Se connecter

1. Entrez vos identifiants : `farcryde.911@gmail.com`
2. Entrez votre mot de passe
3. Cliquez sur "Se connecter"

### Étape 3 : Observer les logs

**Ouvrez la console** (F12 → Console) et recherchez :

```
🔐 État Auth: { ... }
📋 Affichage écran migration
✅ Affichage app normale
```

---

## 📊 LOGS ATTENDUS

### Scénario A : Migration nécessaire

```
🔐 État Auth: {
  isAuthenticated: true,
  isMigrationPending: true,
  hasCheckedMigration: false
}
📋 Affichage écran migration
```

→ **Résultat** : L'écran de migration s'affiche **1 seule fois**

### Scénario B : Pas de migration

```
🔐 État Auth: {
  isAuthenticated: true,
  isMigrationPending: false,
  hasCheckedMigration: false
}
✅ Affichage app normale
```

→ **Résultat** : L'app s'affiche directement

---

## 🐛 SI LA BOUCLE PERSISTE

### Vérification 1 : Scripts SQL exécutés ?

Les 3 scripts SQL de `/TODO_SUPABASE.md` doivent être exécutés :
- ✅ Script 1 : Colonnes `user_id`, `is_migrated`, `migrated_at`
- ✅ Script 2 : Fonction `migrate_profile_to_user`
- ✅ Script 3 : Politiques RLS

**Comment vérifier ?**

Dans Supabase SQL Editor :

```sql
SELECT 
  'Colonnes' as type, COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name IN ('user_id', 'is_migrated', 'migrated_at');
```

**Résultat attendu** : `count = 3`

### Vérification 2 : Profils migrés ?

```sql
SELECT 
  id,
  first_name,
  user_id,
  is_migrated,
  CASE 
    WHEN user_id IS NULL THEN '❌ NON MIGRÉ'
    ELSE '✅ MIGRÉ'
  END as statut
FROM profiles
WHERE is_admin = false;
```

**Attendu** : Tous vos profils doivent avoir `user_id` rempli et `is_migrated = true`

### Vérification 3 : Session Supabase active ?

Dans la console, tapez :

```javascript
supabase.auth.getSession().then(({ data }) => console.log('Session:', data.session?.user?.email))
```

**Attendu** : Votre email s'affiche

---

## 🔧 FIX MANUEL (si la boucle continue)

Si vos profils ne sont pas migrés, forcez la migration manuellement :

### Option 1 : Via l'écran de migration

1. Attendez que l'écran de migration s'affiche
2. Sélectionnez vos profils
3. Cliquez sur "Migrer"

### Option 2 : Via SQL (rapide)

Dans Supabase SQL Editor :

```sql
-- Migrer TOUS les profils vers votre compte actuel
UPDATE profiles
SET 
  user_id = (SELECT id FROM auth.users WHERE email = 'farcryde.911@gmail.com'),
  is_migrated = true,
  migrated_at = NOW()
WHERE is_admin = false AND user_id IS NULL;
```

**⚠️ Remplacez** `farcryde.911@gmail.com` par votre email Supabase

Ensuite, **hard refresh** de l'app.

---

## 📝 CHECKLIST DEBUG

- [ ] Hard refresh effectué (CTRL + SHIFT + R)
- [ ] Scripts SQL exécutés dans Supabase
- [ ] Profils migrés (user_id rempli)
- [ ] Session Supabase active
- [ ] Logs de la console vérifiés

---

## 🆘 TOUJOURS BLOQUÉ ?

Envoyez-moi **une capture d'écran des logs de la console** avec :

1. Les messages `🔐 État Auth:`
2. Les messages d'erreur (en rouge)
3. Le résultat de cette commande SQL :

```sql
SELECT * FROM profiles WHERE is_admin = false;
```

---

**Bon courage ! 🚀**
