import React from 'react';
import ReactDOM from 'react-dom/client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 1. GLOBAL STYLES (En Üstte Olmalı)
// Tüm stiller (Tailwind, Figma Düzeltmeleri, Resetler)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import './index.css';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. ANA UYGULAMA VE PROVIDER'LAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import App from './App';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initStartupCheck } from './utils/startupCheck';

// -----------------------------------------------------------------------------
// Service Worker cleanup (prevent caching issues)
// -----------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(() => {
        console.log('✅ Service Worker kaldırıldı:', registration.scope);
      });
    }
  });
}

// -----------------------------------------------------------------------------
// Uygulamayı Başlat (Startup Check)
// -----------------------------------------------------------------------------
// initStartupCheck(); // Eğer bu bir fonksiyonu hemen çalıştırıyorsa burada kalsın

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 3. UYGULAMAYI RENDER ET (ÇALIŞTIR)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Ana 'root' elementi HTML'de bulunamadı!");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <TooltipProvider>
        
        {/* Ana Uygulama */}
        <App />
        
        {/* Global Bileşenler (Tüm sayfalarda görünsün) */}
        <Toaster />
        <ConnectionStatus />
        
      </TooltipProvider>
    </ErrorBoundary>
  </React.StrictMode>
);