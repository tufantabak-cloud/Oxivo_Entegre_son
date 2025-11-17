// Müşteriler Özet Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Users, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { PayterProduct } from '../PayterProductTab';
import { matchDomain } from '../../utils/domainMatching';
import { FullListModal } from './FullListModal';

interface CustomersSummaryWidgetProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

export function CustomersSummaryWidget({ customers, payterProducts }: CustomersSummaryWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });

  // Toplam müşteri sayısı
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.durum === 'Aktif').length;
  const inactiveCustomers = customers.filter((c) => c.durum === 'Pasif').length;

  // Cihaz Sayısı Bazlı Müşteri Büyüklük Kategorilendirme
  const categorizeCustomer = (customer: Customer): string => {
    // Eğer musteriTipi tanımlıysa direkt kullan
    if (customer.musteriTipi) {
      return customer.musteriTipi;
    }

    // musteriTipi yoksa aktif cihaz sayısına göre kategorilendirme yap
    const allDevices = customer.serviceFeeSettings?.deviceSubscriptions || [];
    const activeDevices = allDevices.filter(d => d.isActive);
    const deviceCount = activeDevices.length;

    // Cihaz sayısı bazlı kategorilendirme
    // Enterprise: 100+ | Large: 51-99 | Medium: 21-50 | Small: 6-20 | Micro: 0-5
    if (deviceCount >= 100) return 'Enterprise';
    if (deviceCount >= 51) return 'Large';
    if (deviceCount >= 21) return 'Medium';
    if (deviceCount >= 6) return 'Small';
    return 'Micro';
  };

  // Müşteri büyüklük dağılımı (hibrit yaklaşım)
  const categorizedCustomers = customers.map((c) => ({
    ...c,
    effectiveCategory: categorizeCustomer(c),
  }));

  const customersBySize = {
    enterprise: categorizedCustomers.filter((c) => c.effectiveCategory === 'Enterprise').length,
    large: categorizedCustomers.filter((c) => c.effectiveCategory === 'Large').length,
    medium: categorizedCustomers.filter((c) => c.effectiveCategory === 'Medium').length,
    small: categorizedCustomers.filter((c) => c.effectiveCategory === 'Small').length,
    micro: categorizedCustomers.filter((c) => c.effectiveCategory === 'Micro').length,
  };

  // Müşteri-Ürün eşleştirmeleri (serial number + domain bazlı)
  const customersWithProducts = customers.filter((c) => {
    const devices = c.serviceFeeSettings?.deviceSubscriptions?.filter(d => d.isActive) || [];
    const deviceSerials = devices.map(d => d.deviceSerialNumber).filter(Boolean);
    if (deviceSerials.length === 0) return false;
    
    const customerDomain = c.domain || c.guncelMyPayterDomain;
    if (!customerDomain) return false;
    
    // Serial number eşleşmesi + domain kontrolü (ignoreMainDomain desteği ile)
    return payterProducts.some((p) => {
      // Serial number eşleşmesi
      if (!deviceSerials.includes(p.serialNumber)) return false;
      
      // Domain kontrolü (ignoreMainDomain=true ise ana domain'i hariç tut)
      if (!p.domain) return false;
      return matchDomain(p.domain, customerDomain, c.ignoreMainDomain || false);
    });
  }).length;

  // Banka/PF bağlantılı müşteriler
  const customersWithBankPF = customers.filter(
    (c) => c.linkedBankPFIds && c.linkedBankPFIds.length > 0
  ).length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Large':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Medium':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Small':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'Micro':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleShowFullList = () => {
    // Kategori bazlı sıralama: Enterprise -> Large -> Medium -> Small -> Micro
    const categoryOrder: Record<string, number> = {
      'Enterprise': 1,
      'Large': 2,
      'Medium': 3,
      'Small': 4,
      'Micro': 5
    };
    
    const sortedCustomers = [...categorizedCustomers].sort((a, b) => {
      const orderDiff = (categoryOrder[a.effectiveCategory] || 999) - (categoryOrder[b.effectiveCategory] || 999);
      if (orderDiff !== 0) return orderDiff;
      // Aynı kategorideyse isme göre sırala
      return (a.cariAdi || '').localeCompare(b.cariAdi || '', 'tr');
    });

    const allItems = sortedCustomers.map((customer, index) => {
      const activeDevices = customer.serviceFeeSettings?.deviceSubscriptions?.filter(d => d.isActive) || [];
      return {
        label: customer.cariAdi || 'İsimsiz Müşteri',
        value: `${activeDevices.length} cihaz`,
        badge: customer.effectiveCategory,
        className: getCategoryColor(customer.effectiveCategory),
      };
    });
    
    setModalData({
      title: 'Tüm Müşteriler - Büyüklük Kategorisine Göre',
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
            <Users className="text-blue-600" size={20} />
            Müşteriler Özeti
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
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{totalCustomers}</div>
                <div className="text-xs text-gray-600 mt-1">Toplam Müşteri</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{activeCustomers}</div>
                <div className="text-xs text-gray-600 mt-1">Aktif</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-600">{inactiveCustomers}</div>
                <div className="text-xs text-gray-600 mt-1">Pasif</div>
              </div>
            </div>

            {/* Müşteri Büyüklük Dağılımı - Card Bazlı */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-700">Büyüklük Dağılımı</h4>
                {customers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowFullList}
                    className="h-8 gap-1"
                  >
                    <ExternalLink size={14} />
                    <span className="text-xs">Tümünü Göster ({customers.length})</span>
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Micro (1-5) • Small (6-20) • Medium (21-50) • Large (51-100) • Enterprise (100+)
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <span className="text-sm font-medium">Enterprise (100+)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-purple-700">{customersBySize.enterprise}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalCustomers > 0 ? Math.round((customersBySize.enterprise / totalCustomers) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <span className="text-sm font-medium">Large (51-99)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700">{customersBySize.large}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalCustomers > 0 ? Math.round((customersBySize.large / totalCustomers) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50">
                  <span className="text-sm font-medium">Medium (21-50)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-700">{customersBySize.medium}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalCustomers > 0 ? Math.round((customersBySize.medium / totalCustomers) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
                  <span className="text-sm font-medium">Small (6-20)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cyan-700">{customersBySize.small}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalCustomers > 0 ? Math.round((customersBySize.small / totalCustomers) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-sm font-medium">Micro (0-5)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-700">{customersBySize.micro}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalCustomers > 0 ? Math.round((customersBySize.micro / totalCustomers) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
    </>
  );
}
