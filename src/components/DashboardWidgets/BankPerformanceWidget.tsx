// Banka Performans Analizi Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Building2, TrendingUp, TrendingDown, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { BankPF } from '../BankPFModule';
import type { Bank } from '../DefinitionsModule';
import { FullListModal } from './FullListModal';

interface BankPerformanceWidgetProps {
  customers: Customer[];
  bankPFRecords: BankPF[];
  banks: Bank[];
}

interface BankStats {
  bankId: string;
  bankName: string;
  bankCode: string;
  customerCount: number;
  deviceCount: number;
  totalRevenue: number;
  activeCustomers: number;
}

export function BankPerformanceWidget({ customers, bankPFRecords, banks }: BankPerformanceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });
  
  // Banka bazlı performans hesaplama
  const bankStats: BankStats[] = banks.map((bank) => {
    // Bu bankaya bağlı müşterileri bul
    const bankCustomers = customers.filter((c) =>
      c.linkedBankPFIds?.some((id) => {
        const bpf = bankPFRecords.find((b) => b.id === id);
        return bpf?.bankaAdi === bank.bankaAdi;
      })
    );

    // Aktif cihaz sayısı (sadece isActive: true olanlar)
    const deviceCount = bankCustomers.reduce((sum, c) => {
      const allDevices = c.serviceFeeSettings?.deviceSubscriptions || [];
      const activeDevices = allDevices.filter(d => d.isActive);
      return sum + activeDevices.length;
    }, 0);

    // Aktif müşteri sayısı
    const activeCustomers = bankCustomers.filter((c) => c.durum === 'Aktif').length;

    // Toplam gelir (cihaz başı €10 varsayımı)
    const totalRevenue = deviceCount * 10;

    return {
      bankId: bank.id,
      bankName: bank.bankaAdi,
      bankCode: bank.bankaKodu,
      customerCount: bankCustomers.length,
      deviceCount,
      totalRevenue,
      activeCustomers,
    };
  })
    .filter((stat) => stat.customerCount > 0) // Müşterisi olmayan bankaları çıkar
    .sort((a, b) => b.totalRevenue - a.totalRevenue) // Gelire göre sırala
    .slice(0, 6); // En iyi 6 bankayı göster

  // Toplam istatistikler
  const totalBanks = bankStats.length;
  const totalCustomers = bankStats.reduce((sum, stat) => sum + stat.customerCount, 0);
  const totalDevices = bankStats.reduce((sum, stat) => sum + stat.deviceCount, 0);
  const totalRevenue = bankStats.reduce((sum, stat) => sum + stat.totalRevenue, 0);

  const handleShowFullList = () => {
    const allItems = bankStats.map((bank) => ({
      label: `${bank.bankName} (${bank.bankCode})`,
      value: `${bank.deviceCount} cihaz • ${bank.customerCount} müşteri`,
      badge: `€${bank.totalRevenue.toLocaleString()}`,
    }));
    
    setModalData({
      title: 'Banka Performansı - Tüm Liste',
      items: allItems,
    });
    setShowFullListModal(true);
  };

  return (
    <>
      <FullListModal
        isOpen={showFullListModal}
        onClose={() => setShowFullListModal(false)}
        title={modalData.title}
        items={modalData.items}
      />
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" size={20} />
            Banka Performansı
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
            {/* Genel İstatistikler */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalBanks}</div>
                <div className="text-xs text-gray-600 mt-1">Aktif Banka</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalCustomers}</div>
                <div className="text-xs text-gray-600 mt-1">Toplam Müşteri</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalDevices}</div>
                <div className="text-xs text-gray-600 mt-1">Toplam Cihaz</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">€{totalRevenue.toLocaleString('tr-TR')}</div>
                <div className="text-xs text-gray-600 mt-1">Aylık Gelir</div>
              </div>
            </div>

            {/* Banka Listesi - Card Bazlı */}
            {bankStats.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Performansa Göre Bankalar (Top 6)</h4>
                  {bankStats.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShowFullList}
                      className="h-8 gap-1"
                    >
                      <ExternalLink size={14} />
                      <span className="text-xs">Tümünü Göster ({bankStats.length})</span>
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {bankStats.map((stat, index) => (
                    <div
                      key={stat.bankId}
                      className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-sm">{stat.bankName}</div>
                            <div className="text-xs text-gray-600">{stat.bankCode}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-600">
                            €{stat.totalRevenue.toLocaleString('tr-TR')}
                          </Badge>
                          {index < 3 && (
                            <TrendingUp size={16} className="text-green-600" />
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-white rounded">
                          <div className="font-semibold text-blue-600">{stat.customerCount}</div>
                          <div className="text-gray-600">Müşteri</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <div className="font-semibold text-purple-600">{stat.deviceCount}</div>
                          <div className="text-gray-600">Cihaz</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <div className="font-semibold text-green-600">{stat.activeCustomers}</div>
                          <div className="text-gray-600">Aktif</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 size={48} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Henüz banka verisi yok</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
      </Card>
    </>
  );
}
