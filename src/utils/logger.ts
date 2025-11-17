/**
 * Production-Ready Logger Utility
 * 
 * Conditional logging system that respects environment settings.
 * 
 * Features:
 * - Environment-aware logging (dev vs production)
 * - Log levels (debug, info, warn, error)
 * - Structured logging with context
 * - Error tracking integration ready
 * - Performance monitoring
 * - Safe object serialization
 * 
 * Usage:
 * import { logger } from './utils/logger';
 * 
 * logger.debug('User action', { userId: 123 });
 * logger.info('Data loaded', { count: items.length });
 * logger.warn('Slow operation', { duration: 1500 });
 * logger.error('API failed', { error, endpoint: '/api/customers' });
 * 
 * Created: 2025-11-06
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * ⚡ Safe environment detection utility
 * Prevents "Cannot read properties of undefined" errors
 */
export function isDevelopmentMode(): boolean {
  try {
    // Check Vite's import.meta.env first
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const env = import.meta.env;
      if (env.DEV === true || env.MODE === 'development') {
        return true;
      }
    }
    
    // Check process.env as fallback (for Node.js environments)
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
    }
    
    // Default to production for safety
    return false;
  } catch {
    // Fallback: assume production if we can't detect
    return false;
  }
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private enabledLevels: Set<LogLevel>;

  constructor() {
    // ⚡ PRODUCTION HARDENING: Safe environment detection
    this.isDevelopment = isDevelopmentMode();
    
    // In production, only log warnings and errors
    this.enabledLevels = new Set(
      this.isDevelopment 
        ? ['debug', 'info', 'warn', 'error'] 
        : ['warn', 'error']
    );
  }

  /**
   * Check if a log level is enabled
   */
  private isEnabled(level: LogLevel): boolean {
    return this.enabledLevels.has(level);
  }

  /**
   * Safely stringify objects for logging
   */
  private safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return String(obj);
    }
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message}\nContext: ${this.safeStringify(context)}`;
    }
    
    return `${prefix} ${message}`;
  }

  /**
   * Send error to external tracking service (e.g., Sentry)
   * TODO: Integrate with your error tracking service
   */
  private trackError(error: Error, context?: LogContext): void {
    // Example: Sentry.captureException(error, { extra: context });
    // For now, just log to console in production
    if (!this.isDevelopment) {
      console.error('Error tracked:', error, context);
    }
  }

  /**
   * Debug level logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isEnabled('debug')) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Info level logging - only in development
   */
  info(message: string, context?: LogContext): void {
    if (this.isEnabled('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Warning level logging - always enabled
   */
  warn(message: string, context?: LogContext): void {
    if (this.isEnabled('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  /**
   * Error level logging - always enabled
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isEnabled('error')) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      console.error(this.formatMessage('error', message, {
        ...context,
        errorMessage: errorObj.message,
        errorStack: errorObj.stack,
      }));

      // Track in external service
      this.trackError(errorObj, { message, ...context });
    }
  }

  /**
   * Performance monitoring helper
   */
  performance(label: string, startTime: number, context?: LogContext): void {
    const duration = performance.now() - startTime;
    
    if (duration > 1000) {
      this.warn(`Slow operation: ${label}`, {
        ...context,
        duration: `${duration.toFixed(2)}ms`,
      });
    } else if (this.isEnabled('debug')) {
      this.debug(`Performance: ${label}`, {
        ...context,
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  }

  /**
   * Group related logs together
   */
  group(label: string, collapsed: boolean = false): void {
    if (this.isDevelopment) {
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Table output for structured data
   */
  table(data: any[], label?: string): void {
    if (this.isDevelopment) {
      if (label) {
        console.log(label);
      }
      console.table(data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for consistency
export type { Logger };

/**
 * Performance timer helper
 * 
 * Usage:
 * const timer = createTimer('Data processing');
 * // ... do work ...
 * timer.end({ count: items.length });
 */
export function createTimer(label: string) {
  const startTime = performance.now();
  
  return {
    end: (context?: LogContext) => {
      logger.performance(label, startTime, context);
    },
    get elapsed() {
      return performance.now() - startTime;
    }
  };
}

/**
 * Async operation wrapper with automatic error logging
 * 
 * Usage:
 * const result = await withErrorLogging(
 *   'Fetch customers',
 *   async () => {
 *     return await fetchCustomers();
 *   },
 *   { userId: currentUser.id }
 * );
 */
export async function withErrorLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T | null> {
  const timer = createTimer(operation);
  
  try {
    const result = await fn();
    timer.end({ ...context, success: true });
    return result;
  } catch (error) {
    logger.error(`Failed: ${operation}`, error, context);
    timer.end({ ...context, success: false });
    return null;
  }
}

/**
 * Development-only assertion
 */
export function devAssert(condition: boolean, message: string): void {
  if (isDevelopmentMode() && !condition) {
    logger.error(`Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}
