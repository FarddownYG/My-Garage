/**
 * Utilitaire pour copier du texte dans le presse-papiers de manière sécurisée
 * Gère les cas où le document n'est pas en focus ou l'API Clipboard n'est pas disponible
 */

/**
 * Copie du texte dans le presse-papiers avec fallback
 * @param text Texte à copier
 * @returns Promise<boolean> true si succès, false sinon
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Méthode 1 : API Clipboard moderne (préférée)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // Vérifier si le document est en focus
      if (document.hasFocus()) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Si pas en focus, essayer quand même (peut fonctionner selon le navigateur)
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (focusError) {
        // Continuer vers les fallbacks
      }
    }

    // Méthode 2 : Fallback avec textarea temporaire
    return copyToClipboardFallback(text);
  } catch (error) {
    console.warn('Erreur copie clipboard:', error);
    return copyToClipboardFallback(text);
  }
}

/**
 * Fallback : copie via textarea temporaire (fonctionne même sans focus)
 */
function copyToClipboardFallback(text: string): boolean {
  try {
    // Créer un textarea temporaire
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // Styles pour le rendre invisible mais fonctionnel
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    
    // Focus et sélection
    textarea.focus();
    textarea.select();
    
    // Commande de copie
    const successful = document.execCommand('copy');
    
    // Nettoyage
    document.body.removeChild(textarea);
    
    return successful;
  } catch (error) {
    console.error('Erreur fallback clipboard:', error);
    return false;
  }
}

/**
 * Copie avec message de succès/échec
 * @param text Texte à copier
 * @param successMessage Message en cas de succès
 * @param errorMessage Message en cas d'échec
 */
export async function copyToClipboardWithFeedback(
  text: string,
  successMessage?: string,
  errorMessage?: string
): Promise<void> {
  const success = await copyToClipboard(text);
  
  if (success) {
    if (successMessage) {
      alert(successMessage);
    }
  } else {
    // Si échec, afficher le texte pour copie manuelle
    const fallbackMessage = errorMessage || 
      `Impossible de copier automatiquement.\n\nTexte à copier :\n${text}`;
    alert(fallbackMessage);
  }
}

/**
 * Copie dans le presse-papiers de manière silencieuse
 * @param text Texte à copier
 * @returns Promise<boolean> true si succès
 */
export async function copyToClipboardSilent(text: string): Promise<boolean> {
  return copyToClipboard(text);
}

/**
 * Vérifie si l'API Clipboard est disponible
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
}

/**
 * Vérifie si le document est en focus (requis pour clipboard API)
 */
export function isDocumentFocused(): boolean {
  return document.hasFocus();
}

/**
 * Lire le contenu du presse-papiers (nécessite permission utilisateur)
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      if (document.hasFocus()) {
        const text = await navigator.clipboard.readText();
        return text;
      }
    }
    return null;
  } catch (error) {
    console.warn('Impossible de lire le presse-papiers:', error);
    return null;
  }
}
