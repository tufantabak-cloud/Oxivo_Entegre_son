// Banka/PF Özet Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Building2, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { BankPF } from '../BankPFModule';
import type { Bank, EPK, OK } from '../DefinitionsModule';
import { FullListModal } from './FullListModal';

interface BankPFSummaryWidgetProps {
  bankPFRecords: BankPF[];
  banks: Bank[];
  epkList: EPK[];
  okList: OK[];
}

export function BankPFSummaryWidget({
  bankPFRecords,
  banks,
  epkList,
  okList,
}: BankPFSummaryWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });
  
  // Toplam kayıt sayıları
  const totalRecords = bankPFRecords.length;
  const activeRecords = bankPFRecords.filter((r) => r.durum === 'Aktif').length;
  const inactiveRecords = bankPFRecords.filter((r) => r.durum === 'Pasif').length;

  // Kategori dağılımı
  const recordsByCategory = {
    banka: bankPFRecords.filter((r) => r.kategori === 'Banka').length,
    pf: bankPFRecords.filter((r) => r.kategori === 'Ödeme Kuruluşu').length,
    efk: bankPFRecords.filter((r) => r.kategori === 'Elektronik Para Kuruluşu').length,
  };

  // Tabela kayıtları
  const recordsWithTabela = bankPFRecords.filter(
    (r) => r.tabelaRecords && r.tabelaRecords.length > 0
  ).length;
  const totalTabelaGroups = bankPFRecords.reduce(
    (sum, r) => sum + (r.tabelaRecords?.length || 0),
    0
  );

  // Cihaz sayıları
  const totalDevices = bankPFRecords.reduce((sum, r) => {
    return (
      sum +
      (r.tabelaRecords?.reduce((tSum, t) => {
        return tSum + (t.toplamCihazSayisi || 0);
      }, 0) || 0)
    );
  }, 0);

  // En çok tabela grubuna sahip firmalar
  const allFirmsWithTabela = bankPFRecords
    .map((r) => ({
      name: r.kurulusAdi,
      tabelaCount: r.tabelaRecords?.length || 0,
      deviceCount: r.tabelaRecords?.reduce((sum, t) => sum + (t.toplamCihazSayisi || 0), 0) || 0,
    }))
    .filter((r) => r.tabelaCount > 0)
    .sort((a, b) => b.tabelaCount - a.tabelaCount);
  
  const topFirmsWithTabela = allFirmsWithTabela.slice(0, 6);

  const handleShowFullList = () => {
    const allItems = allFirmsWithTabela.map((firm, index) => ({
      label: firm.name,
      value: `${firm.deviceCount.toLocaleString('tr-TR')} cihaz`,
      badge: `${firm.tabelaCount} grup`,
    }));
    
    setModalData({
      title: 'En Fazla Tabela Grubuna Sahip Firmalar - Tüm Liste',
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
            <Building2 className="text-purple-600" size={20} />
            Banka/PF Özeti
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{totalRecords}</div>
                <div className="text-xs text-gray-600 mt-1">Toplam Kuruluş</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{activeRecords}</div>
                <div className="text-xs text-gray-600 mt-1">Aktif</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-600">{inactiveRecords}</div>
                <div className="text-xs text-gray-600 mt-1">Pasif</div>
              </div>
            </div>

            {/* Kategori Dağılımı - Card Bazlı */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Kategori Dağılımı</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <span className="text-sm font-medium">Banka</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-purple-700">{recordsByCategory.banka}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalRecords > 0 ? Math.round((recordsByCategory.banka / totalRecords) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <span className="text-sm font-medium">Ödeme Kuruluşu</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700">{recordsByCategory.pf}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalRecords > 0 ? Math.round((recordsByCategory.pf / totalRecords) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50">
                  <span className="text-sm font-medium">Elektronik Para Kuruluşu</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-700">{recordsByCategory.efk}</span>
                    <Badge variant="outline" className="min-w-[50px] justify-center">
                      {totalRecords > 0 ? Math.round((recordsByCategory.efk / totalRecords) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela Özeti */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Tabela Durumu</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{recordsWithTabela}</div>
                  <div className="text-xs text-gray-600 mt-1">Tabelalı Firma</div>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{totalTabelaGroups}</div>
                  <div className="text-xs text-gray-600 mt-1">Tabela Grubu</div>
                </div>
                <div className="text-center p-3 bg-cyan-50 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-600">{totalDevices.toLocaleString('tr-TR')}</div>
                  <div className="text-xs text-gray-600 mt-1">Toplam Cihaz</div>
                </div>
              </div>
            </div>

            {/* En Fazla Tabela Grubuna Sahip Firmalar */}
            {topFirmsWithTabela.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    En Fazla Tabela Grubuna Sahip 6 Firma
                  </h4>
                  {allFirmsWithTabela.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShowFullList}
                      className="h-8 gap-1"
                    >
                      <ExternalLink size={14} />
                      <span className="text-xs">Tümünü Göster ({allFirmsWithTabela.length})</span>
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {topFirmsWithTabela.map((firm, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[180px]">
                          {firm.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {firm.tabelaCount} grup
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {firm.deviceCount.toLocaleString('tr-TR')} cihaz
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
    </>
  );
}
