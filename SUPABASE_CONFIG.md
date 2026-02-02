# 🔧 Configuration Supabase - Guide Complet

## 📋 Résumé Rapide

**3 scripts SQL à exécuter** dans le SQL Editor de Supabase :
1. ✅ Script 1 : Ajout des colonnes (user_id, is_migrated, migrated_at)
2. ✅ Script 2 : Fonction de migration (migrate_profile_to_user)
3. ✅ Script 3 : Politiques RLS (18 policies)

**Temps estimé :** 5-10 minutes

---

## 🚀 EXÉCUTION RAPIDE

### Ouvrir le SQL Editor
1. [https://app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet
3. **SQL Editor** → **New query**

### Copier-Coller les 3 Scripts

Ouvrez le fichier **`/SUPABASE_SQL_SCRIPTS.sql`** et exécutez les 3 scripts dans l'ordre.

**OU** suivez le guide détaillé dans **`/GUIDE_EXECUTION_SQL.md`**.

---

## ⚠️ Configuration Email (Optionnel)

### Problème : "Email not confirmed"

Par défaut, Supabase demande une confirmation d'email lors de l'inscription.

#### ✅ Option 1 : Confirmer l'Email (Production)
1. Un email est envoyé automatiquement
2. Vérifiez votre boîte mail (spams inclus)
3. Cliquez sur le lien de confirmation
4. Connectez-vous à l'app

#### ✅ Option 2 : Désactiver la Confirmation (Dev/Test)

**⚠️ À faire UNIQUEMENT en développement !**

1. Supabase Dashboard
2. **Authentication** → **Providers** → **Email**
3. **Désactiver** l'option **"Confirm email"**
4. **Save**

Les nouveaux comptes n'auront plus besoin de confirmation.

---

## 📊 Vérification de l'Installation

Après avoir exécuté les 3 scripts, vérifiez :

```sql
-- Vérifier TOUT en une requête
SELECT 
  'Colonnes profiles' as check_type,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('user_id', 'is_migrated', 'migrated_at')

UNION ALL

SELECT 
  'Fonction migration',
  COUNT(*)
FROM information_schema.routines
WHERE routine_name = 'migrate_profile_to_user'

UNION ALL

SELECT 
  'Policies RLS',
  COUNT(*)
FROM pg_policies
WHERE schemaname = 'public';
```

### ✅ Résultat Attendu
```
Colonnes profiles       | 3
Fonction migration      | 1
Policies RLS            | 18+
```

**Si vous voyez ces valeurs, c'est parfait ! 🎉**

---

## 🧪 Tests à Effectuer

### Test 1 : Créer un Compte
1. Lancez l'application
2. Cliquez sur **"Créer un compte"**
3. Remplissez email + password
4. Vérifiez que le compte est créé ✅

### Test 2 : Migrer des Profils
1. Si vous avez des profils existants (Sarah, Marc...)
2. L'écran de migration s'affiche automatiquement
3. Cliquez sur un profil
4. Entrez le PIN si nécessaire
5. Vérifiez que le profil disparaît de la liste ✅

### Test 3 : Isolation des Données
1. Créez un 2ème compte avec un autre email
2. Vérifiez que vous ne voyez QUE les profils de ce compte
3. Les profils de l'autre compte ne sont PAS visibles ✅

### Test 4 : Déconnexion
1. Déconnectez-vous
2. Reconnectez-vous
3. Vérifiez que vos données sont toujours là ✅

---

## 🔐 Sécurité RLS (Row Level Security)

### Tables Protégées
- ✅ **profiles** (4 policies)
- ✅ **vehicles** (4 policies)
- ✅ **maintenance_entries** (2 policies)
- ✅ **tasks** (2 policies)
- ✅ **reminders** (2 policies)
- ✅ **maintenance_templates** (2 policies)
- ✅ **maintenance_profiles** (2 policies)

### Principe d'Isolation
- Chaque utilisateur voit **UNIQUEMENT** ses propres données
- Les profils non migrés (`user_id IS NULL`) sont visibles à tous (pour la migration)
- Une fois migrés, ils deviennent privés au propriétaire

---

## 🆘 Dépannage

### Erreur : "Email not confirmed"
→ Vérifiez votre boîte mail OU désactivez la confirmation (voir ci-dessus)

### Erreur : "Too many requests" / "after 55 seconds"
→ Attendez le délai indiqué (rate limiting Supabase)  
→ Le compte à rebours s'affiche automatiquement dans l'app

### Erreur : "Invalid login credentials"
→ Vérifiez l'email et le mot de passe  
→ Créez un nouveau compte si nécessaire

### Erreur : "Row Level Security policy violation"
→ Exécutez le Script 3 (RLS policies)  
→ Vérifiez que RLS est activé sur les tables

### Erreur : "Function migrate_profile_to_user does not exist"
→ Exécutez le Script 2 (fonction de migration)

### Erreur : "column user_id does not exist"
→ Exécutez le Script 1 (ajout des colonnes)

### Profil ne disparaît pas après migration
→ Vérifiez dans la console : logs de migration  
→ Vérifiez que `user_id` est défini après migration :
```sql
SELECT id, name, user_id, is_migrated 
FROM profiles;
```

---

## 📁 Fichiers de Référence

1. **`/SUPABASE_SQL_SCRIPTS.sql`**  
   → Tous les scripts SQL à exécuter (commentés)

2. **`/GUIDE_EXECUTION_SQL.md`**  
   → Guide pas-à-pas détaillé avec captures et vérifications

3. **`/AUDIT_PRE_DEPLOYMENT.md`**  
   → Audit complet du code et de la configuration

4. **`/MIGRATION_FLOW.md`**  
   → Explication détaillée du flux de migration

---

## ✅ Checklist Finale

### Configuration Supabase
- [ ] Script 1 exécuté (colonnes)
- [ ] Script 2 exécuté (fonction)
- [ ] Script 3 exécuté (RLS policies)
- [ ] Confirmation email désactivée (si dev/test)

### Tests
- [ ] Compte créé avec succès
- [ ] Connexion fonctionne
- [ ] Migration des profils OK
- [ ] Profils migrés disparaissent de la liste
- [ ] Isolation des données vérifiée
- [ ] Déconnexion/reconnexion OK

### Code
- [ ] Aucune erreur console
- [ ] Rate limiting géré
- [ ] Messages en français
- [ ] Protection PIN respectée

---

## 🎊 Configuration Complète !

Si toutes les cases sont cochées, votre application est **100% prête** pour la production !

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs console (F12)
2. Vérifiez les logs Supabase Dashboard
3. Relisez la documentation ci-dessus
4. Consultez `/GUIDE_EXECUTION_SQL.md` pour les détails

**Bon développement ! 🚀**
