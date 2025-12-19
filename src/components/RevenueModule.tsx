import React, { useState, useMemo } from 'react';
import { Customer, DeviceSubscription, DomainNode } from './CustomerModule';
import { PayterProduct } from './PayterProductTab';
import { SuspensionReason } from './DefinitionsModule';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { SubscriptionFeesDashboard } from './SubscriptionFeesDashboard';
import { SubscriptionFeesTable } from './SubscriptionFeesTable';
import { BanklessDevicesReport } from './BanklessDevicesReport';
import { BankAssignedDevicesReport } from './BankAssignedDevicesReport';
import { SuspendedDevicesReport } from './SuspendedDevicesReport';
import { PeriodicalRevenueReport } from './PeriodicalRevenueReport';
import { PriceListTab } from './PriceListTab';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, TrendingUp, DollarSign, CheckCircle, XCircle, Pause } from 'lucide-react';

interface RevenueModuleProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
  onUpdateCustomer: (customer: Customer) => void;
  suspensionReasons: SuspensionReason[];
}

// PERFORMANCE: React.memo prevents unnecessary re-renders
export const RevenueModule = React.memo(function RevenueModule({ customers, payterProducts, onUpdateCustomer, suspensionReasons }: RevenueModuleProps) {
  // Dönem seçimi - varsayılan olarak mevcut ay
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    new Date().toISOString().substring(0, 7)
  ); // Format: "YYYY-MM"

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

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    let totalMonthlyRevenue = 0;
    let totalYearlyRevenue = 0;
    let totalActiveDevices = 0;
    let totalSuspendedDevices = 0;
    let confirmedPayments = 0;
    let pendingPayments = 0;
    let overduePayments = 0;
    let banklessDevices = 0;
    let banklessRevenueLoss = 0;
    let customersWithActiveSubscriptions = 0;
    let suspendedCustomers = 0;
    
    // Yeni istatistikler
    let totalDevices = 0;
    let devicesWithBank = 0;
    let devicesWithoutBank = 0;
    let monthlySubscriptionRevenue = 0;
    let monthlySubscriptionLoss = 0;
    let yearlySubscriptionRevenue = 0;
    let yearlySubscriptionLoss = 0;
    let totalExpectedPayment = 0;
    let overduePaymentAmount = 0; // 9. güne kadar gecikmiş ödemeler
    let suspendedDeviceRevenue = 0;

    customers.forEach(customer => {
      if (!customer.serviceFeeSettings) return;

      const serviceFee = customer.serviceFeeSettings;
      
      // Payter cihazlarını eşleştir (Ana Domain görmezden gelme desteği ile)
      const customerDomain = customer.domain || customer.guncelMyPayterDomain;
      if (!customerDomain) return;
      
      const matchedProducts = payterProducts.filter(product => {
        if (!product.domain) return false;
        return matchDomainFn(product.domain, customerDomain, customer.ignoreMainDomain || false);
      });

      let customerActiveDevices = 0;
      let customerSuspendedDevices = 0;
      let customerBanklessDevices = 0;
      let customerBanklessLoss = 0;

      matchedProducts.forEach(product => {
        // Cihaz abonelik kaydını bul
        const subscription = serviceFee.deviceSubscriptions && Array.isArray(serviceFee.deviceSubscriptions)
          ? serviceFee.deviceSubscriptions.find(d => d.deviceId === product.id)
          : undefined;
        const deviceSub: DeviceSubscription = subscription || {
          deviceId: product.id,
          deviceSerialNumber: product.serialNumber || '',
          deviceName: product.name || '',
          monthlyFee: serviceFee.customFeePerDevice || serviceFee.standardFeePerDevice,
          isActive: true,
          activationDate: new Date().toISOString().split('T')[0],
          paymentStatus: 'pending'
        };

        // Toplam cihaz sayısı
        totalDevices++;

        // Banka ataması kontrolü
        const hasBankAssignment = customer.bankDeviceAssignments && Array.isArray(customer.bankDeviceAssignments)
          ? customer.bankDeviceAssignments.some(
              ba => ba.deviceIds && Array.isArray(ba.deviceIds) && ba.deviceIds.includes(product.id)
            )
          : false;

        // Toplam banka durumu istatistikleri (aktif + pasif tüm cihazlar)
        if (hasBankAssignment) {
          devicesWithBank++;
        } else {
          devicesWithoutBank++;
        }

        // Mevcut dönem faturasını bul
        const currentInvoice = serviceFee.invoices && Array.isArray(serviceFee.invoices)
          ? serviceFee.invoices.find(inv => inv.period === selectedPeriod)
          : undefined;

        // Cihazın askıya alınma durumu
        const isSuspended = currentInvoice?.isSuspended || false;
        const isActive = deviceSub.isActive && !isSuspended;

        // Ödeme türü kontrolü (aylık/yıllık)
        const isYearlySubscription = deviceSub.subscriptionType === 'yearly';

        // Cihaz durumuna göre sayımları yap
        if (isActive) {
          customerActiveDevices++;
          totalActiveDevices++;
          
          if (hasBankAssignment) {
            // Banka ataması olan aktif cihazlar gelir hesabına dahil
            totalMonthlyRevenue += deviceSub.monthlyFee;
            
            // Gelir tipi dağılımı
            if (isYearlySubscription) {
              yearlySubscriptionRevenue += (deviceSub.monthlyFee * 12);
            } else {
              monthlySubscriptionRevenue += deviceSub.monthlyFee;
            }
            
            totalExpectedPayment += deviceSub.monthlyFee;
            
            // Ödeme durumu kontrolü - sadece banka atamalı aktif cihazlar için
            if (currentInvoice) {
              if (currentInvoice.paymentConfirmed) {
                confirmedPayments++;
              } else {
                // Fatura var ama ödeme alınmamış
                const dueDate = new Date(currentInvoice.dueDate);
                const today = new Date();
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysOverdue > 0 && daysOverdue <= 9) {
                  overduePaymentAmount += deviceSub.monthlyFee;
                }
                
                if (daysOverdue > 0) {
                  overduePayments++;
                } else {
                  pendingPayments++;
                }
              }
            } else {
              // Fatura yoksa otomatik olarak bekleyen ödeme sayısına ekle
              pendingPayments++;
            }
          } else {
            // Banka ataması olmayan aktif cihazlar
            customerBanklessDevices++;
            customerBanklessLoss += deviceSub.monthlyFee;
            
            // Gelir kaybı dağılımı
            if (isYearlySubscription) {
              yearlySubscriptionLoss += (deviceSub.monthlyFee * 12);
            } else {
              monthlySubscriptionLoss += deviceSub.monthlyFee;
            }
          }
        } else {
          // Dondurulmuş cihazlar
          customerSuspendedDevices++;
          totalSuspendedDevices++;
          suspendedDeviceRevenue += deviceSub.monthlyFee;
        }
      });

      // Müşteri bazlı toplamlar
      banklessDevices += customerBanklessDevices;
      banklessRevenueLoss += customerBanklessLoss;

      if (customerActiveDevices > 0) customersWithActiveSubscriptions++;
      if (customerSuspendedDevices > 0) suspendedCustomers++;
    });

    // Yıllık gelir projeksiyonu
    totalYearlyRevenue = totalMonthlyRevenue * 12;

    // Genel aktif müşteri sayısı (durum bazlı)
    const activeCustomers = customers.filter(c => c.durum === 'Aktif').length;

    return {
      totalMonthlyRevenue,
      totalYearlyRevenue,
      totalActiveDevices,
      totalSuspendedDevices,
      confirmedPayments,
      pendingPayments,
      overduePayments,
      banklessDevices,
      banklessRevenueLoss,
      activeCustomers, // Genel aktif müşteri sayısı (durum === 'Aktif')
      customersWithActiveSubscriptions, // Aidat bedeli aktif müşteri sayısı
      suspendedCustomers,
      // Yeni istatistikler
      totalDevices,
      devicesWithBank,
      devicesWithoutBank,
      monthlySubscriptionRevenue,
      monthlySubscriptionLoss,
      yearlySubscriptionRevenue,
      yearlySubscriptionLoss,
      totalExpectedPayment,
      overduePaymentAmount,
      suspendedDeviceRevenue
    };
  }, [customers, payterProducts, selectedPeriod]);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl text-gray-900">💰 Gelir Yönetimi</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Müşteri aidat bedelleri, ödeme takibi ve gelir raporları
          </p>
        </div>
        
        {/* Dönem Seçici */}
        <div className="flex items-center gap-3">
          <Label className="flex items-center gap-2 text-xs sm:text-sm">
            <Calendar size={16} />
            Dönem:
          </Label>
          <Input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-40"
          />
        </div>
      </div>



      {/* Sekmeler */}
      <Tabs defaultValue="subscription-fees" className="w-full">
        <TabsList>
          <TabsTrigger value="subscription-fees">
            Aidat Bedelleri
            {stats.totalActiveDevices > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.totalActiveDevices}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="price-list">
            <DollarSign size={16} className="mr-2" />
            Fiyat Listesi
          </TabsTrigger>
          <TabsTrigger value="periodical-report">
            <TrendingUp size={16} className="mr-2" />
            Dönemsel Gelişim
          </TabsTrigger>
          <TabsTrigger value="bank-assigned-report">
            <CheckCircle size={16} className="mr-2" />
            Banka Tanımlı Cihazlar
            {stats.devicesWithBank > 0 && (
              <Badge variant="default" className="ml-2 bg-green-600">
                {stats.devicesWithBank}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bankless-report">
            <XCircle size={16} className="mr-2" />
            Banka Tanımsız Cihazlar
            {stats.devicesWithoutBank > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.devicesWithoutBank}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suspended-report">
            <Pause size={16} className="mr-2" />
            Pasif Cihazlar
            {stats.totalSuspendedDevices > 0 && (
              <Badge variant="secondary" className="ml-2 bg-orange-500 text-white">
                {stats.totalSuspendedDevices}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Aidat Bedelleri Sekmesi */}
        <TabsContent value="subscription-fees" className="space-y-6 mt-6">
          {/* Dashboard */}
          <SubscriptionFeesDashboard stats={stats} />

          {/* Dönemsel Gelişim Grafiği - Basit Özet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Son 6 Ay Aidat Gelişimi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                📊 Detaylı dönemsel analiz için "Dönemsel Gelişim" sekmesine bakın
              </p>
            </CardContent>
          </Card>

          {/* Detaylı Tablo */}
          <SubscriptionFeesTable
            customers={customers}
            payterProducts={payterProducts}
            onUpdateCustomer={onUpdateCustomer}
            selectedPeriod={selectedPeriod}
            suspensionReasons={suspensionReasons}
          />
        </TabsContent>

        {/* Fiyat Listesi Sekmesi */}
        <TabsContent value="price-list" className="space-y-6 mt-6">
          <PriceListTab
            customers={customers}
            onUpdateCustomer={onUpdateCustomer}
          />
        </TabsContent>

        {/* Dönemsel Gelişim Sekmesi */}
        <TabsContent value="periodical-report" className="space-y-6 mt-6">
          <PeriodicalRevenueReport
            customers={customers}
            payterProducts={payterProducts}
            currentPeriod={selectedPeriod}
          />
        </TabsContent>

        {/* Banka Tanımlı Cihazlar Sekmesi */}
        <TabsContent value="bank-assigned-report" className="space-y-6 mt-6">
          <BankAssignedDevicesReport
            customers={customers}
            payterProducts={payterProducts}
          />
        </TabsContent>

        {/* Banka Tanımsız Cihazlar Sekmesi */}
        <TabsContent value="bankless-report" className="space-y-6 mt-6">
          <BanklessDevicesReport
            customers={customers}
            payterProducts={payterProducts}
          />
        </TabsContent>

        {/* Pasif Cihazlar Sekmesi */}
        <TabsContent value="suspended-report" className="space-y-6 mt-6">
          <SuspendedDevicesReport
            customers={customers}
            payterProducts={payterProducts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});