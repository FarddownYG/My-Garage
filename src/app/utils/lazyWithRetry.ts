import { lazy, ComponentType } from 'react';

/**
 * Lazy import with retry logic for dynamic module loading failures.
 * Handles "Failed to fetch dynamically imported module" errors
 * by retrying the import and forcing a page reload as last resort.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 1500
): React.LazyExoticComponent<T> {
  return lazy(() => retryImport(factory, retries, interval));
}

async function retryImport<T>(
  factory: () => Promise<T>,
  retries: number,
  interval: number
): Promise<T> {
  try {
    return await factory();
  } catch (error: any) {
    if (retries <= 0) {
      // Last resort: if no session storage flag, reload the page once
      const hasReloaded = sessionStorage.getItem('valcar-chunk-reload');
      if (!hasReloaded) {
        sessionStorage.setItem('valcar-chunk-reload', '1');
        window.location.reload();
      }
      // If we already reloaded, throw the error to ErrorBoundary
      throw error;
    }

    console.warn(`[lazyWithRetry] Import failed, retrying in ${interval}ms... (${retries} left)`);
    await new Promise(resolve => setTimeout(resolve, interval));
    return retryImport(factory, retries - 1, interval);
  }
}

// Clear the reload flag on successful app load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    sessionStorage.removeItem('valcar-chunk-reload');
  });
}
