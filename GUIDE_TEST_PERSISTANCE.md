# 🧪 GUIDE DE TEST - PERSISTANCE DES MODIFICATIONS

## 🎯 OBJECTIF

Vérifier que les modifications sont bien sauvegardées et persistent après déconnexion/reconnexion.

---

## ✅ TEST 1 : MODIFICATION DE PROFIL

### Préparation
1. Crée 2 comptes différents :
   - **Compte A** : `test-a@example.com`
   - **Compte B** : `test-b@example.com`

### Étapes
1. **Connecte-toi au Compte A**
2. Va dans **Paramètres** → **Profils**
3. Modifie ton profil :
   - Change le prénom : "Alice"
   - Change l'avatar : "🚗"
   - Active le PIN : "1234"
4. **Ouvre la console** (F12 → Console)
5. Vérifie les logs :
   ```
   💾 Mise à jour profil Supabase: { ... }
   ✅ Profil sauvegardé dans Supabase
   📥 Chargement des données depuis Supabase...
   ✅ Données rechargées depuis Supabase
   ```
6. **Déconnecte-toi**
7. **Connecte-toi au Compte B**
8. Vérifie que tu ne vois PAS les modifs du Compte A
9. **Déconnecte-toi**
10. **Reconnecte-toi au Compte A**
11. ✅ Vérifie que les modifications sont toujours là :
    - ✅ Prénom = "Alice"
    - ✅ Avatar = "🚗"
    - ✅ PIN = "1234"

### Résultat attendu
✅ **Toutes les modifications sont persistées**

### En cas d'échec
❌ Si les modifications ont disparu :
1. Vérifie la console : Cherche `❌ Erreur mise à jour profil`
2. Vérifie Supabase SQL :
   ```sql
   SELECT * FROM profiles WHERE user_id = auth.uid();
   ```
3. Partage les logs console

---

## ✅ TEST 2 : MODIFICATION DE VÉHICULE

### Étapes
1. **Connecte-toi au Compte A**
2. Va dans **Véhicules**
3. Crée un véhicule :
   - Nom : "Tesla"
   - Marque : "Tesla"
   - Modèle : "Model 3"
   - Kilométrage : 10000
4. **Modifie le véhicule** :
   - Change le nom : "Tesla Model 3 Performance"
   - Change le kilométrage : 15000
5. **Ouvre la console** (F12)
6. Vérifie les logs :
   ```
   💾 Mise à jour véhicule: { ... }
   ✅ Véhicule sauvegardé
   📥 Chargement des données depuis Supabase...
   ```
7. **Déconnecte-toi**
8. **Connecte-toi au Compte B**
9. Vérifie que tu ne vois PAS le véhicule du Compte A
10. **Déconnecte-toi**
11. **Reconnecte-toi au Compte A**
12. ✅ Vérifie que le véhicule est toujours là avec les bonnes infos :
    - ✅ Nom = "Tesla Model 3 Performance"
    - ✅ Kilométrage = 15000

### Résultat attendu
✅ **Le véhicule est sauvegardé avec les modifications**

---

## ✅ TEST 3 : ISOLATION ENTRE COMPTES

### Étapes
1. **Compte A** : Crée un véhicule "BMW X5"
2. **Compte A** : Note l'ID du véhicule (dans les logs console)
3. **Déconnecte-toi**
4. **Compte B** : Connecte-toi
5. **Compte B** : Crée un véhicule "Audi A4"
6. ✅ Vérifie que tu ne vois PAS "BMW X5"
7. **Déconnecte-toi**
8. **Compte A** : Reconnecte-toi
9. ✅ Vérifie que tu vois "BMW X5"
10. ✅ Vérifie que tu ne vois PAS "Audi A4"

### Vérification Supabase (Optionnel)
```sql
-- Compte A
SELECT * FROM vehicles WHERE owner_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
);
-- Devrait retourner uniquement "BMW X5"

-- Compte B
SELECT * FROM vehicles WHERE owner_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
);
-- Devrait retourner uniquement "Audi A4"
```

### Résultat attendu
✅ **Isolation complète : chaque compte ne voit que ses propres données**

---

## ✅ TEST 4 : MODIFICATION D'ENTRETIEN

### Étapes
1. **Connecte-toi au Compte A**
2. Crée un véhicule si pas déjà fait
3. Ajoute un entretien :
   - Type : "Vidange"
   - Date : Aujourd'hui
   - Kilométrage : 15000
   - Coût : 80 €
4. **Modifie l'entretien** :
   - Change le coût : 100 €
   - Ajoute une note : "Changement filtre"
5. **Déconnecte-toi**
6. **Reconnecte-toi au Compte A**
7. ✅ Vérifie que l'entretien est toujours là :
   - ✅ Coût = 100 €
   - ✅ Note = "Changement filtre"

### Résultat attendu
✅ **L'entretien est sauvegardé avec les modifications**

---

## ✅ TEST 5 : MODIFICATION DE TÂCHE

### Étapes
1. **Connecte-toi au Compte A**
2. Crée une tâche :
   - Titre : "Contrôle technique"
   - Description : "Prise de RDV"
3. **Modifie la tâche** :
   - Change la description : "RDV pris pour le 15/02"
   - Ajoute un lien : https://example.com
