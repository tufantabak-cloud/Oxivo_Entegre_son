/**
 * Storage Module - Unified Export
 * 
 * Created: 2025-11-17
 * Updated: 2025-12-06 - Simplified to use only legacy localStorage functions
 * 
 * Usage:
 * ```ts
 * import { getStoredData, setStoredData } from './utils/storage';
 * 
 * // Get data
 * const customers = getStoredData('customers', []);
 * 
 * // Set data
 * setStoredData('customers', customersArray);
 * ```
 */

// ========================================
// EXPORT LEGACY FUNCTIONS (Primary API)
// ========================================

// Legacy localStorage fonksiyonları (app'in kullandığı)
export { 
  getStoredData,
  setStoredData,
  removeStoredData,
  clearStorage,
  getStoredDataAsync,
  setStoredDataAsync
} from './legacy';