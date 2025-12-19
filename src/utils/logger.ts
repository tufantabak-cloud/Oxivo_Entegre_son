/**
 * Production-Ready Logger Utility
 * 
 * Automatically disables debug/info/warn logs in production
 * Keeps error logs enabled for production error tracking
 */

import { ENV_CONFIG } from './environmentConfig';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  timestamp?: boolean;
  enableInProduction?: boolean; // Force enable for critical logs
}

class Logger {
  private prefix: string;
  private timestamp: boolean;
  private enableInProduction: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.timestamp = options.timestamp ?? true;
    this.enableInProduction = options.enableInProduction ?? false;
  }

  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    const parts: any[] = [];
    
    if (this.timestamp) {
      const now = new Date().toLocaleTimeString('tr-TR');
      parts.push(`[${now}]`);
    }
    
    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }
    
    return [...parts, ...args];
  }

  private shouldLog(level: LogLevel): boolean {
    // ✅ Always log errors
    if (level === 'error') return true;

    // ✅ Force enable if specified
    if (this.enableInProduction) return true;

    // ✅ Only log in development
    return ENV_CONFIG.enableConsoleLogs;
  }

  /**
   * Debug logs - Only in development
   */
  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', ...args));
    }
  }

  /**
   * Info logs - Only in development
   */
  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', ...args));
    }
  }

  /**
   * Warning logs - Only in development
   */
  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  /**
   * Error logs - Always enabled (important for production error tracking)
   */
  error(...args: any[]): void {
    console.error(...this.formatMessage('error', ...args));
  }

  /**
   * Log always - Even in production (use sparingly!)
   */
  always(...args: any[]): void {
    console.log(...this.formatMessage('info', ...args));
  }

  /**
   * Group logs (only in development)
   */
  group(label: string): void {
    if (this.shouldLog('info')) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog('info')) {
      console.groupEnd();
    }
  }

  /**
   * Table logs (only in development)
   */
  table(data: any, label?: string): void {
    if (this.shouldLog('info')) {
      if (label && this.prefix) {
        console.log(`[${this.prefix}] ${label}`);
      } else if (label) {
        console.log(label);
      }
      console.table(data);
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({ prefix: 'App' });

/**
 * Create a custom logger with prefix
 */
export function createLogger(prefix: string, options?: Omit<LoggerOptions, 'prefix'>): Logger {
  return new Logger({ ...options, prefix });
}

/**
 * Legacy compatibility - Will be removed in future
 * @deprecated Use logger.debug() instead
 */
export const debugLog = logger.debug.bind(logger);

/**
 * @deprecated Use logger.warn() instead
 */
export const debugWarn = logger.warn.bind(logger);

/**
 * @deprecated Use logger.error() instead
 */
export const debugError = logger.error.bind(logger);