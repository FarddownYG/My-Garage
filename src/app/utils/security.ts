// Security utilities for the app
// Adds multiple layers of protection

/**
 * Detect if DevTools are open
 */
export function detectDevTools(): boolean {
  const threshold = 160;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;
  
  if (widthThreshold || heightThreshold) {
    // Silently detect without warning (removed console.warn)
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
    // Wrap in try-catch to prevent errors when document is not focused
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(() => {
          // Silently fail if clipboard access is denied
        });
      }
    } catch (error) {
      // Silently fail - clipboard clearing is a security enhancement, not critical
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
                             window.location.hostname.includes('figma.site');
    
    if (isDevEnvironment) {
      // Silently allow iframe in development - no console logs
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
         !window.location.hostname.includes('makeproxy');
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
    
    // Periodic DevTools detection (silently - no console warnings)
    setInterval(() => {
      if (detectDevTools()) {
        // Silently detect - removed console.warn to avoid spam
      }
    }, 1000);
  }
  
  console.log('✅ Sécurité initialisée');
}