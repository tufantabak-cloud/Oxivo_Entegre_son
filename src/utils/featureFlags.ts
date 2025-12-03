// ⚡ PERFORMANCE FEATURE FLAGS
// Bu dosya ile performans özelliklerini açıp kapatabiliriz

export const FeatureFlags = {
  // 🔄 Real-time subscriptions (Figma Make'te KAPALI olmalı!)
  ENABLE_REALTIME_SYNC: typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    !window.location.hostname.includes('figma'), // Figma Make'te KAPALI
  
  // 📊 Console logging (Production'da KAPALI)
  ENABLE_DEBUG_LOGS: typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.search.includes('debug=true')),
  
  // ⚡ Performance monitoring
  ENABLE_PERFORMANCE_MONITORING: false,
  
  // 💾 Auto-save frequency (ms)
  AUTO_SAVE_DELAY: 2000,
  
  // 📄 Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  
  // 🔍 Search debounce (ms)
  SEARCH_DEBOUNCE: 300,
} as const;

// 🎯 Environment check
export const isProduction = typeof window !== 'undefined' && 
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('figma');

export const isFigmaMake = typeof window !== 'undefined' && 
  window.location.hostname.includes('figma');

export const isDevelopment = !isProduction;

// 📝 Conditional console logger
export const debugLog = (...args: any[]) => {
  if (FeatureFlags.ENABLE_DEBUG_LOGS) {
    console.log(...args);
  }
};

export const debugWarn = (...args: any[]) => {
  if (FeatureFlags.ENABLE_DEBUG_LOGS) {
    console.warn(...args);
  }
};

export const debugError = (...args: any[]) => {
  // Errors always logged
  console.error(...args);
};
