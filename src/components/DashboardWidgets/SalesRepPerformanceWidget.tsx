// Satış Temsilcisi Performans Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { UserCircle, Award, Users, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { PayterProduct } from '../PayterProductTab';
import { FullListModal } from './FullListModal';

interface SalesRepPerformanceWidgetProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

interface SalesRepStats {
  repId: string;
  repName: string;
  customerCount: number;
  activeCustomers: number;
  totalDevices: number;
  totalRevenue: number;
  averageDevicesPerCustomer: number;
}

export function SalesRepPerformanceWidget({ customers, payterProducts }: SalesRepPerformanceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });
  
  // Satış temsilcisi bazlı performans hesaplama
  const salesRepMap = new Map<string, SalesRepStats>();

  customers.forEach((customer) => {
    const rawRepId = customer.salesRepId || 'unassigned';
    const rawRepName = customer.salesRepName || 'Atanmamış';
    
    // Normalize edilmiş ID: isim bazlı, büyük/küçük harf ve boşluk farkı olmadan
    const normalizedName = rawRepName.trim().toLowerCase().replace(/\s+/g, '-');
    const repId = rawRepId === 'unassigned' ? 'unassigned' : normalizedName;
    const repName = rawRepName.trim(); // Orijinal ismi kullan, sadece trim et

    if (!salesRepMap.has(repId)) {
      salesRepMap.set(repId, {
        repId,
        repName,
        customerCount: 0,
        activeCustomers: 0,
        totalDevices: 0,
        totalRevenue: 0,
        averageDevicesPerCustomer: 0,
      });
    }

    const stats = salesRepMap.get(repId)!;
    stats.customerCount++;

    if (customer.durum === 'Aktif') {
      stats.activeCustomers++;
    }

    // Aktif cihaz sayısı
    const allDevices = customer.serviceFeeSettings?.deviceSubscriptions || [];
    const activeDevices = allDevices.filter(d => d.isActive);
    const deviceCount = activeDevices.length;
    
    stats.totalDevices += deviceCount;
    stats.totalRevenue += deviceCount * 10; // €10 per device
  });

  // Ortalama cihaz sayısını hesapla
  salesRepMap.forEach((stats) => {
    stats.averageDevicesPerCustomer = stats.customerCount > 0
      ? Math.round((stats.totalDevices / stats.customerCount) * 10) / 10
      : 0;
  });

  // Performansa göre sırala (toplam gelir)
  const salesRepStats = Array.from(salesRepMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );

  // Toplam istatistikler
  const totalCustomers = customers.length;
  const totalReps = salesRepStats.filter((r) => r.repId !== 'unassigned' && r.customerCount > 0).length;
  const unassignedCustomers = salesRepStats.find((r) => r.repId === 'unassigned')?.customerCount || 0;

  // Top 6 temsilci
  const topReps = salesRepStats.filter((r) => r.repId !== 'unassigned').slice(0, 6);
  const allAssignedReps = salesRepStats.filter((r) => r.repId !== 'unassigned');

  const handleShowFullList = () => {
    const allItems = allAssignedReps.map((rep) => ({
      label: rep.repName,
      value: `${rep.totalDevices} cihaz • ${rep.customerCount} müşteri`,
      badge: `€${rep.totalRevenue.toLocaleString()}`,
    }));
    
    setModalData({
      title: 'Satış Temsilcisi Performansı - Tüm Liste',
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
              <UserCircle className="text-orange-600" size={20} />
              Satış Temsilcisi Performansı
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
          {/* Genel İstatistikler */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{totalReps}</div>
              <div className="text-xs text-gray-600 mt-1">Aktif Temsilci</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{totalCustomers}</div>
              <div className="text-xs text-gray-600 mt-1">Toplam Müşteri</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">{unassignedCustomers}</div>
              <div className="text-xs text-gray-600 mt-1">Atanmamış</div>
            </div>
          </div>

          {/* Top 5 Temsilci - Card Bazlı */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Top 6 Temsilci</h4>
              {allAssignedReps.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowFullList}
                  className="h-8 gap-1"
                >
                  <ExternalLink size={14} />
                  <span className="text-xs">Tümünü Göster ({allAssignedReps.length})</span>
                </Button>
              )}
            </div>
            {topReps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserCircle size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz temsilci verisi yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topReps.map((rep, index) => (
                  <div key={rep.repId} className="p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        variant={index === 0 ? 'default' : 'outline'}
                        className="h-8 w-8 flex items-center justify-center p-0"
                      >
                        {index === 0 ? <Award size={14} /> : <span className="text-xs">{index + 1}</span>}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rep.repName}</div>
                        <div className="text-xs text-gray-500">{rep.activeCustomers} aktif</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-gray-600">Müşteri: </span>
                          <span className="font-semibold">{rep.customerCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cihaz: </span>
                          <span className="font-semibold">{rep.totalDevices}</span>
                        </div>
                      </div>
                      <div className="font-semibold text-green-600 text-sm">
                        €{rep.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Atanmamış Müşteriler Uyarısı */}
          {unassignedCustomers > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Users size={24} className="text-amber-600" />
              <div>
                <div className="font-semibold text-sm text-amber-900">
                  {unassignedCustomers} müşteri temsilciye atanmamış
                </div>
                <div className="text-xs text-amber-700">
                  Bu müşterileri bir satış temsilcisine atamanız önerilir
                </div>
              </div>
            </div>
          )}
        </div>
        </CardContent>
      )}
      </Card>
    </>
  );
}