4. **Marque la tâche comme terminée**
5. **Déconnecte-toi**
6. **Reconnecte-toi au Compte A**
7. ✅ Vérifie que la tâche est toujours là :
   - ✅ Description = "RDV pris pour le 15/02"
   - ✅ Lien présent
   - ✅ État = Terminée ✓

### Résultat attendu
✅ **La tâche est sauvegardée avec toutes les modifications**

---

## ✅ TEST 6 : MULTIPLES MODIFICATIONS SUCCESSIVES

### Étapes
1. **Connecte-toi au Compte A**
2. Crée un véhicule "Peugeot 208"
3. **Modifie-le 5 fois de suite** :
   - Modification 1 : Kilométrage = 5000
   - Modification 2 : Kilométrage = 6000
   - Modification 3 : Kilométrage = 7000
   - Modification 4 : Kilométrage = 8000
   - Modification 5 : Kilométrage = 9000
4. **Déconnecte-toi immédiatement**
5. **Reconnecte-toi**
6. ✅ Vérifie que le kilométrage = 9000 (dernière valeur)

### Résultat attendu
✅ **La dernière modification est bien sauvegardée**

---

## 🔍 VÉRIFICATIONS SUPABASE

### Vérifier le user_id d'un profil
```sql
SELECT 
  id,
  first_name,
  user_id,
  created_at
FROM profiles
WHERE user_id = auth.uid();
```

**Résultat attendu** :
- ✅ 1 ligne retournée
- ✅ `user_id` = ton UUID Supabase
- ✅ `first_name` = ton prénom

### Vérifier les véhicules d'un compte
```sql
SELECT 
  v.id,
  v.name,
  v.mileage,
  p.first_name as "Propriétaire"
FROM vehicles v
INNER JOIN profiles p ON v.owner_id = p.id
WHERE p.user_id = auth.uid();
```

**Résultat attendu** :
- ✅ Tous tes véhicules apparaissent
- ✅ Aucun véhicule d'un autre utilisateur

### Vérifier l'historique des modifications (si disponible)
```sql
-- Voir la date de dernière modification
SELECT 
  id,
  name,
  mileage,
  updated_at
FROM vehicles
WHERE owner_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
)
ORDER BY updated_at DESC;
```

---

## 📊 CHECKLIST FINALE

### Avant de valider
- [ ] ✅ Test 1 (Profil) : Modifications persistées
- [ ] ✅ Test 2 (Véhicule) : Modifications persistées
- [ ] ✅ Test 3 (Isolation) : Comptes séparés
- [ ] ✅ Test 4 (Entretien) : Modifications persistées
- [ ] ✅ Test 5 (Tâche) : Modifications persistées
- [ ] ✅ Test 6 (Multiples modifs) : Dernière valeur conservée
- [ ] ✅ Logs console propres (pas d'erreur)
- [ ] ✅ Vérification Supabase OK

### Si tous les tests passent
✅ **Le problème de persistance est résolu !**

### Si un test échoue
1. Note le numéro du test qui échoue
2. Copie les logs console complets
3. Fais une capture d'écran
4. Vérifie la requête SQL Supabase correspondante
5. Partage ces informations

---

## 🐛 DÉPANNAGE

### Problème : Modifications disparaissent
**Symptôme** : Les modifications sont présentes juste après la sauvegarde mais disparaissent après déconnexion/reconnexion

**Solutions** :
1. Vérifie les logs console :
   ```
   💾 Mise à jour profil Supabase
   ✅ Profil sauvegardé dans Supabase
   📥 Chargement des données depuis Supabase...
   ```
   Si tu ne vois pas `📥 Chargement des données`, c'est un problème de rechargement.

2. Vérifie Supabase directement :
   ```sql
   SELECT * FROM profiles WHERE id = 'TON_PROFILE_ID';
   ```
   Si les données sont correctes dans Supabase mais pas dans l'app, c'est un problème de chargement.

3. Vérifie le `user_id` :
   ```sql
   SELECT id, first_name, user_id FROM profiles WHERE user_id = auth.uid();
   ```
   Si `user_id` est NULL, c'est un problème de création.

### Problème : Erreur lors de la sauvegarde
**Symptôme** : Message d'erreur dans la console lors de la modification

**Solutions** :
1. Cherche `❌ Erreur mise à jour profil` dans la console
2. Note le message d'erreur complet
3. Vérifie les policies RLS :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
4. Teste la requête manuellement :
   ```sql
   UPDATE profiles 
   SET first_name = 'Test' 
   WHERE id = 'TON_PROFILE_ID' AND user_id = auth.uid();
   ```

### Problème : Rechargement trop lent
**Symptôme** : Délai important après chaque modification

**Explication** : Le rechargement complet après chaque modification est volontaire pour garantir la cohérence. Si c'est trop lent :
1. Vérifie ta connexion internet
2. Vérifie le nombre de données (véhicules, entretiens, etc.)
3. Si tu as >100 entretiens, ça peut être normal

**Amélioration future** : Rechargement partiel au lieu de complet

---

## ✅ CONCLUSION

Si tous les tests passent :
1. ✅ Les modifications sont maintenant persistées
2. ✅ L'isolation entre comptes fonctionne
3. ✅ Les données sont cohérentes entre sessions

**Le problème est résolu ! 🎉**
