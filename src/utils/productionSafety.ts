/**
 * 🛡️ Production Safety Utilities
 * Prevents dangerous operations in production
 */

import { ENV_CONFIG, IS_PRODUCTION, assertDevelopmentOnly } from './environmentConfig';
import { logger } from './logger';

/**
 * 🚨 Dangerous Operations List
 * These operations should NEVER run in production
 */
const DANGEROUS_OPERATIONS = {
  // Data Management
  CLEAR_ALL_DATA: 'Clear all data',
  RESET_DATABASE: 'Reset database',
  DELETE_ALL_CUSTOMERS: 'Delete all customers',
  TRUNCATE_TABLE: 'Truncate table',
  
  // Migration & Sync
  FORCE_MIGRATION: 'Force migration',
  BULK_DELETE: 'Bulk delete',
  BATCH_UPDATE_WITHOUT_BACKUP: 'Batch update without backup',
  
  // Auth & Security
  BYPASS_AUTH: 'Bypass authentication',
  DISABLE_RLS: 'Disable RLS policies',
  EXPOSE_CREDENTIALS: 'Expose credentials',
  
  // Testing
  SEED_MOCK_DATA: 'Seed mock data',
  ENABLE_DEBUG_MODE: 'Enable debug mode globally',
} as const;

type DangerousOperation = keyof typeof DANGEROUS_OPERATIONS;

/**
 * ✅ Check if dangerous operation is allowed
 */
export function canExecuteDangerousOperation(operation: DangerousOperation): boolean {
  if (IS_PRODUCTION) {
    const message = `🚨 BLOCKED: "${DANGEROUS_OPERATIONS[operation]}" is not allowed in production`;
    logger.error(message);
    return false;
  }
  
  logger.warn(`⚠️ DANGEROUS: Executing "${DANGEROUS_OPERATIONS[operation]}" in ${ENV_CONFIG.enableDebugLogs ? 'development' : 'preview'}`);
  return true;
}

/**
 * 🛡️ Safe wrapper for dangerous operations
 */
export function executeDangerousOperation<T>(
  operation: DangerousOperation,
  callback: () => T
): T | null {
  if (!canExecuteDangerousOperation(operation)) {
    throw new Error(`Operation blocked: ${DANGEROUS_OPERATIONS[operation]}`);
  }
  
  return callback();
}

/**
 * 📊 Data Export Safety Check
 * Prevents accidental export of sensitive data in production
 */
export function sanitizeDataForExport<T extends Record<string, any>>(
  data: T[],
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey']
): T[] {
  if (!IS_PRODUCTION) {
    // In development, return as-is
    return data;
  }
  
  // In production, remove sensitive fields
  return data.map(item => {
    const sanitized = { ...item };
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });
    return sanitized;
  });
}

/**
 * 🔒 API Key Validation
 */
export function validateApiKey(key: string | undefined, keyName: string): boolean {
  if (!key) {
    logger.error(`Missing ${keyName}`);
    return false;
  }
  
  // Check for placeholder values
  const placeholders = ['YOUR_API_KEY', 'PLACEHOLDER', 'REPLACE_ME', 'xxx', '000'];
  if (placeholders.some(p => key.toUpperCase().includes(p))) {
    logger.error(`Invalid ${keyName}: Contains placeholder value`);
    return false;
  }
  
  return true;
}

/**
 * 🚦 Rate Limiting (Simple)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  operationKey: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(operationKey);
  
  if (!entry || now > entry.resetAt) {
    // Reset or create new entry
    rateLimitStore.set(operationKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    logger.warn(`Rate limit exceeded for: ${operationKey}`);
    return false;
  }
  
  entry.count++;
  return true;
}

/**
 * 🧹 Cleanup rate limit store (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * 📝 Audit Log for Critical Operations
 */
export interface AuditLogEntry {
  timestamp: string;
  operation: string;
  user: string;
  success: boolean;
  details?: string;
}

const auditLog: AuditLogEntry[] = [];
const MAX_AUDIT_LOG_SIZE = 100;

export function logAuditEvent(
  operation: string,
  user: string,
  success: boolean,
  details?: string
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    operation,
    user,
    success,
    details,
  };
  
  auditLog.push(entry);
  
  // Keep only last N entries
  if (auditLog.length > MAX_AUDIT_LOG_SIZE) {
    auditLog.shift();
  }
  
  // Log errors immediately
  if (!success) {
    logger.error(`Audit: ${operation} failed for ${user}`, details);
  } else if (ENV_CONFIG.enableDebugLogs) {
    logger.info(`Audit: ${operation} by ${user}`);
  }
}

export function getAuditLog(): AuditLogEntry[] {
  assertDevelopmentOnly('Access audit log');
  return [...auditLog];
}

/**
 * 🔍 Expose safety utils to window for debugging (dev only)
 */
if (typeof window !== 'undefined' && ENV_CONFIG.enableDebugLogs) {
  (window as any).__OXIVO_SAFETY__ = {
    canExecute: canExecuteDangerousOperation,
    auditLog: getAuditLog,
    rateLimitStore,
  };
}
