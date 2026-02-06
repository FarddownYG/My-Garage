# 🔄 RÉINITIALISATION PAR PROFIL

## ✅ MODIFICATION EFFECTUÉE

Le bouton **"Réinitialiser les données"** dans les paramètres supprime maintenant **uniquement les données du profil actuel**, et non plus toutes les données de l'application.

---

## 🎯 CE QUI EST SUPPRIMÉ

Quand tu cliques sur "Réinitialiser les données du profil" :

### ✅ Supprimé

- ✅ **Tous les véhicules** du profil actuel
- ✅ **Tous les entretiens** de ces véhicules
- ✅ **Toutes les tâches** de ces véhicules
- ✅ **Tous les rappels** de ces véhicules
- ✅ **Templates personnalisés** créés par ce profil (ceux avec `is_custom = true`)

### ❌ Conservé

- ❌ **Le profil lui-même** (nom, avatar, PIN, etc.)
- ❌ **Les autres profils** (Sarah, Marc, etc.)
- ❌ **Leurs véhicules et données**
- ❌ **Les templates par défaut** (41 templates de base essence/diesel/4x2/4x4)
- ❌ **La configuration admin** (PIN admin, etc.)

---

## 📋 EXEMPLE

### Situation de départ

```
Profil "Sarah"
├─ Véhicule 1: BMW
│  ├─ 5 entretiens
│  ├─ 2 tâches
│  └─ 3 rappels
└─ Véhicule 2: Audi
   ├─ 10 entretiens
   └─ 1 tâche

Profil "Marc"
└─ Véhicule 3: Mercedes
   └─ 8 entretiens
```

### Après réinitialisation du profil "Sarah"

```
Profil "Sarah" (VIDE)
└─ (aucun véhicule)

Profil "Marc" (INTACT)
└─ Véhicule 3: Mercedes
   └─ 8 entretiens
```

---

## 🔔 MESSAGE DE CONFIRMATION

Avant de supprimer, tu verras ce message :

```
⚠️ Cette action supprimera TOUTES les données du profil "Sarah" :

• Tous les véhicules
• Tous les entretiens
• Toutes les tâches
• Tous les rappels
• Les templates personnalisés

Le profil lui-même sera conservé.

Êtes-vous sûr ?
```

Puis une deuxième confirmation :

```
Dernière confirmation : toutes les données de "Sarah" seront perdues définitivement.
```

---

## 💡 UTILISATION

### Cas d'usage

1. **Nettoyer un profil de test** sans supprimer le profil
2. **Repartir de zéro** avec le même profil
3. **Supprimer toutes les données** d'un utilisateur qui quitte l'app
4. **Réinitialiser après des tests** sans perdre les autres profils

### Comment faire

1. **Connecte-toi** avec le profil à réinitialiser
2. Va dans **Paramètres** (⚙️ en bas à droite)
3. Fais défiler jusqu'à **"Réinitialiser les données du profil"**
4. **Confirme** 2 fois
5. ✅ **C'est fait !** Le profil est vide

---

## 🔄 CE QUI SE PASSE TECHNIQUEMENT

### 1. Récupération des véhicules

```sql
SELECT id FROM vehicles WHERE owner_id = 'ID_DU_PROFIL';
```

### 2. Suppression des entretiens

```sql
DELETE FROM maintenance_entries 
WHERE vehicle_id IN (liste des véhicules);
```

### 3. Suppression des tâches

```sql
DELETE FROM tasks 
WHERE vehicle_id IN (liste des véhicules);
```

### 4. Suppression des rappels

```sql
DELETE FROM reminders 
WHERE vehicle_id IN (liste des véhicules);
```

### 5. Suppression des véhicules

```sql
DELETE FROM vehicles 
WHERE owner_id = 'ID_DU_PROFIL';
```

### 6. Suppression des templates personnalisés

```sql
DELETE FROM maintenance_templates 
WHERE owner_id = 'ID_DU_PROFIL' AND is_custom = true;
```

