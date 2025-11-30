// Dashboard Widget Store
// Custom hook for widget configuration and management
// Compatible with existing useState/useEffect pattern
import { useState, useEffect, useCallback } from 'react';
import { getStoredData, setStoredData } from '../utils/storage';

export type WidgetType = 'customers' | 'bankpf' | 'bankPFMembers' | 'bankPFUiySummary' | 'products' | 'revenue' | 'customerGrowth' | 'sectorDiversity' | 'mccDiversity' | 'bankPerformance' | 'revenueTrend' | 'salesRepPerformance' | 'riskDashboard' | 'topCustomers' | 'systemStatus' | 'subscriptionRevenue' | 'deviceRevenueRatio';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  pinned?: boolean; // Sabitlenmiş widget'lar her zaman görünür ve kapatılamaz
  order: number;
  size?: WidgetSize; // 'small' = 1x1, 'medium' = 1x2, 'large' = 2x1, 'full' = 2x2
}

const defaultWidgets: WidgetConfig[] = [
  // ═══════════════════════════════════════════════════════
  // MÜŞTERİLER BÖLÜMÜ (7 Widget)
  // ═══════════════════════════════════════════════════════
  {
    id: 'customers-1',
    type: 'customers',
    title: 'Müşteriler Özeti',
    enabled: true,
    pinned: false,
    order: 0,
    size: 'medium',
  },
  {
    id: 'customerGrowth-1',
    type: 'customerGrowth',
    title: 'Müşteri Büyümesi',
    enabled: true,
    order: 1,
    size: 'medium',
  },
  {
    id: 'sectorDiversity-1',
    type: 'sectorDiversity',
    title: 'Sektör Çeşitliliği Analizi',
    enabled: true,
    order: 2,
    size: 'medium',
  },
  {
    id: 'mccDiversity-1',
    type: 'mccDiversity',
    title: 'MCC Çeşitliliği Analizi',
    enabled: true,
    order: 3,
    size: 'medium',
  },
  {
    id: 'riskDashboard-1',
    type: 'riskDashboard',
    title: 'Risk Dashboard\'u',
    enabled: true,
    order: 4,
    size: 'medium',
  },
  {
    id: 'salesRepPerformance-1',
    type: 'salesRepPerformance',
    title: 'Satış Temsilcisi Performansı',
    enabled: true,
    order: 5,
    size: 'medium',
  },
  {
    id: 'topCustomers-1',
    type: 'topCustomers',
    title: 'Top 10 Müşteriler',
    enabled: true,
    order: 6,
    size: 'large', // 2 kolonu kaplasın
  },
  // ═══════════════════════════════════════════════════════
  // BANKA/PF BÖLÜMÜ (4 Widget)
  // ═══════════════════════════════════════════════════════
  {
    id: 'bankPFMembers-1',
    type: 'bankPFMembers',
    title: 'Banka/PF ÜİY Özeti',
    enabled: true,
    order: 7,
    size: 'medium',
  },
  {
    id: 'bankPFUiySummary-1',
    type: 'bankPFUiySummary',
    title: 'ÜİY İcmal Tablosu',
    enabled: true,
    order: 8,
    size: 'medium',
  },
  {
    id: 'bankPFUiySummary-2',
    type: 'bankPFUiySummary',
    title: 'ÜİY İcmal Tablosu',
    enabled: true,
    order: 9,
    size: 'medium',
  },
  {
    id: 'bankPerformance-1',
    type: 'bankPerformance',
    title: 'Banka Performansı',
    enabled: true,
    order: 10,
    size: 'medium',
  },
  // ═══════════════════════════════════════════════════════
  // ÜRÜN BÖLÜMÜ (1 Widget)
  // ═══════════════════════════════════════════════════════
  {
    id: 'products-1',
    type: 'products',
    title: 'Ürün Özeti',
    enabled: true,
    order: 11,
    size: 'medium',
  },
  // ═══════════════════════════════════════════════════════
  // GELİR BÖLÜMÜ (4 Widget)
  // ═══════════════════════════════════════════════════════
  {
    id: 'revenue-1',
    type: 'revenue',
    title: 'Gelir Özeti',
    enabled: true,
    order: 12,
    size: 'medium',
  },
  {
    id: 'revenueTrend-1',
    type: 'revenueTrend',
    title: 'Gelir Trend Analizi',
    enabled: true,
    order: 13,
    size: 'medium',
  },
  {
    id: 'subscriptionRevenue-1',
    type: 'subscriptionRevenue',
    title: 'Abone Hizmet Bedeli Özeti',
    enabled: true,
    order: 14,
    size: 'medium',
  },
  {
    id: 'deviceRevenueRatio-1',
    type: 'deviceRevenueRatio',
    title: 'Cihaz / Aidat Bedeli Oranı',
    enabled: true,
    order: 15,
    size: 'medium',
  },
];

