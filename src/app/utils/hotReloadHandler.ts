/**
 * 🔥 Hot Reload Error Handler
 * Détecte et gère les erreurs de hot-reload React en développement
 */

let errorCount = 0;
let lastErrorTime = 0;
const ERROR_THRESHOLD = 3; // Nombre d'erreurs avant d'afficher un message
const ERROR_WINDOW = 5000; // Fenêtre de temps en ms

export function handleHotReloadError(error: Error): boolean {
  // Uniquement en développement
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  // Vérifier si c'est une erreur de hot-reload
  const isHotReloadError = 
    error.message?.includes('useApp must be used within AppProvider') ||
    error.message?.includes('Context') ||
    error.message?.includes('Provider');

  if (!isHotReloadError) {
    return false;
  }

  const now = Date.now();

  // Réinitialiser le compteur si plus de ERROR_WINDOW ms se sont écoulées
  if (now - lastErrorTime > ERROR_WINDOW) {
    errorCount = 0;
  }

  errorCount++;
  lastErrorTime = now;

  // Afficher un toast après ERROR_THRESHOLD erreurs
  if (errorCount >= ERROR_THRESHOLD) {
    showHotReloadToast();
    errorCount = 0; // Réinitialiser pour éviter le spam
  }

  return true;
}

function showHotReloadToast() {
  // Vérifier si un toast existe déjà
  if (document.getElementById('hot-reload-toast')) {
    return;
  }

  const toast = document.createElement('div');
  toast.id = 'hot-reload-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
    max-width: 90%;
    text-align: center;
  `;

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 20px;">🔄</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Hot-reload détecté</div>
        <div style="font-size: 12px; opacity: 0.9;">Faites Ctrl+Shift+R pour actualiser</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
      ">×</button>
    </div>
  `;

  // Ajouter l'animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);

  // Supprimer automatiquement après 10 secondes
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }
  }, 10000);
}

// Écouter les erreurs globales
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (event) => {
    if (event.error && handleHotReloadError(event.error)) {
      // Empêcher l'affichage de l'erreur dans la console (optionnel)
      // event.preventDefault();
    }
  });

  // Écouter les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof Error && handleHotReloadError(event.reason)) {
      // event.preventDefault();
    }
  });
}
