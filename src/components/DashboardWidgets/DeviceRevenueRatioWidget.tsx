/**
 * Cihaz / Aidat Oranı Widget'ı
 * 
 * Toplam cihaz sayısının aidat bedellerine oranını gösterir:
 * - Toplam aktif cihaz sayısı
 * - Toplam aylık aidat (subscription fee)
 * - Cihaz başına düşen aidat bedeli
 * - En iyi ve en kötü oranlara sahip müşteriler
 * 
 * Created: 2025-01-12
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Calculator,
  TrendingUp,
  TrendingDown,
  Smartphone,
  DollarSign,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { PayterProduct } from '../PayterProductTab';
import { matchDomain } from '../../utils/domainMatching';
import { FullListModal } from './FullListModal';

interface DeviceRevenueRatioWidgetProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
  isPinned?: boolean;
  onTogglePin?: () => void;
}

interface CustomerRatio {
  customer: Customer;
  deviceCount: number;
  monthlyFee: number;
  revenuePerDevice: number;
}

export function DeviceRevenueRatioWidget({ 
  customers,
  payterProducts,
  isPinned = false,
  onTogglePin
}: DeviceRevenueRatioWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBestModal, setShowBestModal] = useState(false);
  const [showWorstModal, setShowWorstModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ 
    title: '', 
    items: [] 
  });

  // Aktif müşteriler
  const activeCustomers = customers.filter((c) => c.durum === 'Aktif');

  // Her müşteri için cihaz sayısı ve oran hesapla
  const customerRatios: CustomerRatio[] = activeCustomers
    .map((customer) => {
      // Aidat bedeli olan aktif cihazları al
      const allDevices = customer.serviceFeeSettings?.deviceSubscriptions || [];
      const activeDevices = allDevices.filter(d => d.isActive && d.monthlyFee > 0);
      
      // Toplam cihaz sayısı ve toplam euro aidat
      const deviceCount = activeDevices.length;
      const monthlyFee = activeDevices.reduce((sum, d) => sum + d.monthlyFee, 0);
      const revenuePerDevice = deviceCount > 0 ? monthlyFee / deviceCount : 0;

      return {
        customer,
        deviceCount,
        monthlyFee,
        revenuePerDevice,
      };
    })
    .filter((ratio) => ratio.deviceCount > 0 && ratio.monthlyFee > 0); // Sadece her ikisi de olan

  // Toplamlar
  const totalDevices = customerRatios.reduce((sum, r) => sum + r.deviceCount, 0);
  const totalMonthlyRevenue = customerRatios.reduce((sum, r) => sum + r.monthlyFee, 0);
  const avgRevenuePerDevice = totalDevices > 0 
    ? totalMonthlyRevenue / totalDevices 
    : 0;

  // En iyi oranlar (cihaz başına en yüksek gelir)
  const sortedByBest = [...customerRatios].sort(
    (a, b) => b.revenuePerDevice - a.revenuePerDevice
  );
  const topBestRatios = sortedByBest.slice(0, 6);

  // En kötü oranlar (cihaz başına en düşük gelir)
  const sortedByWorst = [...customerRatios].sort(
    (a, b) => a.revenuePerDevice - b.revenuePerDevice
  );
  const topWorstRatios = sortedByWorst.slice(0, 6);

  const handleShowBestList = () => {
    const allItems = sortedByBest.map((ratio) => ({
      label: ratio.customer.cariAdi || 'İsimsiz Müşteri',
      value: `€${ratio.revenuePerDevice.toLocaleString('tr-TR', { 
        minimumFractionDigits: 2 
      })} / cihaz`,
      badge: `${ratio.deviceCount} cihaz`,
      subtext: `Toplam: €${ratio.monthlyFee.toLocaleString('tr-TR')} / ay`,
      icon: <TrendingUp size={14} className="text-green-600" />,
    }));

    setModalData({
      title: 'En İyi Cihaz/Gelir Oranları',
      items: allItems,
    });
    setShowBestModal(true);
  };

  const handleShowWorstList = () => {
    const allItems = sortedByWorst.map((ratio) => ({
      label: ratio.customer.cariAdi || 'İsimsiz Müşteri',
      value: `€${ratio.revenuePerDevice.toLocaleString('tr-TR', { 
        minimumFractionDigits: 2 
      })} / cihaz`,
      badge: `${ratio.deviceCount} cihaz`,
      subtext: `Toplam: €${ratio.monthlyFee.toLocaleString('tr-TR')} / ay`,
      icon: <TrendingDown size={14} className="text-red-600" />,
    }));

    setModalData({
      title: 'En Düşük Cihaz/Gelir Oranları',
      items: allItems,
    });
    setShowWorstModal(true);
  };

  return (
    <>
      <Card className="relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">
            Cihaz / Aidat Bedeli Oranı
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              {/* Genel Özet */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-purple-900">Genel Oran</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-purple-700 mb-1">Toplam Cihaz</div>
                    <div className="flex items-baseline gap-1">
                      <Smartphone className="h-3 w-3 text-purple-600" />
                      <span className="text-xl text-purple-900">
                        {totalDevices.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-700 mb-1">Toplam Aidat (€)</div>
                    <div className="flex items-baseline gap-1">
                      <DollarSign className="h-3 w-3 text-purple-600" />
                      <span className="text-xl text-purple-900">
                        €{totalMonthlyRevenue.toLocaleString('tr-TR', { 
                          maximumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-700 mb-1">Cihaz Başı (€)</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl text-purple-900">
                        €{avgRevenuePerDevice.toLocaleString('tr-TR', { 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* En İyi Oranlar */}
              {topBestRatios.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <h4 className="text-xs text-gray-700">
                        En İyi Oranlar (Top 6)
                      </h4>
                    </div>
                    {sortedByBest.length > 6 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShowBestList}
                        className="h-7 text-xs"
                      >
                        <ExternalLink size={12} className="mr-1" />
                        Tümü ({sortedByBest.length})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {topBestRatios.map((ratio, index) => (
                      <div
                        key={ratio.customer.id}
                        className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">
                            #{index + 1}
                          </Badge>
                          <span className="text-xs truncate">
                            {ratio.customer.cariAdi || 'İsimsiz'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className="bg-green-600 text-white text-xs">
                            €{ratio.revenuePerDevice.toLocaleString('tr-TR', { 
                              maximumFractionDigits: 2 
                            })} / cihaz
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {ratio.deviceCount} cihaz
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* En Düşük Oranlar */}
              {topWorstRatios.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <h4 className="text-xs text-gray-700">
                        Dikkat Gereken Oranlar (Bottom 6)
                      </h4>
                    </div>
                    {sortedByWorst.length > 6 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShowWorstList}
                        className="h-7 text-xs"
                      >
                        <ExternalLink size={12} className="mr-1" />
                        Tümü ({sortedByWorst.length})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {topWorstRatios.map((ratio, index) => (
                      <div
                        key={ratio.customer.id}
                        className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">
                            #{index + 1}
                          </Badge>
                          <span className="text-xs truncate">
                            {ratio.customer.cariAdi || 'İsimsiz'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className="bg-orange-600 text-white text-xs">
                            €{ratio.revenuePerDevice.toLocaleString('tr-TR', { 
                              maximumFractionDigits: 2 
                            })} / cihaz
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {ratio.deviceCount} cihaz
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Veri yoksa */}
              {customerRatios.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-xs">
                  Cihaz ve aidat bedeli bilgisi bulunan müşteri yok
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Full List Modals */}
      <FullListModal
        isOpen={showBestModal}
        onClose={() => setShowBestModal(false)}
        title={modalData.title}
        items={modalData.items}
      />
      <FullListModal
        isOpen={showWorstModal}
        onClose={() => setShowWorstModal(false)}
        title={modalData.title}
        items={modalData.items}
      />
    </>
  );
}
