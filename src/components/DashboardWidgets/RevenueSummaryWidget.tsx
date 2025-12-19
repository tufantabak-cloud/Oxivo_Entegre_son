// Gelir Özet Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Euro, TrendingUp, AlertCircle, DollarSign, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { PayterProduct } from '../PayterProductTab';
import { matchDomain } from '../../utils/domainMatching';
import { FullListModal } from './FullListModal';

interface RevenueSummaryWidgetProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

export function RevenueSummaryWidget({ customers, payterProducts }: RevenueSummaryWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });
  
  // Aktif müşteriler (gelir getiren)
  const activeCustomers = customers.filter((c) => c.durum === 'Aktif');
  
  // Subscription fee analizi
  const customersWithFee = activeCustomers.filter(
    (c) => c.subscriptionFee && c.subscriptionFee > 0
  );
  const totalMonthlyRevenue = customersWithFee.reduce(
    (sum, c) => sum + (c.subscriptionFee || 0),
    0
  );
  const avgFeePerCustomer = customersWithFee.length > 0 
    ? totalMonthlyRevenue / customersWithFee.length 
    : 0;

  // Fee dağılımı (aralıklara göre)
  const feeDistribution = {
    low: customersWithFee.filter((c) => (c.subscriptionFee || 0) < 1000).length,
    medium: customersWithFee.filter(
      (c) => (c.subscriptionFee || 0) >= 1000 && (c.subscriptionFee || 0) < 5000
    ).length,
    high: customersWithFee.filter((c) => (c.subscriptionFee || 0) >= 5000).length,
  };

  // Askıda cihazları olan müşteriler (potansiyel gelir kaybı) - Ana Domain görmezden gelme desteği ile
  const customersWithSuspended = customers.filter((c) => {
    const customerDomain = c.domain || c.guncelMyPayterDomain;
    if (!customerDomain) return false;
    const customerProducts = payterProducts.filter(
      (p) => matchDomain(p.domain, customerDomain, c.ignoreMainDomain || false)
    );
    return customerProducts.some((p) => (p.askidaCihazSayisi || 0) > 0);
  });

  const totalSuspendedDevices = customersWithSuspended.reduce((sum, c) => {
    const customerDomain = c.domain || c.guncelMyPayterDomain;
    if (!customerDomain) return sum;
    const customerProducts = payterProducts.filter(
      (p) => matchDomain(p.domain, customerDomain, c.ignoreMainDomain || false)
    );
    return (
      sum +
      customerProducts.reduce((pSum, p) => pSum + (p.askidaCihazSayisi || 0), 0)
    );
  }, 0);

  // En yüksek subscription fee'ye sahip müşteriler
  const allRevenueCustomers = customersWithFee
    .sort((a, b) => (b.subscriptionFee || 0) - (a.subscriptionFee || 0));
  
  const topRevenueCustomers = allRevenueCustomers.slice(0, 6);

  const handleShowFullList = () => {
    const allItems = allRevenueCustomers.map((customer, index) => ({
      id: customer.id, // ✅ FIX: Add unique customer ID
      label: customer.cariAdi || 'İsimsiz Müşteri',
      value: `₺${(customer.subscriptionFee || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign size={14} className="text-green-600" />,
    }));
    
    setModalData({
      title: 'En Yüksek Gelirli Müşteriler - Tüm Liste',
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
            <Euro className="text-green-600" size={20} />
            Gelir Özeti
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2 text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                ₺{totalMonthlyRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-600 mt-1">Toplam Aylık Gelir</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{customersWithFee.length}</div>
              <div className="text-xs text-gray-600 mt-1">Ücretli Müşteri</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                ₺{avgFeePerCustomer.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-600 mt-1">Ort. Ücret/Müşteri</div>
            </div>
          </div>

          {/* Ücret Dağılımı - Card Bazlı */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Ücret Dağılımı</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <Badge variant="outline" className="bg-white">
                  {'< ₺1,000'}
                </Badge>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-700">{feeDistribution.low}</span>
                  <Badge variant="outline" className="min-w-[50px] justify-center">
                    {customersWithFee.length > 0
                      ? Math.round((feeDistribution.low / customersWithFee.length) * 100)
                      : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <Badge variant="outline" className="bg-white">
                  ₺1,000 - ₺5,000
                </Badge>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-700">{feeDistribution.medium}</span>
                  <Badge variant="outline" className="min-w-[50px] justify-center">
                    {customersWithFee.length > 0
                      ? Math.round((feeDistribution.medium / customersWithFee.length) * 100)
                      : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                <Badge variant="outline" className="bg-white">
                  {'≥ ₺5,000'}
                </Badge>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-purple-700">{feeDistribution.high}</span>
                  <Badge variant="outline" className="min-w-[50px] justify-center">
                    {customersWithFee.length > 0
                      ? Math.round((feeDistribution.high / customersWithFee.length) * 100)
                      : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Analizi */}
          {customersWithSuspended.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600" />
                Risk Analizi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-2xl font-bold text-amber-600">
                    {customersWithSuspended.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Askıdalı Müşteri</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{totalSuspendedDevices}</div>
                  <div className="text-xs text-gray-600 mt-1">Askıda Cihaz</div>
                </div>
              </div>
            </div>
          )}

          {/* En Yüksek Gelirli Müşteriler */}
          {topRevenueCustomers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  En Yüksek Gelirli 6 Müşteri
                </h4>
                {allRevenueCustomers.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowFullList}
                    className="h-8 gap-1"
                  >
                    <ExternalLink size={14} />
                    <span className="text-xs">Tümünü Göster ({allRevenueCustomers.length})</span>
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {topRevenueCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {customer.cariAdi || 'İsimsiz Müşteri'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <DollarSign size={14} className="text-green-600" />
                      <span className="font-bold text-green-700 whitespace-nowrap">
                        ₺{(customer.subscriptionFee || 0).toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yıllık Projeksiyon */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                <span className="text-sm font-semibold text-gray-700">Yıllık Projeksiyon</span>
              </div>
              <div className="text-xl font-bold text-green-700">
                ₺{(totalMonthlyRevenue * 12).toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                })}
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