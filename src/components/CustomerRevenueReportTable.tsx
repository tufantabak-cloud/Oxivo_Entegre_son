import { Customer, ServiceFeeSettings } from './CustomerModule';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, Ban, CheckCircle, XCircle } from 'lucide-react';

interface CustomerRevenueData {
  customer: Customer;
  serviceFee: ServiceFeeSettings | null;
  activeDevices: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalPayterDevices: number;
}

interface CustomerRevenueReportTableProps {
  data: CustomerRevenueData[];
}

export function CustomerRevenueReportTable({ data }: CustomerRevenueReportTableProps) {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <CardTitle className="text-green-900 flex items-center gap-2">
          <TrendingUp size={20} />
          📊 Müşteri Bazlı Gelir Raporu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-green-300">
                <th className="text-left py-3 px-3">Müşteri Adı</th>
                <th className="text-left py-3 px-3">Hesap Kodu</th>
                <th className="text-center py-3 px-3">Ödeme Tipi</th>
                <th className="text-center py-3 px-3">Toplam Cihaz</th>
                <th className="text-center py-3 px-3">Aktif Cihaz</th>
                <th className="text-center py-3 px-3">Cihaz Başı Ücret (€)</th>
                <th className="text-right py-3 px-3 bg-green-100">Aylık Gelir (€)</th>
                <th className="text-right py-3 px-3 bg-blue-100">Yıllık Gelir (€)</th>
                <th className="text-center py-3 px-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const feePerDevice = item.serviceFee?.customFeePerDevice || item.serviceFee?.standardFeePerDevice || 0;
                const isActive = item.serviceFee?.isActive && !item.serviceFee?.suspensionStartDate;
                
                return (
                  <tr key={item.customer.id} className="border-b border-green-100 hover:bg-white/50">
                    <td className="py-3 px-3">
                      <p className={`font-medium ${item.customer.durum === 'Pasif' ? 'line-through text-gray-500' : ''}`}>
                        {item.customer.cariAdi}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <p className={`text-xs ${item.customer.durum === 'Pasif' ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                        {item.customer.cariHesapKodu}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.serviceFee ? (
                        <Badge variant="outline" className={item.serviceFee.paymentType === 'monthly' ? 'bg-blue-50' : 'bg-purple-50'}>
                          {item.serviceFee.paymentType === 'monthly' ? '📅 Aylık' : '📆 Yıllık'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span>{item.totalPayterDevices}</span>
                        {item.totalPayterDevices > 0 && (
                          <span className="text-xs text-blue-600">📱 Payter</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-medium text-green-700">{item.activeDevices}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.serviceFee ? (
                        <div className="flex flex-col items-center">
                          <span>{feePerDevice.toFixed(2)}</span>
                          {item.serviceFee.customFeePerDevice && (
                            <Badge variant="secondary" className="text-xs mt-1">Özel</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right bg-green-50">
                      <div className="flex flex-col items-end">
                        <span className="text-green-700 font-semibold">
                          {isActive ? item.monthlyRevenue.toFixed(2) : '0.00'}
                        </span>
                        {!isActive && item.monthlyRevenue > 0 && (
                          <span className="text-xs text-red-500 line-through">
                            {item.monthlyRevenue.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 mt-1">
                          {item.activeDevices} × {feePerDevice.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right bg-blue-50">
                      <div className="flex flex-col items-end">
                        <span className="text-blue-700 font-semibold">
                          {isActive ? item.yearlyRevenue.toFixed(2) : '0.00'}
                        </span>
                        {!isActive && item.yearlyRevenue > 0 && (
                          <span className="text-xs text-red-500 line-through">
                            {item.yearlyRevenue.toFixed(2)}
                          </span>
                        )}
                        {item.serviceFee?.paymentType === 'yearly' && isActive && (
                          <span className="text-xs text-purple-600 mt-1">
                            Yıllık ödeme
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {item.serviceFee?.suspensionStartDate ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Ban size={12} />
                            Donduruldu
                          </Badge>
                        ) : item.serviceFee?.isActive ? (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                            <CheckCircle size={12} />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <XCircle size={12} />
                            Pasif
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-green-300 bg-green-100">
                <td colSpan={6} className="py-4 px-3 text-right font-semibold">
                  TOPLAM ({data.filter(d => d.serviceFee?.isActive && !d.serviceFee?.suspensionStartDate).length} Aktif Müşteri):
                </td>
                <td className="py-4 px-3 text-right font-bold text-green-700 text-lg bg-green-200">
                  {data
                    .filter(d => d.serviceFee?.isActive && !d.serviceFee?.suspensionStartDate)
                    .reduce((sum, d) => sum + d.monthlyRevenue, 0)
                    .toFixed(2)} €
                </td>
                <td className="py-4 px-3 text-right font-bold text-blue-700 text-lg bg-blue-200">
                  {data
                    .filter(d => d.serviceFee?.isActive && !d.serviceFee?.suspensionStartDate)
                    .reduce((sum, d) => sum + d.yearlyRevenue, 0)
                    .toFixed(2)} €
                </td>
                <td className="py-4 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-green-200">
          <p className="text-xs text-gray-700">
            💡 <strong>Hesaplama Mantığı:</strong>
          </p>
          <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4 list-disc">
            <li><strong>Toplam Cihaz:</strong> Payter sayfasından domain eşleştirmesiyle otomatik gelen cihaz sayısı</li>
            <li><strong>Aktif Cihaz:</strong> Hizmet bedeli hesaplamasına dahil edilen cihaz sayısı</li>
            <li><strong>Aylık Gelir:</strong> Aktif Cihaz × Cihaz Başı Ücret (sadece aktif ve dondurulmamış müşteriler)</li>
            <li><strong>Yıllık Gelir:</strong> Aylık Gelir × 12 (yıllık ödeme tipinde tek seferde tahsil edilir)</li>
            <li><strong>Pasif/Dondurulmuş:</strong> Müşteriler gelir hesaplamasına dahil edilmez (üstü çizili gösterilir)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
