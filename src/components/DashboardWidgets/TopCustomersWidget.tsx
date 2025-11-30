// Top 10 Müşteriler Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Trophy, Users, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { PayterProduct } from '../PayterProductTab';
import { matchDomain } from '../../utils/domainMatching';
import { FullListModal } from './FullListModal';

interface TopCustomersWidgetProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

interface CustomerRanking {
  id: string;
  name: string;
  deviceCount: number;
  revenue: number;
  productCount: number;
  status: 'Aktif' | 'Pasif';
  category: string;
}

export function TopCustomersWidget({ customers, payterProducts }: TopCustomersWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });

  // ✅ Serial number bazlı eşleştirme sistemi aktif
  // Debug log'ları kaldırıldı - sistem production ready

  // Müşteri sıralaması oluştur
  const rankings: CustomerRanking[] = customers.map((customer) => {
    // Aktif cihaz sayısı (sadece isActive: true olanlar)
    const allDevices = customer.serviceFeeSettings?.deviceSubscriptions || [];
    const activeDevices = allDevices.filter(d => d.isActive);
    const deviceCount = activeDevices.length;
    const revenue = deviceCount * 10; // €10 per device

    // ✅ YENİ: Serial number + domain bazlı ürün eşleştirmesi
    // Müşterinin tüm device serial number'larını al
    const deviceSerials = activeDevices
      .map(d => d.deviceSerialNumber)
      .filter(Boolean); // Boş olanları temizle
    
    const customerDomain = customer.domain || customer.guncelMyPayterDomain;
    
    // PayterProducts içinde serial number + domain eşleşmesi yap
    const matchingProducts = payterProducts.filter((p) => {
      // Serial number eşleşmesi
      if (!deviceSerials.includes(p.serialNumber)) return false;
      
      // Domain kontrolü (ignoreMainDomain desteği ile)
      if (!p.domain || !customerDomain) return false;
      return matchDomain(p.domain, customerDomain, customer.ignoreMainDomain || false);
    });
    const productCount = matchingProducts.length;



    // Kategori (cihaz sayısına göre)
    let category = 'Micro';
    if (deviceCount >= 100) category = 'Enterprise';
    else if (deviceCount >= 51) category = 'Large';
    else if (deviceCount >= 21) category = 'Medium';
    else if (deviceCount >= 6) category = 'Small';

    return {
      id: customer.id,
      name: customer.cariAdi,
      deviceCount,
      revenue,
      productCount,
      status: customer.durum,
      category,
    };
  });

  // Eşleşme özeti
  const customersWithProducts = rankings.filter(r => r.productCount > 0).length;
  const customersWithoutProducts = rankings.filter(r => r.productCount === 0).length;
  const totalProducts = rankings.reduce((sum, r) => sum + r.productCount, 0);

  // Müşteri büyüklüğü kategorisine göre sırala (Enterprise → Large → Medium → Small → Micro)
  const categoryOrder: Record<string, number> = {
    'Enterprise': 1,
    'Large': 2,
    'Medium': 3,
    'Small': 4,
    'Micro': 5
  };
  
  const topByDevices = [...rankings]
    .sort((a, b) => {
      // Önce kategoriye göre sırala
      const categoryDiff = (categoryOrder[a.category] || 999) - (categoryOrder[b.category] || 999);
      if (categoryDiff !== 0) return categoryDiff;
      // Aynı kategorideyse cihaz sayısına göre sırala
      return b.deviceCount - a.deviceCount;
    });

  // Gelire göre sırala
  const topByRevenue = [...rankings]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // ✅ Top 6'dan Top 10'a güncellendi

  // Toplam istatistikler
  const totalDevices = rankings.reduce((sum, r) => sum + r.deviceCount, 0);
  const totalRevenue = rankings.reduce((sum, r) => sum + r.revenue, 0);
  const enterpriseCount = rankings.filter((r) => r.category === 'Enterprise').length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Large':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Medium':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Small':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Micro':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleShowFullList = () => {
    const allItems = topByDevices.map((customer, index) => ({
      label: customer.name,
      value: `${customer.deviceCount} cihaz • €${customer.revenue.toLocaleString()}`,
      badge: customer.category,
      className: getCategoryColor(customer.category),
    }));
    
    setModalData({
      title: 'En Çok Cihaza Sahip Müşteriler - Tüm Liste',
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
            <Trophy className="text-amber-600" size={20} />
            Top 10 Müşteriler
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
        <CardContent className="px-6">
        <div className="space-y-6">
          {/* Genel İstatistikler - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-amber-50 rounded-lg">
              <div className="text-4xl font-bold text-amber-600">{enterpriseCount}</div>
              <div className="text-sm text-gray-600 mt-2">Enterprise Müşteri</div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600">{totalDevices}</div>
              <div className="text-sm text-gray-600 mt-2">Toplam Cihaz</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl font-bold text-green-600">€{totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-2">Toplam Gelir</div>
            </div>
          </div>

          {/* Cihaz Sayısına Göre Top 10 - Responsive Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                En Çok Cihaza Sahip 10 Müşteri
              </h4>
              {topByDevices.length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowFullList}
                  className="h-8 gap-1"
                >
                  <ExternalLink size={14} />
                  <span className="text-xs">Tümünü Göster ({topByDevices.length})</span>
                </Button>
              )}
            </div>
            {topByDevices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz müşteri verisi yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topByDevices.slice(0, 10).map((customer, index) => (
                  <div key={customer.id} className="p-3 bg-white border rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge
                          variant={index < 3 ? 'default' : 'outline'}
                          className="h-8 w-8 flex items-center justify-center p-0 flex-shrink-0"
                        >
                          {index === 0 ? (
                            <Trophy size={14} className="text-amber-500" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{customer.name}</div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-xs">
                            <span className="text-gray-600">Cihaz: </span>
                            <span className="font-semibold">{customer.deviceCount}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-600">Gelir: </span>
                            <span className="font-semibold text-green-600">
                              €{customer.revenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getCategoryColor(customer.category)} text-xs whitespace-nowrap flex-shrink-0`}>
                        {customer.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </CardContent>
      )}
      </Card>
    </>
  );
}