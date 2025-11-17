/**
 * Formatting Utility Functions
 * Helper functions for formatting strings, numbers, and other data types
 */

/**
 * Shorten product names for display
 * @param urun - Product type
 * @returns Shortened product name
 */
export const kisaltUrunAdi = (urun: string): string => {
  switch (urun) {
    case 'UnattendedPOS':
      return 'UnattPOS';
    case 'AttendedPOS':
      return 'AttndPOS';
    case 'SoftPOS':
      return 'SoftPOS';
    case 'SanalPOS':
      return 'SanalPOS';
    default:
      return urun;
  }
};

/**
 * Format currency to Turkish Lira format
 * @param amount - Amount to format
 * @param showCurrency - Whether to show currency symbol
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, showCurrency = true): string => {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return showCurrency ? `${formatted} ₺` : formatted;
};

/**
 * Format percentage
 * @param value - Value to format
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  return `%${value.toFixed(decimals)}`;
};

/**
 * Format date to Turkish locale
 * @param date - Date to format
 * @param includeTime - Whether to include time
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, includeTime = false): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (includeTime) {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }
  
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

/**
 * Truncate string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
};
