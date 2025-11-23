import { useState, useMemo } from 'react';
import { Customer, DeviceSubscription } from './CustomerModule';
import { PayterProduct } from './PayterProductTab';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { AlertTriangle, Ban, Clock, Search, Filter } from 'lucide-react';
import { matchDomain } from '../utils/domainMatching';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface DeviceRowData {
  customer: Customer;
  device: DeviceSubscription;
  deviceDomain: string;
  monthlyFee: number;
  daysOverdue: number;
  bankName: string | null;
}

interface OverdueSuspensionWarningPanelProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
  selectedPeriod: string;
  onSuspendDevices: (devices: DeviceRowData[]) => void;
}

export function OverdueSuspensionWarningPanel({
  customers,
  payterProducts,
  selectedPeriod,
  onSuspendDevices
}: OverdueSuspensionWarningPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());



  // 10+ gün gecikmiş cihazları bul
  const overdueDevices = useMemo((): DeviceRowData[] => {
    const devices: DeviceRowData[] = [];

    customers.forEach(customer => {
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

        const currentInvoice = serviceFee.invoices.find(inv => inv.period === selectedPeriod);
        
        // Banka atamasını bul
        const bankAssignment = customer.bankDeviceAssignments?.find(
          ba => ba.deviceIds.includes(product.id)
        );

        // Sadece aktif, ödeme alınmamış ve 10+ gün gecikmiş cihazlar
        if (currentInvoice && !currentInvoice.paymentConfirmed && !currentInvoice.isSuspended) {
          const dueDate = new Date(currentInvoice.dueDate);
          const today = new Date();
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysOverdue >= 10 && deviceSub.isActive) {
            devices.push({
              customer,
              device: deviceSub,
              deviceDomain: product.domain || '',
              monthlyFee: deviceSub.monthlyFee,
              daysOverdue,
              bankName: bankAssignment?.bankName || null
            });
          }
        }
      });
    });

    return devices.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [customers, payterProducts, selectedPeriod]);

  // Filtreleme
  const filteredDevices = useMemo(() => {
    if (!searchTerm) return overdueDevices;

    const searchLower = searchTerm.toLowerCase();
    return overdueDevices.filter(row => 
      row.customer.cariAdi.toLowerCase().includes(searchLower) ||
      row.customer.cariHesapKodu.toLowerCase().includes(searchLower) ||
      row.device.deviceSerialNumber.toLowerCase().includes(searchLower) ||
      row.deviceDomain.toLowerCase().includes(searchLower)
    );
  }, [overdueDevices, searchTerm]);

  // Müşteri bazlı gruplama
  const groupedByCustomer = useMemo(() => {
    const groups = new Map<string, {
      customer: Customer;
      devices: DeviceRowData[];
      totalDevices: number;
      totalAmount: number;
      maxDaysOverdue: number;
    }>();

    filteredDevices.forEach(row => {
      const customerId = row.customer.id;
      
      if (!groups.has(customerId)) {
        groups.set(customerId, {
          customer: row.customer,
          devices: [],
          totalDevices: 0,
          totalAmount: 0,
          maxDaysOverdue: 0
        });
      }

      const group = groups.get(customerId)!;
      group.devices.push(row);
      group.totalDevices++;
      group.totalAmount += row.monthlyFee;
      group.maxDaysOverdue = Math.max(group.maxDaysOverdue, row.daysOverdue);
    });

    return Array.from(groups.values()).sort((a, b) => b.maxDaysOverdue - a.maxDaysOverdue);
  }, [filteredDevices]);

  const handleToggleDevice = (customerId: string, deviceId: string) => {
    const key = `${customerId}-${deviceId}`;
    const newSelected = new Set(selectedDevices);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedDevices(newSelected);
  };

  const handleToggleCustomer = (customerId: string, devices: DeviceRowData[]) => {
    const newSelected = new Set(selectedDevices);
    const allSelected = devices.every(d => newSelected.has(`${customerId}-${d.device.deviceId}`));
    
    devices.forEach(d => {
      const key = `${customerId}-${d.device.deviceId}`;
      if (allSelected) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
    });
    
    setSelectedDevices(newSelected);
  };

  const handleBulkSuspend = () => {
    const devicesToSuspend = filteredDevices.filter(row => 
      selectedDevices.has(`${row.customer.id}-${row.device.deviceId}`)
    );

    if (devicesToSuspend.length === 0) {
      toast.error('Lütfen en az bir cihaz seçin');
      return;
    }

    onSuspendDevices(devicesToSuspend);
    setSelectedDevices(new Set());
  };

  if (overdueDevices.length === 0) {
    return null; // 10+ gün gecikmiş cihaz yoksa paneli gösterme
  }

  return (
    <Card className="border-red-300 bg-red-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-red-600" />
            <div>
              <CardTitle className="text-red-900">
                Hizmeti Dondurulacak Firmalar (10+ Gün Gecikme)
              </CardTitle>
              <p className="text-sm text-red-700 mt-1">
                {groupedByCustomer.length} firma, {overdueDevices.length} cihaz
              </p>
            </div>
          </div>
          {selectedDevices.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkSuspend}
              className="flex items-center gap-2"
            >
              <Ban size={16} />
              <span>{selectedDevices.size} Cihazı Dondur</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Arama */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Müşteri, cihaz seri no, domain ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              Arama kriterine uygun kayıt bulunamadı
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {groupedByCustomer.map((group) => {
                const allSelected = group.devices.every(d => 
                  selectedDevices.has(`${group.customer.id}-${d.device.deviceId}`)
                );

                return (
                  <div key={group.customer.id} className="border rounded-lg overflow-hidden">
                    {/* Müşteri Başlığı */}
                    <div className="bg-red-100 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => handleToggleCustomer(group.customer.id, group.devices)}
                        />
                        <div>
                          <p className="font-medium text-red-900">{group.customer.cariAdi}</p>
                          <p className="text-xs text-red-700">{group.customer.cariHesapKodu}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Clock size={14} />
                          {group.maxDaysOverdue} gün gecikme
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                          {group.totalDevices} cihaz
                        </Badge>
                        <span className="text-red-900">{group.totalAmount.toFixed(2)} €</span>
                      </div>
                    </div>

                    {/* Cihaz Listesi */}
                    <div className="divide-y bg-white">
                      {group.devices.map((device) => (
                        <div
                          key={device.device.deviceId}
                          className="px-4 py-2 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={selectedDevices.has(`${group.customer.id}-${device.device.deviceId}`)}
                              onCheckedChange={() => handleToggleDevice(group.customer.id, device.device.deviceId)}
                            />
                            <div className="flex-1">
                              <p className="text-sm">{device.device.deviceSerialNumber}</p>
                              <p className="text-xs text-gray-500">{device.deviceDomain}</p>
                            </div>
                            {device.bankName && (
                              <Badge variant="outline" className="text-xs">
                                {device.bankName}
                              </Badge>
                            )}
                            <span className="text-sm text-gray-900 min-w-[80px] text-right">
                              {device.monthlyFee.toFixed(2)} €
                            </span>
                            <Badge variant="destructive" className="min-w-[100px] text-center">
                              {device.daysOverdue} gün gecikti
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}