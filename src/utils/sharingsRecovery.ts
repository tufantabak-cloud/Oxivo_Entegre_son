/**
 * Sharings Recovery Utility
 * 
 * Paylaşım Modelleri verisinin localStorage'da kaybolması durumunda
 * veriyi kontrol eder ve gerekirse default değerlerle restore eder.
 * 
 * Created: 2025-11-11
 */

import { Sharing } from '../components/DefinitionsModule';
import { logger } from './logger';
import { toast } from 'sonner';

// Default sharings data
const DEFAULT_SHARINGS: Sharing[] = [
  {
    id: '1',
    kod: 'PAY001',
    modelAdi: 'Gelir Ortaklığı',
    oran: '%50',
    aciklama: 'Gelir ortaklığı modeli',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    kod: 'PAY002',
    modelAdi: 'Sabit Komisyon',
    oran: 'Sabit',
    aciklama: 'Sabit komisyon modeli',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

/**
 * Check localStorage sharings status
 * @returns Status object with details
 */
export function checkSharingsStatus(): {
  exists: boolean;
  isValid: boolean;
  count: number;
  data: Sharing[] | null;
  error?: string;
} {
  try {
    const stored = localStorage.getItem('sharings');
    
    if (!stored) {
      return {
        exists: false,
        isValid: false,
        count: 0,
        data: null,
        error: 'Sharings verisi localStorage\'da bulunamadı',
      };
    }

    let parsed = JSON.parse(stored);
    
    // 🔧 VERSIONED FORMAT SUPPORT: Check if data is in versioned format
    // Format: { version: "1.0.14", timestamp: "...", data: [...] }
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      // Extract data from versioned wrapper
      parsed = parsed.data;
    }
    
    // Check if array
    if (!Array.isArray(parsed)) {
      return {
        exists: true,
        isValid: false,
        count: 0,
        data: null,
        error: 'Sharings verisi array değil',
      };
    }

    // Check if empty
    if (parsed.length === 0) {
      return {
        exists: true,
        isValid: false,
        count: 0,
        data: parsed,
        error: 'Sharings verisi boş',
      };
    }

    // Check structure
    const isValid = parsed.every((item: any) => {
      return (
        item &&
        typeof item.id === 'string' &&
        typeof item.kod === 'string' &&
        typeof item.modelAdi === 'string' &&
        typeof item.oran === 'string' &&
        typeof item.aktif === 'boolean'
      );
    });

    if (!isValid) {
      return {
        exists: true,
        isValid: false,
        count: parsed.length,
        data: parsed,
        error: 'Sharings verisi bozuk (bazı alanlar eksik veya hatalı)',
      };
    }

    return {
      exists: true,
      isValid: true,
      count: parsed.length,
      data: parsed,
    };
  } catch (error) {
    return {
      exists: false,
      isValid: false,
      count: 0,
      data: null,
      error: `Parse hatası: ${error}`,
    };
  }
}

/**
 * Restore sharings data to default values
 * @param force - If true, restore even if data exists
 * @returns Success status and message
 */
export function restoreSharingsData(force: boolean = false): {
  success: boolean;
  message: string;
  restoredCount: number;
} {
  try {
    const status = checkSharingsStatus();

    if (!force && status.isValid) {
      return {
        success: false,
        message: 'Sharings verisi zaten mevcut ve geçerli. Restore edilmedi.',
        restoredCount: status.count,
      };
    }

    // Backup existing data if exists
    if (status.exists && status.data) {
      const backup = {
        timestamp: new Date().toISOString(),
        data: status.data,
      };
      localStorage.setItem('sharings_backup', JSON.stringify(backup));
      logger.info('Mevcut sharings verisi yedeklendi', backup);
    }

    // Restore default data
    localStorage.setItem('sharings', JSON.stringify(DEFAULT_SHARINGS));
    
    logger.info('Sharings verisi default değerlerle restore edildi', {
      restoredCount: DEFAULT_SHARINGS.length,
      force,
    });

    return {
      success: true,
      message: `✅ Sharings verisi başarıyla restore edildi (${DEFAULT_SHARINGS.length} kayıt)`,
      restoredCount: DEFAULT_SHARINGS.length,
    };
  } catch (error) {
    logger.error('Sharings restore hatası', { error });
    return {
      success: false,
      message: `❌ Restore hatası: ${error}`,
      restoredCount: 0,
    };
  }
}

/**
 * Get sharings backup if exists
 * @returns Backup data or null
 */
export function getSharingsBackup(): {
  timestamp: string;
  data: Sharing[];
} | null {
  try {
    const backup = localStorage.getItem('sharings_backup');
    if (!backup) return null;
    
    return JSON.parse(backup);
  } catch {
    return null;
  }
}

/**
 * Restore from backup
 * @returns Success status
 */
export function restoreFromBackup(): {
  success: boolean;
  message: string;
} {
  try {
    const backup = getSharingsBackup();
    
    if (!backup) {
      return {
        success: false,
        message: 'Yedek veri bulunamadı',
      };
    }

    localStorage.setItem('sharings', JSON.stringify(backup.data));
    
    return {
      success: true,
      message: `✅ Yedek veriden geri yüklendi (${backup.data.length} kayıt, ${new Date(backup.timestamp).toLocaleString('tr-TR')})`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Geri yükleme hatası: ${error}`,
    };
  }
}

/**
 * Run diagnostic and auto-repair if needed
 * @param showToasts - Show toast notifications
 * @returns Diagnostic result
 */
export function diagnosticAndRepair(showToasts: boolean = true): {
  needsRepair: boolean;
  repaired: boolean;
  status: ReturnType<typeof checkSharingsStatus>;
  message: string;
} {
  const status = checkSharingsStatus();

  if (status.isValid) {
    if (showToasts) {
      toast.success(`✅ Sharings verisi sağlam (${status.count} kayıt)`);
    }
    return {
      needsRepair: false,
      repaired: false,
      status,
      message: `✅ Veri sağlam (${status.count} kayıt)`,
    };
  }

  // Needs repair
  if (showToasts) {
    toast.warning(`⚠️ Sharings verisi sorunlu: ${status.error}`);
  }

  const result = restoreSharingsData(false);

  if (result.success) {
    if (showToasts) {
      toast.success(result.message);
    }
    return {
      needsRepair: true,
      repaired: true,
      status,
      message: result.message,
    };
  } else {
    if (showToasts) {
      toast.error(result.message);
    }
    return {
      needsRepair: true,
      repaired: false,
      status,
      message: result.message,
    };
  }
}

/**
 * Get detailed localStorage report
 * @returns Diagnostic report
 */
export function getSharingsReport(): string {
  const status = checkSharingsStatus();
  const backup = getSharingsBackup();

  let report = '=== SHARINGS DIAGNOSTIC REPORT ===\n\n';

  report += '📊 CURRENT STATUS:\n';
  report += `  - Exists: ${status.exists ? '✅' : '❌'}\n`;
  report += `  - Valid: ${status.isValid ? '✅' : '❌'}\n`;
  report += `  - Count: ${status.count}\n`;
  if (status.error) {
    report += `  - Error: ⚠️ ${status.error}\n`;
  }

  if (status.data && status.data.length > 0) {
    report += '\n📝 DATA PREVIEW:\n';
    status.data.forEach((item, index) => {
      report += `  ${index + 1}. [${item.kod}] ${item.modelAdi} - ${item.oran} (${item.aktif ? 'Aktif' : 'Pasif'})\n`;
    });
  }

  if (backup) {
    report += '\n💾 BACKUP AVAILABLE:\n';
    report += `  - Timestamp: ${new Date(backup.timestamp).toLocaleString('tr-TR')}\n`;
    report += `  - Records: ${backup.data.length}\n`;
  } else {
    report += '\n💾 BACKUP: Not available\n';
  }

  report += '\n🔧 DEFAULT DATA:\n';
  DEFAULT_SHARINGS.forEach((item, index) => {
    report += `  ${index + 1}. [${item.kod}] ${item.modelAdi} - ${item.oran}\n`;
  });

  report += '\n' + '='.repeat(35) + '\n';

  return report;
}

/**
 * Console command helper
 * Use in browser console: window.sharingsRecovery
 */
export const sharingsRecoveryAPI = {
  check: checkSharingsStatus,
  restore: restoreSharingsData,
  backup: getSharingsBackup,
  restoreFromBackup,
  diagnostic: diagnosticAndRepair,
  report: getSharingsReport,
  help: () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           SHARINGS RECOVERY UTILITY - HELP                ║
╚═══════════════════════════════════════════════════════════╝

📋 AVAILABLE COMMANDS:

  window.sharingsRecovery.check()
    → Sharings verisinin durumunu kontrol et

  window.sharingsRecovery.restore(force?)
    → Default değerlerle restore et
    → force=true: Zorla restore

  window.sharingsRecovery.backup()
    → Yedek veriye bak

  window.sharingsRecovery.restoreFromBackup()
    → Yedek veriden geri yükle

  window.sharingsRecovery.diagnostic()
    → Otomatik teşhis ve onarım

  window.sharingsRecovery.report()
    → Detaylı rapor

  window.sharingsRecovery.help()
    → Bu yardım mesajı

╔═══════════════════════════════════════════════════════════╗
║                      QUICK FIXES                          ║
╚═══════════════════════════════════════════════════════════╝

🚑 Hızlı Çözümler:

  // 1. Otomatik teşhis ve onarım
  window.sharingsRecovery.diagnostic()

  // 2. Manuel restore
  window.sharingsRecovery.restore()

  // 3. Yedekten geri yükle (varsa)
  window.sharingsRecovery.restoreFromBackup()

  // 4. Detaylı rapor
  console.log(window.sharingsRecovery.report())
    `);
  },
};

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).sharingsRecovery = sharingsRecoveryAPI;
}
