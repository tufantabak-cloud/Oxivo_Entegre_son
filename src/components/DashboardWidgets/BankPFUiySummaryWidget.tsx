// ÜİY İcmal Tablosu - Sadece Banka/PF Adı ve Toplam Sütunları
// Dashboard için basitleştirilmiş özet widget
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BarChart3, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { FullListModal } from './FullListModal';
import type { Customer } from '../CustomerModule';
import type { BankPF } from '../BankPFModule';
import type { Bank, EPK, OK } from '../DefinitionsModule';

interface BankPFUiySummaryWidgetProps {
  customers: Customer[];
  bankPFRecords: BankPF[];
  banks: Bank[];
  epkList: EPK[];
  okList: OK[];
}

export function BankPFUiySummaryWidget({
  customers,
  bankPFRecords,
  banks,
  epkList,
  okList
}: BankPFUiySummaryWidgetProps) {
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });

  // ÜİY İcmal Verisi - Her banka için toplam ÜİY ve cihaz sayıları
  const uiySummaryData = useMemo(() => {
    // ✅ DEBUG: Check if bankaAdi mapping is working
    if (banks.length > 0) {
      const firstBank = banks[0];
      console.log('🔍 DEBUG - First Bank in Widget:', {
        id: firstBank.id,
        ad: firstBank.ad,
        bankaAdi: firstBank.bankaAdi,
        allKeys: Object.keys(firstBank)
      });
    }
    
    // TÜM banka/PF/EPK/ÖK tanımlarını birleştir
    const allBankDefinitions = [
      ...bankPFRecords.filter(bp => bp.firmaUnvan).map(bp => ({
        id: bp.id,
        name: bp.firmaUnvan,
        source: 'bankPF' as const
      })),
      ...banks.filter(b => b.bankaAdi).map(b => ({
        id: b.id,
        name: b.bankaAdi,
        source: 'definitions' as const
      })),
      ...epkList.filter(e => e.kurumAdi).map(e => ({
        id: e.id,
        name: e.kurumAdi,
        source: 'definitions' as const
      })),
      ...okList.filter(o => o.kurumAdi).map(o => ({
        id: o.id,
        name: o.kurumAdi,
        source: 'definitions' as const
      }))
    ];

    // Her banka için toplam müşteri ve cihaz sayılarını hesapla
    const bankaStats = allBankDefinitions.map(def => {
      // İlişkili tüm müşterileri bul
      const relatedCustomers = customers.filter(customer => {
        if (def.source === 'bankPF' && customer.linkedBankPFIds?.includes(def.id)) {
          return true;
        }
        if (customer.bankDeviceAssignments?.some(a => 
          a.bankId === def.id || 
          a.bankId === `bank-${def.id}` || 
          a.bankId === `ok-epk-${def.id}` || 
          a.bankId === `ok-ok-${def.id}`
        )) {
          return true;
        }
        return false;
      });

      // Toplam cihaz sayısını hesapla
      const toplamCihaz = relatedCustomers.reduce((sum, customer) => {
        const assignment = customer.bankDeviceAssignments?.find(
          a => a.bankId === def.id || 
               a.bankId === `bank-${def.id}` || 
               a.bankId === `ok-epk-${def.id}` || 
               a.bankId === `ok-ok-${def.id}`
        );
        return sum + (assignment?.deviceIds?.length || 0);
      }, 0);

      return {
        name: def.name,
        toplamUiy: relatedCustomers.length,
        toplamCihaz
      };
    });

    // En az 1 ÜİY'si olan bankaları filtrele ve toplam cihaz sayısına göre sırala
    const filteredBankaStats = bankaStats
      .filter(b => b.toplamUiy > 0)
      .sort((a, b) => b.toplamCihaz - a.toplamCihaz);

    // Genel toplamları hesapla
    const genelToplam = {
      toplamUiy: filteredBankaStats.reduce((sum, b) => sum + b.toplamUiy, 0),
      toplamCihaz: filteredBankaStats.reduce((sum, b) => sum + b.toplamCihaz, 0)
    };

    return {
      bankalar: filteredBankaStats,
      genelToplam
    };
  }, [bankPFRecords, banks, epkList, okList, customers]);

  const handleShowFullList = () => {
    const allItems = uiySummaryData.bankalar.map((banka, index) => ({
      id: `bank-${index}`, // ✅ FIX: Add unique ID (using index as fallback since no ID field)
      label: banka.name,
      value: `${banka.toplamCihaz} cihaz`,
      badge: `${banka.toplamUiy} ÜİY`,
    }));
    
    setModalData({
      title: 'ÜİY İcmal Tablosu - Tüm Liste',
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              ÜİY İcmal Tablosu
            </CardTitle>
            <CardDescription>
              Banka/PF bazında toplam ÜİY ve cihaz sayıları
            </CardDescription>
          </div>
          {uiySummaryData.bankalar.length > 6 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowFullList}
              className="h-8 gap-1"
            >
              <ExternalLink size={14} />
              <span className="text-xs">Tümünü Göster ({uiySummaryData.bankalar.length})</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border-r-2 border-gray-300">
                  Banka/PF Adı
                </TableHead>
                <TableHead className="text-center bg-blue-50 border-r">
                  Toplam ÜİY
                </TableHead>
                <TableHead className="text-center bg-blue-50">
                  Toplam Cihaz
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uiySummaryData.bankalar.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    Henüz ÜİY verisi bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {uiySummaryData.bankalar.slice(0, 6).map((banka, index) => (
                    <TableRow 
                      key={banka.name || `bank-${index}`}
                      className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'}
                    >
                      <TableCell className="border-r-2 border-gray-300">
                        {banka.name}
                      </TableCell>
                      <TableCell className="text-center text-blue-700 border-r">
                        {banka.toplamUiy}
                      </TableCell>
                      <TableCell className="text-center text-blue-700">
                        {banka.toplamCihaz}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* GENEL TOPLAM */}
                  <TableRow className="bg-blue-100 border-t-2 border-blue-400 hover:bg-blue-100">
                    <TableCell className="border-r-2 border-gray-300">
                      <strong>Genel Toplam</strong>
                    </TableCell>
                    <TableCell className="text-center border-r">
                      <strong className="text-blue-700">{uiySummaryData.genelToplam.toplamUiy}</strong>
                    </TableCell>
                    <TableCell className="text-center">
                      <strong className="text-blue-700">{uiySummaryData.genelToplam.toplamCihaz}</strong>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Not */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>📊 Not:</strong> Bu tablo, en az 1 ÜİY'si olan Banka/PF kayıtlarını gösterir. 
            Toplam cihaz sayısına göre sıralıdır. Detaylı rapor için Raporlar modülüne bakınız.
          </p>
        </div>
      </CardContent>
    </Card>
    </>
  );
}