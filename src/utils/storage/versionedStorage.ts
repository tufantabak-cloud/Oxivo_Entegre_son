/*COMMENT*/

// Get current app version (will be imported from App.tsx)
// For now, hardcoded - TODO: centralize version management
const CURRENT_VERSION = '1.0.12';

export interface VersionedData<T> {
  version: string;
  timestamp: string;
  data: T;
}

/*COMMENT*/
export const getVersionedData = <T,>(
  key: string,
  defaultValue: T,
  migrateFn?: (data: any, fromVersion: string, toVersion: string) => T
): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      console.log(`?? ${key}: No stored data, using default`);
      return defaultValue;
    }

    const parsed = JSON.parse(stored);

    // Check if data is already versioned
    if (parsed.version && parsed.data !== undefined) {
      // Versioned format
      const storedVersion = parsed.version;
      
      if (storedVersion === CURRENT_VERSION) {
        // Version match - no migration needed
        console.log(`? ${key}: Version match (v${storedVersion})`);
        return parsed.data as T;
      } else {
        // Version mismatch - migration needed
        console.log(`?? ${key}: Version mismatch (v${storedVersion} ? v${CURRENT_VERSION})`);
        
        if (migrateFn) {
          const migrated = migrateFn(parsed.data, storedVersion, CURRENT_VERSION);
          console.log(`? ${key}: Migration completed`);
          
          // Save migrated data back to localStorage
          setVersionedData(key, migrated);
          
          return migrated;
        } else {
          console.warn(`?? ${key}: No migration function provided, using stored data as-is`);
          return parsed.data as T;
        }
      }
    } else {
      // Legacy format (no version wrapper) - auto-migrate
      console.log(`?? ${key}: Legacy format detected, wrapping with version`);
      
      // Assume stored data is in correct format, just wrap it
      const wrappedData = parsed as T;
      
      // Save with version wrapper
      setVersionedData(key, wrappedData);
      
      return wrappedData;
    }
  } catch (error) {
    console.error(`? ${key}: Error loading data:`, error);
    return defaultValue;
  }
};

/*COMMENT*/
export const setVersionedData = <T,>(key: string, value: T): void => {
  try {
    const versioned: VersionedData<T> = {
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      data: value,
    };

    const serialized = JSON.stringify(versioned);
    localStorage.setItem(key, serialized);
    
    // Optional: Log storage size for monitoring
    const sizeKB = (serialized.length / 1024).toFixed(2);
    console.log(`?? ${key}: Saved (${sizeKB}KB, v${CURRENT_VERSION})`);
  } catch (error) {
    console.error(`? ${key}: Error saving data:`, error);
    
    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('?? localStorage quota exceeded!');
      // TODO: Implement cleanup or compression strategy
    }
  }
};

/*COMMENT*/
export const getStoredVersion = (key: string): string | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed.version || null;
  } catch {
    return null;
  }
};

/*COMMENT*/
export const getStoredTimestamp = (key: string): string | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed.timestamp || null;
  } catch {
    return null;
  }
};

/*COMMENT*/
export const removeVersionedData = (key: string): void => {
  try {
    localStorage.removeItem(key);
    console.log(`??? ${key}: Removed`);
  } catch (error) {
    console.error(`? ${key}: Error removing data:`, error);
  }
};

/*COMMENT*/
export const clearAllVersionedData = (): void => {
  try {
    localStorage.clear();
    console.log('??? All localStorage data cleared');
  } catch (error) {
    console.error('? Error clearing localStorage:', error);
  }
};

/*COMMENT*/
export const getVersionedDataInventory = (): Array<{
  key: string;
  version: string | null;
  timestamp: string | null;
  sizeKB: number;
}> => {
  const inventory: Array<{
    key: string;
    version: string | null;
    timestamp: string | null;
    sizeKB: number;
  }> = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const sizeKB = (stored.length / 1024);

      try {
        const parsed = JSON.parse(stored);
        inventory.push({
          key,
          version: parsed.version || null,
          timestamp: parsed.timestamp || null,
          sizeKB,
        });
      } catch {
        // Not JSON or invalid format
        inventory.push({
          key,
          version: null,
          timestamp: null,
          sizeKB,
        });
      }
    }
  } catch (error) {
    console.error('Error getting inventory:', error);
  }

  return inventory;
};

/*COMMENT*/
export const migrateAllToVersioned = (): void => {
  console.log('?? Starting localStorage migration to versioned format...');
  
  const keys = [
    'customers',
    'bankPFRecords',
    'payterProducts',
    'jobTitles',
    'mccList',
    'banks',
    'epkList',
    'okList',
    'partnerships',
    'sharings',
    'kartProgramlar',
    'hesapKalemleri',
    'sabitKomisyonlar',
    'ekGelirler',
    'salesReps',
  ];

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  keys.map(key => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(`  ?? ${key}: No data, skipping`);
        skipped++;
        return;
      }

      const parsed = JSON.parse(stored);

      // Check if already versioned
      if (parsed.version && parsed.data !== undefined) {
        console.log(`  ? ${key}: Already versioned (v${parsed.version})`);
        skipped++;
        return;
      }

      // Wrap with version
      const versioned: VersionedData<any> = {
        version: CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        data: parsed,
      };

      localStorage.setItem(key, JSON.stringify(versioned));
      console.log(`  ? ${key}: Migrated to versioned format`);
      migrated++;
    } catch (error) {
      console.error(`  ? ${key}: Migration failed:`, error);
      errors++;
    }
  });

  console.log(`? Migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
};

/*COMMENT*/


