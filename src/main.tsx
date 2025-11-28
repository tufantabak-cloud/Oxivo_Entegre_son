import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSS IMPORT ORDER - CRITICAL FOR PERFORMANCE & CLS PREVENTION
// DO NOT CHANGE ORDER! Each file builds on the previous one.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Tailwind base styles - Foundation (resets, utilities)
import './styles/globals.css'

// 2. Figma component styles - Component templates (minimized)
import './styles/figma.css'

// 3. Custom utilities - Scrollbars, animations
import './styles/utilities.css'

// 4. Mobile enhancements - Touch-friendly, responsive optimizations
import './styles/mobile-enhancements.css'

// 5. Figma pixel-perfect fixes - ALWAYS LAST (highest priority overrides)
import './styles/figma-fixes.css'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { ConnectionStatus } from './components/ConnectionStatus'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initStartupCheck } from './utils/startupCheck'
import { cleanupSupabaseSession } from './utils/supabaseCleanup'

// Supabase Session Cleanup (prevent multiple client instances)
cleanupSupabaseSession();

// Service Worker cleanup (prevent caching issues)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(() => {
        console.log('✅ Service Worker kaldırıldı:', registration.scope);
      });
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PERFORMANCE OPTIMIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Remove loading state after CSS is loaded
const removeLoadingState = () => {
  const root = document.getElementById('root');
  if (root) {
    // Force a reflow to ensure CSS is applied
    void root.offsetHeight;
    // Mark as ready for hydration
    root.setAttribute('data-css-loaded', 'true');
  }
};

// Wait for CSS to be parsed and applied
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', removeLoadingState);
} else {
  removeLoadingState();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STARTUP HEALTH CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Run health check before rendering
initStartupCheck().then((success) => {
  if (success) {
    console.log('✅ System health check passed');
  } else {
    console.warn('⚠️ System health check found issues');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REACT RENDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TooltipProvider>
        <App />
        <ConnectionStatus />
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)