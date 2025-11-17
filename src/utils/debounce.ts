/**
 * Debounce Utility
 * 
 * Delays function execution until after a specified wait period
 * has elapsed since the last time it was invoked.
 * 
 * Perfect for:
 * - Search input handlers
 * - Resize event handlers
 * - Auto-save functionality
 * - API calls on input change
 * 
 * Usage:
 * const debouncedSearch = debounce((value: string) => {
 *   performSearch(value);
 * }, 300);
 * 
 * Created: 2025-11-06
 */

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Debounce with immediate execution option
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param immediate - If true, trigger on leading edge instead of trailing
 */
export function debounceImmediate<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && timeout === null;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * React hook version of debounce
 * 
 * Usage in React components:
 * const debouncedValue = useDebounce(searchTerm, 300);
 */
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