### 7. Rechargement des données

L'app recharge automatiquement toutes les données depuis Supabase pour mettre à jour l'affichage.

---

## 🔒 SÉCURITÉ

### Protection contre les suppressions accidentelles

- ✅ **2 confirmations** avant suppression
- ✅ **Message clair** sur ce qui va être supprimé
- ✅ **Isolation par profil** : Impossible de supprimer les données d'autres profils
- ✅ **Conservation du profil** : Tu peux recréer des véhicules après

### Protection Row Level Security (RLS)

Les politiques Supabase garantissent que :

- ✅ Un utilisateur ne peut supprimer **que ses propres véhicules**
- ✅ Les entretiens/tâches/rappels sont **automatiquement supprimés** (CASCADE)
- ✅ Les templates par défaut **ne peuvent pas être supprimés** (is_custom = false)

---

## 🆘 RÉCUPÉRATION

### Si tu supprimes par erreur

**AVANT LA SUPPRESSION** : Pas de récupération possible SAUF si tu as :

1. **Backup Supabase activé** (PITR)
   - Dashboard → Settings → Database → Backups
   - Coût : ~$100/mois
   - Permet de restaurer à n'importe quelle date

2. **Export manuel**
   - Paramètres → Exporter les données
   - Fichier JSON chiffré
   - Importer via Paramètres → Importer les données

### APRÈS LA SUPPRESSION

Si tu n'as ni backup ni export :

- ❌ **Les données sont perdues définitivement**
- ✅ **Le profil existe toujours** → Tu peux recréer des véhicules
- ✅ **Les templates par défaut sont toujours là**

---

## 🧪 TEST

### Tester sans risque

1. **Crée un profil de test** (ex: "Test Delete")
2. **Ajoute un véhicule** avec quelques entretiens
3. **Réinitialise les données** de ce profil
4. **Vérifie** que tes autres profils sont intacts

### Commande SQL de vérification

```sql
-- Voir tous les profils et leur nombre de véhicules
SELECT 
  p.first_name as profil,
  COUNT(v.id) as nb_vehicules
FROM profiles p
LEFT JOIN vehicles v ON v.owner_id = p.id
WHERE p.is_admin = false
GROUP BY p.id, p.first_name
ORDER BY p.first_name;
```

---

## 📊 DIFFÉRENCE AVANT/APRÈS

### AVANT ❌

```
Réinitialiser les données
→ Supprime TOUT dans l'app
→ Tous les profils supprimés
→ Toutes les données perdues
→ Déconnexion forcée
```

### APRÈS ✅

```
Réinitialiser les données du profil
→ Supprime uniquement le profil actuel
→ Les autres profils sont conservés
→ Pas de déconnexion
→ Le profil reste accessible (vide)
```

---

## 🎯 PROCHAINES AMÉLIORATIONS POSSIBLES

### Option 1 : Réinitialisation sélective

Permettre de choisir ce qu'on veut supprimer :

```
☑️ Véhicules
☑️ Entretiens
☐ Tâches
☐ Rappels
☐ Templates personnalisés
```

### Option 2 : Corbeille temporaire

Garder les données supprimées 30 jours avant suppression définitive :

```
vehicles
├─ deleted_at: NULL (actif)
└─ deleted_at: 2026-02-01 (dans la corbeille)
```

### Option 3 : Export automatique

Créer automatiquement un export avant chaque réinitialisation :

```
✅ Données supprimées !
💾 Backup sauvegardé : backup-sarah-2026-02-03.json
```

---

## 🚀 RÉSUMÉ

✅ **Le bouton réinitialise uniquement le profil actuel**
✅ **Les autres profils sont protégés**
✅ **Le profil lui-même est conservé**
✅ **Templates par défaut intacts**
✅ **2 confirmations avant suppression**

---

**C'EST FAIT ! Maintenant tu peux nettoyer un profil sans tout casser. 🎉**
