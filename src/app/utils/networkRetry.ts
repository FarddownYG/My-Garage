// 🔄 Network Retry utility with exponential backoff
// Transparently handles network errors without user intervention

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number; // Base delay in ms
  maxDelay?: number; // Maximum delay in ms
  backoffMultiplier?: number;
  retryableErrors?: string[]; // Error codes to retry
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000, // Start with 1 second
  maxDelay: 10000, // Max 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'PGRST301', // Supabase connection error
    'PGRST504', // Supabase timeout
    '23505', // PostgreSQL unique violation (can retry with new data)
    'NetworkError',
    'Failed to fetch',
    'timeout',
  ],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;
  
  const errorString = JSON.stringify(error).toLowerCase();
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = error.code || '';
  
  return retryableErrors.some(retryableError => 
    errorString.includes(retryableError.toLowerCase()) ||
    errorMessage.includes(retryableError.toLowerCase()) ||
    errorCode === retryableError
  );
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  // Exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  
  // Add random jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  const delayWithJitter = exponentialDelay + jitter;
  
  // Cap at maxDelay
  return Math.min(delayWithJitter, config.maxDelay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry on failure
 * Transparent to the user - handles network errors automatically
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => supabase.from('users').insert(data),
 *   { maxRetries: 5 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig: Required<RetryConfig> = { ...DEFAULT_CONFIG, ...config };
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentative ${attempt + 1}/${finalConfig.maxRetries + 1}...`);
      
      const result = await fn();
      
      if (attempt > 0) {
        console.log(`✅ Succès après ${attempt + 1} tentative(s)`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = 
        attempt < finalConfig.maxRetries &&
        isRetryableError(error, finalConfig.retryableErrors);
      
      if (!shouldRetry) {
        console.error(`❌ Erreur non-récupérable ou nombre max de tentatives atteint:`, error);
        throw error;
      }
      
      // Calculate delay before next attempt
      const delay = calculateDelay(attempt, finalConfig);
      
      console.warn(`⚠️ Tentative ${attempt + 1} échouée, nouvelle tentative dans ${Math.round(delay)}ms...`, {
        error: (error as any)?.message || error,
        code: (error as any)?.code,
      });
      
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Wrapper for Supabase operations with optimized retry logic
 * Automatically handles common Supabase errors
 */
export async function withSupabaseRetry<T>(
  fn: () => Promise<T>,
  operationName: string = 'Supabase operation'
): Promise<T> {
  try {
    return await withRetry(fn, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      retryableErrors: [
        'PGRST301',
        'PGRST504',
        'NetworkError',
        'Failed to fetch',
        'timeout',
        'ECONNREFUSED',
        'ETIMEDOUT',
      ],
    });
  } catch (error) {
    console.error(`❌ Échec de l'opération "${operationName}" après plusieurs tentatives:`, error);
    throw error;
  }
}

/**
 * Batch retry for multiple operations
 * Executes operations in parallel with individual retry logic
 */
export async function batchWithRetry<T>(
  operations: Array<() => Promise<T>>,
  config: RetryConfig = {}
): Promise<T[]> {
  const promises = operations.map(op => withRetry(op, config));
  return await Promise.all(promises);
}

/**
 * Rate-limited retry
 * Adds a minimum delay between retries to respect rate limits
 */
export async function withRateLimitedRetry<T>(
  fn: () => Promise<T>,
  minDelayBetweenAttempts: number = 1000,
  config: RetryConfig = {}
): Promise<T> {
  const configWithRateLimit: RetryConfig = {
    ...config,
    baseDelay: Math.max(config.baseDelay || DEFAULT_CONFIG.baseDelay, minDelayBetweenAttempts),
  };
  
  return await withRetry(fn, configWithRateLimit);
}
