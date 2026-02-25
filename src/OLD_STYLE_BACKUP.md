# Ancien Style - Valcar App (Backup)

Ce fichier sauvegarde l'ancien style dark theme de l'application Valcar.
Pour restaurer, remplacer les fichiers CSS correspondants par le contenu ci-dessous.

---

## /src/styles/theme.css - Variables Dark Mode

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
}
```

## Palette de couleurs principales

- **Background principal** : `bg-black` (#000000)
- **Cards** : `bg-zinc-900` avec `border-zinc-800`
- **Headers** : `bg-gradient-to-b from-zinc-900 to-black`
- **Texte principal** : `text-white`
- **Texte secondaire** : `text-zinc-500`
- **Texte tertiaire** : `text-zinc-600`, `text-zinc-700`

## Couleurs d'accent

- **Bleu** : `text-blue-500`, `bg-blue-500/10`, `border-blue-800/30`
- **Orange** : `text-orange-500`, `bg-orange-500/10`
- **Vert** : `text-green-500`, `bg-green-500/10`
- **Rouge** : `text-red-500`, `bg-red-500/10`
- **Violet** : `text-purple-500`, `bg-purple-500/10`
- **Indigo** : `text-indigo-500`, `bg-indigo-500/10`

## Composants typiques

### Cards de parametres
```
bg-zinc-900 border-zinc-800 p-4 cursor-pointer hover:bg-zinc-800 transition-colors
```

### Bottom Nav
```
bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800
Active: text-blue-500 bg-blue-500/10 shadow-glow-blue
Inactive: text-zinc-500 hover:text-zinc-300
```

### Headers de pages
```
bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8
Titre: text-3xl text-white
Sous-titre: text-zinc-500
```

### Slider de taille de police
```
Thumb: rgb(99 102 241) - Indigo
Track: linear-gradient indigo -> zinc-800
```

### Titres de sections
```
text-sm text-zinc-500 mb-3 (uppercase)
```

### Loading Screen
```
bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950
Gradient texte: from-blue-500 to-purple-500
Spinner: border-blue-500, bg-blue-500/20 to-purple-500/20
```

## /src/styles/visual-enhancements.css - Classes utilitaires

- `.glass-enhanced`: backdrop-blur-xl bg-white/5 border border-white/10
- `.glass-card`: backdrop-blur-md bg-white/5 border border-white/10
- `.glass-button`: backdrop-blur-sm bg-white/10 border border-white/20
- `.shadow-glow-blue`: box-shadow 0 0 20px rgba(59, 130, 246, 0.3)
- `.shadow-glow-purple`: box-shadow 0 0 20px rgba(147, 51, 234, 0.3)
- `.hover-lift`: hover:-translate-y-1 hover:shadow-2xl
- `.shadow-soft`: box-shadow 0 4px 20px rgba(0, 0, 0, 0.15)

## Boutons d'action
```
Primaire: bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg
Danger: bg-red-500/10 text-red-500
Success: bg-green-500/10 text-green-500
Warning: bg-orange-500/10 text-orange-500
```

## Notes
- Theme purement zinc/neutral avec accents de couleur
- Pas de gradients sur le background principal (noir pur)
- Cards plates avec bordures zinc-800
- Glassmorphism subtil sur nav et modals