function getWidgetTitle(type: WidgetType): string {
  switch (type) {
    case 'customers':
      return 'Müşteriler Özeti';
    case 'bankpf':
      return 'Banka/PF Özeti';
    case 'bankPFMembers':
      return 'Banka/PF ÜİY Özeti';
    case 'bankPFUiySummary':
      return 'ÜİY İcmal Tablosu';
    case 'products':
      return 'Ürün Özeti';
    case 'revenue':
      return 'Gelir Özeti';
    case 'customerGrowth':
      return 'Müşteri Büyüme Analizi';
    case 'sectorDiversity':
      return 'Sektör Çeşitliliği';
    case 'mccDiversity':
      return 'MCC Çeşitliliği';
    case 'bankPerformance':
      return 'Banka Performans Analizi';
    case 'revenueTrend':
      return 'Gelir Trend Analizi';
    case 'salesRepPerformance':
      return 'Satış Temsilcisi Performansı';
    case 'riskDashboard':
      return 'Risk Dashboard\'u';
    case 'topCustomers':
      return 'Top 10 Müşteriler';
    case 'systemStatus':
      return 'Sistem Durumu';
    case 'subscriptionRevenue':
      return 'Abone Hizmet Bedeli Özeti';
    case 'deviceRevenueRatio':
      return 'Cihaz / Aidat Bedeli Oranı';
    default:
      return 'Widget';
  }
}

