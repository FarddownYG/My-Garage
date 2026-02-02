# 📝 Changelog - Système d'Administration

## ✨ Nouvelles Fonctionnalités

### 1. **Affichage du Nom Complet** lors de la connexion

- **Avant** : `Bonjour, [nom du profil]`
- **Après** : `Bonjour, [nom complet saisi lors de l'inscription]`
- **Fallback** : Si aucun nom complet, affiche le nom du profil

**Fichier modifié** : `/src/app/components/home/Dashboard.tsx`

```typescript
const displayName = supabaseUser?.user_metadata?.full_name || currentProfile?.name;
```

---

### 2. **Panneau d'Administration** 🛡️

Accessible uniquement par l'email admin : `admin2647595726151748@gmail.com`

#### Fonctionnalités :

#### a) **Bannir un Email** 🚫
- Empêche un email spécifique de créer un compte
- Ajoute une raison optionnelle
- Liste des emails bannis visible
- Possibilité de débannir

#### b) **Liste des Utilisateurs** 👥
- Affiche tous les utilisateurs avec profils liés
- Informations : Nom complet, ID, dates de création/connexion
- **Note** : Les emails ne sont pas accessibles sans Service Role Key

#### c) **Supprimer un Utilisateur** 🗑️
- Supprime les profils liés à un utilisateur
- Confirmation en deux clics pour éviter les erreurs
- **Note** : La suppression complète de `auth.users` nécessite Service Role

---

### 3. **Protection RLS Supabase**

- Seul l'admin peut bannir/débannir des emails
- Seul l'admin peut supprimer des utilisateurs
- Vérification automatique lors de l'inscription (emails bannis rejetés)

---

## 📂 Fichiers Créés

### Composants

1. **`/src/app/components/admin/AdminPanel.tsx`**
   - Interface du panneau d'administration
   - Gestion des bannissements
   - Liste des utilisateurs
   - Suppression de comptes

### Documentation

2. **`/ADMIN_GUIDE.md`**
   - Guide complet d'utilisation du panneau admin
   - Procédures step-by-step
   - Cas d'usage pratiques
   - Dépannage

3. **`/SUPABASE_ADMIN_SQL.md`**
   - Scripts SQL à exécuter dans Supabase
   - Création de la table `banned_emails`
   - Fonctions de vérification et suppression
   - Policies RLS de sécurité

4. **`/CHANGELOG_ADMIN.md`** (ce fichier)
   - Récapitulatif des changements

---

## 🔧 Fichiers Modifiés

### 1. `/src/app/components/home/Dashboard.tsx`

**Changements** :
- Import de `useState` et `Shield` icon
- Import de `AdminPanel`
- Variable `ADMIN_EMAIL` pour identifier l'admin
- État `showAdminPanel` pour afficher/masquer le panneau
- Variable `displayName` pour afficher le nom complet
- Bouton Shield (🛡️) visible uniquement pour l'admin
- Rendu conditionnel du panneau admin

**Nouvelles lignes** : ~20 lignes ajoutées

---

### 2. `/src/app/contexts/AppContext.tsx`

**Changements** (correction de bugs) :
- **Bug critique corrigé** : `setState(prev => ({...prev, ...}))` pour préserver l'état
- **Ajout de `userId`** dans le mapping des profils :
  ```typescript
  userId: p.user_id || undefined
  ```

**Impact** : 
- ✅ Fixe le bug de déconnexion automatique
- ✅ Les profils peuvent maintenant être filtrés par `userId`

---

### 3. `/src/app/components/auth/ProfileSelectorAfterAuth.tsx`

**Changements** :
- **Filtrage sécurisé** des profils :
  ```typescript
  const userProfiles = profiles.filter(p => 
    !p.isAdmin && 
    p.userId === supabaseUser?.id
  );
  ```

**Impact** : 
- ✅ Un utilisateur ne voit QUE ses propres profils
- ✅ Les profils d'autres utilisateurs sont invisibles

---

## 🔒 Sécurité Implémentée

### Frontend

1. **Vérification de l'email admin** :
   ```typescript
   const isAdmin = supabaseUser?.email === ADMIN_EMAIL;
   ```

2. **Affichage conditionnel** :
   - Bouton Shield visible uniquement pour l'admin
   - Panneau admin accessible uniquement si `isAdmin === true`

### Backend (Supabase)

