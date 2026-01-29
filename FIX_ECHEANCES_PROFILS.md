# 🔧 Correction : Échéances et Profils d'Entretien Personnalisés

**Date:** 29 janvier 2026  
**Problème:** Les échéances affichaient tous les templates (généraux + personnalisés) au lieu de filtrer selon le profil associé au véhicule

---

## 🐛 Le Problème

### Comportement Incorrect (Avant)
```
Voiture reliée à "Profil Entretien Sportif"
  ↓
Échéances affichées :
  ✅ Templates du profil personnalisé
  ❌ Templates généraux (ne devrait PAS apparaître)
```

### Résultat
- **Confusion** : Trop d'échéances affichées
- **Doublons** : Même type d'entretien en général ET personnalisé
- **Pas de différenciation** : Le profil personnalisé ne sert à rien si on voit aussi les généraux

---

## ✅ La Solution

### Comportement Correct (Après)
```
Voiture reliée à "Profil Entretien Sportif"
  ↓
Échéances affichées :
  ✅ UNIQUEMENT les templates du profil personnalisé
  ❌ Templates généraux exclus
```

```
Voiture SANS profil personnalisé
  ↓
Échéances affichées :
  ✅ Templates généraux (filtrés par motorisation/transmission)
  ❌ Templates de profils personnalisés exclus
```

---

## 🔧 Fichiers Modifiés

### 1. `/src/app/utils/alerts.ts`

**Avant :**
```typescript
export function calculateUpcomingAlerts(
  vehicles: Vehicle[],
  maintenances: MaintenanceRecord[],
  templates: MaintenanceTemplate[]
): UpcomingAlert[] {
  // ...
  const applicableTemplates = templates.filter((template) => {
    // Filtrage par motorisation uniquement
    // ❌ Pas de vérification du profil personnalisé
  });
}
```

**Après :**
```typescript
export function calculateUpcomingAlerts(
  vehicles: Vehicle[],
  maintenances: MaintenanceRecord[],
  templates: MaintenanceTemplate[],
  maintenanceProfiles: MaintenanceProfile[] = [] // ✅ Nouveau paramètre
): UpcomingAlert[] {
  // ...
  
  // 🔧 Trouver le profil d'entretien personnalisé associé
  const assignedProfile = maintenanceProfiles.find(
    p => p.vehicleIds.includes(vehicle.id)
  );

  let applicableTemplates: MaintenanceTemplate[];

  if (assignedProfile) {
    // ✅ Profil personnalisé → UNIQUEMENT ses templates
    applicableTemplates = templates.filter(
      t => t.profileId === assignedProfile.id
    );
  } else {
    // ✅ Pas de profil → Templates généraux (sans profileId)
    applicableTemplates = templates.filter((template) => {
      // Exclure les templates de profils personnalisés
      if (template.profileId) return false;
      
      // Filtrer par motorisation et transmission
      // ...
    });
  }
}
```

---

### 2. `/src/app/App.tsx`

**Changement :**
```typescript
// Ajouter maintenanceProfiles au destructuring
const { 
  currentProfile, 
  setCurrentProfile, 
  isLoading, 
  vehicles, 
  maintenances, 
  maintenanceTemplates,
  maintenanceProfiles // ✅ Ajouté
} = useApp();

// Passer le nouveau paramètre à calculateUpcomingAlerts
const alerts = useMemo(() => {
  return calculateUpcomingAlerts(
    userVehicles, 
    maintenances, 
    maintenanceTemplates,
    maintenanceProfiles // ✅ Ajouté
  );
}, [userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles]);
```

---

### 3. `/src/app/components/home/Dashboard.tsx`

**Même changement que App.tsx :**
```typescript
const { 
  vehicles, 
  tasks, 
  currentProfile, 
  maintenances, 
  maintenanceTemplates,
  maintenanceProfiles // ✅ Ajouté
} = useApp();

const alerts = useMemo(() => {
  return calculateUpcomingAlerts(
    userVehicles, 
    maintenances, 
    maintenanceTemplates,
    maintenanceProfiles // ✅ Ajouté
  );
}, [userVehicles, maintenances, maintenanceTemplates, maintenanceProfiles]);
```

---

## 📊 Logique de Filtrage

### Diagramme de Décision

