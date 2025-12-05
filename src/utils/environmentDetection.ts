/**
 * Figma Make Environment Detection
 * 
 * Purpose: Detect if the app is running in Figma Make sandbox environment
 * Used to suppress Supabase CORS errors and warning spam
 */

/**
 * Check if we're running in Figma Make environment
 * Figma Make uses blob: protocol and figma.com domains
 */
export function isFigmaMakeEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  return (
    hostname.includes('figma.com') ||
    hostname.includes('figmaiframepreview') ||
    protocol === 'blob:'
  );
}

/**
 * Silent mode: Skip logging if in Figma Make
 * Usage: if (!isSilentMode()) logger.warn('...');
 */
export function isSilentMode(): boolean {
  return isFigmaMakeEnvironment();
}
