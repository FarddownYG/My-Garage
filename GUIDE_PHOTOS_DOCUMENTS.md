# 📸 Guide Photos & Documents - Véhicules

**Bonne nouvelle !** Tout est déjà implémenté et fonctionnel ! 🎉

---

## ✅ Fonctionnalités Déjà Disponibles

### 1️⃣ **Onglet Photos**
- ✅ Ajouter photos par **appareil photo** (📷)
- ✅ Ajouter photos depuis **bibliothèque** (🖼️)
- ✅ **Consulter** en plein écran (zoom)
- ✅ **Supprimer** les photos
- ✅ Grille responsive 2-3 colonnes

### 2️⃣ **Onglet Documents** 
- ✅ Ajouter via **appareil photo** (scanner facture) (📷)
- ✅ Ajouter depuis **photos** (🖼️)
- ✅ Ajouter **fichiers** (PDF, DOC, etc.) (📄)
- ✅ **Consulter** :
  - Photos → Modal plein écran
  - PDF/Documents → Nouvelle page web
- ✅ **Supprimer** les documents
- ✅ Métadonnées (nom, type, taille, date)

---

## 🚀 Comment Utiliser

### Accéder aux Photos/Documents

1. **Sélectionnez un véhicule** dans la liste
2. Vous verrez **4 onglets** :
   - 📊 Infos
   - 🔧 Entretien
   - 📸 **Photos**
   - 📄 **Documents**

---

### Ajouter des Photos

**Méthode 1 : Appareil Photo**
```
1. Cliquez sur "Appareil photo" (📷)
2. Prenez la photo
3. ✅ Photo ajoutée instantanément
```

**Méthode 2 : Bibliothèque**
```
1. Cliquez sur "Bibliothèque" (🖼️)
2. Sélectionnez une ou plusieurs photos
3. ✅ Photos ajoutées
```

**Consulter**
```
- Cliquez sur une photo → Affichage plein écran
- Bouton Supprimer (❌) au survol
- Bouton Agrandir (🔍) au survol
```

---

### Ajouter des Documents

**Méthode 1 : Scanner une Facture (Appareil Photo)**
```
1. Cliquez sur "Appareil photo" (📷)
2. Prenez la photo de la facture
3. ✅ Document ajouté avec type "photo"
```

**Méthode 2 : Fichiers (Photos + PDF + Documents)**
```
1. Cliquez sur "Fichiers" (📄)
2. Sélectionnez :
   - Une ou plusieurs photos (.jpg, .png)
   - Des fichiers PDF (.pdf)
   - Des documents (.doc, .docx, .txt)
3. ✅ Documents ajoutés avec le bon type
```

**Consulter**
```
Photo :
  → Cliquez dessus → Modal plein écran
  
PDF/Document :
  → Cliquez dessus → Nouvelle page web avec le fichier
  
Supprimer :
  → Bouton ❌ à droite du document
```

---

## 📋 Types de Fichiers Supportés

### Photos
- ✅ JPG / JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ✅ HEIC (sur iOS)

### Documents
- ✅ PDF (factures, carte grise, etc.)
- ✅ Images (JPG, PNG)
- ✅ Documents Word (.doc, .docx)
- ✅ Texte (.txt)

---

## 🎯 Cas d'Usage

### 📸 Onglet Photos
```
- Photos de votre voiture (extérieur)
- Photos des modifications
- Photos avant/après nettoyage
- Photos de dégâts/rayures
- Photos de tuning
```

### 📄 Onglet Documents
```
- Factures de garage
- Carte grise
- Assurance
- Contrôle technique
- Factures d'entretien
- Devis de réparation
- PV (si malheureusement...)
```

---

## 🔍 Interface

### Onglet Photos
```
┌─────────────────────────────────┐
│  📷 Appareil   │  🖼️ Bibliothèque │
├─────────────────────────────────┤
│  ┌───┐  ┌───┐  ┌───┐           │
│  │ 📸│  │ 📸│  │ 📸│   Grille   │
│  └───┘  └───┘  └───┘    2-3     │
│  ┌───┐  ┌───┐  ┌───┐  colonnes  │
│  │ 📸│  │ 📸│  │ 📸│           │
│  └───┘  └───┘  └───┘           │
└─────────────────────────────────┘
  Au survol : ❌ Supprimer | 🔍 Agrandir
```

### Onglet Documents
```
┌─────────────────────────────────┐
│  📷 Appareil   │    📄 Fichiers   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📄  facture-vidange.pdf      │ │
│ │     PDF • 250 KB • 29/01/24  │ │
│ │                    🔗 Ouvrir ❌│
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📸  carte-grise.jpg          │ │
│ │     Photo • 1.2 MB • 15/01/24│ │
│ │                    🔗 Ouvrir ❌│
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
Note: Le bouton "Fichiers" accepte photos ET documents
```

---

## 💾 Stockage

### Comment c'est stocké ?

**Photos** : Tableau d'URLs base64
```typescript
photos: [
  "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "data:image/png;base64,iVBORw0KGgoA..."
]
```