```
Pour chaque véhicule :
  │
  ├─ A-t-il un profil d'entretien personnalisé ?
  │  │
  │  ├─ OUI ────────────────────────────────────┐
  │  │                                           │
  │  │  Filtrer les templates :                 │
  │  │  ✅ template.profileId === assignedProfile.id
  │  │  ❌ Tous les autres                       │
  │  │                                           │
  │  └─ NON ────────────────────────────────────┤
  │                                              │
  │     Filtrer les templates :                 │
  │     ✅ template.profileId === undefined      │
  │     ✅ ET motorisation compatible            │
  │     ✅ ET transmission compatible            │
  │     ❌ Tous les templates de profils perso   │
  │                                              │
  └──────────────────────────────────────────────┘
       Calculer les échéances pour ces templates
```

---

## 🧪 Comment Tester

### Test 1 : Voiture avec profil personnalisé

1. Créer un profil d'entretien personnalisé
2. Y ajouter des templates spécifiques (ex: "Vidange Racing 5000km")
3. Assigner une voiture à ce profil
4. Aller dans les échéances de cette voiture

**Résultat attendu :**
- ✅ Uniquement les templates du profil personnalisé apparaissent
- ❌ Aucun template général (ex: "Vidange 10000km")

---

### Test 2 : Voiture sans profil personnalisé

1. Avoir une voiture sans profil d'entretien assigné
2. Aller dans ses échéances

**Résultat attendu :**
- ✅ Templates généraux (selon motorisation/transmission)
- ❌ Aucun template de profils personnalisés

---

### Test 3 : Changement de profil

1. Voiture assignée au "Profil A"
2. Voir les échéances → Templates du Profil A
3. Changer l'assignation vers "Profil B"
4. Rafraîchir les échéances

**Résultat attendu :**
- ✅ Templates du Profil B apparaissent
- ❌ Templates du Profil A disparaissent
- ❌ Templates généraux n'apparaissent jamais

---

## 🔍 Vérification Console

Après correction, dans la console du navigateur (F12) :

```
🔄 Recalcul des alertes...
{
  vehicles: 1,
  maintenances: 5,
  templates: 50,
  profiles: 2  // ✅ Maintenant visible
}

🔧 [Alerts] Véhicule "Ma Voiture" utilise le profil personnalisé "Sportif"
```

Si le message "🔧 [Alerts] Véhicule utilise le profil personnalisé" apparaît, c'est que le filtrage fonctionne !

---

## ✅ Résultat Final

### Impact Utilisateur

**Avant :**
- 😕 30 échéances affichées (générales + personnalisées)
- 😕 Confusion sur "quelle échéance suivre ?"
- 😕 Doublons partout

**Après :**
- 😊 10 échéances affichées (uniquement personnalisées)
- 😊 Clair et précis : ce sont MES entretiens
- 😊 Aucun doublon

---

### Compatibilité

✅ **Backwards compatible** : 
- Véhicules existants sans profil → Continuent à voir les templates généraux
- Véhicules avec profil → Voient uniquement leurs templates
- Aucune migration nécessaire

---

## 📝 Notes Techniques

### Pourquoi `maintenanceProfiles` est optionnel (`= []`) ?

```typescript
maintenanceProfiles: MaintenanceProfile[] = []
```

- **Raison** : Éviter les erreurs si l'app charge avant que les profils soient disponibles
- **Comportement** : Si vide, aucun véhicule n'aura de profil assigné → Fallback vers templates généraux

---

### Déduplication dans les templates

Le code conserve la déduplication par nom de template :

```typescript
const uniqueTemplates = new Map<string, MaintenanceTemplate>();
applicableTemplates.forEach(template => {
  if (!uniqueTemplates.has(template.name)) {
    uniqueTemplates.set(template.name, template);
  }
});
```

**Pourquoi ?**
- Évite les doublons si le même nom de template existe plusieurs fois
- Garde seulement le premier trouvé

---

## ✅ Checklist de Validation

- [x] Profil personnalisé assigné → Uniquement ses templates
- [x] Pas de profil assigné → Templates généraux (filtrés motorisation)
- [x] Templates généraux exclus si profil personnalisé
- [x] Templates personnalisés exclus si pas de profil
- [x] Console logs ajoutés pour debugging
- [x] Backwards compatible
- [x] Pas de breaking changes

---

**🎉 Correction terminée ! Les échéances sont maintenant cohérentes avec les profils d'entretien.**
