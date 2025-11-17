import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 GLOBAL STYLES & TAILWIND CONFIGURATION
// Tüm stiller (Tailwind, Figma Düzeltmeleri, Resetler) artık burada:
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import './index.css' 

import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { ConnectionStatus } from './components/ConnectionStatus'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initStartupCheck } from './utils/startupCheck'

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