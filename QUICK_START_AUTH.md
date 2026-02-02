# ⚡ Guide Rapide - Authentification Supabase

## 🎯 En 3 Étapes

### 1️⃣ Exécuter le Script SQL (5 min)

```bash
1. Ouvrir Supabase Dashboard
   → https://app.supabase.com/

2. Sélectionner votre projet

3. Menu latéral → SQL Editor

4. Copier TOUT le contenu de :
   📄 /supabase-auth-migration.sql

5. Coller dans l'éditeur SQL

6. Cliquer "RUN" (ou Ctrl+Enter)

7. ✅ Success ! Vérifier les logs :
   "CREATE POLICY"
   "CREATE FUNCTION"
   "CREATE TRIGGER"
```

**Vérification** :
```sql
-- Copier/coller ceci dans SQL Editor
SELECT * FROM get_unmigrated_profiles();
```

Si des profils existent → ils apparaissent ici ✅

---

### 2️⃣ Activer l'Authentification (2 min)

```bash
1. Supabase Dashboard → Authentication

2. Onglet "Providers"

3. Activer "Email" :
   ☑️ Enable Email provider
   ☑️ Confirm email (optionnel)
   [Save]

4. (Optionnel) Activer "Google" :
   ☑️ Enable Google provider
   → Ajouter Client ID / Secret
   → Guide : https://supabase.com/docs/guides/auth/social-login/auth-google
   [Save]
```

---

### 3️⃣ Tester l'App (1 min)

```bash
# Lancer l'app
npm run dev

# Ouvrir http://localhost:5173
```

**Scénario A : Profils existants**
```
1. App démarre
2. ✅ AuthScreen s'affiche
3. Créer un compte (ex: test@example.com)
4. ✅ MigrationScreen s'affiche
5. Sélectionner un profil
6. Entrer PIN si nécessaire
7. Cliquer "Lier ce profil"
8. ✅ Toutes les données conservées !
```

**Scénario B : Nouvelle installation**
```
1. App démarre
2. ✅ AuthScreen s'affiche
3. Créer un compte
4. ✅ App normale (Dashboard)
5. Créer véhicules, entretiens, etc.
6. ✅ Données liées à votre compte
```

---

## 🧪 Test Multi-Users

```bash
# User 1
1. Se connecter : user1@example.com
2. Créer véhicule "Tesla Model 3"
3. Se déconnecter

# User 2
4. Se connecter : user2@example.com
5. Créer véhicule "BMW X5"

# Vérification
6. ✅ User2 NE VOIT PAS "Tesla Model 3"
7. Reconnecter User1
8. ✅ User1 NE VOIT PAS "BMW X5"

RLS fonctionne ! 🔒
```

---

## 🔧 Console de Debug

Ouvrir la console (F12) et chercher :

```javascript
// Au démarrage
🔐 User actuel: test@example.com  // ✅ Connecté
// ou
🔐 User actuel: Non connecté      // ❌ Pas d'auth

// État Auth
🔐 État Auth: {
  isAuthenticated: true,
  isMigrationPending: true,  // Profils à migrer
  hasProfiles: 2,
  ...
}

// Migration
🔄 Migration profil abc123 → user def456...
✅ Profil abc123 migré avec succès !
```

---

## ⚠️ Problèmes Courants

### "AuthScreen ne s'affiche pas"
```
Cause : Script SQL pas exécuté
Solution : Étape 1 ☝️
```

### "Erreur RLS policy violation"
```
Cause : Policies pas créées
Solution : Ré-exécuter script SQL complet
```

### "Profils non détectés"
```
Cause : Cache
Solution : Hard refresh (Ctrl+Shift+R)
```

### "OAuth Google ne marche pas"
```
Cause : Client ID/Secret manquants
Solution : Configurer dans Supabase Dashboard
          ou ignorer (email/password suffit)
```

---

## 📱 Mode "Plus Tard"

Si vous cliquez **"⏭️ Plus tard"** :

```
✅ L'app fonctionne normalement (mode legacy)
✅ Profils locaux utilisables
✅ Aucune restriction

Mais :
⚠️ Pas de sécurité multi-users
⚠️ Pas de sync entre appareils
⚠️ Migration proposée au prochain démarrage
```

**Recommandé** : Migrer pour profiter de :
- 🔒 Sécurité RLS
- 🌐 Accès multi-appareils
- 📧 Notifications email (futur)
- 🔄 Sync automatique

---

## 🎉 C'est Terminé !

Vous avez maintenant :
- ✅ Authentification complète
- ✅ Migration des données
- ✅ Sécurité multi-users
- ✅ Aucune perte de données

**Temps total** : ~10 minutes ⏱️

---

## 📖 Documentation Complète

Pour plus de détails :
→ Lire `/SUPABASE_AUTH_IMPLEMENTATION.md`

Pour les photos/documents :
→ Lire `/GUIDE_PHOTOS_DOCUMENTS.md`

---

**Besoin d'aide ?**
- Logs console (F12)
- Supabase Dashboard → Logs
- Documentation : `/SUPABASE_AUTH_IMPLEMENTATION.md`
