// MCC (Merchant Category Code) Çeşitliliği Analizi Widget'ı
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CreditCard, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { PayterProduct } from '../PayterProductTab';
import { matchDomain, normalizeDomain } from '../../utils/domainMatching';
import { FullListModal } from './FullListModal';

interface MCCDiversityWidgetProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

interface MCCData {
  mcc: string;
  category: string;
  description: string;
  customerCount: number;
  percentage: number;
  totalDevices: number;
  monthlyRevenue: number;
  avgDevicesPerCustomer: number;
  activeRate: number;
  growth: number;
  riskLevel: 'low' | 'medium' | 'high';
  opportunity: number; // 1-4 yıldız
}

// MCC kategorileri ve açıklamaları
const MCC_CATEGORIES: Record<string, { category: string; description: string }> = {
  '5411': { category: 'Perakende', description: 'Süpermarketler' },
  '8211': { category: 'Eğitim', description: 'İlköğretim ve Ortaöğretim Okulları' },
  '8011': { category: 'Sağlık', description: 'Doktorlar ve Hekimler' },
  '6011': { category: 'Finans', description: 'Finansal Kurumlar (Manuel)' },
  '5812': { category: 'Restoran', description: 'Yeme-İçme Yerleri' },
  '5999': { category: 'Perakende', description: 'Çeşitli Perakende Mağazaları' },
  '7011': { category: 'Konaklama', description: 'Oteller ve Moteller' },
  '5912': { category: 'Sağlık', description: 'Eczaneler' },
  '5941': { category: 'Spor', description: 'Spor Malzemeleri Mağazaları' },
  '7372': { category: 'Teknoloji', description: 'Yazılım Hizmetleri' },
};