1. **Row Level Security (RLS)** :
   - Seul l'admin peut insérer/supprimer dans `banned_emails`
   - Tout le monde peut lire (pour vérifier lors de l'inscription)

2. **Trigger automatique** :
   - Bloque l'inscription si l'email est banni
   - Erreur levée : `"This email address is banned"`

3. **Fonction de suppression** :
   - Vérifie que l'appelant est admin avant suppression
   - Erreur levée si non autorisé

---

## 🎨 Interface Utilisateur

### Panneau Admin

**Design** :
- Header rouge (danger) pour indiquer la zone admin
- Icône Shield (🛡️) pour identifier la section
- Cards organisées par fonctionnalité
- Messages de succès/erreur colorés
- Boutons de confirmation en deux étapes

**Responsive** :
- Fonctionne sur mobile et desktop
- Grilles adaptatives
- Texte tronqué sur petits écrans

---

## 📊 Base de Données

### Nouvelle Table : `banned_emails`

```sql
CREATE TABLE public.banned_emails (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Index** :
- `idx_banned_emails_email` pour recherche rapide

**RLS** :
- `SELECT` : Public (lecture seule)
- `INSERT` : Admin uniquement
- `DELETE` : Admin uniquement

---

## ⚠️ Limitations Connues

### 1. **Emails des utilisateurs non accessibles**

**Raison** : Supabase Auth API ne permet pas de lire les emails sans Service Role Key.

**Solution actuelle** : 
- Affichage du nom complet depuis `user_metadata`
- Affichage de l'ID partiel (`abc12345...`)

**Solution complète** (future) :
- Créer une Edge Function avec Service Role
- Appeler cette fonction pour récupérer les emails

---

### 2. **Suppression d'utilisateur incomplète**

**Raison** : Impossible de supprimer de `auth.users` sans Service Role Key.

**Solution actuelle** : 
- Suppression des profils liés
- L'utilisateur reste dans `auth.users` mais sans profil (inutilisable)

**Solution complète** (future) :
- Edge Function avec `supabase.auth.admin.deleteUser(userId)`

---

### 3. **Pas de bannissement par domaine**

**État** : Non implémenté

**Solution future** :
- Ajouter un champ `pattern` à `banned_emails`
- Support des wildcards (ex: `*@tempmail.com`)

---

## 🧪 Tests Recommandés

### Test 1 : Connexion avec nom complet

1. Créer un compte avec nom complet (ex: "Jean Dupont")
2. Se connecter
3. Vérifier que le Dashboard affiche : **"Bonjour, Jean Dupont"**

---

### Test 2 : Accès panneau admin

1. Se connecter avec `admin2647595726151748@gmail.com`
2. Vérifier que le bouton Shield (🛡️) est visible
3. Cliquer sur le bouton
4. Vérifier l'affichage du panneau admin

---

### Test 3 : Bannir un email

1. Accéder au panneau admin
2. Entrer un email de test (ex: `test@example.com`)
3. Cliquer sur "Bannir cet email"
4. Vérifier que l'email apparaît dans "Emails bannis"
5. Essayer de créer un compte avec cet email
6. Vérifier que l'inscription est bloquée

---

### Test 4 : Débannir un email

1. Dans la liste "Emails bannis"
2. Cliquer sur "Débannir" pour un email
3. Vérifier que l'email disparaît de la liste
4. Essayer de créer un compte avec cet email
5. Vérifier que l'inscription fonctionne

---

### Test 5 : Supprimer un utilisateur

1. Créer un compte de test
2. Lier un profil à ce compte
3. Depuis le panneau admin, cliquer sur "Supprimer"
4. Cliquer à nouveau pour confirmer
5. Vérifier que le profil disparaît de la liste

---

## 📦 Dépendances

Aucune nouvelle dépendance ajoutée. Utilise les packages existants :
- `lucide-react` (icônes)
- `@supabase/supabase-js` (backend)
- React hooks (`useState`, `useEffect`, `useMemo`)

---

## 🚀 Déploiement

### Étapes Critiques

1. **Exécuter les scripts SQL** :
   - Ouvrir Supabase SQL Editor
   - Copier-coller les scripts de `/SUPABASE_ADMIN_SQL.md`
   - Exécuter tous les scripts

2. **Vérifier les policies RLS** :
   - Aller dans Supabase Dashboard → Database → Policies
   - Vérifier que `banned_emails` a les bonnes policies

3. **Créer le compte admin** :
   - S'inscrire avec l'email admin via l'app
   - Ou créer manuellement dans Supabase Dashboard

4. **Tester l'accès admin** :
   - Se connecter avec le compte admin
   - Vérifier le bouton Shield
   - Tester le bannissement d'un email

---

## 🔄 Migrations Futures

### Fonctionnalités Prévues

1. **Dashboard statistiques** :
   - Nombre d'utilisateurs actifs
   - Graphiques de connexions
   - Tendances d'inscription

2. **Gestion avancée** :
   - Bannissement par domaine (`*@tempmail.com`)
   - Rôles multiples (admin, modérateur, etc.)
   - Permissions granulaires

3. **Logs d'activité** :
   - Table `admin_audit_log`
   - Tracking de toutes les actions admin
   - Export CSV/JSON

4. **Notifications** :
   - Email à l'admin lors d'événements critiques
   - Alertes pour comportements suspects

---

## 📞 Support

**Documentation** :
- `/ADMIN_GUIDE.md` : Guide utilisateur complet
- `/SUPABASE_ADMIN_SQL.md` : Scripts SQL

**Logs** :
- Console navigateur (F12) pour erreurs frontend
- Supabase Dashboard → Logs pour erreurs backend

**Questions** :
- Documentation Supabase : https://supabase.com/docs
- Documentation React : https://react.dev/

---

## ✅ Checklist de Déploiement

- [ ] Scripts SQL exécutés dans Supabase
- [ ] Table `banned_emails` créée
- [ ] Trigger `check_banned_email` actif
- [ ] Policies RLS configurées
- [ ] Compte admin créé
- [ ] Test d'accès au panneau admin réussi
- [ ] Test de bannissement d'email réussi
- [ ] Test de débannissement réussi
- [ ] Test d'affichage du nom complet réussi
- [ ] Code déployé en production

---

**Date de création** : 2 février 2026  
**Version** : 1.0.0  
**Auteur** : Système d'Administration My Garage

🎉 **Le système d'administration est maintenant opérationnel !**
