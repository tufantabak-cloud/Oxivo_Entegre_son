/**
 * Abone Hizmet Bedeli Özet Widget'ı
 * 
 * Aylık ve yıllık abone hizmet bedeli toplamlarını gösterir:
 * - Aylık abone sayısı ve toplam tutar
 * - Yıllık abone sayısı ve toplam tutar
 * - Ortalama abonelik bedeli
 * - En yüksek abonelik bedeline sahip müşteriler (Top 6)
 * 
 * Created: 2025-01-12
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  CalendarDays, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  Maximize2,
  Minimize2,
  ExternalLink
} from 'lucide-react';
import type { Customer } from '../CustomerModule';
import { FullListModal } from './FullListModal';

interface SubscriptionRevenueSummaryWidgetProps {
  customers: Customer[];
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export function SubscriptionRevenueSummaryWidget({ 
  customers,
  isPinned = false,
  onTogglePin
}: SubscriptionRevenueSummaryWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ 
    title: '', 
    items: [] 
  });

  // Aktif müşteriler
  const activeCustomers = customers.filter((c) => c.durum === 'Aktif');

  // Subscription fee olan müşteriler
  const customersWithFee = activeCustomers.filter(
    (c) => c.subscriptionFee && c.subscriptionFee > 0
  );

  // 🔍 DEBUG: Veri kontrolü
  console.log('📊 Abonelik Geliri Widget Debug:', {
    totalCustomers: customers.length,
    activeCustomers: activeCustomers.length,
    customersWithFee: customersWithFee.length,
    sampleFees: customersWithFee.slice(0, 3).map(c => ({
      name: c.cariAdi,
      fee: c.subscriptionFee
    }))
  });

  // Aylık toplam (subscription fee aylık olarak kabul ediliyor)
  const monthlySubscribers = customersWithFee.length;
  const monthlyTotalRevenue = customersWithFee.reduce(
    (sum, c) => sum + (c.subscriptionFee || 0),
    0
  );

  // Yıllık toplam (aylık x 12)
  const yearlySubscribers = monthlySubscribers;
  const yearlyTotalRevenue = monthlyTotalRevenue * 12;

  // Ortalama aylık bedel
  const avgMonthlyFee = monthlySubscribers > 0 
    ? monthlyTotalRevenue / monthlySubscribers 
    : 0;

  // En yüksek subscription fee'ye sahip müşteriler
  const allRevenueCustomers = customersWithFee
    .sort((a, b) => (b.subscriptionFee || 0) - (a.subscriptionFee || 0));
  
  const topRevenueCustomers = allRevenueCustomers.slice(0, 6);

  const handleShowFullList = () => {
    const allItems = allRevenueCustomers.map((customer) => ({
      label: customer.cariAdi || 'İsimsiz Müşteri',
      value: `₺${(customer.subscriptionFee || 0).toLocaleString('tr-TR', { 
        minimumFractionDigits: 2 
      })} / ay`,
      badge: `Yıllık: ₺${((customer.subscriptionFee || 0) * 12).toLocaleString('tr-TR', { 
        minimumFractionDigits: 2 
      })}`,
      icon: <DollarSign size={14} className="text-green-600" />,
    }));

    setModalData({
      title: 'Tüm Abone Müşteriler',
      items: allItems,
    });
    setShowFullListModal(true);
  };

  return (
    <>
      <Card className="relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">
            Abone Hizmet Bedeli Özeti
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
            {/* Aylık Özet */}
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-900">Aylık Toplam</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-blue-700 mb-1">Abone Sayısı</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-blue-900">
                        {monthlySubscribers}
                      </span>
                      <span className="text-xs text-blue-600">müşteri</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-700 mb-1">Toplam Tutar</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-blue-900">
                        ₺{monthlyTotalRevenue.toLocaleString('tr-TR', { 
                          maximumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Ort: ₺{avgMonthlyFee.toLocaleString('tr-TR', { 
                        maximumFractionDigits: 0 
                      })} / müşteri
                    </div>
                  </div>
                </div>
              </div>

              {/* Yıllık Özet */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-900">Yıllık Projeksiyon</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-green-700 mb-1">Abone Sayısı</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-green-900">
                        {yearlySubscribers}
                      </span>
                      <span className="text-xs text-green-600">müşteri</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-green-700 mb-1">Toplam Tutar</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-green-900">
                        ₺{yearlyTotalRevenue.toLocaleString('tr-TR', { 
                          maximumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Ort: ₺{(avgMonthlyFee * 12).toLocaleString('tr-TR', { 
                        maximumFractionDigits: 0 
                      })} / müşteri
                    </div>
                  </div>
                </div>
              </div>

              {/* En Yüksek Abonelikler */}
              {topRevenueCustomers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                      <h4 className="text-xs text-gray-700">
                        En Yüksek Abonelikler (Top 6)
                      </h4>
                    </div>
                    {allRevenueCustomers.length > 6 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShowFullList}
                        className="h-7 text-xs"
                      >
                        <ExternalLink size={12} className="mr-1" />
                        Tümü ({allRevenueCustomers.length})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {topRevenueCustomers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">
                            #{index + 1}
                          </Badge>
                          <span className="text-xs truncate">
                            {customer.cariAdi || 'İsimsiz'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                            ₺{(customer.subscriptionFee || 0).toLocaleString('tr-TR', { 
                              maximumFractionDigits: 0 
                            })} / ay
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Yıllık: ₺{((customer.subscriptionFee || 0) * 12).toLocaleString('tr-TR', { 
                              maximumFractionDigits: 0 
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Özet Bilgi */}
              {customersWithFee.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-xs">
                  Henüz abone hizmet bedeli tanımlı müşteri bulunmuyor
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Full List Modal */}
      <FullListModal
        isOpen={showFullListModal}
        onClose={() => setShowFullListModal(false)}
        title={modalData.title}
        items={modalData.items}
      />
    </>
  );
}
