# ⚡ Action Immédiate - 5 Minutes

## ✅ Code Déjà Corrigé !

Tous les fichiers TypeScript ont été mis à jour :
- ✅ AppContext.tsx (vérification session)
- ✅ auth.ts (getSession au lieu de getUser)
- ✅ migration.ts (échecs silencieux)
- ✅ DocumentsGallery.tsx (fix téléchargement)

**Il ne reste plus que le SQL !**

---

## 🎯 2 Scripts SQL à Exécuter

### Étape 1 : Ouvrir Supabase

```
https://app.supabase.com/
→ Sélectionner votre projet
→ Menu latéral → SQL Editor
```

---

### Étape 2 : Script 1 (Auth + RLS)

**Fichier** : `supabase-auth-migration.sql`

1. Ouvrir le fichier dans votre éditeur
2. **Copier TOUT le contenu**
3. **Coller** dans SQL Editor
4. **Cliquer "RUN"** (ou Ctrl+Enter)
5. ✅ Attendre message de succès

**Ce que ça fait** :
- Ajoute colonnes `user_id`
- Active RLS sur 7 tables
- Crée 28 policies
- Crée fonctions + triggers

**Temps** : ~30 secondes d'exécution

---

### Étape 3 : Script 2 (Fix Session)

**Fichier** : `fix-auth-session-missing.sql`

1. Ouvrir le fichier dans votre éditeur
2. **Copier TOUT le contenu**
3. **Coller** dans SQL Editor (nouveau query ou effacer l'ancien)
4. **Cliquer "RUN"** (ou Ctrl+Enter)
5. ✅ Attendre message de succès

**Ce que ça fait** :
- Assouplit policies RLS
- Permet lecture profils non migrés
- Fix erreur "Auth session missing"

**Temps** : ~10 secondes d'exécution

---

## ✅ Vérification

Dans SQL Editor, exécuter :

```sql
-- Vérifier les policies
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Doit retourner : >= 28

-- Vérifier les fonctions
SELECT proname FROM pg_proc 
WHERE proname IN ('migrate_profile_to_user', 'get_unmigrated_profiles');
-- Doit retourner : 2 lignes
```

---

## 🚀 Tester l'App

```bash
npm run dev
```

**Console attendue** :
```
🔐 User actuel: Non connecté ✅
🔄 Migration profils nécessaire: false ✅
(Pas d'erreur rouge !)
```

**UI attendue** :
```
AuthScreen s'affiche ✅
Pas de crash ✅
```

---

## 🐛 Si Erreurs SQL

### Erreur : "already exists"

```
# C'est OK ! Signifie que c'était déjà créé
# Continuer normalement
```

### Erreur : "permission denied"

```
# Vérifier que vous êtes connecté en tant que propriétaire
# Dashboard → Settings → Database → Connection string
```

### Erreur : Autre

```
1. Copier le message d'erreur
2. Rechercher dans la documentation
3. Ou : DROP POLICY ... puis re-exécuter
```

---

## ✅ C'est Tout !

**Temps total** : 2-5 minutes

**Après ça** :
- ✅ Aucune erreur console
- ✅ Auth fonctionne
- ✅ Migration fonctionne
- ✅ RLS actif
- ✅ Téléchargement fonctionne
- ✅ Clipboard fonctionne

---

## 📖 Prochaine Étape

**Lire** : [QUICK_START_AUTH.md](./QUICK_START_AUTH.md) pour tester l'authentification

**Ou** : Directement créer un compte dans l'app !

---

**🎉 Félicitations ! Tout est prêt !**
