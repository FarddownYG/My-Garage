# 🔒 INSTALLATION RAPIDE - ROW LEVEL SECURITY

## ⚡ EN 3 MINUTES

### Étape 1 : Copier le script SQL
1. Ouvre le fichier **`supabase-rls-policies.sql`**
2. Copie **TOUT** le contenu (Ctrl+A, Ctrl+C)

---

### Étape 2 : Exécuter dans Supabase
1. Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet
3. Clique sur **SQL Editor** (menu de gauche)
4. Clique sur **"New Query"**
5. Colle le script SQL
6. Clique sur **RUN** (ou Ctrl+Enter)

**✅ Résultat attendu :**
```
Success. No rows returned.
```

---

### Étape 3 : Vérifier que RLS est activé

Exécute cette requête dans SQL Editor :

```sql
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 
    'vehicles', 
    'maintenance_entries', 
    'tasks', 
    'reminders', 
    'maintenance_templates', 
    'maintenance_profiles'
  );
```

**✅ Résultat attendu :**
Toutes les lignes doivent avoir `rowsecurity = true`

```
tablename               | rowsecurity
------------------------+-------------
profiles                | true
vehicles                | true
maintenance_entries     | true
tasks                   | true
reminders               | true
maintenance_templates   | true
maintenance_profiles    | true
```

---

## 🎯 C'EST TOUT !

**Ton app est maintenant sécurisée et optimisée !**

### Prochaines étapes :

1. ✅ **Teste l'app** avec 2 comptes différents
2. ✅ **Vérifie** que chaque user voit uniquement ses données
3. ✅ **Profite** des performances améliorées !

---

## 🆘 EN CAS DE PROBLÈME

### Erreur : "permission denied for table vehicles"

**Cause :** RLS est activé mais les policies ne sont pas créées

**Solution :**
```sql
-- Désactiver temporairement RLS pour déboguer
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

-- Puis réactiver après avoir exécuté les policies
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
```

---

### Les policies ne fonctionnent pas

**Vérifier qu'elles sont créées :**
```sql
SELECT * FROM pg_policies WHERE tablename = 'vehicles';
```

**Si vide :** Réexécute le script `supabase-rls-policies.sql`

---

### Je vois "0 vehicles" dans l'app

**Cause possible :** Les véhicules ont été créés AVANT d'activer RLS

**Solution :** Vérifie que les véhicules ont un `owner_id` valide
```sql
SELECT id, name, owner_id FROM vehicles;
```

Si `owner_id` est NULL ou invalide, mets-le à jour :
```sql
UPDATE vehicles 
SET owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
WHERE owner_id IS NULL;
```

---

## 📞 SUPPORT

Si tu as encore des problèmes :

1. Vérifie les logs dans la console du navigateur (F12)
2. Vérifie les erreurs dans Supabase > Logs
3. Partage les logs pour que je puisse t'aider !

---

**C'est parti ! 🚀**
