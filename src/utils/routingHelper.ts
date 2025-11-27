// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 ROUTING HELPER - YENİ SEKMEDE AÇ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ URL parametreleri ile sayfa yönetimi
// ✅ Yeni sekmede/pencerede açma
// ✅ Tarayıcı history entegrasyonu
// ✅ Deep linking desteği
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ModuleType = 
  | 'customer' 
  | 'bankpf' 
  | 'product' 
  | 'revenue' 
  | 'reports' 
  | 'definitions';

export type ReportType = 
  | 'customer-report'
  | 'domain-report'
  | 'hakedis-report'
  | 'periodical-revenue'
  | 'bankpf-report';

export interface RouteParams {
  module?: ModuleType;
  id?: string;
  action?: 'view' | 'edit' | 'new';
  report?: ReportType;
  [key: string]: string | undefined;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const buildUrl = (params: RouteParams): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PARSE URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const parseUrl = (): RouteParams => {
  const searchParams = new URLSearchParams(window.location.search);
  const params: RouteParams = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NAVIGATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const navigate = (params: RouteParams, replaceHistory = false) => {
  const url = buildUrl(params);
  
  if (replaceHistory) {
    window.history.replaceState({}, '', url || window.location.pathname);
  } else {
    window.history.pushState({}, '', url || window.location.pathname);
  }

  // Trigger custom event for listeners
  window.dispatchEvent(new CustomEvent('route-change', { detail: params }));
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OPEN IN NEW TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const openInNewTab = (params: RouteParams) => {
  const url = buildUrl(params);
  const fullUrl = `${window.location.origin}${window.location.pathname}${url}`;
  
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OPEN IN NEW WINDOW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const openInNewWindow = (params: RouteParams, width = 1200, height = 800) => {
  const url = buildUrl(params);
  const fullUrl = `${window.location.origin}${window.location.pathname}${url}`;
  
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  window.open(
    fullUrl,
    '_blank',
    `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLE SMART CLICK (Ctrl+Click, Shift+Click, Middle-Click)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const handleSmartClick = (
  e: React.MouseEvent,
  params: RouteParams,
  defaultAction: () => void
) => {
  // Middle click or Ctrl+Click → New tab
  if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
    e.preventDefault();
    openInNewTab(params);
    return;
  }

  // Shift+Click → New window
  if (e.button === 0 && e.shiftKey) {
    e.preventDefault();
    openInNewWindow(params);
    return;
  }

  // Normal click → Default action
  if (e.button === 0) {
    defaultAction();
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COPY URL TO CLIPBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const copyUrlToClipboard = async (params: RouteParams): Promise<boolean> => {
  try {
    const url = buildUrl(params);
    const fullUrl = `${window.location.origin}${window.location.pathname}${url}`;
    
    await navigator.clipboard.writeText(fullUrl);
    return true;
  } catch (error) {
    console.error('Failed to copy URL:', error);
    return false;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARE URL (Web Share API)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const shareUrl = async (
  params: RouteParams,
  title: string,
  text?: string
): Promise<boolean> => {
  try {
    if (!navigator.share) {
      // Fallback to copy
      return await copyUrlToClipboard(params);
    }

    const url = buildUrl(params);
    const fullUrl = `${window.location.origin}${window.location.pathname}${url}`;

    await navigator.share({
      title,
      text: text || title,
      url: fullUrl,
    });

    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Failed to share URL:', error);
    }
    return false;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET CURRENT ROUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getCurrentRoute = (): RouteParams => {
  return parseUrl();
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USE ROUTE (React Hook)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';

export const useRoute = () => {
  const [route, setRoute] = useState<RouteParams>(parseUrl());

  useEffect(() => {
    const handleRouteChange = (e: Event) => {
      const customEvent = e as CustomEvent<RouteParams>;
      setRoute(customEvent.detail);
    };

    const handlePopState = () => {
      setRoute(parseUrl());
    };

    window.addEventListener('route-change', handleRouteChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('route-change', handleRouteChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return route;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS FOR COMMON ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const routes = {
  customer: (id: string, action: 'view' | 'edit' = 'view') => ({
    module: 'customer' as const,
    id,
    action,
  }),
  
  bankpf: (id: string, action: 'view' | 'edit' = 'view') => ({
    module: 'bankpf' as const,
    id,
    action,
  }),
  
  product: (id: string, action: 'view' | 'edit' = 'view') => ({
    module: 'product' as const,
    id,
    action,
  }),
  
  report: (reportType: ReportType, filters?: Record<string, string>) => ({
    module: 'reports' as const,
    report: reportType,
    ...filters,
  }),
};
