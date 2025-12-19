import { useMemo, useState } from 'react';
import { Customer, DeviceSubscription } from './CustomerModule';
import { PayterProduct } from './PayterProductTab';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Pause, AlertCircle, Euro, TrendingDown, Search, ChevronDown, ChevronRight, UserX, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { matchDomain } from '../utils/domainMatching';

interface SuspendedDevice {
  customer: Customer;
  device: DeviceSubscription;
  deviceDomain: string;
  monthlyFee: number;
  subscriptionType: 'monthly' | 'yearly';
  hasBankAssignment: boolean;
  bankName?: string;
  bankCode?: string;
  suspensionReason?: string;
  suspensionDate?: string;
  suspensionType: 'customer_inactive' | 'device_suspended'; // Müşteri pasif mi, yoksa cihaz pasif mi
}

interface SuspendedDevicesReportProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

export function SuspendedDevicesReport({ customers, payterProducts }: SuspendedDevicesReportProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set());

  // Domain normalizasyon fonksiyonu


  const suspendedDevices = useMemo((): SuspendedDevice[] => {
    const devices: SuspendedDevice[] = [];

    customers.forEach(customer => {
      // Müşterinin Payter cihazlarını bul (Ana Domain görmezden gelme desteği ile)
      const customerDomain = customer.domain || customer.guncelMyPayterDomain;
      if (!customerDomain) return;
      
      const matchedProducts = payterProducts.filter(product => {
        if (!product.domain) return false;
        return matchDomain(product.domain, customerDomain, customer.ignoreMainDomain || false, customer.domainHierarchy);
      });

      matchedProducts.forEach(product => {
        // Cihaz abonelik bilgisi
        const serviceFee = customer.serviceFeeSettings;
        
        // ✅ ARRAY SAFETY: deviceSubscriptions kontrolü
        const deviceSubscriptions = Array.isArray(serviceFee?.deviceSubscriptions)
          ? serviceFee.deviceSubscriptions
          : [];
        
        const subscription = deviceSubscriptions.find(d => d.deviceId === product.id);
        
        const defaultFee = serviceFee?.customFeePerDevice || serviceFee?.standardFeePerDevice || 0;
        const deviceSub: DeviceSubscription = subscription || {
          deviceId: product.id,
          deviceSerialNumber: product.serialNumber || '',
          deviceName: product.name || '',
          monthlyFee: defaultFee,
          isActive: true,
          activationDate: new Date().toISOString().split('T')[0],
          paymentStatus: 'pending'
        };

        // GRUP 1: Pasif Müşteri - Müşteri durumu "Pasif" ise tüm cihazları pasif
        if (customer.durum === 'Pasif') {
          // ✅ ARRAY SAFETY: bankDeviceAssignments kontrolü
          const bankAssignments = Array.isArray(customer.bankDeviceAssignments)
            ? customer.bankDeviceAssignments
            : [];
          
          const bankAssignment = bankAssignments.find(
            ba => Array.isArray(ba.deviceIds) && ba.deviceIds.includes(product.id)
          );

          devices.push({
            customer,
            device: deviceSub,
            deviceDomain: product.domain || '',
            monthlyFee: deviceSub.monthlyFee,
            subscriptionType: serviceFee?.paymentType || 'monthly',
            hasBankAssignment: !!bankAssignment,
            bankName: bankAssignment?.bankName,
            bankCode: bankAssignment?.bankCode,
            suspensionType: 'customer_inactive',
            suspensionReason: 'Müşteri Pasif',
            suspensionDate: undefined
          });
        }
        // GRUP 2: Pasif Cihaz - Cihaz durumu "Pasif" işaretlenmiş
        else if (subscription && !subscription.isActive) {
          // ✅ ARRAY SAFETY: bankDeviceAssignments kontrolü (yeniden kullanım)
          const bankAssignments2 = Array.isArray(customer.bankDeviceAssignments)
            ? customer.bankDeviceAssignments
            : [];
          
          const bankAssignment = bankAssignments2.find(
            ba => Array.isArray(ba.deviceIds) && ba.deviceIds.includes(product.id)
          );

          devices.push({
            customer,
            device: deviceSub,
            deviceDomain: product.domain || '',
            monthlyFee: deviceSub.monthlyFee,
            subscriptionType: serviceFee?.paymentType || 'monthly',
            hasBankAssignment: !!bankAssignment,
            bankName: bankAssignment?.bankName,
            bankCode: bankAssignment?.bankCode,
            suspensionType: 'device_suspended',
            suspensionReason: deviceSub.suspensionReason || 'Sebep belirtilmemiş',
            suspensionDate: deviceSub.suspensionDate
          });
        }
      });
    });

    return devices;
  }, [customers, payterProducts]);

  // Grup 1: Pasif Müşteri cihazları
  const inactiveCustomerDevices = useMemo(() => {
    return suspendedDevices.filter(d => d.suspensionType === 'customer_inactive');
  }, [suspendedDevices]);

  // Grup 2: Pasif Cihazlar - Sebebe göre gruplanmış
  const suspendedDevicesByReason = useMemo(() => {
    const devicesBySuspension = suspendedDevices.filter(d => d.suspensionType === 'device_suspended');
    
    const grouped = new Map<string, SuspendedDevice[]>();
    
    devicesBySuspension.forEach(device => {
      const reason = device.suspensionReason || 'Sebep belirtilmemiş';
      if (!grouped.has(reason)) {
        grouped.set(reason, []);
      }
      grouped.get(reason)!.push(device);
    });

    return Array.from(grouped.entries())
      .map(([reason, devices]) => ({
        reason,
        count: devices.length,
        devices,
        totalMonthlyLoss: devices.reduce((sum, d) => sum + d.monthlyFee, 0)
      }))
      .sort((a, b) => b.count - a.count);
  }, [suspendedDevices]);

  // Filtreleme
  const filterDevices = (devices: SuspendedDevice[]) => {
    if (!searchTerm.trim()) return devices;

    const term = searchTerm.toLowerCase();
    return devices.filter(item =>
      item.customer.cariAdi?.toLowerCase().includes(term) ||
      item.customer.cariHesapKodu?.toLowerCase().includes(term) ||
      item.deviceDomain?.toLowerCase().includes(term) ||
      item.device.deviceSerialNumber?.toLowerCase().includes(term) ||
      item.bankName?.toLowerCase().includes(term) ||
      item.bankCode?.toLowerCase().includes(term) ||
      item.suspensionReason?.toLowerCase().includes(term)
    );
  };

  const filteredInactiveCustomerDevices = useMemo(() => 
    filterDevices(inactiveCustomerDevices), 
    [inactiveCustomerDevices, searchTerm]
  );

  const filteredSuspendedDevicesByReason = useMemo(() => {
    return suspendedDevicesByReason.map(group => ({
      ...group,
      devices: filterDevices(group.devices)
    })).filter(group => group.devices.length > 0);
  }, [suspendedDevicesByReason, searchTerm]);

  // Genel istatistikler
  const totalDevices = suspendedDevices.length;
  const totalMonthlyLoss = suspendedDevices.reduce((sum, d) => sum + d.monthlyFee, 0);
  const totalYearlyLoss = totalMonthlyLoss * 12;

  const toggleReasonExpansion = (reason: string) => {
    const newExpanded = new Set(expandedReasons);
    if (newExpanded.has(reason)) {
      newExpanded.delete(reason);
    } else {
      newExpanded.add(reason);
    }
    setExpandedReasons(newExpanded);
  };

  if (totalDevices === 0) {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 text-white rounded-full p-3">
              <Pause size={24} />
            </div>
            <div>
              <p className="text-green-900">✅ Hiç pasif cihaz yok</p>
              <p className="text-sm text-green-700">Tüm cihazlar aktif durumda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // DeviceTable component
  const DeviceTable = ({ devices, showCustomerColumn = true }: { devices: SuspendedDevice[], showCustomerColumn?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {showCustomerColumn && <th className="text-left py-3 px-3">Müşteri</th>}
            <th className="text-left py-3 px-3">Domain</th>
            <th className="text-left py-3 px-3">Seri No</th>
            <th className="text-left py-3 px-3">Banka Durumu</th>
            {showCustomerColumn && <th className="text-left py-3 px-3">Pasif Sebebi</th>}
            <th className="text-left py-3 px-3">Pasif Tarihi</th>
            <th className="text-left py-3 px-3">Abonelik</th>
            <th className="text-right py-3 px-3">Aylık Ücret</th>
            <th className="text-right py-3 px-3">Yıllık Kayıp</th>
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 ? (
            <tr>
              <td colSpan={showCustomerColumn ? 9 : 8} className="text-center py-8 text-gray-500">
                Arama kriterlerine uygun cihaz bulunamadı
              </td>
            </tr>
          ) : (
            devices.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-orange-50">
                {showCustomerColumn && (
                  <td className="py-3 px-3">
                    <div>
                      <p className={item.customer.durum === 'Pasif' ? 'text-gray-500' : ''}>
                        {item.customer.cariAdi}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.customer.cariHesapKodu}
                      </p>
                    </div>
                  </td>
                )}
                <td className="py-3 px-3">
                  <p className="text-xs">{item.deviceDomain}</p>
                </td>
                <td className="py-3 px-3">
                  <p className="text-xs">{item.device.deviceSerialNumber}</p>
                </td>
                <td className="py-3 px-3">
                  {item.hasBankAssignment ? (
                    <div>
                      <p className="text-xs text-blue-600">{item.bankCode}</p>
                      <p className="text-xs text-gray-500">{item.bankName}</p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Banka Tanımsız
                    </Badge>
                  )}
                </td>
                {showCustomerColumn && (
                  <td className="py-3 px-3">
                    <div>
                      <p className="text-xs text-orange-700">
                        {item.suspensionType === 'customer_inactive' ? '👤 Müşteri Pasif' : `🚫 ${item.suspensionReason}`}
                      </p>
                    </div>
                  </td>
                )}
                <td className="py-3 px-3">
                  {item.suspensionDate ? (
                    <p className="text-xs text-gray-500">
                      📅 {new Date(item.suspensionDate).toLocaleDateString('tr-TR')}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <Badge variant="outline">
                    {item.subscriptionType === 'monthly' ? 'Aylık' : 'Yıllık'}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-right">
                  <p className="text-red-600">{(item.monthlyFee || 0).toFixed(2)} €</p>
                </td>
                <td className="py-3 px-3 text-right">
                  <p className="text-red-700">{(item.monthlyFee * 12).toFixed(2)} €</p>
                </td>
              </tr>
            ))
          )}
        </tbody>
        {devices.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td colSpan={showCustomerColumn ? 7 : 6} className="py-3 px-3 text-right">
                <strong>Toplam ({devices.length} cihaz):</strong>
              </td>
              <td className="py-3 px-3 text-right">
                <strong className="text-red-600">
                  {devices.reduce((sum, d) => sum + d.monthlyFee, 0).toFixed(2)} €
                </strong>
              </td>
              <td className="py-3 px-3 text-right">
                <strong className="text-red-700">
                  {devices.reduce((sum, d) => sum + (d.monthlyFee * 12), 0).toFixed(2)} €
                </strong>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Uyarı Banner */}
      <Alert className="border-orange-300 bg-orange-50">
        <AlertCircle className="text-orange-600" size={20} />
        <AlertDescription>
          <div className="space-y-2">
            <p className="text-orange-900">
              ⚠️ Pasif cihazlar tespit edildi
            </p>
            <p className="text-sm text-orange-700">
              Bu cihazlar için aidat bedeli tahsil edilmemekte ve gelir hesaplamalarına dahil edilmemektedir.
              <strong> Grup 1 - Pasif Müşteri:</strong> Müşteri durumu "Pasif" olduğu için tüm cihazları otomatik pasif.
              <strong> Grup 2 - Pasif Cihaz:</strong> Cihaz bazlı pasifleştirme sebebi ile pasif.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Toplam Pasif Cihaz</p>
                <p className="text-3xl text-orange-900 mt-1">{totalDevices}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs bg-white">
                    <UserX size={12} className="mr-1" />
                    {inactiveCustomerDevices.length} Müşteri Pasif
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white">
                    <XCircle size={12} className="mr-1" />
                    {suspendedDevices.filter(d => d.suspensionType === 'device_suspended').length} Cihaz Pasif
                  </Badge>
                </div>
              </div>
              <Pause className="text-orange-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Aylık Potansiyel Kayıp</p>
                <p className="text-3xl text-red-900 mt-1">{totalMonthlyLoss.toFixed(2)} €</p>
              </div>
              <TrendingDown className="text-red-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-300 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Yıllık Potansiyel Kayıp</p>
                <p className="text-3xl text-purple-900 mt-1">{totalYearlyLoss.toFixed(2)} €</p>
              </div>
              <Euro className="text-purple-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Pasif Sebep Sayısı</p>
                <p className="text-3xl text-blue-900 mt-1">{suspendedDevicesByReason.length + 1}</p>
                <p className="text-xs text-blue-600 mt-1">+1 Müşteri Pasif</p>
              </div>
              <AlertCircle className="text-blue-600" size={40} />
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
              placeholder="Müşteri, domain, seri no, banka veya pasif sebebi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* İki Grup Halinde Listeleme */}
      <Tabs defaultValue="customer-inactive" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customer-inactive" className="flex items-center gap-2">
            <UserX size={16} />
            Grup 1: Pasif Müşteri
            <Badge variant="secondary" className="ml-2">
              {filteredInactiveCustomerDevices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="device-suspended" className="flex items-center gap-2">
            <XCircle size={16} />
            Grup 2: Pasif Cihaz
            <Badge variant="secondary" className="ml-2">
              {filteredSuspendedDevicesByReason.reduce((sum, g) => sum + g.devices.length, 0)}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Grup 1: Pasif Müşteri */}
        <TabsContent value="customer-inactive">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-900 flex items-center gap-2">
                <UserX size={20} />
                Grup 1: Pasif Müşteri - Müşteri durumu "Pasif" olan firmalar
                <Badge variant="secondary" className="ml-2">
                  {filteredInactiveCustomerDevices.length} Cihaz
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Bu gruptaki cihazlar, müşteri cari kartında durum "Pasif" olarak işaretlendiği için otomatik olarak pasif kabul edilir.
              </p>
            </CardHeader>
            <CardContent>
              <DeviceTable devices={filteredInactiveCustomerDevices} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grup 2: Pasif Cihaz (Sebebe göre gruplanmış) */}
        <TabsContent value="device-suspended">
          <div className="space-y-4">
            {filteredSuspendedDevicesByReason.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 py-8">
                    Cihaz bazlı pasifleştirme bulunamadı
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredSuspendedDevicesByReason.map((group) => (
                <Card key={group.reason}>
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleReasonExpansion(group.reason)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-orange-900 flex items-center gap-2">
                        {expandedReasons.has(group.reason) ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                        🚫 {group.reason}
                        <Badge variant="secondary" className="ml-2">
                          {group.devices.length} Cihaz
                        </Badge>
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700">
                          {group.totalMonthlyLoss.toFixed(2)} € / ay
                        </Badge>
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {expandedReasons.has(group.reason) && (
                    <CardContent>
                      <DeviceTable devices={group.devices} showCustomerColumn={true} />
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}