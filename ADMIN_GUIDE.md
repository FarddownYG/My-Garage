# 🛡️ Guide du Panneau d'Administration

## 🔐 Accès Admin

### Compte Administrateur

**Email** : `admin2647595726151748@gmail.com`  
**Mot de passe** : `\4I"fTRtW-UB"NG"<oxER'2S=2(2qNr[PcD]d)ak^T:Gb)jyX&`

### Accéder au Panneau Admin

1. **Connectez-vous** avec le compte admin
2. **Sur le Dashboard**, cliquez sur l'icône **🛡️ Shield** (rouge) en haut à droite
3. Vous accédez au **Panneau d'Administration**

---

## ✨ Fonctionnalités Admin

### 1. 🚫 Bannir un Email

**Utilité** : Empêcher un email spécifique de créer un compte.

**Procédure** :
1. Entrez l'adresse email à bannir
2. (Optionnel) Ajoutez une raison (ex: "Spam", "Abus", etc.)
3. Cliquez sur **"Bannir cet email"**

**Résultat** :
- L'email est ajouté à la liste noire
- Toute tentative d'inscription avec cet email sera refusée
- L'email apparaît dans la liste des "Emails bannis"

### 2. ✅ Débannir un Email

**Procédure** :
1. Dans la liste **"Emails bannis"**
2. Cliquez sur **"Débannir"** à côté de l'email concerné

**Résultat** :
- L'email est retiré de la liste noire
- L'utilisateur peut à nouveau créer un compte avec cet email

### 3. 👥 Voir les Utilisateurs