export function MCCDiversityWidget({ customers, payterProducts }: MCCDiversityWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });
  
  const mccAnalysis = useMemo(() => {
    // MCC dağılımı hesapla
    const mccMap = new Map<string, Customer[]>();
    const customersWithMCC = customers.filter(c => c.mcc);
    
    customersWithMCC.forEach(customer => {
      const mcc = customer.mcc || 'Belirtilmemiş';
      if (!mccMap.has(mcc)) {
        mccMap.set(mcc, []);
      }
      mccMap.get(mcc)!.push(customer);
    });

    // Her MCC için detaylı analiz
    const mccData: MCCData[] = Array.from(mccMap.entries()).map(([mcc, mccCustomers]) => {
      const mccInfo = MCC_CATEGORIES[mcc] || { category: 'Diğer', description: 'Tanımsız Kategori' };
      const customerCount = mccCustomers.length;
      const percentage = (customerCount / customersWithMCC.length) * 100;
      
      // Cihaz sayısı hesapla (serial number + domain bazlı)
      let totalDevices = 0;
      mccCustomers.forEach(customer => {
        const allDevices = customer.serviceFeeSettings?.deviceSubscriptions || [];
        const activeDevices = allDevices.filter(d => d.isActive);
        const deviceSerials = activeDevices.map(d => d.deviceSerialNumber).filter(Boolean);
        
        if (deviceSerials.length > 0) {
          const customerDomain = customer.domain || customer.guncelMyPayterDomain;
          
          // Serial number eşleşmesi + domain kontrolü (ignoreMainDomain desteği ile)
          const devices = payterProducts.filter(p => {
            if (!deviceSerials.includes(p.serialNumber)) return false;
            if (!p.domain || !customerDomain) return false;
            return matchDomain(p.domain, customerDomain, customer.ignoreMainDomain || false);
          }).length;
          
          totalDevices += devices;
        }
      });
      
      const avgDevicesPerCustomer = customerCount > 0 ? totalDevices / customerCount : 0;
      
      // Gelir hesapla (varsayılan cihaz başına 10€)
      const monthlyRevenue = totalDevices * 10;
      
      // Aktif oran
      const activeCount = mccCustomers.filter(c => c.durum === 'Aktif').length;
      const activeRate = (activeCount / customerCount) * 100;
      
      // Büyüme (simulasyon - gerçek uygulamada tarihsel veriye göre)
      const growth = activeRate > 90 ? 8 : activeRate > 85 ? 3 : activeRate > 80 ? 0 : -2;
      
      // Risk seviyesi
      const riskLevel: 'low' | 'medium' | 'high' = 
        activeRate > 90 ? 'low' : activeRate > 80 ? 'medium' : 'high';
      
      // Fırsat potansiyeli (1-4 yıldız)
      const opportunity = activeRate > 90 && growth > 5 ? 4 : 
                         activeRate > 85 && growth > 0 ? 3 : 
                         activeRate > 80 ? 2 : 1;
      
      return {
        mcc,
        category: mccInfo.category,
        description: mccInfo.description,
        customerCount,
        percentage,
        totalDevices,
        monthlyRevenue,
        avgDevicesPerCustomer,
        activeRate,
        growth,
        riskLevel,
        opportunity
      };
    });

    // En büyükten en küçüğe sırala
    mccData.sort((a, b) => b.customerCount - a.customerCount);

    // Shannon Diversity Index hesapla
    let shannonIndex = 0;
    mccData.forEach(({ percentage }) => {
      const p = percentage / 100;
      if (p > 0) {
        shannonIndex -= p * Math.log(p);
      }
    });

    // Simpson's Diversity Index hesapla
    let simpsonIndex = 0;
    mccData.forEach(({ percentage }) => {
      const p = percentage / 100;
      simpsonIndex += p * p;
    });
    simpsonIndex = 1 - simpsonIndex;

    // MCC kategori gruplaması
    const categoryGroups = new Map<string, { count: number; customers: number; revenue: number }>();
    mccData.forEach(mcc => {
      const existing = categoryGroups.get(mcc.category) || { count: 0, customers: 0, revenue: 0 };
      categoryGroups.set(mcc.category, {
        count: existing.count + 1,
        customers: existing.customers + mcc.customerCount,
        revenue: existing.revenue + mcc.monthlyRevenue
      });
    });

    // Top 5 MCC konsantrasyon oranı
    const top5Concentration = mccData.slice(0, 5).reduce((sum, m) => sum + m.percentage, 0);

    return {
      totalMCCCount: mccMap.size,
      topMCC: mccData[0],
      leastMCC: mccData[mccData.length - 1],
      shannonIndex: shannonIndex.toFixed(2),
      simpsonIndex: simpsonIndex.toFixed(2),
      top5Concentration: top5Concentration.toFixed(1),
      missingMCC: customers.length - customersWithMCC.length,
      topMCCs: mccData.slice(0, 6), // Top 6 MCC
      categoryGroups: Array.from(categoryGroups.entries()).map(([category, data]) => ({
        category,
        ...data,
        percentage: (data.customers / customersWithMCC.length) * 100
      })).sort((a, b) => b.customers - a.customers),
      allMCCs: mccData
    };
  }, [customers, payterProducts]);

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-red-100 text-red-700 border-red-200'
    };
    const labels = { low: '🟢 Düşük', medium: '🟡 Orta', high: '🔴 Yüksek' };
    
    return (
      <Badge variant="outline" className={`text-xs ${colors[risk]}`}>
        {labels[risk]}
      </Badge>
    );
  };

  const getOpportunityStars = (opportunity: number) => {
    return '⭐'.repeat(opportunity);
  };

  const getGrowthIndicator = (growth: number) => {
    if (growth > 5) return <TrendingUp size={14} className="text-green-600" />;
    if (growth < 0) return <TrendingDown size={14} className="text-red-600" />;
    return <span className="text-gray-600 text-xs">→</span>;
  };

  const handleShowFullList = () => {
    const allItems = mccAnalysis.allMCCs.map((mcc) => ({
      label: `${mcc.mcc} - ${mcc.description}`,
      value: `${mcc.customerCount} müşteri • ${mcc.totalDevices} cihaz`,
      badge: `€${mcc.monthlyRevenue.toLocaleString()}`,
    }));
    
    setModalData({
      title: 'MCC Çeşitliliği - Tüm Liste',
      items: allItems,
    });
    setShowFullListModal(true);
  };

  return (
    <>
      <FullListModal
        isOpen={showFullListModal}
        onClose={() => setShowFullListModal(false)}
        title={modalData.title}
        items={modalData.items}
      />
      <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="text-emerald-600" size={20} />
            MCC Çeşitliliği Analizi
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
            title={isExpanded ? "Daralt" : "Genişlet"}
          >
            {isExpanded ? (
              <Minimize2 size={16} className="text-gray-600" />
            ) : (
              <Maximize2 size={16} className="text-gray-600" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-6">
          {/* MCC Kategori Gruplaması */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Kategori Gruplaması</h4>
            <div className="space-y-2">
              {mccAnalysis.categoryGroups.slice(0, 5).map((group, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{group.category}</div>
                    <div className="text-xs text-gray-500">
                      {group.count} farklı MCC • {group.customers} müşteri
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-600">
                      {group.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      €{group.revenue.toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MCC Dağılımı - Card Bazlı */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Top 6 MCC Dağılımı</h4>
              {mccAnalysis.allMCCs.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowFullList}
                  className="h-8 gap-1"
                >
                  <ExternalLink size={14} />
                  <span className="text-xs">Tümünü Göster ({mccAnalysis.allMCCs.length})</span>
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {mccAnalysis.topMCCs.slice(0, 6).map((mcc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono font-semibold text-sm">{mcc.mcc}</span>
                    <Badge variant="outline" className="text-xs">
                      {mcc.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{mcc.customerCount}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(mcc.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-sm min-w-[45px] text-right">{mcc.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </CardContent>
      )}
      </Card>
    </>
  );
}
