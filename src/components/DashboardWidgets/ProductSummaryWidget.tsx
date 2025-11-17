// Ürün Özet Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Package, TrendingUp, CheckCircle, XCircle, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { PayterProduct } from '../PayterProductTab';
import type { Customer } from '../CustomerModule';
import { matchDomain, normalizeDomain } from '../../utils/domainMatching';
import { FullListModal } from './FullListModal';

interface ProductSummaryWidgetProps {
  payterProducts: PayterProduct[];
  customers: Customer[];
}

export function ProductSummaryWidget({ payterProducts, customers }: ProductSummaryWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });

  // Toplam ürün sayısı
  const totalProducts = payterProducts.length;
  
  // Online/Offline durumuna göre aktif/pasif hesaplama
  const activeProducts = payterProducts.filter((p) => 
    p.onlineStatus?.toLowerCase() === 'online'
  ).length;
  
  const inactiveProducts = payterProducts.filter((p) => 
    p.onlineStatus?.toLowerCase() === 'offline' || !p.onlineStatus
  ).length;

  // Müşteri-Ürün eşleştirmeleri (Ana Domain görmezden gelme desteği ile)
  const productsWithCustomers = payterProducts.filter((p) => {
    if (!p.domain) return false;
    return customers.some((c) => {
      const customerDomain = c.domain || c.guncelMyPayterDomain;
      if (!customerDomain) return false;
      return matchDomain(p.domain, customerDomain, c.ignoreMainDomain || false, c.domainHierarchy);
    });
  }).length;

  const productsWithoutCustomers = totalProducts - productsWithCustomers;

  // Ürün türü dağılımı (online/offline/sync bazlı)
  const productsByStatus = {
    aktif: activeProducts,
    pasif: inactiveProducts,
    synced: payterProducts.filter((p) => 
      p.syncStatus?.toLowerCase().includes('sync') || 
      p.syncStatus?.toLowerCase() === 'synced'
    ).length,
  };

  // Domain analizi (normalize edilmiş)
  const uniqueDomains = new Set(
    payterProducts.map((p) => normalizeDomain(p.domain)).filter(Boolean)
  ).size;

  // En çok ürüne sahip müşteriler (serial number + domain bazlı)
  const customerProductCounts = customers
    .map((c) => {
      const devices = c.serviceFeeSettings?.deviceSubscriptions?.filter(d => d.isActive) || [];
      const deviceSerials = devices.map(d => d.deviceSerialNumber).filter(Boolean);
      if (deviceSerials.length === 0) return null;
      
      const customerDomain = c.domain || c.guncelMyPayterDomain;
      
      // Serial number eşleşmesi + domain kontrolü (ignoreMainDomain desteği ile)
      const productCount = payterProducts.filter((p) => {
        // Serial number eşleşmesi
        if (!deviceSerials.includes(p.serialNumber)) return false;
        
        // Domain kontrolü (ignoreMainDomain=true ise ana domain'i hariç tut)
        if (!p.domain || !customerDomain) return false;
        return matchDomain(p.domain, customerDomain, c.ignoreMainDomain || false, c.domainHierarchy);
      }).length;
      
      return {
        name: c.cariAdi,
        domain: customerDomain,
        productCount,
      };
    })
    .filter((c): c is { name: string; domain: string; productCount: number } => 
      c !== null && c.productCount > 0
    )
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 6);

  // Durum verileri (card bazlı gösterim için)
  const statusItems = [
    {
      icon: <CheckCircle size={16} className="text-green-600" />,
      label: 'Online',
      count: productsByStatus.aktif,
      color: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      icon: <XCircle size={16} className="text-gray-600" />,
      label: 'Offline',
      count: productsByStatus.pasif,
      color: 'bg-gray-50',
      textColor: 'text-gray-700'
    },
    ...(productsByStatus.synced > 0 ? [{
      icon: <TrendingUp size={16} className="text-blue-600" />,
      label: 'Senkronize',
      count: productsByStatus.synced,
      color: 'bg-blue-50',
      textColor: 'text-blue-700'
    }] : [])
  ];

  const handleShowFullList = () => {
    const allItems = payterProducts.slice(0, 50).map((product) => {
      const customer = customers.find(c => {
        const deviceSerials = c.serviceFeeSettings?.deviceSubscriptions
          ?.filter(d => d.isActive)
          .map(d => d.deviceSerialNumber)
          .filter(Boolean) || [];
        return deviceSerials.includes(product.serialNumber || '');
      });
      
      return {
        label: product.serialNumber || 'Seri No Yok',
        value: customer?.cariAdi || 'Müşteri atanmamış',
        badge: product.onlineStatus || 'N/A',
      };
    });
    
    setModalData({
      title: 'Tüm Ürünler (İlk 50)',
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
            <Package className="text-orange-600" size={20} />
            Ürün Özeti
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
          {/* Genel İstatistikler - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{totalProducts}</div>
              <div className="text-xs text-gray-600 mt-1">Toplam Ürün</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{activeProducts}</div>
              <div className="text-xs text-gray-600 mt-1">Online</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{inactiveProducts}</div>
              <div className="text-xs text-gray-600 mt-1">Offline</div>
            </div>
          </div>

          {/* Durum Dağılımı - Card Bazlı */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Durum Dağılımı</h4>
              {payterProducts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowFullList}
                  className="h-8 gap-1"
                >
                  <ExternalLink size={14} />
                  <span className="text-xs">Tüm Ürünler ({payterProducts.length})</span>
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {statusItems.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${item.color}`}>
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${item.textColor}`}>{item.count}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalProducts > 0 ? Math.round((item.count / totalProducts) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Müşteri Entegrasyonu */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Müşteri Entegrasyonu</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{productsWithCustomers}</div>
                <div className="text-xs text-gray-600 mt-1">Müşterili Ürün</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{productsWithoutCustomers}</div>
                <div className="text-xs text-gray-600 mt-1">Müşterisiz Ürün</div>
              </div>
            </div>
            <div className="mt-3 text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{uniqueDomains}</div>
              <div className="text-xs text-gray-600 mt-1">Benzersiz Domain</div>
            </div>
          </div>

          {/* En Çok Ürüne Sahip Müşteriler */}
          {customerProductCounts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                En Çok Ürüne Sahip 6 Müşteri
              </h4>
              <div className="space-y-2">
                {customerProductCounts.map((customer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {customer.name}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {customer.domain}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 whitespace-nowrap">{customer.productCount} ürün</Badge>
                  </div>
                ))}
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
