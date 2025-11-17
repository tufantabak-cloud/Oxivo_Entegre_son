// Gelir Trend Grafiği Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TrendingUp, TrendingDown, DollarSign, Maximize2, Minimize2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Customer } from '../CustomerModule';
import type { PayterProduct } from '../PayterProductTab';

interface RevenueTrendWidgetProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

interface MonthlyRevenue {
  month: string;
  deviceRevenue: number;
  totalRevenue: number;
  customerCount: number;
}

export function RevenueTrendWidget({ customers, payterProducts }: RevenueTrendWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  // Son 12 aylık gelir trendi oluştur
  const generateMonthlyData = (): MonthlyRevenue[] => {
    const monthlyData: MonthlyRevenue[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });

      // O aya kadar olan müşteri sayısı (kümülatif)
      const customersUpToMonth = customers.filter((c) => {
        if (!c.kayitTarihi) return true; // Tarihi olmayanları dahil et
        const registrationDate = new Date(c.kayitTarihi);
        return registrationDate <= date;
      }).length;

      // O aydaki aktif cihaz sayısı (her müşterinin aktif cihazları)
      const deviceCount = customers.reduce((sum, c) => {
        const allDevices = c.serviceFeeSettings?.deviceSubscriptions || [];
        const activeDevices = allDevices.filter(d => d.isActive);
        
        if (!c.kayitTarihi) return sum + activeDevices.length;
        const registrationDate = new Date(c.kayitTarihi);
        if (registrationDate <= date) {
          return sum + activeDevices.length;
        }
        return sum;
      }, 0);

      // Cihaz geliri (€10 per device)
      const deviceRevenue = deviceCount * 10;

      // Toplam gelir (şimdilik sadece cihaz geliri)
      const totalRevenue = deviceRevenue;

      monthlyData.push({
        month: monthLabel,
        deviceRevenue,
        totalRevenue,
        customerCount: customersUpToMonth,
      });
    }

    return monthlyData;
  };

  const monthlyData = generateMonthlyData();

  // Trend analizi (son ay vs önceki ay)
  const lastMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const revenueChange = lastMonth && previousMonth
    ? ((lastMonth.totalRevenue - previousMonth.totalRevenue) / (previousMonth.totalRevenue || 1)) * 100
    : 0;
  const isPositiveTrend = revenueChange >= 0;

  // Toplam gelir (son ay)
  const totalRevenue = lastMonth?.totalRevenue || 0;
  const totalCustomers = lastMonth?.customerCount || 0;

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            Gelir Trend Analizi
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
        <div className="space-y-6">
          {/* Özet İstatistikler */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">€{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">Bu Ay Gelir</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{totalCustomers}</div>
              <div className="text-xs text-gray-600 mt-1">Aktif Müşteri</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${isPositiveTrend ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`text-3xl font-bold flex items-center justify-center gap-1 ${isPositiveTrend ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositiveTrend ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                {Math.abs(revenueChange).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">Aylık Değişim</div>
            </div>
          </div>

          {/* Trend Grafiği */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Son 12 Ay Gelir Trendi</h4>
            {monthlyData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz gelir verisi yok</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      stroke="#888"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#888"
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`€${value.toLocaleString()}`, 'Gelir']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="totalRevenue"
                      name="Toplam Gelir"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="deviceRevenue"
                      name="Cihaz Geliri"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#3b82f6' }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        </CardContent>
      )}
    </Card>
  );
}
