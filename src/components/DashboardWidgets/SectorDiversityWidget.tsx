// Sektör Çeşitliliği Analizi Widget'ı
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PieChart, Building2, TrendingUp, TrendingDown, AlertCircle, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { PayterProduct } from '../PayterProductTab';
import { matchDomain } from '../../utils/domainMatching';
import { FullListModal } from './FullListModal';

interface SectorDiversityWidgetProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

interface SectorData {
  sector: string;
  customerCount: number;
  percentage: number;
  totalDevices: number;
  avgDevices: number;
  totalRevenue: number;
  activeRate: number;
  growthTrend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
}

export function SectorDiversityWidget({ customers, payterProducts }: SectorDiversityWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });
  
  const sectorAnalysis = useMemo(() => {
    // Sektör dağılımı hesapla
    const sectorMap = new Map<string, Customer[]>();
    
    // ✅ NULL SAFETY: customers boş olabilir
    (customers || []).forEach(customer => {
      const sector = customer.sektor || 'Belirtilmemiş';
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, []);
      }
      sectorMap.get(sector)!.push(customer);
    });

    // Her sektör için detaylı analiz
    const sectorData: SectorData[] = Array.from(sectorMap.entries()).map(([sector, sectorCustomers]) => {
      const customerCount = sectorCustomers.length;
      const percentage = (customerCount / customers.length) * 100;
      
      // Cihaz sayısı hesapla (serial number + domain bazlı)
      let totalDevices = 0;
      // ✅ NULL SAFETY: sectorCustomers boş olabilir
      (sectorCustomers || []).forEach(customer => {
        const allDevices = customer.serviceFeeSettings?.deviceSubscriptions || [];
        const activeDevices = allDevices.filter(d => d.isActive);
        const deviceSerials = activeDevices.map(d => d.deviceSerialNumber).filter(Boolean);
        
        const customerDomain = customer.domain || customer.guncelMyPayterDomain;
        
        // Serial number eşleşmesi + domain kontrolü (ignoreMainDomain desteği ile)
        const deviceCount = payterProducts.filter(p => {
          if (!deviceSerials.includes(p.serialNumber)) return false;
          if (!p.domain || !customerDomain) return false;
          return matchDomain(p.domain, customerDomain, customer.ignoreMainDomain || false);
        }).length;
        
        totalDevices += deviceCount;
      });
      
      const avgDevices = customerCount > 0 ? totalDevices / customerCount : 0;
      
      // Gelir hesapla (varsayılan cihaz başına 10€)
      const totalRevenue = totalDevices * 10;
      
      // Aktif oran
      const activeCount = sectorCustomers.filter(c => c.durum === 'Aktif').length;
      const activeRate = (activeCount / customerCount) * 100;
      
      // Büyüme trendi (basit simulasyon - gerçek uygulamada tarihsel veriye göre hesaplanır)
      const growthTrend: 'up' | 'down' | 'stable' = 
        activeRate > 90 ? 'up' : activeRate < 75 ? 'down' : 'stable';
      
      // Risk seviyesi
      const riskLevel: 'low' | 'medium' | 'high' = 
        activeRate > 90 ? 'low' : activeRate > 80 ? 'medium' : 'high';
      
      return {
        sector,
        customerCount,
        percentage,
        totalDevices,
        avgDevices,
        totalRevenue,
        activeRate,
        growthTrend,
        riskLevel
      };
    });

    // En büyükten en küçüğe sırala
    sectorData.sort((a, b) => b.customerCount - a.customerCount);

    // Shannon Diversity Index hesapla
    let shannonIndex = 0;
    sectorData.forEach(({ percentage }) => {
      const p = percentage / 100;
      if (p > 0) {
        shannonIndex -= p * Math.log(p);
      }
    });

    // Herfindahl-Hirschman Index (HHI) hesapla
    let hhi = 0;
    sectorData.forEach(({ percentage }) => {
      hhi += Math.pow(percentage, 2);
    });

    // Top 3 sektör payı
    const top3Share = sectorData.slice(0, 3).reduce((sum, s) => sum + s.percentage, 0);

    // Çeşitlilik durumu
    const diversityStatus = hhi < 1500 ? 'İyi Dağılmış' : hhi < 2500 ? 'Orta' : 'Yoğun';
    const concentrationRisk = hhi < 1500 ? 'Düşük' : hhi < 2500 ? 'Orta' : 'Yüksek';

    return {
      sectorCount: sectorMap.size,
      topSector: sectorData[0],
      leastSector: sectorData[sectorData.length - 1],
      shannonIndex: shannonIndex.toFixed(2),
      hhi: Math.round(hhi),
      diversityStatus,
      concentrationRisk,
      top3Share: top3Share.toFixed(1),
      topSectors: sectorData.slice(0, 6), // Top 6 sektör
      allSectors: sectorData
    };
  }, [customers, payterProducts]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} className="text-green-600" />;
      case 'down':
        return <TrendingDown size={14} className="text-red-600" />;
      default:
        return <span className="text-gray-600">→</span>;
    }
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-red-100 text-red-700 border-red-200'
    };
    const labels = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
    
    return (
      <Badge variant="outline" className={`text-xs ${colors[risk]}`}>
        {labels[risk]}
      </Badge>
    );
  };

  const handleShowFullList = () => {
    const allItems = sectorAnalysis.allSectors.map((sector) => ({
      label: sector.sector,
      value: `${sector.customerCount} müşteri • ${sector.totalDevices} cihaz`,
      badge: `€${sector.totalRevenue.toLocaleString()}`,
    }));
    
    setModalData({
      title: 'Sektör Çeşitliliği - Tüm Liste',
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
      <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="text-purple-600" size={20} />
            Sektör Çeşitliliği Analizi
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
          {/* Sektör Dağılımı Tablosu */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Top 6 Sektör Dağılımı</h4>
              {sectorAnalysis.allSectors.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowFullList}
                  className="h-8 gap-1"
                >
                  <ExternalLink size={14} />
                  <span className="text-xs">Tümünü Göster ({sectorAnalysis.allSectors.length})</span>
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Sektör</TableHead>
                    <TableHead className="text-xs text-right">Müşteri</TableHead>
                    <TableHead className="text-xs text-right">Oran</TableHead>
                    <TableHead className="text-xs text-center">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectorAnalysis.topSectors.map((sector, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs font-medium max-w-[120px] truncate" title={sector.sector}>
                        {sector.sector}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {sector.customerCount}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(sector.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold">{sector.percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getRiskBadge(sector.riskLevel)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        </CardContent>
      )}
      </Card>
    </>
  );
}