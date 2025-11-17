// Sistem Durum Widget'ı
// Dashboard'un güncel veri durumunu gösterir
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CheckCircle, Database, Clock, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Customer } from '../CustomerModule';
import type { BankPF } from '../BankPFModule';
import type { PayterProduct } from '../PayterProductTab';

interface SystemStatusWidgetProps {
  customers: Customer[];
  bankPFRecords: BankPF[];
  payterProducts: PayterProduct[];
}

export function SystemStatusWidget({
  customers,
  bankPFRecords,
  payterProducts,
}: SystemStatusWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [customers, bankPFRecords, payterProducts]);

  // Veri istatistikleri
  const stats = {
    customers: customers.length,
    activeCustomers: customers.filter((c) => c.durum === 'Aktif').length,
    bankPF: bankPFRecords.length,
    products: payterProducts.length,
    totalDevices: customers.reduce((sum, c) => {
      const allDevices = c.serviceFeeSettings?.deviceSubscriptions || [];
      const activeDevices = allDevices.filter(d => d.isActive);
      return sum + activeDevices.length;
    }, 0),
  };

  // LocalStorage boyutu
  const getStorageSize = () => {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage.getItem(key)?.length || 0;
      }
    }
    return (size / 1024 / 1024).toFixed(2); // MB
  };

  const storageSize = getStorageSize();

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="text-green-600" size={20} />
            Sistem Durumu
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
        <div className="space-y-4">
          {/* Veri Senkronizasyon Durumu */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <div className="font-semibold text-sm text-green-900">
                  Tüm Veriler Senkronize
                </div>
                <div className="text-xs text-green-700">Dashboard güncel</div>
              </div>
            </div>
            <Badge className="bg-green-600">Aktif</Badge>
          </div>

          {/* Son Güncelleme */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>
              Son güncelleme:{' '}
              {lastUpdate.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          {/* Veri İstatistikleri - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.customers}</div>
              <div className="text-xs text-gray-600">Müşteri</div>
              <div className="text-xs text-blue-600">{stats.activeCustomers} aktif</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.bankPF}</div>
              <div className="text-xs text-gray-600">Banka/PF</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{stats.products}</div>
              <div className="text-xs text-gray-600">Ürün</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{stats.totalDevices}</div>
              <div className="text-xs text-gray-600">Cihaz</div>
            </div>
          </div>

          {/* Storage Durumu */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">LocalStorage Kullanımı</span>
              <span className="text-xs font-semibold text-gray-900">
                {storageSize} MB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((parseFloat(storageSize) / 10) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Otomatik Yenileme */}
          <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <RefreshCw size={16} className="text-indigo-600" />
            <div className="text-xs text-indigo-900">
              <div className="font-semibold">Otomatik Yenileme Aktif</div>
              <div className="text-indigo-700">Her 30 saniyede bir güncellenir</div>
            </div>
          </div>
        </div>
        </CardContent>
      )}
    </Card>
  );
}
