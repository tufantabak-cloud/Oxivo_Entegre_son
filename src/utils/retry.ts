/**
 * Retry Utilities
 * 
 * Automatic retry with exponential backoff.
 * Use for operations that might fail temporarily.
 * 
 * Usage:
 * const result = await retry(() => fetchData(), { maxAttempts: 3 });
 * 
 * Or with hook:
 * const { execute, isRetrying } = useRetry({ maxAttempts: 3 });
 * await execute(() => saveData());
 * 
 * Created: 2025-11-04
 */

import { useState, useCallback, useRef } from 'react';

export interface RetryOptions {
  maxAttempts?: number; // Default: 3
  backoff?: 'linear' | 'exponential'; // Default: 'exponential'
  initialDelay?: number; // Default: 1000ms
  maxDelay?: number; // Default: 30000ms (30s)
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean; // Custom retry condition
  timeout?: number; // Per-attempt timeout
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * Calculate delay for next retry
 */
function calculateDelay(
  attempt: number,
  backoff: 'linear' | 'exponential',
  initialDelay: number,
  maxDelay: number
): number {
  let delay: number;

  if (backoff === 'exponential') {
    // Exponential: 1s, 2s, 4s, 8s, 16s, 32s
    delay = initialDelay * Math.pow(2, attempt - 1);
  } else {
    // Linear: 1s, 2s, 3s, 4s, 5s
    delay = initialDelay * attempt;
  }

  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  delay += jitter;

  // Cap at max delay
  return Math.min(delay, maxDelay);
}

/**
 * Wait for specified duration
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper for async functions
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Core retry function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    backoff = 'exponential',
    initialDelay = 1000,
    maxDelay = 30000,
    onRetry,
    shouldRetry,
    timeout,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts}`);

      // Execute function (with optional timeout)
      const promise = fn();
      const result = timeout
        ? await withTimeout(promise, timeout)
        : await promise;

      // Success!
      console.log(`✅ Success on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(lastError)) {
        console.log(`❌ Error not retryable: ${lastError.message}`);
        throw lastError;
      }

      // Last attempt - don't retry
      if (attempt >= maxAttempts) {
        console.log(`❌ Max attempts (${maxAttempts}) reached`);
        throw lastError;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, backoff, initialDelay, maxDelay);

      console.log(
        `⏳ Retry ${attempt}/${maxAttempts} after ${Math.round(delay)}ms (${lastError.message})`
      );

      // Call onRetry callback
      onRetry?.(attempt, lastError);

      // Wait before retry
      await wait(delay);
    }
  }

  // Should never reach here
  throw lastError || new Error('Retry failed');
}

/**
 * Retry with detailed result
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  let attempts = 0;

  try {
    const data = await retry(
      async () => {
        attempts++;
        return fn();
      },
      options
    );

    return {
      success: true,
      data,
      attempts,
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      attempts,
    };
  }
}

/**
 * Retry hook for React components
 */
export function useRetry(options: RetryOptions = {}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setIsRetrying(true);
      setAttempts(0);
      setError(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const result = await retry(
          async () => {
            // Check if aborted
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error('Retry cancelled');
            }

            return fn();
          },
          {
            ...options,
            onRetry: (attempt, err) => {
              setAttempts(attempt);
              options.onRetry?.(attempt, err);
            },
          }
        );

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsRetrying(false);
        abortControllerRef.current = null;
      }
    },
    [options]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRetrying(false);
  }, []);

  return {
    execute,
    isRetrying,
    attempts,
    error,
    cancel,
  };
}

/**
 * Retry specific error types
 */
export const retryPresets = {
  /**
   * Network errors (fetch, API calls)
   */
  network: {
    maxAttempts: 3,
    backoff: 'exponential' as const,
    initialDelay: 1000,
    maxDelay: 10000,
    shouldRetry: (error: Error) => {
      // Retry on network errors, timeouts, 5xx errors
      return (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504')
      );
    },
  },

  /**
   * localStorage quota errors
   */
  storage: {
    maxAttempts: 2,
    backoff: 'linear' as const,
    initialDelay: 500,
    shouldRetry: (error: Error) => {
      // Retry once on quota errors (maybe user cleared some space)
      return error.message.includes('quota') || error.message.includes('storage');
    },
  },

  /**
   * Temporary failures (race conditions, etc.)
   */
  temporary: {
    maxAttempts: 5,
    backoff: 'exponential' as const,
    initialDelay: 500,
    maxDelay: 5000,
  },
};

/**
 * Batch retry - retry multiple operations
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<RetryResult<T>[]> {
  const results = await Promise.allSettled(
    operations.map(op => retryWithResult(op, options))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        error: new Error(`Operation ${index + 1} failed: ${result.reason}`),
        attempts: 0,
      };
    }
  });
}

/**
 * Circuit breaker pattern
 * 
 * Prevents retry if too many failures occur in a time window.
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === 'open') {
      // Check if we should try half-open
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.resetTimeout
      ) {
        console.log('🔄 Circuit breaker: half-open (testing)');
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - too many failures');
      }
    }

    try {
      const result = await fn();

      // Success - reset
      if (this.state === 'half-open') {
        console.log('✅ Circuit breaker: closed (recovered)');
        this.state = 'closed';
        this.failureCount = 0;
        this.lastFailureTime = null;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.threshold) {
        console.log('❌ Circuit breaker: open (too many failures)');
        this.state = 'open';
      }

      throw error;
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
}

export default retry;