**Documents** : Tableau d'objets JSON
```typescript
documents: [
  {
    id: "1706543210000-0",
    name: "facture-vidange.pdf",
    url: "data:application/pdf;base64,JVBERi0xLj...",
    type: "pdf",
    uploadedAt: "2024-01-29T10:00:00.000Z",
    size: 52428
  }
]
```

**Où ?**
- 💾 Stocké directement dans **Supabase** (table `vehicles`)
- 🔒 Sécurisé avec vos autres données
- 📦 Pas besoin de serveur de fichiers séparé

---

## ⚡ Performance

### Limites Recommandées

**Par Véhicule :**
- 📸 Photos : Max **10 photos** (~50 MB total)
- 📄 Documents : Max **20 documents** (~100 MB total)

**Pourquoi ?**
- Base64 augmente la taille de ~33%
- PostgreSQL limite : 1 GB par ligne (largement suffisant)

### Si Vous Dépassez

Si vous avez **beaucoup** de photos/documents :
1. **Supprimer** les anciennes photos non nécessaires
2. **Alternative** : Utiliser Supabase Storage (fichiers séparés, gratuit jusqu'à 1GB)

**Pour l'instant, le système actuel est parfait !** 👌

---

## 🛠️ Installation (Supabase)

### Vérifier si les colonnes existent

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name IN ('photos', 'documents');
```

**Si vide** → Exécuter le script :

```sql
-- Voir le fichier /supabase-add-photos-documents.sql
```

---

## 🧪 Test

### Test 1 : Ajouter une Photo
1. Véhicule → Onglet **Photos**
2. Cliquez sur **"Appareil photo"**
3. Prenez une photo
4. ✅ Vérifiez qu'elle apparaît dans la grille
5. Cliquez dessus → ✅ Modal plein écran

### Test 2 : Ajouter un Document PDF
1. Véhicule → Onglet **Documents**
2. Cliquez sur **"Fichiers"**
3. Sélectionnez un PDF (ou une photo)
4. ✅ Vérifiez qu'il apparaît avec icône appropriée
5. Cliquez dessus → ✅ Nouvelle page avec le fichier (ou modal pour photo)

### Test 3 : Scanner une Facture
1. Véhicule → Onglet **Documents**
2. Cliquez sur **"Appareil photo"**
3. Prenez photo d'une facture papier
4. ✅ Document ajouté comme "photo"
5. Cliquez dessus → ✅ Affichage plein écran

---

## ❓ FAQ

### "Je ne vois pas l'onglet Documents"
→ Vérifiez que vous êtes sur un **véhicule spécifique**, pas dans la liste

### "L'upload ne marche pas"
→ Vérifiez :
1. Table `vehicles` a les colonnes `photos` et `documents`
2. Pas d'erreur dans la console (F12)
3. Fichier pas trop gros (< 10 MB recommandé)

### "Le PDF ne s'affiche pas"
→ Certains navigateurs bloquent les pop-ups
1. Autorisez les pop-ups pour votre site
2. Ou cliquez avec Ctrl/Cmd pour ouvrir dans nouvel onglet

### "Puis-je ajouter plusieurs fichiers en même temps ?"
→ **OUI !** Tous les inputs acceptent `multiple`
- Sélectionnez plusieurs photos d'un coup
- Sélectionnez plusieurs PDFs d'un coup

### "Les photos ralentissent l'app ?"
→ Non, elles sont lazy-loaded
- Chargées uniquement quand vous ouvrez l'onglet
- Optimisées avec `ImageWithFallback`

---

## 📊 Architecture Technique

### Composants

```
VehicleDetail.tsx
  ├─ PhotosGallery.tsx
  │   ├─ Bouton Appareil Photo
  │   ├─ Bouton Bibliothèque
  │   ├─ Grille de photos
  │   └─ Modal plein écran
  │
  └─ DocumentsGallery.tsx
      ├─ Bouton Appareil
      ├─ Bouton Photos
      ├─ Bouton Fichiers
      ├─ Liste de documents
      └─ Modal photo / Nouvelle page PDF
```

### Flow Upload

```
1. Utilisateur clique sur bouton
2. Input file caché déclenché
3. FileReader convertit en base64
4. updateVehicle() appelé
5. Supabase mis à jour
6. State React mis à jour
7. ✅ UI rafraîchie instantanément
```

---

## ✅ Checklist Finale

- [x] Onglet Photos créé
- [x] Onglet Documents créé
- [x] Upload par appareil photo
- [x] Upload par bibliothèque
- [x] Upload de fichiers
- [x] Consultation photos (modal)
- [x] Consultation documents (nouvelle page)
- [x] Suppression photos
- [x] Suppression documents
- [x] Métadonnées (type, taille, date)
- [x] UI responsive mobile
- [x] Stockage Supabase
- [x] Type TypeScript `VehicleDocument`

---

**🎉 Tout fonctionne déjà ! Il suffit d'exécuter le script SQL dans Supabase.**

**Ensuite, allez dans un véhicule → Onglet Photos/Documents → Amusez-vous ! 📸📄**
