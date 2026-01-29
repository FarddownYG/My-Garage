// 🔒 Critical Operations wrapper
// Combines retry logic, race condition protection, and error handling
// Ensures maximum security without user-facing lag

import { withSupabaseRetry } from './networkRetry';

/**
 * Mutex lock to prevent race conditions
 * Ensures only one critical operation runs at a time per key
 */
class MutexLock {
  private locks: Map<string, Promise<void>> = new Map();
  
  /**
   * Acquire a lock for a specific key
   * Waits if lock is already held
   */
  async acquire(key: string): Promise<() => void> {
    // Wait for existing lock to be released
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }
    
    // Create new lock
    let releaseFn: () => void;
    const lockPromise = new Promise<void>(resolve => {
      releaseFn = resolve;
    });
    
    this.locks.set(key, lockPromise);
    
    // Return release function
    return () => {
      this.locks.delete(key);
      releaseFn!();
    };
  }
}

const globalMutex = new MutexLock();

/**
 * Execute a critical operation with protection against:
 * - Race conditions (mutex lock)
 * - Network failures (automatic retry)
 * - Concurrent modifications
 * 
 * @param key - Unique identifier for the operation (e.g., 'update-admin-pin', 'save-profile-123')
 * @param operation - The async function to execute
 * @param operationName - Human-readable name for logging
 * 
 * @example
 * ```typescript
 * await executeCriticalOperation(
 *   'update-admin-pin',
 *   async () => {
 *     await supabase.from('app_config').upsert({ admin_pin: hashedPin });
 *   },
 *   'Mise à jour PIN admin'
 * );
 * ```
 */
export async function executeCriticalOperation<T>(
  key: string,
  operation: () => Promise<T>,
  operationName: string = 'Operation'
): Promise<T> {
  const release = await globalMutex.acquire(key);
  
  try {
    console.log(`🔒 Opération critique démarrée: ${operationName} (${key})`);
    
    const result = await withSupabaseRetry(operation, operationName);
    
    console.log(`✅ Opération critique réussie: ${operationName}`);
    return result;
  } catch (error) {
    console.error(`❌ Opération critique échouée: ${operationName}`, error);
    throw error;
  } finally {
    release();
    console.log(`🔓 Verrou libéré: ${key}`);
  }
}

/**
 * Transaction-like operation for Supabase
 * Executes multiple operations and rolls back on failure
 * 
 * Note: Since Supabase doesn't support true transactions client-side,
 * this provides best-effort rollback by tracking operations
 */
export async function executeTransaction<T>(
  operations: Array<{
    execute: () => Promise<any>;
    rollback: () => Promise<void>;
    name: string;
  }>,
  transactionName: string = 'Transaction'
): Promise<T[]> {
  const executedOps: typeof operations = [];
  
  try {
    console.log(`🔄 Transaction démarrée: ${transactionName}`);
    
    const results: any[] = [];
    
    for (const op of operations) {
      console.log(`  ▶ Exécution: ${op.name}`);
      const result = await withSupabaseRetry(op.execute, op.name);
      results.push(result);
      executedOps.push(op);
    }
    
    console.log(`✅ Transaction réussie: ${transactionName}`);
    return results;
  } catch (error) {
    console.error(`❌ Transaction échouée: ${transactionName}`, error);
    console.log('🔄 Rollback en cours...');
    
    // Rollback in reverse order
    for (let i = executedOps.length - 1; i >= 0; i--) {
      try {
        console.log(`  ◀ Rollback: ${executedOps[i].name}`);
        await executedOps[i].rollback();
      } catch (rollbackError) {
        console.error(`❌ Rollback échoué pour ${executedOps[i].name}:`, rollbackError);
      }
    }
    
    throw error;
  }
}

/**
 * Debounced critical operation
 * Prevents duplicate calls within a time window
 */
class OperationDebouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private pendingOperations: Map<string, Promise<any>> = new Map();
  
  /**
   * Debounce an operation
   * If called multiple times rapidly, only the last call executes
   */
  async debounce<T>(
    key: string,
    operation: () => Promise<T>,
    delay: number = 500
  ): Promise<T> {
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Return existing pending operation if any
    const pending = this.pendingOperations.get(key);
    if (pending) {
      console.log(`⏳ Opération déjà en attente: ${key}`);
      return pending;
    }
    
    // Create new debounced operation
    const promise = new Promise<T>((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          console.log(`▶ Exécution différée: ${key}`);
          const result = await operation();
          this.pendingOperations.delete(key);
          this.timers.delete(key);
          resolve(result);
        } catch (error) {
          this.pendingOperations.delete(key);
          this.timers.delete(key);
          reject(error);
        }
      }, delay);
      
      this.timers.set(key, timer);
    });
    
    this.pendingOperations.set(key, promise);
    return promise;
  }
}

export const operationDebouncer = new OperationDebouncer();

/**
 * Optimistic UI update wrapper
 * Updates UI immediately, then syncs with server
 * Rolls back on failure
 */
export async function executeOptimisticUpdate<TData, TResult>(
  {
    optimisticUpdate,
    serverUpdate,
    rollback,
    onSuccess,
    onError,
  }: {
    optimisticUpdate: () => void;
    serverUpdate: () => Promise<TResult>;
    rollback: () => void;
    onSuccess?: (result: TResult) => void;
    onError?: (error: any) => void;
  }
): Promise<TResult> {
  // 1. Apply optimistic update immediately (no lag)
  optimisticUpdate();
  console.log('⚡ Mise à jour optimiste appliquée');
  
  try {
    // 2. Sync with server in background
    const result = await withSupabaseRetry(serverUpdate, 'Optimistic update sync');
    
    console.log('✅ Synchronisation serveur réussie');
    onSuccess?.(result);
    return result;
  } catch (error) {
    // 3. Rollback on failure
    console.error('❌ Synchronisation serveur échouée, rollback...', error);
    rollback();
    onError?.(error);
    throw error;
  }
}

/**
 * Batch operation with progress tracking
 * Useful for bulk operations like migration
 */
export async function executeBatchOperation<TItem, TResult>(
  items: TItem[],
  operation: (item: TItem, index: number) => Promise<TResult>,
  {
    batchSize = 10,
    onProgress,
    operationName = 'Batch operation',
  }: {
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
    operationName?: string;
  } = {}
): Promise<TResult[]> {
  const results: TResult[] = [];
  const total = items.length;
  
  console.log(`🔄 ${operationName}: ${total} éléments, batches de ${batchSize}`);
  
  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, total));
    
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => 
        withSupabaseRetry(
          () => operation(item, i + batchIndex),
          `${operationName} [${i + batchIndex + 1}/${total}]`
        )
      )
    );
    
    results.push(...batchResults);
    
    const completed = i + batch.length;
    console.log(`📊 Progression: ${completed}/${total} (${Math.round(completed / total * 100)}%)`);
    onProgress?.(completed, total);
  }
  
  console.log(`✅ ${operationName} terminé: ${total}/${total}`);
  return results;
}
