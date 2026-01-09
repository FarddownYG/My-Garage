// Security utilities for the app
// Adds multiple layers of protection

/**
 * Detects if developer tools are open
 */
export function detectDevTools(): boolean {
  const threshold = 160;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;
  
  if (widthThreshold || heightThreshold) {
    console.warn('⚠️ Outils de développement détectés');
    return true;
  }
  return false;
}

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Generate a device-specific encryption key
 * This makes encrypted data only readable on the same device
 */
export async function getDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    navigator.hardwareConcurrency || 'unknown',
  ];
  
  const fingerprint = components.join('|||');
  
  // Hash the fingerprint
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Verify data integrity with checksum
 */
export async function createChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify checksum
 */
export async function verifyChecksum(data: string, checksum: string): Promise<boolean> {
  const calculated = await createChecksum(data);
  return calculated === checksum;
}

/**
 * Disable right-click context menu (basic protection)
 */
export function disableContextMenu() {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
}

/**
 * Disable keyboard shortcuts for developer tools
 */
export function disableDevToolsShortcuts() {
  document.addEventListener('keydown', (e) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
      (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
      (e.ctrlKey && e.keyCode === 85) // Ctrl+U
    ) {
      e.preventDefault();
      return false;
    }
  });
}

/**
 * Clear clipboard on app exit (prevent data leaks)
 */
export function clearClipboardOnExit() {
  window.addEventListener('beforeunload', () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('');
    }
  });
}

/**
 * Prevent iframe embedding (clickjacking protection)
 */
export function preventIframeEmbedding() {
  if (window.top !== window.self) {
    // Check if we're in a legitimate development environment
    const isDevEnvironment = window.location.hostname.includes('localhost') || 
                             window.location.hostname.includes('127.0.0.1') ||
                             window.location.hostname.includes('makeproxy') ||
                             window.location.hostname.includes('figma');
    
    if (isDevEnvironment) {
      console.log('✅ Environnement de développement détecté - iframe autorisé');
      return;
    }
    
    console.error('⚠️ Application détectée dans un iframe - possible attaque');
    // Optionally redirect to break out of iframe
    try {
      window.top!.location = window.self.location;
    } catch (e) {
      console.warn('Impossible de sortir de l\'iframe');
    }
  }
}

/**
 * Check if we're running in production environment
 */
export function isProductionEnvironment(): boolean {
  return !window.location.hostname.includes('localhost') && 
         !window.location.hostname.includes('127.0.0.1') &&
         !window.location.hostname.includes('makeproxy') &&
         !window.location.hostname.includes('figma');
}

/**
 * Initialize all security measures
 */
export function initializeSecurity(enableDevToolsProtection: boolean = false) {
  console.log('🔒 Initialisation des mesures de sécurité...');
  
  // Detect environment
  const inProduction = isProductionEnvironment();
  console.log('🌍 Environnement:', inProduction ? 'Production' : 'Développement');
  
  // Basic protections (always enabled)
  preventIframeEmbedding();
  clearClipboardOnExit();
  
  // Optional: DevTools protection (can be annoying for development)
  // Disabled in development environment for better development experience
  if (enableDevToolsProtection && inProduction) {
    disableContextMenu();
    disableDevToolsShortcuts();
    
    // Periodic DevTools detection
    setInterval(() => {
      if (detectDevTools()) {
        // You could clear data or show a warning here
        console.warn('⚠️ Sécurité: DevTools actifs');
      }
    }, 1000);
  }
  
  console.log('✅ Sécurité initialisée');
}