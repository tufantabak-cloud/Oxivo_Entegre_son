/**
 * Startup Health Check
 * 
 * Uygulama başlarken bağlantı ve sistem kontrolü yapar.
 * Sorun varsa kullanıcıyı bilgilendirir.
 * 
 * Created: 2025-01-12
 */

import { connectionManager } from './connectionManager';
import { toast } from 'sonner';
// Removed: sharingsRecovery module has been deleted

interface StartupCheckResult {
  success: boolean;
  checks: {
    network: boolean;
    localStorage: boolean;
    browser: boolean;
    // sharingsData: boolean; // Removed: sharingsRecovery deleted
  };
  warnings: string[];
  errors: string[];
  autoRepairs: string[];
}

/**
 * Check if browser supports required features
 */
function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!window.localStorage) missing.push('LocalStorage');
  if (!window.fetch) missing.push('Fetch API');
  if (!window.Promise) missing.push('Promises');

  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Check localStorage availability and quota
 */
function checkLocalStorage(): { available: boolean; error?: string } {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return { available: true };
  } catch (error: any) {
    return {
      available: false,
      error: error.message || 'LocalStorage not available',
    };
  }
}

/**
 * Run startup health check
 */
export async function runStartupCheck(): Promise<StartupCheckResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const autoRepairs: string[] = [];
  
  const result: StartupCheckResult = {
    success: true,
    checks: {
      network: false,
      localStorage: false,
      browser: false,
      // sharingsData: false, // Removed: sharingsRecovery deleted
    },
    warnings,
    errors,
    autoRepairs,
  };

  // 1. Browser support check
  const browserCheck = checkBrowserSupport();
  result.checks.browser = browserCheck.supported;
  
  if (!browserCheck.supported) {
    errors.push(`Tarayıcı desteği eksik: ${browserCheck.missing.join(', ')}`);
    result.success = false;
  }

  // 2. LocalStorage check
  const storageCheck = checkLocalStorage();
  result.checks.localStorage = storageCheck.available;
  
  if (!storageCheck.available) {
    warnings.push('LocalStorage kullanılamıyor. Veriler kaydedilemeyebilir.');
  }

  // 3. Network check
  try {
    const isOnline = connectionManager.isOnline();
    result.checks.network = isOnline;
    
    if (!isOnline) {
      warnings.push('İnternet bağlantısı yok. Bazı özellikler çalışmayabilir.');
    }
  } catch (error) {
    warnings.push('Bağlantı durumu kontrol edilemedi');
  }

  // 4. Removed: Sharings data check (sharingsRecovery module deleted)

  // Set overall success
  result.success = errors.length === 0;

  return result;
}

/**
 * Show startup check results to user
 */
export function showStartupResults(result: StartupCheckResult): void {
  // Critical errors
  if (result.errors.length > 0) {
    toast.error('Sistem Hatası', {
      description: result.errors.join('\n'),
      duration: 10000,
      important: true,
    });
    return;
  }

  // Auto-repairs (show as success)
  if (result.autoRepairs.length > 0) {
    toast.success('Otomatik Düzeltme', {
      description: result.autoRepairs.join('\n'),
      duration: 4000,
    });
  }

  // Warnings
  if (result.warnings.length > 0) {
    toast.warning('Sistem Uyarısı', {
      description: result.warnings.join('\n'),
      duration: 5000,
    });
  }
}

/**
 * Initialize startup check (call in main.tsx or App.tsx)
 */
export async function initStartupCheck(): Promise<boolean> {
  console.log('🚀 Starting system health check...');
  
  const result = await runStartupCheck();
  
  console.log('📊 Health check results:', result);
  
  // Show results to user if there are issues
  if (!result.success || result.warnings.length > 0) {
    showStartupResults(result);
  }

  return result.success;
}