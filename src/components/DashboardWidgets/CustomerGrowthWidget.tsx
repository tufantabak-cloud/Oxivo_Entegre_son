// Müşteri Büyüme Analizi Widget'ı
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TrendingUp, TrendingDown, Minus, Users, Maximize2, Minimize2 } from 'lucide-react';
import type { Customer } from '../CustomerModule';

interface CustomerGrowthWidgetProps {
  customers: Customer[];
}

interface MonthlyData {
  month: string;
  total: number;
  change: number;
  changePercent: number;
  newCustomers: number;
  lostCustomers: number;
}

export function CustomerGrowthWidget({ customers }: CustomerGrowthWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const growthAnalysis = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Müşterileri kayıt tarihine göre grupla
    const customersByMonth = new Map<string, Customer[]>();
    
    customers.forEach(customer => {
      if (customer.kayitTarihi) {
        const date = new Date(customer.kayitTarihi);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!customersByMonth.has(key)) {
          customersByMonth.set(key, []);
        }
        customersByMonth.get(key)!.push(customer);
      }
    });

    // Son 12 aylık veri oluştur
    const monthlyData: MonthlyData[] = [];
    let cumulativeTotal = 0;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthCustomers = customersByMonth.get(monthKey) || [];
      const newCustomers = monthCustomers.filter(c => c.durum === 'Aktif').length;
      const lostCustomers = monthCustomers.filter(c => c.durum === 'Pasif').length;
      
      cumulativeTotal += newCustomers - lostCustomers;
      
      const previousTotal = i === 11 ? 0 : monthlyData[monthlyData.length - 1]?.total || 0;
      const change = cumulativeTotal - previousTotal;
      const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0;
      
      monthlyData.push({
        month: date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
        total: cumulativeTotal,
        change,
        changePercent,
        newCustomers,
        lostCustomers,
      });
    }
    
    return monthlyData;
  }, [customers]);

  // Son 6 ayı göster
  const recentMonths = growthAnalysis.slice(-6);
  const totalGrowth = recentMonths.length > 0 
    ? recentMonths[recentMonths.length - 1].total - recentMonths[0].total 
    : 0;
  const avgMonthlyGrowth = recentMonths.length > 0
    ? recentMonths.reduce((sum, m) => sum + m.change, 0) / recentMonths.length
    : 0;

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-green-600" size={20} />
            Müşteri Büyümesi
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {totalGrowth >= 0 ? '+' : ''}{totalGrowth}
                </div>
                <div className="text-xs text-gray-600 mt-1">Son 6 Ay Büyüme</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {avgMonthlyGrowth >= 0 ? '+' : ''}{avgMonthlyGrowth.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Ortalama Aylık</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{customers.length}</div>
                <div className="text-xs text-gray-600 mt-1">Toplam Müşteri</div>
              </div>
            </div>

            {/* Aylık Büyüme - Card Bazlı */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Aylık Detay (Son 6 Ay)</h4>
              <div className="space-y-2">
                {recentMonths.map((month, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm min-w-[60px]">{month.month}</span>
                      <div className="flex items-center gap-2">
                        {month.change > 0 ? (
                          <TrendingUp size={14} className="text-green-600" />
                        ) : month.change < 0 ? (
                          <TrendingDown size={14} className="text-red-600" />
                        ) : (
                          <Minus size={14} className="text-gray-400" />
                        )}
                        <span className={`text-xs font-semibold ${
                          month.change > 0 ? 'text-green-600' : 
                          month.change < 0 ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {month.change >= 0 ? '+' : ''}{month.change}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {month.total} toplam
                      </Badge>
                      {month.newCustomers > 0 && (
                        <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                          +{month.newCustomers}
                        </Badge>
                      )}
                      {month.lostCustomers > 0 && (
                        <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                          -{month.lostCustomers}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
