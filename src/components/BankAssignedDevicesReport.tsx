import { useMemo, useState } from 'react';
import { Customer, DeviceSubscription } from './CustomerModule';
import { PayterProduct } from './PayterProductTab';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Building2, Euro, TrendingUp, Search } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { matchDomain } from '../utils/domainMatching';

interface BankAssignedDevice {
  customer: Customer;
  device: DeviceSubscription;
  deviceDomain: string;
  monthlyFee: number;
  subscriptionType: 'monthly' | 'yearly';
  bankName: string;
  bankCode: string;
}

interface BankAssignedDevicesReportProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

export function BankAssignedDevicesReport({ customers, payterProducts }: BankAssignedDevicesReportProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const bankAssignedDevices = useMemo((): BankAssignedDevice[] => {
    const devices: BankAssignedDevice[] = [];

    // ✅ NULL SAFETY: customers boş olabilir
    (customers || []).forEach(customer => {
      if (!customer.serviceFeeSettings) return;

      const serviceFee = customer.serviceFeeSettings;
      
      // Müşterinin Payter cihazlarını bul (Ana Domain görmezden gelme desteği ile)
      const customerDomain = customer.domain || customer.guncelMyPayterDomain;
      if (!customerDomain) return;
      
      const matchedProducts = payterProducts.filter(product => {
        if (!product.domain) return false;
        return matchDomain(product.domain, customerDomain, customer.ignoreMainDomain || false, customer.domainHierarchy);
      });

      matchedProducts.forEach(product => {
        // Banka ataması kontrolü
        const bankAssignment = customer.bankDeviceAssignments?.find(
          ba => ba.deviceIds.includes(product.id)
        );

        if (!bankAssignment) return; // Gerçek banka ataması yoksa atla

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

        // Tüm cihazları ekle (aktif + pasif)
        devices.push({
          customer,
          device: deviceSub,
          deviceDomain: product.domain || '',
          monthlyFee: deviceSub.monthlyFee,
          subscriptionType: serviceFee.paymentType,
          bankName: bankAssignment.bankName,
          bankCode: bankAssignment.bankCode
        });
      });
    });

    return devices;
  }, [customers, payterProducts]);

  // Filtreleme
  const filteredDevices = useMemo(() => {
    if (!searchTerm.trim()) return bankAssignedDevices;

    const term = searchTerm.toLowerCase();
    return bankAssignedDevices.filter(item =>
      item.customer.cariAdi?.toLowerCase().includes(term) ||
      item.customer.cariHesapKodu?.toLowerCase().includes(term) ||
      item.deviceDomain?.toLowerCase().includes(term) ||
      item.device.deviceSerialNumber?.toLowerCase().includes(term) ||
      item.bankName?.toLowerCase().includes(term) ||
      item.bankCode?.toLowerCase().includes(term)
    );
  }, [bankAssignedDevices, searchTerm]);

  const totalMonthlyRevenue = useMemo(() => {
    return filteredDevices.reduce((sum, d) => sum + d.monthlyFee, 0);
  }, [filteredDevices]);

  const yearlyRevenue = totalMonthlyRevenue * 12;

  // Banka bazlı gruplandırma
  const devicesByBank = useMemo(() => {
    const grouped = new Map<string, BankAssignedDevice[]>();
    filteredDevices.forEach(device => {
      const bankKey = `${device.bankCode} - ${device.bankName}`;
      if (!grouped.has(bankKey)) {
        grouped.set(bankKey, []);
      }
      grouped.get(bankKey)!.push(device);
    });
    return grouped;
  }, [filteredDevices]);

  if (bankAssignedDevices.length === 0) {
    return (
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-600 text-white rounded-full p-3">
              <Building2 size={24} />
            </div>
            <div>
              <p className="font-medium text-yellow-900">⚠️ Banka atanmış cihaz bulunamadı</p>
              <p className="text-sm text-yellow-700">Henüz hiçbir cihaza banka ataması yapılmamış</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bilgi Banner */}
      <Alert className="border-green-300 bg-green-50">
        <CheckCircle className="text-green-600" size={20} />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-green-900">
              ✅ Banka tanımlı cihazlar listesi
            </p>
            <p className="text-sm text-green-700">
              Bu cihazlar için ödeme alınabilmekte ve aidat bedelleri tablosuna yansıtılmaktadır.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Gelir Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Banka Tanımlı Cihaz</p>
                <p className="text-3xl text-green-900 mt-1">{filteredDevices.length}</p>
              </div>
              <CheckCircle className="text-green-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Banka Sayısı</p>
                <p className="text-3xl text-blue-900 mt-1">{devicesByBank.size}</p>
              </div>
              <Building2 className="text-blue-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Aylık Gelir</p>
                <p className="text-3xl text-emerald-900 mt-1">{totalMonthlyRevenue.toFixed(2)} €</p>
              </div>
              <Euro className="text-emerald-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-300 bg-teal-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-700">Yıllık Gelir</p>
                <p className="text-3xl text-teal-900 mt-1">{yearlyRevenue.toFixed(2)} €</p>
              </div>
              <TrendingUp className="text-teal-600" size={40} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arama */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <Input
              placeholder="Müşteri, domain, seri no veya banka ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detaylı Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <CheckCircle size={20} />
            Banka Tanımlı Cihazlar - Gelir Raporu
            <Badge variant="secondary" className="ml-2">
              {filteredDevices.length} Cihaz
            </Badge>
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
                  <th className="text-left py-3 px-3">Banka</th>
                  <th className="text-left py-3 px-3">Abonelik Tipi</th>
                  <th className="text-left py-3 px-3">Aylık Ücret</th>
                  <th className="text-left py-3 px-3">Yıllık Gelir</th>
                  <th className="text-center py-3 px-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-green-50">
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
                      <div>
                        <p className="text-xs text-blue-600">{item.bankCode}</p>
                        <p className="text-xs text-gray-500">{item.bankName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline">
                        {item.subscriptionType === 'monthly' ? 'Aylık' : 'Yıllık'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-green-600">{item.monthlyFee.toFixed(2)} €</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-teal-600">{(item.monthlyFee * 12).toFixed(2)} €</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="default" className="text-xs bg-green-600">
                        <CheckCircle size={12} className="mr-1" />
                        Atanmış
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Banka Bazlı Özet */}
          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
            <p className="font-medium text-blue-900 mb-3">📊 Banka Bazlı Dağılım:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(devicesByBank.entries()).map(([bankKey, devices]) => {
                const bankRevenue = devices.reduce((sum, d) => sum + d.monthlyFee, 0);
                return (
                  <div key={bankKey} className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm text-gray-900">{bankKey}</p>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="secondary">{devices.length} cihaz</Badge>
                      <p className="text-sm text-green-600">{bankRevenue.toFixed(2)} €/ay</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alt Bilgi */}
          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-700">
              <strong>💡 Not:</strong> Bu liste sadece gerçek banka ataması yapılmış cihazları gösterir.{' '}
              <strong>PAYTER DEMO BANK</strong> atamalı cihazlar "Banka Tanımsız Cihazlar" sekmesinde görüntülenir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}