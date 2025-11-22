/*COMMENT*/

// Logger varsa kullan, yoksa konsola yaz (Hata almamak için fallback)
import { logger } from './logger';

const safeLogger = {
  error: (msg: string, meta?: any) => logger ? logger.error(msg, meta) : console.error(msg, meta),
  info: (msg: string, meta?: any) => logger ? logger.info(msg, meta) : console.log(msg, meta)
};

// Uygulama versiyonunu buradan yönetiyoruz
const STORAGE_VERSION = '1.0.25';

/*COMMENT*/
export const getStoredData = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === 'undefined') return defaultValue;

    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    // Try to parse
    const parsed = JSON.parse(stored);

    // ðŸ”§ VERSIONED FORMAT SUPPORT
    // Eger veri versiyonlu formatta ise ({ version: "...", data: ... }) sadece data'yi dön
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
        return parsed.data as T;
    }

    // Eski format (Direkt array/obje) ise oldugu gibi dön
    return parsed as T;

  } catch (error) {
    safeLogger.error('Error reading from localStorage', { key, error });
    
    // Try to recover corrupted data
    try {
      localStorage.removeItem(key);
      safeLogger.info('Removed corrupted localStorage key', { key });
    } catch {}
    
    return defaultValue;
  }
};

/*COMMENT*/
export const setStoredData = <T>(key: string, value: T): void => {
  try {
    if (typeof window === 'undefined') return;

    // ðŸ”§ WRAP DATA (Versiyon bilgisi ekle)
    // Bu sayede ileride veri yapisi degisirse migration yapabiliriz.
    const versionedData = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        data: value
    };

    const stringified = JSON.stringify(versionedData);
    localStorage.setItem(key, stringified);

  } catch (error: any) {
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
      safeLogger.error('LocalStorage quota exceeded', { key });
      
      // Try to free up space by removing old activity logs and cache
      try {
        const keysToClean = ['activityLogs', 'debugLogs', 'oldCustomers', 'temp_backup'];
        keysToClean.map(k => {
          if (k !== key) {
            localStorage.removeItem(k);
          }
        });
        
        // Retry after cleanup
        const versionedData = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: value
        };
        localStorage.setItem(key, JSON.stringify(versionedData));
        safeLogger.info('Successfully saved after quota cleanup', { key });
      } catch {
        safeLogger.error('Failed to save even after cleanup', { key });
      }
    } else {
      safeLogger.error('Error saving to localStorage', { key, error });
    }
  }
};

/*COMMENT*/
export const removeStoredData = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    safeLogger.error('Error removing from localStorage', { key, error });
  }
};

/*COMMENT*/
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    safeLogger.error('Error clearing localStorage', { error });
  }
};


