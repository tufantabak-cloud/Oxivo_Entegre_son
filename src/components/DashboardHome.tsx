// Dashboard Ana Sayfa Component'i
// Özelleştirilebilir widget sistemi ile özet bilgi tabloları
// ✅ Otomatik senkronizasyon: Tüm widget'lar real-time verilerle çalışır
// ✅ Widget pin özelliği: Önemli widget'ları en üstte sabitleyin
import { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RefreshCw, Download, Upload, Search } from 'lucide-react';
import {
  Settings,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  LayoutGrid,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Pin,
  PinOff,
} from 'lucide-react';
import { useDashboardWidgets } from '../hooks/useDashboardWidgets';
import type { WidgetConfig } from '../hooks/useDashboardWidgets';
import {
  CustomersSummaryWidget,
  BankPFSummaryWidget,
  BankPFMembersSummaryWidget,
  BankPFUiySummaryWidget,
  ProductSummaryWidget,
  RevenueSummaryWidget,
  CustomerGrowthWidget,
  SectorDiversityWidget,
  MCCDiversityWidget,
  BankPerformanceWidget,
  RevenueTrendWidget,
  SalesRepPerformanceWidget,
  RiskDashboardWidget,
  TopCustomersWidget,
  SystemStatusWidget,
  SubscriptionRevenueSummaryWidget,
  DeviceRevenueRatioWidget,
} from './DashboardWidgets';
import type { Customer } from './CustomerModule';
import type { BankPF } from './BankPFModule';
import type { PayterProduct } from './PayterProductTab';
import type { Bank, EPK, OK } from './DefinitionsModule';
import type { Partnership } from './PartnershipTab';
import type { HesapKalemi, SabitKomisyon, EkGelir } from './RevenueModelsTab';
import { ExcelDataManager } from './ExcelDataManager';
import { CustomerDomainDebugger } from './CustomerDomainDebugger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Separator } from './ui/separator';

interface DashboardHomeProps {
  customers: Customer[];
  bankPFRecords: BankPF[];
  payterProducts: PayterProduct[];
  banks: Bank[];
  epkList: EPK[];
  okList: OK[];
  mccList: Array<{ kod: string; kategori: string }>;
  salesReps: Array<{ id: string; adSoyad: string; aktif: boolean }>;
  jobTitles: Array<{ id: string; unvan: string; aktif: boolean }>;
  partnerships: Partnership[];
  sharings: Array<{ id: string; ad: string; aktif: boolean }>;
  kartProgramlar: Array<{ id: string; ad: string; aktif: boolean }>;
  hesapKalemleri: HesapKalemi[];
  sabitKomisyonlar: SabitKomisyon[];
  ekGelirler: EkGelir[];
  onCustomersChange: (customers: Customer[]) => void;
  onBankPFRecordsChange: (records: BankPF[]) => void;
  onPayterProductsChange: (products: PayterProduct[]) => void;
  onMCCListChange: (list: Array<{ kod: string; kategori: string }>) => void;
  onBanksChange: (list: Bank[]) => void;
  onEPKListChange: (list: EPK[]) => void;
  onOKListChange: (list: OK[]) => void;
  onSalesRepsChange: (list: Array<{ id: string; adSoyad: string; aktif: boolean }>) => void;
  onJobTitlesChange: (list: Array<{ id: string; unvan: string; aktif: boolean }>) => void;
  onPartnershipsChange: (list: Partnership[]) => void;
  onSharingsChange: (list: Array<{ id: string; ad: string; aktif: boolean }>) => void;
  onKartProgramlarChange: (list: Array<{ id: string; ad: string; aktif: boolean }>) => void;
  onHesapKalemleriChange: (list: HesapKalemi[]) => void;
  onSabitKomisyonlarChange: (list: SabitKomisyon[]) => void;
  onEkGelirlerChange: (list: EkGelir[]) => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onCheckData?: () => void;
  onClearData?: () => void;
}

