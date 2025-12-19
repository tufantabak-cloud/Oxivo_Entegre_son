/**
 * 🔄 OXIVO-BOX Otomatik Yedekleme Sistemi
 * 
 * Her Supabase işleminde otomatik olarak localStorage'a yedekleme yapar.
 * Silinen kayıtlar deleted_records_backup tablosuna kaydedilir.
 * 
 * @version 1.0.0
 * @date 2024-12-17
 */

export interface BackupMetadata {
  tableName: string;
  recordId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE';
  timestamp: string;
  userId?: string;
  backupData: any;
}

export interface BackupStorageData {
  version: string;
  lastBackup: string;
  backups: BackupMetadata[];
}

const BACKUP_STORAGE_KEY = 'oxivo_auto_backup_v1';
const MAX_BACKUPS = 1000; // Maksimum 1000 yedek sakla (disk dolmaması için)

/**
 * LocalStorage'dan tüm yedekleri getirir
 */
export function getBackups(): BackupStorageData {
  try {
    const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!stored) {
      return {
        version: '1.0.0',
        lastBackup: new Date().toISOString(),
        backups: []
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('❌ Yedek veriler okunamadı:', error);
    return {
      version: '1.0.0',
      lastBackup: new Date().toISOString(),
      backups: []
    };
  }
}

/**
 * LocalStorage'a yedek kaydeder
 */
function saveBackups(data: BackupStorageData): boolean {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('❌ Yedek veriler kaydedilemedi:', error);
    return false;
  }
}

/**
 * Yeni bir yedek kaydı ekler
 */
export function addBackup(
  tableName: string,
  operation: BackupMetadata['operation'],
  recordId: string,
  recordData: any
): boolean {
  try {
    const backupStorage = getBackups();
    
    const newBackup: BackupMetadata = {
      tableName,
      recordId,
      operation,
      timestamp: new Date().toISOString(),
      backupData: recordData
    };
    
    // Yeni yedeklemeyi ekle
    backupStorage.backups.unshift(newBackup); // En yeni en başta
    
    // Maksimum limit aşılırsa eski kayıtları sil
    if (backupStorage.backups.length > MAX_BACKUPS) {
      const removed = backupStorage.backups.splice(MAX_BACKUPS);
      console.warn(`⚠️ Eski ${removed.length} yedek silindi (limit: ${MAX_BACKUPS})`);
    }
    
    backupStorage.lastBackup = new Date().toISOString();
    
    const saved = saveBackups(backupStorage);
    
    if (saved) {
      console.log(`✅ [AUTO-BACKUP] ${tableName}.${recordId} yedeklendi (${operation})`);
    }
    
    return saved;
  } catch (error) {
    console.error('❌ Yedekleme hatası:', error);
    return false;
  }
}

/**
 * Belirli bir tablonun yedeklerini getirir
 */
export function getBackupsByTable(tableName: string): BackupMetadata[] {
  const backupStorage = getBackups();
  return backupStorage.backups.filter(b => b.tableName === tableName);
}

/**
 * Belirli bir kaydın yedeklerini getirir
 */
export function getBackupsByRecordId(tableName: string, recordId: string): BackupMetadata[] {
  const backupStorage = getBackups();
  return backupStorage.backups.filter(
    b => b.tableName === tableName && b.recordId === recordId
  );
}

/**
 * Silinen kayıtların yedeklerini getirir
 */
export function getDeletedBackups(): BackupMetadata[] {
  const backupStorage = getBackups();
  return backupStorage.backups.filter(
    b => b.operation === 'SOFT_DELETE' || b.operation === 'DELETE'
  );
}

/**
 * Tüm yedekleri temizler (DİKKAT: Geri alınamaz!)
 */
export function clearAllBackups(): boolean {
  try {
    localStorage.removeItem(BACKUP_STORAGE_KEY);
    console.log('✅ Tüm yedekler temizlendi');
    return true;
  } catch (error) {
    console.error('❌ Yedekler temizlenemedi:', error);
    return false;
  }
}

/**
 * Yedekleri JSON dosyası olarak indirir
 */
export function exportBackupsToJSON(): void {
  try {
    const backupStorage = getBackups();
    const json = JSON.stringify(backupStorage, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oxivo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ Yedekler JSON olarak indirildi');
  } catch (error) {
    console.error('❌ Yedek indirilemedi:', error);
  }
}

/**
 * JSON dosyasından yedekleri geri yükler
 */
export function importBackupsFromJSON(jsonString: string): boolean {
  try {
    const imported = JSON.parse(jsonString) as BackupStorageData;
    
    // Validasyon
    if (!imported.version || !Array.isArray(imported.backups)) {
      throw new Error('Geçersiz yedek formatı');
    }
    
    const saved = saveBackups(imported);
    
    if (saved) {
      console.log(`✅ ${imported.backups.length} yedek geri yüklendi`);
    }
    
    return saved;
  } catch (error) {
    console.error('❌ Yedek geri yüklenemedi:', error);
    return false;
  }
}

/**
 * Yedekleme istatistiklerini getirir
 */
export function getBackupStats() {
  const backupStorage = getBackups();
  
  const stats = {
    totalBackups: backupStorage.backups.length,
    lastBackup: backupStorage.lastBackup,
    byOperation: {} as Record<string, number>,
    byTable: {} as Record<string, number>,
    oldestBackup: backupStorage.backups[backupStorage.backups.length - 1]?.timestamp || null,
    newestBackup: backupStorage.backups[0]?.timestamp || null
  };
  
  // Operation bazlı istatistik
  backupStorage.backups.forEach(b => {
    stats.byOperation[b.operation] = (stats.byOperation[b.operation] || 0) + 1;
    stats.byTable[b.tableName] = (stats.byTable[b.tableName] || 0) + 1;
  });
  
  return stats;
}

/**
 * Belirli bir tarihten önceki yedekleri temizler
 */
export function cleanOldBackups(daysOld: number = 30): number {
  try {
    const backupStorage = getBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const initialCount = backupStorage.backups.length;
    
    backupStorage.backups = backupStorage.backups.filter(b => {
      const backupDate = new Date(b.timestamp);
      return backupDate >= cutoffDate;
    });
    
    const removed = initialCount - backupStorage.backups.length;
    
    if (removed > 0) {
      saveBackups(backupStorage);
      console.log(`✅ ${daysOld} günden eski ${removed} yedek temizlendi`);
    }
    
    return removed;
  } catch (error) {
    console.error('❌ Eski yedekler temizlenemedi:', error);
    return 0;
  }
}
