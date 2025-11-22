/*COMMENT*/

import { connectionManager } from './connectionManager';
import { toast } from 'sonner';
import { checkSharingsStatus, diagnosticAndRepair } from './sharingsRecovery';

interface StartupCheckResult {
  success: boolean;
  checks: {
    network: boolean;
    localStorage: boolean;
    browser: boolean;
    sharingsData: boolean;
  };
  warnings: string[];
  errors: string[];
  autoRepairs: string[];
}

/*COMMENT*/
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

/*COMMENT*/
function checkLocalStorage(): { available: boolean; error?: string } {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return { available: true };
  } catch (error: any) {
    return {
      available: false,
      error: error?.message || 'LocalStorage not available',
    };
  }
}

/*COMMENT*/
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
      sharingsData: false,
    },
    warnings,
    errors,
    autoRepairs,
  };

  // 1. Browser support check
  const browserCheck = checkBrowserSupport();
  result.checks.browser = browserCheck.supported;
  
  if (!browserCheck.supported) {
    errors.push(`Tarayici destegi eksik: ${browserCheck.missing.join(', ')}`);
    result.success = false;
  }

  // 2. LocalStorage check
  const storageCheck = checkLocalStorage();
  result.checks.localStorage = storageCheck.available;
  
  if (!storageCheck.available) {
    warnings.push('LocalStorage kullanilamiyor. Veriler kaydedilemeyebilir.');
  }

  // 3. Network check
  try {
    const isOnline = connectionManager.isOnline();
    result.checks.network = isOnline;
    
    if (!isOnline) {
      warnings.push('Internet baglantisi yok. Bazi özellikler çalismayabilir.');
    }
  } catch (error) {
    warnings.push('Baglanti durumu kontrol edilemedi');
  }

  // 4. âœ… AUTO-REPAIR: Sharings data check and auto-repair
  try {
    const sharingsStatus = checkSharingsStatus();
    result.checks.sharingsData = sharingsStatus.isValid;
    
    if (!sharingsStatus.isValid || sharingsStatus.count === 0) {
      console.log('[STARTUP] Sharings data needs repair:', sharingsStatus);
      
      // Attempt auto-repair
      const repairResult = diagnosticAndRepair(false); // Silent repair
      
      if (repairResult.repaired) {
        autoRepairs.push('Paylasim modelleri otomatik olarak düzeltildi');
        result.checks.sharingsData = true;
        console.log('[STARTUP] âœ… Sharings auto-repair successful');
      } else {
        warnings.push('Paylasim modelleri verisi sorunlu. Tanimlar sekmesinde kontrol edin.');
        console.warn('[STARTUP] âš ï¸ Sharings auto-repair failed');
      }
    } else {
      console.log('[STARTUP] âœ… Sharings data is valid');
    }
  } catch (error) {
    console.error('[STARTUP] Error checking sharings:', error);
    warnings.push('Paylasim modelleri verisi kontrol edilemedi');
  }

  // Set overall success
  result.success = errors.length === 0;

  return result;
}

/*COMMENT*/
export function showStartupResults(result: StartupCheckResult): void {
  // Critical errors
  if (result.errors.length > 0) {
    toast.error('Sistem Hatasi', {
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
    toast.warning('Sistem Uyarisi', {
      description: result.warnings.join('\n'),
      duration: 5000,
    });
  }
}

/*COMMENT*/
export async function initStartupCheck(): Promise<boolean> {
  console.log('ðŸš€ Starting system health check...');
  
  const result = await runStartupCheck();
  
  console.log('ðŸ“Š Health check results:', result);
  
  // Show results to user if there are issues
  if (!result.success || result.warnings.length > 0) {
    showStartupResults(result);
  }

  return result.success;
}



