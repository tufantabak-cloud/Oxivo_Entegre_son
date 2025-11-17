/**
 * Activity Log / Audit Trail System
 * Tracks all data changes with user context
 */

export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'FINALIZE'
  | 'REVERT';

export type ActivityCategory =
  | 'Müşteri'
  | 'Banka/PF'
  | 'Ürün'
  | 'TABELA'
  | 'Hakediş'
  | 'Tanımlar'
  | 'Gelir'
  | 'Sistem';

export interface ActivityLogEntry {
  id: string;
  timestamp: number; // Unix timestamp
  action: ActivityAction;
  category: ActivityCategory;
  entityId?: string; // ID of the affected entity
  entityName: string; // Name/title of the entity
  details?: string; // Additional context
  oldValue?: any; // Previous value (for updates)
  newValue?: any; // New value (for updates)
  metadata?: Record<string, any>; // Extra data
}

const STORAGE_KEY = 'activity_log_entries';
const MAX_ENTRIES = 1000; // Keep last 1000 entries

/**
 * Log an activity
 */
export function logActivity(
  action: ActivityAction,
  category: ActivityCategory,
  entityName: string,
  options?: {
    entityId?: string;
    details?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: Record<string, any>;
  }
): ActivityLogEntry {
  const entry: ActivityLogEntry = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    action,
    category,
    entityName,
    ...options,
  };

  try {
    const entries = getAllActivities();
    entries.unshift(entry); // Add to beginning

    // Keep only last MAX_ENTRIES
    const trimmed = entries.slice(0, MAX_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    console.log(`📝 Activity logged: ${action} ${category} - ${entityName}`);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }

  return entry;
}

/**
 * Get all activity log entries
 */
export function getAllActivities(): ActivityLogEntry[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to load activities:', error);
    return [];
  }
}

/**
 * Get activities with filters
 */
export interface ActivityFilter {
  action?: ActivityAction;
  category?: ActivityCategory;
  entityId?: string;
  fromDate?: Date;
  toDate?: Date;
  searchQuery?: string;
}

export function getActivities(filter?: ActivityFilter): ActivityLogEntry[] {
  let entries = getAllActivities();

  if (!filter) return entries;

  // Filter by action
  if (filter.action) {
    entries = entries.filter(e => e.action === filter.action);
  }

  // Filter by category
  if (filter.category) {
    entries = entries.filter(e => e.category === filter.category);
  }

  // Filter by entity ID
  if (filter.entityId) {
    entries = entries.filter(e => e.entityId === filter.entityId);
  }

  // Filter by date range
  if (filter.fromDate) {
    const fromTime = filter.fromDate.getTime();
    entries = entries.filter(e => e.timestamp >= fromTime);
  }

  if (filter.toDate) {
    const toTime = filter.toDate.getTime();
    entries = entries.filter(e => e.timestamp <= toTime);
  }

  // Filter by search query
  if (filter.searchQuery && filter.searchQuery.trim()) {
    const query = filter.searchQuery.toLowerCase();
    entries = entries.filter(
      e =>
        e.entityName.toLowerCase().includes(query) ||
        e.details?.toLowerCase().includes(query) ||
        e.action.toLowerCase().includes(query)
    );
  }

  return entries;
}

/**
 * Get activities for a specific entity
 */
export function getEntityHistory(entityId: string): ActivityLogEntry[] {
  return getActivities({ entityId });
}

/**
 * Clear all activity logs
 */
export function clearActivityLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('📝 Activity log cleared');
  } catch (error) {
    console.error('Failed to clear activity log:', error);
  }
}

/**
 * Clear old entries (older than X days)
 */
export function clearOldActivities(daysToKeep: number = 90): number {
  try {
    const entries = getAllActivities();
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    const filtered = entries.filter(e => e.timestamp >= cutoffTime);
    const removedCount = entries.length - filtered.length;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    console.log(`📝 Removed ${removedCount} old activity entries (older than ${daysToKeep} days)`);
    return removedCount;
  } catch (error) {
    console.error('Failed to clear old activities:', error);
    return 0;
  }
}

/**
 * Export activity log as JSON
 */
export function exportActivityLog(): string {
  const entries = getAllActivities();
  return JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalEntries: entries.length,
      entries,
    },
    null,
    2
  );
}

/**
 * Get activity statistics
 */
export interface ActivityStats {
  totalEntries: number;
  byAction: Record<ActivityAction, number>;
  byCategory: Record<ActivityCategory, number>;
  oldestEntry?: Date;
  newestEntry?: Date;
}

export function getActivityStats(): ActivityStats {
  const entries = getAllActivities();

  const byAction: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  entries.forEach(entry => {
    byAction[entry.action] = (byAction[entry.action] || 0) + 1;
    byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
  });

  return {
    totalEntries: entries.length,
    byAction: byAction as Record<ActivityAction, number>,
    byCategory: byCategory as Record<ActivityCategory, number>,
    oldestEntry: entries.length > 0 ? new Date(entries[entries.length - 1].timestamp) : undefined,
    newestEntry: entries.length > 0 ? new Date(entries[0].timestamp) : undefined,
  };
}

/**
 * Format activity action for display
 */
export function formatActivityAction(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    CREATE: 'Oluşturuldu',
    UPDATE: 'Güncellendi',
    DELETE: 'Silindi',
    EXPORT: 'Dışa aktarıldı',
    IMPORT: 'İçe aktarıldı',
    APPROVE: 'Onaylandı',
    REJECT: 'Reddedildi',
    FINALIZE: 'Kesinleştirildi',
    REVERT: 'Geri alındı',
  };

  return labels[action] || action;
}

/**
 * Get activity action icon
 */
export function getActivityActionIcon(action: ActivityAction): string {
  const icons: Record<ActivityAction, string> = {
    CREATE: '➕',
    UPDATE: '✏️',
    DELETE: '🗑️',
    EXPORT: '📤',
    IMPORT: '📥',
    APPROVE: '✅',
    REJECT: '❌',
    FINALIZE: '🔒',
    REVERT: '↩️',
  };

  return icons[action] || '📝';
}

/**
 * Get activity action color class
 */
export function getActivityActionColor(action: ActivityAction): string {
  const colors: Record<ActivityAction, string> = {
    CREATE: 'bg-green-100 text-green-700 border-green-200',
    UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
    EXPORT: 'bg-purple-100 text-purple-700 border-purple-200',
    IMPORT: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    APPROVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECT: 'bg-orange-100 text-orange-700 border-orange-200',
    FINALIZE: 'bg-gray-100 text-gray-700 border-gray-200',
    REVERT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return colors[action] || 'bg-gray-100 text-gray-700 border-gray-200';
}