**Affichage** :
- Liste de tous les utilisateurs inscrits
- Informations affichées :
  - **Email** (ou identifiant si email non accessible)
  - **Nom complet** (si renseigné lors de l'inscription)
  - **Date de création** du compte
  - **Dernière connexion**

### 4. 🗑️ Supprimer un Utilisateur

⚠️ **FONCTIONNALITÉ LIMITÉE** : Nécessite configuration Supabase avancée

**Procédure** :
1. Cliquez sur **"Supprimer"** à côté de l'utilisateur
2. Cliquez à nouveau pour **confirmer**

**Résultat attendu** :
- Suppression des profils liés à l'utilisateur
- ⚠️ La suppression complète nécessite un accès Service Role (voir section Configuration)

---

## ⚙️ Configuration Requise

### Prérequis Supabase

Pour activer **toutes** les fonctionnalités admin, vous devez exécuter les scripts SQL dans Supabase.

#### Étape 1 : Ouvrir SQL Editor

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Menu **SQL Editor** (icône de base de données)

#### Étape 2 : Exécuter les Scripts

Copiez-collez et exécutez **TOUS** les scripts du fichier **`SUPABASE_ADMIN_SQL.md`** :

1. ✅ Table `banned_emails`
2. ✅ Fonction `check_email_not_banned()` + Trigger
3. ✅ Fonction `admin_delete_user()` (optionnel)
4. ✅ Vue `admin_users_view` (optionnel)

#### Vérification

```sql
-- Vérifier que la table existe
SELECT * FROM banned_emails;

-- Devrait retourner une table vide si tout est OK
```

---

## 🛠️ Limitations Actuelles

### 📧 Emails des Utilisateurs

**Problème** : L'API Supabase ne permet pas de lire les emails des utilisateurs sans Service Role Key.

**Solution de contournement** :
- Les utilisateurs sont identifiés par leur `user_id`
- Le nom complet est affiché s'il a été renseigné

**Solution complète** (avancé) :
1. Créer une fonction Edge Function (Supabase)
2. Utiliser la Service Role Key côté serveur
3. Appeler cette fonction depuis le frontend

### 🗑️ Suppression d'Utilisateurs

**Problème** : La suppression complète d'un utilisateur de `auth.users` nécessite la Service Role Key.

**Solution actuelle** :
- Les profils liés sont supprimés
- L'utilisateur reste dans `auth.users` mais ne peut plus se connecter (car pas de profil)

**Solution complète** (avancé) :
1. Créer une fonction Edge Function avec Service Role
2. Appeler `supabase.auth.admin.deleteUser(userId)` côté serveur

---

## 🔒 Sécurité

### Bonnes Pratiques

1. ✅ **Ne JAMAIS partager** les identifiants admin
2. ✅ **Changer le mot de passe** admin régulièrement
3. ✅ **Activer la double authentification** (2FA) sur Supabase Dashboard
4. ✅ **Surveiller les logs** d'activité admin

### Changer l'Email Admin

Pour utiliser un autre email admin, modifiez :

**Fichier** : `/src/app/components/home/Dashboard.tsx`

```typescript
// Ligne ~20
const ADMIN_EMAIL = 'votre-nouvel-admin@example.com';
```

**PUIS** : Mettez à jour les **policies SQL** dans Supabase :

```sql
-- Remplacer dans TOUS les scripts SQL
WHERE email = 'votre-nouvel-admin@example.com'
```

---

## 📊 Cas d'Usage

### Scénario 1 : Utilisateur Abusif

1. Vous détectez un comportement anormal
2. **Bannir son email** pour empêcher de nouveaux comptes
3. **Supprimer son compte** actuel

### Scénario 2 : Email Spam

1. Un bot crée des comptes avec des emails jetables
2. **Bannir les domaines** (ex: `@tempmail.com`)
3. Les inscriptions futures avec ce domaine seront bloquées

### Scénario 3 : Support Client

1. Un utilisateur demande la suppression de son compte
2. **Vérifier son identité**
3. **Supprimer son compte** via le panneau admin

---

## 🆘 Dépannage

### "Impossible de charger les données admin"

**Cause** : Les scripts SQL n'ont pas été exécutés

**Solution** : 
1. Ouvrez SQL Editor sur Supabase
2. Exécutez les scripts de `SUPABASE_ADMIN_SQL.md`
3. Actualisez le panneau admin

### "Erreur lors du bannissement"

**Cause** : Les permissions RLS ne sont pas configurées

**Solution** :
1. Vérifiez que la table `banned_emails` existe
2. Vérifiez les policies RLS dans Supabase Dashboard

### "La liste des utilisateurs est vide"

**Cause** : Normal si les utilisateurs n'ont pas de profils liés

**Solution** :
- Les utilisateurs apparaîtront une fois qu'ils auront lié un profil
- Pour voir TOUS les utilisateurs, utilisez le Supabase Dashboard

---

## 📝 Logs et Audit

### Voir l'Activité Admin

Dans Supabase Dashboard → **Logs** :

1. **Auth Logs** : Connexions, déconnexions
2. **Database Logs** : Modifications de tables
3. **API Logs** : Appels aux fonctions

### Ajouter un Système d'Audit (Avancé)

```sql
-- Table d'audit des actions admin
CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'ban_email', 'delete_user', etc.
  target TEXT, -- Email banni, user_id supprimé, etc.
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);
```

---

## 🎯 Feuille de Route

### Fonctionnalités Futures

- [ ] Dashboard statistiques (nombre d'utilisateurs, connexions, etc.)
- [ ] Filtres et recherche d'utilisateurs
- [ ] Export de données (CSV, JSON)
- [ ] Bannissement par domaine (ex: bloquer tous les `@tempmail.com`)
- [ ] Gestion des rôles (admin, modérateur, etc.)
- [ ] Logs d'activité détaillés
- [ ] Notifications admin (nouveaux utilisateurs, etc.)

---

## 📞 Support

Pour toute question ou problème :

1. Consultez la [documentation Supabase](https://supabase.com/docs)
2. Vérifiez les logs dans la console du navigateur (F12)
3. Consultez les logs Supabase Dashboard

**Bon courage ! 🚀**
