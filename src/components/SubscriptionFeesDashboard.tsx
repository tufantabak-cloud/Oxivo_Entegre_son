import { useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Euro, 
  TrendingUp, 
  AlertTriangle, 
  Users,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  DollarSign,
  AlertCircle
} from 'lucide-react';
// Tooltip removed - import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface SubscriptionFeesStats {
  totalMonthlyRevenue: number;
  totalYearlyRevenue: number;
  totalActiveDevices: number;
  totalSuspendedDevices: number;
  confirmedPayments: number;
  pendingPayments: number;
  overduePayments: number;
  banklessDevices: number;
  banklessRevenueLoss: number;
  activeCustomers: number; // Genel aktif müşteri sayısı (durum === 'Aktif')
  customersWithActiveSubscriptions?: number; // Aidat bedeli aktif müşteri sayısı (opsiyonel)
  suspendedCustomers: number;
  // Yeni istatistikler
  totalDevices: number;
  devicesWithBank: number;
  devicesWithoutBank: number;
  monthlySubscriptionRevenue: number;
  monthlySubscriptionLoss: number;
  yearlySubscriptionRevenue: number;
  yearlySubscriptionLoss: number;
  totalExpectedPayment: number;
  overduePaymentAmount: number;
  suspendedDeviceRevenue: number;
}

interface SubscriptionFeesDashboardProps {
  stats: SubscriptionFeesStats;
}

export function SubscriptionFeesDashboard({ stats }: SubscriptionFeesDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Üst Satır: Mevcut 4 Kart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Aidat Kazancı (Beklenen) */}
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aidat Kazancı (Beklenen)</p>
                <p className="text-2xl text-green-600 mt-1">
                  {stats.totalMonthlyRevenue.toFixed(2)} €
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeCustomers} aktif müşteri
                </p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </CardContent>
        </Card>

        {/* Aidat Kaybı (Banka Tanımsız) */}
        <Card className={stats.devicesWithoutBank > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aidat Kaybı (Banka Tanımsız)</p>
                <p className={`text-2xl mt-1 ${stats.devicesWithoutBank > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {stats.banklessRevenueLoss.toFixed(2)} €
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {stats.devicesWithoutBank} cihaz banka tanımsız
                </p>
              </div>
              <XCircle className={stats.devicesWithoutBank > 0 ? 'text-red-600' : 'text-gray-400'} size={32} />
            </div>
          </CardContent>
        </Card>

        {/* Ödeme Alınan Fatura Sayısı */}
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ödeme Alınan Fatura Sayısı</p>
                <p className="text-2xl text-blue-600 mt-1">
                  {stats.confirmedPayments}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Bu dönem
                </p>
              </div>
              <CheckCircle className="text-blue-600" size={32} />
            </div>
          </CardContent>
        </Card>

        {/* Hizmeti Dondurulmuş Cihaz */}
        <Card className={stats.suspendedCustomers > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hizmeti Dondurulmuş Cihaz</p>
                <p className={`text-2xl mt-1 ${stats.suspendedCustomers > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                  {stats.totalSuspendedDevices}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.suspendedCustomers} müşteri
                </p>
              </div>
              <Ban className={stats.suspendedCustomers > 0 ? 'text-orange-600' : 'text-gray-400'} size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alt Satır: 3 Yeni Kart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Cihaz Dağılımı */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="text-blue-600" size={20} />
                  <p className="text-sm text-gray-700">Cihaz Dağılımı</p>
                </div>
                
                <p className="text-3xl text-blue-700 mb-2">
                  {stats.totalDevices}
                </p>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bankaya Tanımlı:</span>
                    <span className="text-green-700">{stats.devicesWithBank}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Banka Tanımsız:</span>
                    <span className="text-orange-600">
                      {stats.devicesWithoutBank}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Gelir Tipi Dağılımı */}
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="text-purple-600" size={20} />
                  <p className="text-sm text-gray-700">Gelir Tipi Dağılımı</p>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="border-b border-purple-200 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600">Aylık Aidat (Güncel):</span>
                      <span className="text-green-700">
                        {stats.monthlySubscriptionRevenue.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Aylık Kayıp:</span>
                      <span className="text-red-600">
                        {stats.monthlySubscriptionLoss.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600">Yıllık Aidat (Toplam):</span>
                      <span className="text-green-700">
                        {stats.yearlySubscriptionRevenue.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Yıllık Kayıp:</span>
                      <span className="text-red-600">
                        {stats.yearlySubscriptionLoss.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Ödeme Performansı */}
        <Card className={stats.overduePaymentAmount > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className={stats.overduePaymentAmount > 0 ? 'text-red-600' : 'text-green-600'} size={20} />
                  <p className="text-sm text-gray-700">Ödeme Performansı</p>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Beklenen Toplam:</span>
                    <span className="text-gray-800">
                      {stats.totalExpectedPayment.toFixed(2)} €
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Gecikmiş (1-9. Gün):</span>
                    <span className={`${stats.overduePaymentAmount > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                      {stats.overduePaymentAmount.toFixed(2)} €
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dondurulmuş Cihaz:</span>
                    <span className={`${stats.suspendedDeviceRevenue > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {stats.suspendedDeviceRevenue.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
