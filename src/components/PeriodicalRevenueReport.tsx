import { useMemo } from 'react';
import { Customer, DomainNode, DeviceSubscription } from './CustomerModule';
import { PayterProduct } from './PayterProductTab';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

interface PeriodData {
  period: string;
  totalRevenue: number;
  activeDevices: number;
  activeCustomers: number;
  confirmedPayments: number;
  overduePayments: number;
}

interface PeriodicalRevenueReportProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
  currentPeriod: string;
}

export function PeriodicalRevenueReport({ 
  customers, 
  payterProducts, 
  currentPeriod 
}: PeriodicalRevenueReportProps) {
  
  // Son 6 ay için dönem listesi oluştur
  const periods = useMemo(() => {
    const periodList: string[] = [];
    const currentDate = new Date(currentPeriod + '-01');
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      periodList.push(date.toISOString().substring(0, 7));
    }
    
    return periodList;
  }, [currentPeriod]);

  // Domain normalizasyon fonksiyonu
  const normalizeDomain = (domain: string | undefined): string => {
    if (!domain) return '';
    return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  // Domain eşleştirme fonksiyonu (Ana Domain görmezden gelme desteği ile)
  const matchDomainFn = (
    productDomain: string | undefined,
    customerDomain: string | undefined,
    ignoreMainDomain: boolean = false
  ): boolean => {
    const normalizedProduct = normalizeDomain(productDomain);
    const normalizedCustomer = normalizeDomain(customerDomain);
    
    if (!normalizedProduct || !normalizedCustomer) return false;
    
    if (ignoreMainDomain) {
      // Ana domain'i görmezden gel, SADECE alt domainleri kabul et
      // Ana domain eşleşmesini engelle
      if (normalizedProduct === normalizedCustomer) return false;
      
      // Alt domain kontrolü: product domain customer domain ile bitmeli ve önünde subdomain olmalı
      return normalizedProduct.endsWith('.' + normalizedCustomer);
    } else {
      // Tam eşleşme (Ana domain eşleştirmesi)
      return normalizedProduct === normalizedCustomer;
    }
  };

  // Her dönem için verileri hesapla
  const periodData = useMemo((): PeriodData[] => {
    return periods.map(period => {
      let totalRevenue = 0;
      let activeDevices = 0;
      let activeCustomers = 0;
      let confirmedPayments = 0;
      let overduePayments = 0;

      customers.forEach(customer => {
        if (!customer.serviceFeeSettings) return;

        const serviceFee = customer.serviceFeeSettings;
        
        // Müşterinin Payter cihazlarını bul (Ana Domain görmezden gelme desteği ile)
        const customerDomain = customer.domain || customer.guncelMyPayterDomain;
        if (!customerDomain) return;
        
        const matchedProducts = payterProducts.filter(product => {
          if (!product.domain) return false;
          return matchDomainFn(product.domain, customerDomain, customer.ignoreMainDomain || false);
        });

        let customerActiveDevicesCount = 0;

        matchedProducts.forEach(product => {
          // Banka ataması kontrolü
          const hasBankAssignment = customer.bankDeviceAssignments?.some(
            ba => ba.deviceIds.includes(product.id)
          );

          // Banka ataması olmayan cihazlar gelir hesabına dahil olmaz
          if (!hasBankAssignment) return;

          // Cihaz abonelik kaydını bul
          const subscription = serviceFee.deviceSubscriptions.find(d => d.deviceId === product.id);
          const deviceSub: DeviceSubscription = subscription || {
            deviceId: product.id,
            deviceSerialNumber: product.serialNumber || '',
            deviceName: product.name || '',
            monthlyFee: serviceFee.customFeePerDevice || serviceFee.standardFeePerDevice,
            isActive: true,
            activationDate: new Date().toISOString().split('T')[0],
            paymentStatus: 'pending'
          };

          // Aktif olmayan cihazları atla
          if (!deviceSub.isActive) return;

          // O dönem faturasını bul
          const invoice = serviceFee.invoices.find(inv => inv.period === period);
          
          // Fatura varsa ve dondurulmamışsa
          if (!invoice || !invoice.isSuspended) {
            totalRevenue += deviceSub.monthlyFee;
            activeDevices++;
            customerActiveDevicesCount++;

            // Ödeme durumu kontrolü
            if (invoice) {
              if (invoice.paymentConfirmed) {
                confirmedPayments++;
              } else {
                const dueDate = new Date(invoice.dueDate);
                const today = new Date();
                const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysUntilDue < 0) {
                  overduePayments++;
                }
              }
            }
            // Not: Fatura yoksa ödeme durumu hesaplamaz (bekleyen sayısı ana dashboard'da gösteriliyor)
          }
        });

        if (customerActiveDevicesCount > 0) {
          activeCustomers++;
        }
      });

      return {
        period,
        totalRevenue,
        activeDevices,
        activeCustomers,
        confirmedPayments,
        overduePayments
      };
    });
  }, [periods, customers, payterProducts]);

  // Trend hesaplama (son ay vs bir önceki ay)
  const trend = useMemo(() => {
    if (periodData.length < 2) return { revenue: 0, devices: 0 };
    
    const latest = periodData[periodData.length - 1];
    const previous = periodData[periodData.length - 2];
    
    const revenueDiff = latest.totalRevenue - previous.totalRevenue;
    const devicesDiff = latest.activeDevices - previous.activeDevices;
    
    return {
      revenue: revenueDiff,
      revenuePercent: previous.totalRevenue > 0 
        ? ((revenueDiff / previous.totalRevenue) * 100)
        : 0,
      devices: devicesDiff,
      devicesPercent: previous.activeDevices > 0
        ? ((devicesDiff / previous.activeDevices) * 100)
        : 0
    };
  }, [periodData]);

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="text-green-600" size={16} />;
    if (value < 0) return <TrendingDown className="text-red-600" size={16} />;
    return <Minus className="text-gray-600" size={16} />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Trend Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Gelir Trendi (Aylık)</p>
                <div className="flex items-center gap-2 mt-1">
                  {getTrendIcon(trend.revenue)}
                  <p className={`text-2xl ${getTrendColor(trend.revenue)}`}>
                    {Math.abs(trend.revenue).toFixed(2)} €
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {trend.revenuePercent >= 0 ? '+' : ''}{trend.revenuePercent.toFixed(1)}% değişim
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-300 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Cihaz Trendi</p>
                <div className="flex items-center gap-2 mt-1">
                  {getTrendIcon(trend.devices)}
                  <p className={`text-2xl ${getTrendColor(trend.devices)}`}>
                    {Math.abs(trend.devices)}
                  </p>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  {trend.devicesPercent >= 0 ? '+' : ''}{trend.devicesPercent.toFixed(1)}% değişim
                </p>
              </div>
              <Calendar className="text-purple-600" size={40} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dönemsel Tablo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Dönemsel Gelişim Raporu (Son 6 Ay)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3">Dönem</th>
                  <th className="text-right py-3 px-3">Gelir (€)</th>
                  <th className="text-center py-3 px-3">Cihaz</th>
                  <th className="text-center py-3 px-3">Müşteri</th>
                  <th className="text-center py-3 px-3">Ödeme Onayı</th>
                  <th className="text-center py-3 px-3">Gecikmiş</th>
                  <th className="text-right py-3 px-3">Değişim</th>
                </tr>
              </thead>
              <tbody>
                {periodData.map((data, index) => {
                  const isCurrentPeriod = data.period === currentPeriod;
                  const prevRevenue = index > 0 ? periodData[index - 1].totalRevenue : 0;
                  const revenueDiff = prevRevenue > 0 ? data.totalRevenue - prevRevenue : 0;
                  const revenueChangePercent = prevRevenue > 0 
                    ? ((revenueDiff / prevRevenue) * 100)
                    : 0;

                  return (
                    <tr 
                      key={data.period} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        isCurrentPeriod ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <p>{formatPeriod(data.period)}</p>
                          {isCurrentPeriod && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              Güncel
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <p className="text-green-600">{data.totalRevenue.toFixed(2)} €</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="outline">{data.activeDevices}</Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="outline">{data.activeCustomers}</Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge className="bg-green-100 text-green-700">
                          {data.confirmedPayments}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {data.overduePayments > 0 ? (
                          <Badge variant="destructive">
                            {data.overduePayments}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {index > 0 ? (
                          <div className="flex items-center justify-end gap-1">
                            {getTrendIcon(revenueDiff)}
                            <span className={getTrendColor(revenueDiff)}>
                              {revenueChangePercent >= 0 ? '+' : ''}{revenueChangePercent.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Özet Bilgi */}
          <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600">Ortalama Aylık Gelir</p>
                <p className="text-green-600 mt-1">
                  {(periodData.reduce((sum, d) => sum + d.totalRevenue, 0) / periodData.length).toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">En Yüksek Gelir</p>
                <p className="text-blue-600 mt-1">
                  {Math.max(...periodData.map(d => d.totalRevenue)).toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">En Düşük Gelir</p>
                <p className="text-orange-600 mt-1">
                  {Math.min(...periodData.map(d => d.totalRevenue)).toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Toplam (6 Ay)</p>
                <p className="text-purple-600 mt-1">
                  {periodData.reduce((sum, d) => sum + d.totalRevenue, 0).toFixed(2)} €
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
