# 🔧 FIX: Invalid Refresh Token Error

## 🎯 PROBLÈME
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

Cette erreur survient quand le refresh token stocké dans le navigateur est invalide, expiré, ou révoqué.

---

## ✅ SOLUTION AUTOMATIQUE

Le code a été mis à jour pour gérer automatiquement ce problème :

1. **Détection automatique** : L'erreur est interceptée à plusieurs niveaux
2. **Nettoyage automatique** : La session invalide est supprimée
3. **Redirection** : L'utilisateur est redirigé vers l'écran de connexion

---

## 🔧 SOLUTIONS MANUELLES

### Solution 1 : Rafraîchir l'application (Rapide)

1. **Appuie sur F5** pour rafraîchir la page
2. ✅ L'erreur devrait disparaître automatiquement
3. Tu seras redirigé vers l'écran de connexion

### Solution 2 : Nettoyer le localStorage (Si F5 ne suffit pas)

1. **Ouvre la console** du navigateur (F12)
2. Va dans l'onglet **Console**
3. Tape et exécute :
   ```javascript
   localStorage.clear();
   location.reload();
   ```
4. ✅ Toutes les données locales sont supprimées
5. Reconnecte-toi normalement

### Solution 3 : Mode navigation privée (Test)

1. Ouvre une fenêtre de **navigation privée** (Ctrl+Shift+N sur Chrome)
2. Va sur ton application
3. Connecte-toi
4. ✅ Si ça fonctionne, le problème vient du localStorage

---

## 🔍 CAUSES POSSIBLES

### Cause 1 : Session expirée
- **Symptôme** : Tu n'as pas ouvert l'app depuis longtemps
- **Solution** : Rafraîchir la page (F5)

### Cause 2 : Token révoqué côté Supabase
- **Symptôme** : Tu as changé ton mot de passe récemment
- **Solution** : Reconnecter avec le nouveau mot de passe

### Cause 3 : Plusieurs onglets ouverts
- **Symptôme** : Tu as l'app ouverte dans plusieurs onglets
- **Solution** : Fermer tous les onglets sauf un, puis rafraîchir

### Cause 4 : Déconnexion depuis un autre appareil
- **Symptôme** : Tu t'es déconnecté depuis un autre navigateur/appareil
- **Solution** : Te reconnecter

### Cause 5 : Cache navigateur corrompu
- **Symptôme** : L'erreur persiste même après F5
- **Solution** : Vider le cache (Ctrl+Shift+Delete)

---

## 🚨 SI LE PROBLÈME PERSISTE

### Étape 1 : Nettoyer complètement Supabase localStorage

Dans la console (F12 → Console) :

```javascript
// Supprimer toutes les clés Supabase
Object.keys(localStorage)
  .filter(key => key.startsWith('sb-') || key.includes('supabase'))
  .forEach(key => localStorage.removeItem(key));

// Recharger
location.reload();
```

### Étape 2 : Vérifier les cookies Supabase

1. Ouvre les **Outils de développement** (F12)
2. Va dans **Application** (Chrome) ou **Stockage** (Firefox)
3. Clique sur **Cookies**
4. Supprime tous les cookies contenant "supabase"
5. Rafraîchis la page

### Étape 3 : Révoquer toutes les sessions (Supabase Dashboard)

Si tu as accès au Supabase Dashboard :

1. Va sur **Authentication** → **Users**
2. Trouve ton utilisateur
3. Clique sur les 3 points → **Sign out user**
4. ✅ Toutes les sessions sont révoquées
5. Reconnecte-toi dans l'app

---

## 🔧 VÉRIFIER LE PROBLÈME (Console)

Ouvre la console (F12) et cherche ces messages :

### ✅ Messages normaux (pas d'erreur)
```
🚀 INITIALISATION APP...
🔐 User actuel: ton-email@example.com
✅ Initialisation terminée
```

### ❌ Messages d'erreur
```
❌ Erreur getUser(): AuthApiError: Invalid Refresh Token
⚠️ Token invalide détecté, nettoyage...
🧹 Nettoyage de la session invalide...
```

Si tu vois les messages d'erreur, le nettoyage automatique devrait se déclencher.

---

## 🎯 PRÉVENTION

Pour éviter cette erreur à l'avenir :

1. **Ne pas ouvrir l'app dans trop d'onglets** (max 2-3)
2. **Te déconnecter proprement** avant de fermer le navigateur
3. **Utiliser un seul appareil** à la fois
4. **Ne pas modifier ton mot de passe** sans te déconnecter d'abord

---

## 🧪 TESTER LA CORRECTION

1. **Ouvre l'application**
2. Si tu vois l'erreur de refresh token :
   - ✅ Un message "Session expirée" devrait apparaître
   - ✅ Compte à rebours automatique (3, 2, 1...)
   - ✅ Rechargement automatique
   - ✅ Redirection vers l'écran de connexion

3. **Reconnecte-toi**
4. ✅ Tout devrait fonctionner normalement

---

## 📞 BESOIN D'AIDE ?

Si le problème persiste après avoir suivi TOUTES ces étapes :

1. Prends une **capture d'écran** de la console (F12 → Console)
2. Note les **messages d'erreur exacts**
3. Indique :
   - Navigateur utilisé (Chrome, Firefox, Safari, etc.)
   - Système d'exploitation (Windows, Mac, Linux)
   - Étapes déjà essayées

---

## ✅ RÉSUMÉ RAPIDE

**Erreur "Invalid Refresh Token" ?**

1. **Appuie sur F5** → Problème résolu ? ✅ Stop
2. Sinon : **Console → `localStorage.clear(); location.reload();`**
3. Sinon : **Navigation privée** → Tester
4. Sinon : **Supabase Dashboard** → Sign out user
5. **Reconnecte-toi** dans l'app

Dans 99% des cas, F5 ou `localStorage.clear()` résout le problème.
