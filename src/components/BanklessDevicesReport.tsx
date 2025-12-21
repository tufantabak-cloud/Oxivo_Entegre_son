import { useMemo } from 'react';
import { Customer, DeviceSubscription } from './CustomerModule';
import { PayterProduct } from './PayterProductTab';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { XCircle, AlertTriangle, Euro, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { matchDomain } from '../utils/domainMatching';

interface BanklessDevice {
  customer: Customer;
  device: DeviceSubscription;
  deviceDomain: string;
  monthlyFee: number;
  subscriptionType: 'monthly' | 'yearly';
}

interface BanklessDevicesReportProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

export function BanklessDevicesReport({ customers, payterProducts }: BanklessDevicesReportProps) {

  const banklessDevices = useMemo((): BanklessDevice[] => {
    const devices: BanklessDevice[] = [];

    // ✅ NULL SAFETY: customers boş olabilir
    (customers || []).forEach(customer => {
      // ✅ FIX 1: ServiceFee yoksa atla
      if (!customer.serviceFeeSettings) return;

      const serviceFee = customer.serviceFeeSettings;
      
      // ✅ FIX 2: ServiceFee aktif değilse atla
      if (!serviceFee.isActive) return;
      
      // ✅ FIX 3: Müşteri pasif/bloke ise atla
      if (customer.durum === 'Pasif' || customer.durum === 'Bloke') return;
      
      // Müşterinin Payter cihazlarını bul (Ana Domain görmezden gelme desteği ile)
      const customerDomain = customer.domain || customer.guncelMyPayterDomain;
      if (!customerDomain) return;
      
      // ✅ NULL SAFETY: payterProducts boş olabilir
      const matchedProducts = (payterProducts || []).filter(product => {
        if (!product.domain) return false;
        // ✅ FIX 4: Silinmiş cihazları filtrele
        if ('isDeleted' in product && (product as any).isDeleted) return false;
        return matchDomain(product.domain, customerDomain, customer.ignoreMainDomain || false, customer.domainHierarchy);
      });

      // ✅ NULL SAFETY: matchedProducts boş olabilir
      (matchedProducts || []).forEach(product => {
        // ✅ FIX: linkedBankPFIds kontrolü (Müşterinin banka ataması var mı?)
        // Eğer müşterinin herhangi bir bankaya ataması varsa, o müşterinin cihazları "bankasız" değildir
        const hasBankAssignment = customer.linkedBankPFIds && customer.linkedBankPFIds.length > 0;

        if (hasBankAssignment) return; // Müşterinin banka ataması varsa atla

        // ✅ ARRAY SAFETY: deviceSubscriptions kontrolü
        const deviceSubscriptions = Array.isArray(serviceFee.deviceSubscriptions)
          ? serviceFee.deviceSubscriptions
          : [];
        
        // Cihaz abonelik kaydını bul
        const subscription = deviceSubscriptions.find(d => d.deviceId === product.id);
        
        // ✅ FIX 5: Pasif abonelikleri atla
        if (subscription && !subscription.isActive) return;
        if (subscription && subscription.paymentStatus === 'cancelled') return;
        
        const deviceSub: DeviceSubscription = subscription || {
          deviceId: product.id,
          deviceSerialNumber: product.serialNumber || '',
          deviceName: product.name || '',
          monthlyFee: serviceFee.customFeePerDevice || serviceFee.standardFeePerDevice || 0,
          isActive: true,
          activationDate: new Date().toISOString().split('T')[0],
          paymentStatus: 'pending'
        };

        // ✅ Sadece AKTİF cihazları ekle
        devices.push({
          customer,
          device: deviceSub,
          deviceDomain: product.domain || '',
          monthlyFee: deviceSub.monthlyFee,
          subscriptionType: serviceFee.paymentType
        });
      });
    });

    return devices;
  }, [customers, payterProducts]);

  const totalRevenueLoss = useMemo(() => {
    return banklessDevices.reduce((sum, d) => sum + d.monthlyFee, 0);
  }, [banklessDevices]);

  const yearlyRevenueLoss = totalRevenueLoss * 12;

  if (banklessDevices.length === 0) {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 text-white rounded-full p-3">
              <XCircle size={24} />
            </div>
            <div>
              <p className="font-medium text-green-900">✅ Tüm cihazlar bankaya atanmış</p>
              <p className="text-sm text-green-700">Gelir kaybı bulunmuyor</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Uyarı Banner */}
      <Alert className="border-purple-300 bg-purple-50">
        <AlertTriangle className="text-purple-600" size={20} />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-purple-900">
              ⚠️ Banka tanımsız cihazlar tespit edildi
            </p>
            <p className="text-sm text-purple-700">
              Bu cihazlar için ödeme alınamadığından aidat bedelleri tablosuna yansıtılmamaktadır.
              Lütfen müşteri detay sayfasından bu cihazları bir bankaya atayın.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Gelir Kaybı Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-purple-300 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Banka Tanımsız Cihaz</p>
                <p className="text-3xl text-purple-900 mt-1">{banklessDevices.length}</p>
              </div>
              <XCircle className="text-purple-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Aylık Gelir Kaybı</p>
                <p className="text-3xl text-red-900 mt-1">{(totalRevenueLoss || 0).toFixed(2)} €</p>
              </div>
              <TrendingDown className="text-red-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Yıllık Gelir Kaybı</p>
                <p className="text-3xl text-orange-900 mt-1">{(yearlyRevenueLoss || 0).toFixed(2)} €</p>
              </div>
              <Euro className="text-orange-600" size={40} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-900 flex items-center gap-2">
            <XCircle size={20} />
            Banka Tanımsız Cihazlar - Gelir Kaybı Raporu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3">Müşteri</th>
                  <th className="text-left py-3 px-3">Domain</th>
                  <th className="text-left py-3 px-3">Seri No</th>
                  <th className="text-left py-3 px-3">Abonelik Tipi</th>
                  <th className="text-left py-3 px-3">Aylık Ücret</th>
                  <th className="text-left py-3 px-3">Yıllık Kayıp</th>
                  <th className="text-center py-3 px-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {banklessDevices.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-purple-50">
                    <td className="py-3 px-3">
                      <div>
                        <p className={item.customer.durum === 'Pasif' ? 'line-through text-gray-500' : ''}>
                          {item.customer.cariAdi}
                        </p>
                        <p className={`text-xs ${item.customer.durum === 'Pasif' ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                          {item.customer.cariHesapKodu}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-xs">{item.deviceDomain}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-xs">{item.device.deviceSerialNumber}</p>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline">
                        {item.subscriptionType === 'monthly' ? 'Aylık' : 'Yıllık'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-red-600">{(item.monthlyFee || 0).toFixed(2)} €</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-orange-600">{((item.monthlyFee || 0) * 12).toFixed(2)} €</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="destructive" className="text-xs">
                        <XCircle size={12} className="mr-1" />
                        Banka Tanımsız
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alt Bilgi */}
          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-700">
              <strong>💡 Çözüm:</strong> Bu cihazları müşteri detay sayfasından{' '}
              <strong>"Banka/PF Yönetimi"</strong> sekmesinde bir bankaya atayarak gelir kaybını önleyebilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}