// Migration: Widget'ları güncelle ve yeni widget'ları ekle
function migrateWidgets(widgets: WidgetConfig[]): WidgetConfig[] {
  // ✅ CRITICAL FIX: Ensure widgets is array before .map()
  if (!Array.isArray(widgets)) {
    console.warn('[useDashboardWidgets] migrateWidgets received non-array, using defaultWidgets');
    return defaultWidgets;
  }

  let migratedWidgets = widgets.map((widget) => {
    // topCustomers widget'ı 'large' değilse, güncelle
    if (widget.type === 'topCustomers' && widget.size !== 'large') {
      return { ...widget, size: 'large' };
    }
    return widget;
  });

  // BankPFMembers widget'ı yoksa ekle
  const hasBankPFMembers = migratedWidgets.some((w) => w.type === 'bankPFMembers');
  if (!hasBankPFMembers) {
    // bankpf widget'ından sonraya ekle
    const bankPFIndex = migratedWidgets.findIndex((w) => w.type === 'bankpf');
    const insertIndex = bankPFIndex >= 0 ? bankPFIndex + 1 : 3;
    
    const newWidget: WidgetConfig = {
      id: 'bankPFMembers-1',
      type: 'bankPFMembers',
      title: 'Banka/PF ÜİY Özeti',
      enabled: true,
      order: insertIndex,
      size: 'medium',
    };
    
    // Yeni widget'ı ekle ve order'ları yeniden düzenle
    migratedWidgets.splice(insertIndex, 0, newWidget);
    migratedWidgets = migratedWidgets.map((w, index) => ({
      ...w,
      order: index,
    }));
  }

  return migratedWidgets;
}

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const storedWidgets = getStoredData<WidgetConfig[]>('dashboardWidgets', defaultWidgets);
    const migratedWidgets = migrateWidgets(storedWidgets);
    
    // Eğer migration değişiklik yaptıysa, hemen storage'a kaydet
    const hasChanges = JSON.stringify(storedWidgets) !== JSON.stringify(migratedWidgets);
    if (hasChanges) {
      setStoredData('dashboardWidgets', migratedWidgets);
    }
    
    return migratedWidgets;
  });

  // LocalStorage'a kaydet (debounce ile)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setStoredData('dashboardWidgets', widgets);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [widgets]);

  const addWidget = useCallback((type: WidgetType) => {
    setWidgets((prevWidgets) => {
      const existingWidgetsOfType = prevWidgets.filter((w) => w.type === type);
      const newId = `${type}-${existingWidgetsOfType.length + 1}`;
      const newOrder = Math.max(...prevWidgets.map((w) => w.order), -1) + 1;

      // topCustomers widget'ı için varsayılan boyutu 'large' yap
      const defaultSize = type === 'topCustomers' ? 'large' : 'medium';

      const newWidget: WidgetConfig = {
        id: newId,
        type,
        title: getWidgetTitle(type),
        enabled: true,
        order: newOrder,
        size: defaultSize,
      };

      return [...prevWidgets, newWidget];
    });
  }, []);

  const updateWidgetSize = useCallback((id: string, size: WidgetSize) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((w) => (w.id === id ? { ...w, size } : w))
    );
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prevWidgets) => prevWidgets.filter((w) => w.id !== id));
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((w) => {
        // Pin'li widget'lar kapatılamaz, sadece açılabilir
        if (w.id === id && w.pinned && w.enabled) {
          return w; // Değişiklik yapma
        }
        return w.id === id ? { ...w, enabled: !w.enabled } : w;
      })
    );
  }, []);

  // Widget'ı sabitle/sabitlemeyi kaldır
  const togglePinWidget = useCallback((id: string) => {
    setWidgets((prevWidgets) => {
      const updatedWidgets = prevWidgets.map((w) => {
        if (w.id === id) {
          const newPinned = !w.pinned;
          // Pin'leniyorsa otomatik olarak enabled yap
          return { ...w, pinned: newPinned, enabled: newPinned ? true : w.enabled };
        }
        return w;
      });

      // Pin'li widget'ları üste taşı
      const pinnedWidgets = updatedWidgets.filter(w => w.pinned).sort((a, b) => a.order - b.order);
      const unpinnedWidgets = updatedWidgets.filter(w => !w.pinned).sort((a, b) => a.order - b.order);
      
      // Sıralamayı yeniden düzenle
      return [...pinnedWidgets, ...unpinnedWidgets].map((w, index) => ({ ...w, order: index }));
    });
  }, []);

  const reorderWidgets = useCallback((widgetIds: string[]) => {
    setWidgets((prevWidgets) => {
      return widgetIds
        .map((id, index) => {
          const widget = prevWidgets.find((w) => w.id === id);
          return widget ? { ...widget, order: index } : null;
        })
        .filter((w): w is WidgetConfig => w !== null);
    });
  }, []);

  const resetWidgets = useCallback(() => {
    setWidgets(defaultWidgets);
    setStoredData('dashboardWidgets', defaultWidgets);
  }, []);

  // Widget sırasını bir yukarı taşı
  const moveWidgetUp = useCallback((id: string) => {
    setWidgets((prevWidgets) => {
      const sortedWidgets = [...prevWidgets].sort((a, b) => a.order - b.order);
      const currentIndex = sortedWidgets.findIndex((w) => w.id === id);
      
      // Zaten en üstteyse hiçbir şey yapma
      if (currentIndex <= 0) return prevWidgets;
      
      // İki widget'ın yerini değiştir
      const newWidgets = [...sortedWidgets];
      [newWidgets[currentIndex - 1], newWidgets[currentIndex]] = 
        [newWidgets[currentIndex], newWidgets[currentIndex - 1]];
      
      // Order değerlerini yeniden ata
      return newWidgets.map((w, index) => ({ ...w, order: index }));
    });
  }, []);

  // Widget sırasını bir aşağı taşı
  const moveWidgetDown = useCallback((id: string) => {
    setWidgets((prevWidgets) => {
      const sortedWidgets = [...prevWidgets].sort((a, b) => a.order - b.order);
      const currentIndex = sortedWidgets.findIndex((w) => w.id === id);
      
      // Zaten en alttaysa hiçbir şey yapma
      if (currentIndex < 0 || currentIndex >= sortedWidgets.length - 1) return prevWidgets;
      
      // İki widget'ın yerini değiştir
      const newWidgets = [...sortedWidgets];
      [newWidgets[currentIndex], newWidgets[currentIndex + 1]] = 
        [newWidgets[currentIndex + 1], newWidgets[currentIndex]];
      
      // Order değerlerini yeniden ata
      return newWidgets.map((w, index) => ({ ...w, order: index }));
    });
  }, []);

  return {
    widgets,
    addWidget,
    removeWidget,
    toggleWidget,
    togglePinWidget,
    reorderWidgets,
    resetWidgets,
    updateWidgetSize,
    moveWidgetUp,
    moveWidgetDown,
  };
}