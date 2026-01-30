# 📸 Photos & Documents - Guide Complet

**Nouvelles fonctionnalités ajoutées !**

---

## ✨ Ce Qui A Été Ajouté

### 1. **Onglet Photos** (Galerie)
Dans la fiche véhicule, nouvel onglet "Photos" avec :
- ✅ Ajout par **appareil photo** (accès caméra directement)
- ✅ Ajout par **bibliothèque** (sélection de photos existantes)
- ✅ **Plusieurs photos** en une fois
- ✅ Visualisation **plein écran** au clic
- ✅ Suppression de photos
- ✅ Grille responsive 2-3 colonnes

### 2. **Onglet Documents** (Factures, Papiers)
Nouvel onglet "Documents" avec :
- ✅ Ajout par **photo** (scanner une facture)
- ✅ Ajout par **bibliothèque photos**
- ✅ Ajout par **fichiers** (PDF, documents)
- ✅ Ouverture dans **nouvelle page web** (PDF)
- ✅ Ouverture dans **l'app** (photos)
- ✅ Miniatures et métadonnées (nom, taille, date)
- ✅ Suppression de documents

---

## 🎯 Ce Que Vous Devez Faire

### Étape Unique : Script SQL dans Supabase

1. **Aller dans Supabase SQL Editor**  
   https://app.supabase.com → Votre projet → SQL Editor

2. **Copier-coller le script :**

```sql
-- Ajouter colonne photos (array d'URLs)
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Ajouter colonne documents (JSON)
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS documents JSONB;

-- Vérifier
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name IN ('photos', 'documents');
```

3. **Cliquer sur "Run"**

4. **Vérifier le résultat :**

```
column_name | data_type
------------|----------
documents   | jsonb
photos      | ARRAY
```

---

## 📱 Comment Utiliser

### Onglet Photos

1. Ouvrir une fiche véhicule
2. Cliquer sur l'onglet "Photos"
3. Utiliser les boutons :
   - **Appareil photo** : Prendre une photo directement
   - **Bibliothèque** : Sélectionner des photos existantes
4. Cliquer sur une photo pour la voir en plein écran
5. Utiliser le bouton de suppression pour retirer une photo

### Onglet Documents

1. Ouvrir une fiche véhicule
2. Cliquer sur l'onglet "Documents"
3. Utiliser les boutons :
   - **Photo** : Scanner un document avec l'appareil photo
   - **Bibliothèque** : Sélectionner une image existante
   - **Fichiers** : Choisir un PDF ou autre document
4. Cliquer sur un document pour l'ouvrir
5. Utiliser le bouton de suppression pour retirer un document

---

## 🔧 Détails Techniques

### Structure des Données

**Photos** : Array de strings (URLs)
```json
["https://storage.url/photo1.jpg", "https://storage.url/photo2.jpg"]
```

**Documents** : Array d'objets JSON
```json
[
  {
    "name": "Facture_2024.pdf",
    "url": "https://storage.url/doc.pdf",
    "type": "application/pdf",
    "size": 245678,
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Stockage

- Les fichiers sont stockés dans **Supabase Storage**
- Bucket : `vehicle-files`
- Organisation : `{vehicleId}/photos/` et `{vehicleId}/documents/`
- Les URLs sont stockées dans la base de données

---

## ❓ FAQ

**Q: Combien de photos puis-je ajouter ?**  
A: Pas de limite technique, mais pensez à l'espace de stockage.

**Q: Quels formats de documents sont acceptés ?**  
A: Photos (JPG, PNG, HEIC), PDF, et la plupart des formats de documents.

**Q: Les photos sont-elles compressées ?**  
A: Non, elles sont stockées dans leur qualité originale.

**Q: Puis-je télécharger les documents ?**  
A: Oui, cliquez sur le document pour l'ouvrir, puis utilisez les options de votre navigateur/appareil.

---

## 🚀 Prochaines Améliorations Possibles

- [ ] Réorganisation par glisser-déposer
- [ ] Légendes pour les photos
- [ ] Catégories de documents (facture, assurance, etc.)
- [ ] Recherche dans les documents
- [ ] Partage de photos/documents
- [ ] Compression automatique des photos

---

**Besoin d'aide ?** Contactez le support technique.