export function DashboardHome({
  customers,
  bankPFRecords,
  payterProducts,
  banks,
  epkList,
  okList,
  mccList,
  salesReps,
  jobTitles,
  partnerships,
  sharings,
  kartProgramlar,
  hesapKalemleri,
  sabitKomisyonlar,
  ekGelirler,
  onCustomersChange,
  onBankPFRecordsChange,
  onPayterProductsChange,
  onMCCListChange,
  onBanksChange,
  onEPKListChange,
  onOKListChange,
  onSalesRepsChange,
  onJobTitlesChange,
  onPartnershipsChange,
  onSharingsChange,
  onKartProgramlarChange,
  onHesapKalemleriChange,
  onSabitKomisyonlarChange,
  onEkGelirlerChange,
  onExportData,
  onImportData,
  onCheckData,
  onClearData,
}: DashboardHomeProps) {
  const { widgets, addWidget, removeWidget, toggleWidget, togglePinWidget, resetWidgets, updateWidgetSize, reorderWidgets, moveWidgetUp, moveWidgetDown } = useDashboardWidgets();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Global refresh handler - tüm widget'ları yenile
  const handleGlobalRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // Auto-refresh: Her 30 saniyede bir otomatik yenile (opsiyonel)
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      console.log('📊 Dashboard auto-refresh triggered');
      setRefreshKey(prev => prev + 1);
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, []);

  // Sıralı ve aktif widget'ları filtrele
  // ✅ CRITICAL FIX: Ensure widgets is array before spreading
  const safeWidgets = Array.isArray(widgets) ? widgets : [];
  const sortedWidgets = [...safeWidgets].sort((a, b) => a.order - b.order);
  const activeWidgets = sortedWidgets.filter((w) => w.enabled);

  // Widget'ları kategorilere ayır
  const customerWidgets = activeWidgets.filter((w) => 
    ['customers', 'customerGrowth', 'sectorDiversity', 'mccDiversity', 'topCustomers', 'salesRepPerformance', 'riskDashboard'].includes(w.type)
  );
  const bankPFWidgets = activeWidgets.filter((w) => 
    ['bankpf', 'bankPFMembers', 'bankPFUiySummary', 'bankPerformance'].includes(w.type)
  );
  const productWidgets = activeWidgets.filter((w) => 
    ['products', 'systemStatus'].includes(w.type)
  );
  const revenueWidgets = activeWidgets.filter((w) => 
    ['revenue', 'revenueTrend', 'subscriptionRevenue', 'deviceRevenueRatio'].includes(w.type)
  );

  // Sürükle-bırak handler
  const moveWidget = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragWidget = activeWidgets[dragIndex];
      const newOrder = [...activeWidgets];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, dragWidget);
      
      // Yeni sıralamayı kaydet
      reorderWidgets(newOrder.map((w) => w.id));
    },
    [activeWidgets, reorderWidgets]
  );

  // Widget render fonksiyonu
  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'customers':
        return (
          <CustomersSummaryWidget customers={customers} payterProducts={payterProducts} />
        );
      case 'bankpf':
        return (
          <BankPFSummaryWidget
            bankPFRecords={bankPFRecords}
            banks={banks}
            epkList={epkList}
            okList={okList}
          />
        );
      case 'products':
        return <ProductSummaryWidget payterProducts={payterProducts} customers={customers} />;
      case 'revenue':
        return <RevenueSummaryWidget customers={customers} payterProducts={payterProducts} />;
      case 'customerGrowth':
        return <CustomerGrowthWidget customers={customers} />;
      case 'sectorDiversity':
        return <SectorDiversityWidget customers={customers} payterProducts={payterProducts} />;
      case 'mccDiversity':
        return <MCCDiversityWidget customers={customers} payterProducts={payterProducts} />;
      case 'bankPerformance':
        return <BankPerformanceWidget customers={customers} bankPFRecords={bankPFRecords} banks={banks} />;
      case 'bankPFMembers':
        return <BankPFMembersSummaryWidget customers={customers} bankPFRecords={bankPFRecords} />;
      case 'bankPFUiySummary':
        return <BankPFUiySummaryWidget customers={customers} bankPFRecords={bankPFRecords} banks={banks} epkList={epkList} okList={okList} />;
      case 'revenueTrend':
        return <RevenueTrendWidget customers={customers} payterProducts={payterProducts} />;
      case 'salesRepPerformance':
        return <SalesRepPerformanceWidget customers={customers} payterProducts={payterProducts} />;
      case 'riskDashboard':
        return <RiskDashboardWidget customers={customers} />;
      case 'topCustomers':
        return <TopCustomersWidget customers={customers} payterProducts={payterProducts} />;
      case 'systemStatus':
        return <SystemStatusWidget customers={customers} bankPFRecords={bankPFRecords} payterProducts={payterProducts} />;
      case 'subscriptionRevenue':
        return <SubscriptionRevenueSummaryWidget customers={customers} />;
      case 'deviceRevenueRatio':
        return <DeviceRevenueRatioWidget customers={customers} payterProducts={payterProducts} />;
      default:
        return null;
    }
  };

  // Yeni widget ekle handler
  const handleAddWidget = (type: 'customers' | 'bankpf' | 'bankPFMembers' | 'bankPFUiySummary' | 'products' | 'revenue' | 'customerGrowth' | 'sectorDiversity' | 'mccDiversity' | 'bankPerformance' | 'revenueTrend' | 'salesRepPerformance' | 'riskDashboard' | 'topCustomers' | 'systemStatus' | 'subscriptionRevenue' | 'deviceRevenueRatio') => {
    addWidget(type);
  };

  // Widget sayaçları
  // ✅ CRITICAL FIX: Use safeWidgets for counts
  const widgetTypeCounts = {
    customers: safeWidgets.filter((w) => w.type === 'customers').length,
    bankpf: safeWidgets.filter((w) => w.type === 'bankpf').length,
    bankPFMembers: safeWidgets.filter((w) => w.type === 'bankPFMembers').length,
    bankPFUiySummary: safeWidgets.filter((w) => w.type === 'bankPFUiySummary').length,
    products: safeWidgets.filter((w) => w.type === 'products').length,
    revenue: safeWidgets.filter((w) => w.type === 'revenue').length,
    customerGrowth: safeWidgets.filter((w) => w.type === 'customerGrowth').length,
    sectorDiversity: safeWidgets.filter((w) => w.type === 'sectorDiversity').length,
    mccDiversity: safeWidgets.filter((w) => w.type === 'mccDiversity').length,
    bankPerformance: safeWidgets.filter((w) => w.type === 'bankPerformance').length,
    revenueTrend: safeWidgets.filter((w) => w.type === 'revenueTrend').length,
    salesRepPerformance: safeWidgets.filter((w) => w.type === 'salesRepPerformance').length,
    riskDashboard: safeWidgets.filter((w) => w.type === 'riskDashboard').length,
    topCustomers: safeWidgets.filter((w) => w.type === 'topCustomers').length,
    systemStatus: safeWidgets.filter((w) => w.type === 'systemStatus').length,
    subscriptionRevenue: safeWidgets.filter((w) => w.type === 'subscriptionRevenue').length,
    deviceRevenueRatio: safeWidgets.filter((w) => w.type === 'deviceRevenueRatio').length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Excel Import/Export */}
            <ExcelDataManager
              customers={customers}
              onCustomersChange={onCustomersChange}
              payterProducts={payterProducts}
              onPayterProductsChange={onPayterProductsChange}
              bankPFRecords={bankPFRecords}
              onBankPFRecordsChange={onBankPFRecordsChange}
              hesapKalemleri={hesapKalemleri}
              onHesapKalemleriChange={onHesapKalemleriChange}
              sabitKomisyonlar={sabitKomisyonlar}
              onSabitKomisyonlarChange={onSabitKomisyonlarChange}
              ekGelirler={ekGelirler}
              onEkGelirlerChange={onEkGelirlerChange}
              jobTitles={jobTitles}
              onJobTitlesChange={onJobTitlesChange}
              mccList={mccList}
              onMCCListChange={onMCCListChange}
              banks={banks}
              onBanksChange={onBanksChange}
              epkList={epkList}
              onEPKListChange={onEPKListChange}
              okList={okList}
              onOKListChange={onOKListChange}
              partnerships={partnerships}
              onPartnershipsChange={onPartnershipsChange}
              sharings={sharings}
              onSharingsChange={onSharingsChange}
              kartProgramlar={kartProgramlar}
              onKartProgramlarChange={onKartProgramlarChange}
              salesReps={salesReps}
              onSalesRepsChange={onSalesRepsChange}
            />

            {/* JSON Export/Import Butonları */}
            {onExportData && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                onClick={onExportData}
              >
                <Download size={16} />
                JSON Export
              </Button>
            )}
            
            {onImportData && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors"
                onClick={onImportData}
              >
                <Upload size={16} />
                JSON Import
              </Button>
            )}
            
            {onCheckData && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                onClick={onCheckData}
              >
                <Search size={16} />
                Verileri Kontrol Et
              </Button>
            )}
            
            {onClearData && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                onClick={onClearData}
              >
                <Trash2 size={16} />
                Tüm Verileri Temizle
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleGlobalRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Yenile
            </Button>
            
            {/* Widget Ayarları Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings size={16} />
                  Widget Yönetimi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Widget Yönetimi</DialogTitle>
                  <DialogDescription>
                    Widget'ları ekleyin, kaldırın veya görünürlüklerini ayarlayın
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4 overflow-y-auto flex-1 pr-2">
                  {/* Yeni Widget Ekle */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Yeni Widget Ekle</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('customers')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Müşteriler Özeti</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.customers} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('bankpf')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Banka/PF Özeti</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.bankpf} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('bankPFMembers')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Banka/PF ÜİY Özeti</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.bankPFMembers} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('bankPFUiySummary')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">ÜİY İcmal Tablosu</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.bankPFUiySummary} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('products')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Ürün Özeti</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.products} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('revenue')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Gelir Özeti</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.revenue} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('customerGrowth')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Müşteri Büyüme</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.customerGrowth} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('sectorDiversity')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Sektör Çeşitliliği</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.sectorDiversity} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('mccDiversity')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">MCC Çeşitliliği</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.mccDiversity} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('bankPerformance')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Banka Performansı</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.bankPerformance} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('revenueTrend')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Gelir Trendi</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.revenueTrend} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('salesRepPerformance')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Temsilci Performansı</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.salesRepPerformance} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('riskDashboard')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Risk Dashboard'u</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.riskDashboard} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('topCustomers')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Top 10 Müşteriler</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.topCustomers} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('systemStatus')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Sistem Durumu</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.systemStatus} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('subscriptionRevenue')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Abone Hizmet Bedeli Özeti</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.subscriptionRevenue} mevcut
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleAddWidget('deviceRevenueRatio')}
                      >
                        <Plus size={16} />
                        <div className="text-left">
                          <div className="font-medium">Cihaz / Aidat Bedeli Oranı</div>
                          <div className="text-xs text-gray-500">
                            {widgetTypeCounts.deviceRevenueRatio} mevcut
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Mevcut Widget'lar */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Mevcut Widget'lar</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Pin size={12} className="text-blue-600" />
                        <span>Sabitlenmiş widget'lar her zaman görünür ve en üsttedir</span>
                      </div>
                    </div>
                    {sortedWidgets.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                          <LayoutGrid size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Henüz widget eklenmemiş</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {sortedWidgets.map((widget, index) => (
                          <div
                            key={widget.id}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              widget.pinned
                                ? 'bg-blue-50 border-blue-300'
                                : widget.enabled
                                ? 'bg-white border-gray-200'
                                : 'bg-gray-50 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={widget.pinned ? 'default' : widget.enabled ? 'default' : 'secondary'}
                                className={`w-20 justify-center ${widget.pinned ? 'bg-blue-600' : ''}`}
                              >
                                {widget.pinned ? '📌 Sabit' : widget.enabled ? 'Aktif' : 'Gizli'}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-400 w-6 text-center">
                                  #{index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    {widget.title}
                                    {widget.pinned && (
                                      <Pin size={14} className="text-blue-600" />
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">ID: {widget.id}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Pin Butonu */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePinWidget(widget.id)}
                                className={`gap-2 ${widget.pinned ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-100' : ''}`}
                                title={widget.pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                              >
                                {widget.pinned ? (
                                  <>
                                    <PinOff size={14} />
                                    Kaldır
                                  </>
                                ) : (
                                  <>
                                    <Pin size={14} />
                                    Sabitle
                                  </>
                                )}
                              </Button>
                              
                              {/* Sıra Yükselt/İndir Butonları */}
                              <div className="flex items-center gap-1 border-r pr-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveWidgetUp(widget.id)}
                                  disabled={index === 0}
                                  className="gap-1 px-2"
                                  title="Sıra Yükselt"
                                >
                                  <ChevronUp size={14} />
                                  Yukarı
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveWidgetDown(widget.id)}
                                  disabled={index === sortedWidgets.length - 1}
                                  className="gap-1 px-2"
                                  title="Sıra İndir"
                                >
                                  <ChevronDown size={14} />
                                  Aşağı
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleWidget(widget.id)}
                                className="gap-2"
                                disabled={widget.pinned && widget.enabled}
                                title={widget.pinned && widget.enabled ? 'Sabitlenmiş widget gizlenemez' : ''}
                              >
                                {widget.enabled ? (
                                  <>
                                    <EyeOff size={14} />
                                    Gizle
                                  </>
                                ) : (
                                  <>
                                    <Eye size={14} />
                                    Göster
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeWidget(widget.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                                disabled={widget.pinned}
                                title={widget.pinned ? 'Sabitlenmiş widget silinemez' : ''}
                              >
                                <Trash2 size={14} />
                                Sil
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Reset Button */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Varsayılana Dön</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Tüm widget'ları varsayılan ayarlara döndürür
                      </p>
                    </div>
                    <Button variant="outline" onClick={resetWidgets}>
                      Sıfırla
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Widgets Tabs */}
        {activeWidgets.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <LayoutGrid size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Henüz aktif widget yok
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Widget yönetimi menüsünden widget'ları etkinleştirin veya yeni widget'lar ekleyin
              </p>
              <Button onClick={() => setIsSettingsOpen(true)} className="gap-2">
                <Settings size={16} />
                Widget Yönetimi
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="customers" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="customers" className="gap-2">
                <BarChart3 size={16} />
                Müşteriler
                {customerWidgets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{customerWidgets.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="bankpf" className="gap-2">
                <BarChart3 size={16} />
                Banka/PF
                {bankPFWidgets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{bankPFWidgets.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <BarChart3 size={16} />
                Ürün
                {productWidgets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{productWidgets.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="revenue" className="gap-2">
                <BarChart3 size={16} />
                Gelir
                {revenueWidgets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{revenueWidgets.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="mt-6">
              {customerWidgets.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-16 text-center">
                    <BarChart3 size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Müşteri widget'ı yok
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Widget yönetiminden müşteri kategorisi widget'larını ekleyin
                    </p>
                    <Button onClick={() => setIsSettingsOpen(true)} className="gap-2">
                      <Settings size={16} />
                      Widget Ekle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" key={refreshKey}>
                  {customerWidgets.map((widget) => (
                    <div
                      key={`${widget.id}-${refreshKey}`}
                      className={`
                        ${widget.size === 'large' ? 'lg:col-span-2' : 'lg:col-span-1'}
                        ${widget.pinned ? 'relative' : ''}
                      `}
                    >
                      {widget.pinned && (
                        <div className="absolute -top-2 -right-2 z-10 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                          <Pin size={14} />
                        </div>
                      )}
                      {renderWidget(widget)}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bankpf" className="mt-6">
              {bankPFWidgets.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-16 text-center">
                    <BarChart3 size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Banka/PF widget'ı yok
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Widget yönetiminden banka/PF kategorisi widget'larını ekleyin
                    </p>
                    <Button onClick={() => setIsSettingsOpen(true)} className="gap-2">
                      <Settings size={16} />
                      Widget Ekle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" key={refreshKey}>
                  {bankPFWidgets.map((widget) => (
                    <div
                      key={`${widget.id}-${refreshKey}`}
                      className={`
                        ${widget.size === 'large' ? 'lg:col-span-2' : 'lg:col-span-1'}
                        ${widget.pinned ? 'relative' : ''}
                      `}
                    >
                      {widget.pinned && (
                        <div className="absolute -top-2 -right-2 z-10 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                          <Pin size={14} />
                        </div>
                      )}
                      {renderWidget(widget)}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              {productWidgets.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-16 text-center">
                    <BarChart3 size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Ürün widget'ı yok
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Widget yönetiminden ürün kategorisi widget'larını ekleyin
                    </p>
                    <Button onClick={() => setIsSettingsOpen(true)} className="gap-2">
                      <Settings size={16} />
                      Widget Ekle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" key={refreshKey}>
                  {productWidgets.map((widget) => (
                    <div
                      key={`${widget.id}-${refreshKey}`}
                      className={`
                        ${widget.size === 'large' ? 'lg:col-span-2' : 'lg:col-span-1'}
                        ${widget.pinned ? 'relative' : ''}
                      `}
                    >
                      {widget.pinned && (
                        <div className="absolute -top-2 -right-2 z-10 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                          <Pin size={14} />
                        </div>
                      )}
                      {renderWidget(widget)}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="revenue" className="mt-6">
              {revenueWidgets.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-16 text-center">
                    <BarChart3 size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Gelir widget'ı yok
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Widget yönetiminden gelir kategorisi widget'larını ekleyin
                    </p>
                    <Button onClick={() => setIsSettingsOpen(true)} className="gap-2">
                      <Settings size={16} />
                      Widget Ekle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" key={refreshKey}>
                  {revenueWidgets.map((widget) => (
                    <div
                      key={`${widget.id}-${refreshKey}`}
                      className={`
                        ${widget.size === 'large' ? 'lg:col-span-2' : 'lg:col-span-1'}
                        ${widget.pinned ? 'relative' : ''}
                      `}
                    >
                      {widget.pinned && (
                        <div className="absolute -top-2 -right-2 z-10 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                          <Pin size={14} />
                        </div>
                      )}
                      {renderWidget(widget)}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}