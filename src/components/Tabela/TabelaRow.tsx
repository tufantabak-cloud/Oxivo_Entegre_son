// TABELA Kayıt Satırı Bileşeni
import React from 'react';
import { Button } from '../ui/button';
import { TableCell, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Pencil, Trash2, XCircle } from 'lucide-react';
import { TabelaRowProps } from './types';
import { kisaltUrunAdi } from '../../utils/formatters';

export function TabelaRow({
  record,
  vadeListesi,
  onEdit,
  onDelete,
  onToggleStatus,
  onClose,
  group,
  isGrouped,
  rowSpan = 1,
  isFirstInGroup = false,
}: TabelaRowProps) {
  // Aktif vadeleri al - Her vade için ayrı satır oluştur
  const activeVadeler = record.komisyonOranları.filter(ko => ko.aktif !== false);
  if (activeVadeler.length === 0) {
    activeVadeler.push({ vade: '-', oran: '0', aktif: true });
  }

  // Grup adının kısaltması (ilk kelime)
  const getGroupAbbreviation = (groupName: string): string => {
    const words = groupName.trim().split(/\s+/);
    return words[0] || '';
  };

  return (
    <>
      {activeVadeler.map((vadeInfo, vadeIndex) => {
        const isFirstRow = vadeIndex === 0;

        return (
          <TableRow
            key={`${record.id}-vade-${vadeIndex}`}
            className={`hover:bg-gray-50 ${isGrouped ? 'bg-blue-50/20' : ''}`}
          >
            {/* İlk satırda gösterilecek sütunlar (rowSpan ile) */}
            {isFirstRow && (
              <>
                {/* KLM - İlk sütun */}
                <TableCell className="py-2 w-16" rowSpan={activeVadeler.length}>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-mono text-xs">
                    {String(rowSpan).padStart(2, '0')}
                  </Badge>
                </TableCell>
                {/* Grup */}
                <TableCell className="py-2 w-32" rowSpan={activeVadeler.length}>
                  {isGrouped && group ? (
                    <Badge variant="default" className="bg-blue-600 text-white">
                      {getGroupAbbreviation(group.name)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                {/* Kısa Açıklama */}
                <TableCell className="py-2 w-36" rowSpan={activeVadeler.length}>
                  {record.kisaAciklama ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                      {record.kisaAciklama}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                {/* Ürün */}
                <TableCell className="py-2 w-40" rowSpan={activeVadeler.length}>
                  {record.urun ? (
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                      {kisaltUrunAdi(record.urun)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                {/* Gelir Modeli */}
                <TableCell className="py-2 w-36" rowSpan={activeVadeler.length}>
                  <div className="flex items-center gap-2">
                    <span>{record.gelirModeli.ad}</span>
                    {record.gelirModeli.ad?.toLowerCase().includes('paçal') && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                        Auto
                      </Badge>
                    )}
                    {record.ekGelirDetay && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                        {record.ekGelirDetay.gelirTuru}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {/* Yurt İçi/Dışı */}
                <TableCell className="py-2 w-32" rowSpan={activeVadeler.length}>
                  <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'}>
                    {record.yurtIciDisi}
                  </Badge>
                </TableCell>
                {/* Kart Tipi */}
                <TableCell className="py-2 w-24" rowSpan={activeVadeler.length}>
                  <Badge
                    variant={record.kartTipi === 'Credit' ? 'default' : record.kartTipi === 'Debit' ? 'secondary' : 'outline'}
                    className={record.kartTipi?.includes('Paçal') ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
                  >
                    {record.kartTipi?.replace(' (Tüm Kart Tipleri)', '') || record.kartTipi}
                  </Badge>
                </TableCell>
              </>
            )}

            {/* Her vade satırında gösterilecek sütunlar */}
            {/* Vade */}
            <TableCell className="py-2 w-20">
              <div className="text-xs text-blue-700">
                {vadeInfo.vade.replace(' (Peşin)', '')}
              </div>
            </TableCell>
            {/* Oran */}
            <TableCell className="py-2 w-40">
              <div className="text-xs space-y-0.5">
                {record.gelirModeli.ad === 'Hazine Geliri' ? (
                  <>
                    <div className="text-gray-500">Kazanç:</div>
                    <div className="text-blue-700">{parseFloat(record.hazineGeliri?.kazancTL || '0').toFixed(2)}₺</div>
                  </>
                ) : record.gelirModeli.ad === 'Gelir Ortaklığı' ? (
                  <>
                    <div className="text-gray-500">Alış: <span className="text-red-600">{parseFloat(vadeInfo.alisTL || '0').toFixed(2)}</span></div>
                    <div className="text-gray-500">Satış: <span className="text-green-600">{parseFloat(vadeInfo.satisTL || '0').toFixed(2)}</span></div>
                    <div className="text-gray-500">Kar: <span className="text-blue-600">{parseFloat(vadeInfo.karTL || '0').toFixed(2)}</span></div>
                  </>
                ) : (
                  <div className="text-blue-700">
                    %{vadeInfo.oran}
                  </div>
                )}
              </div>
            </TableCell>

            {/* İlk satırda gösterilecek diğer sütunlar (rowSpan ile) */}
            {isFirstRow && (
              <>
                {/* Paylaşım */}
                <TableCell className="py-2 w-36" rowSpan={activeVadeler.length}>
                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2 bg-green-50 px-2 py-2 rounded">
                      <span className="text-gray-700">{record.kurulus.ad}</span>
                      <span className="text-green-700">%{record.paylaşımOranları.kurulusOrani}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-blue-50 px-2 py-2 rounded">
                      <span className="text-gray-700">OXİVO</span>
                      <span className="text-blue-700">%{record.paylaşımOranları.oxivoOrani}</span>
                    </div>
                  </div>
                </TableCell>
                {/* Oluşturma */}
                <TableCell className="py-2 w-36" rowSpan={activeVadeler.length}>
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">📅</span>
                      <span>{record.olusturmaTarihi}</span>
                    </div>
                    {record.kapanmaTarihi && (
                      <div className="flex items-center gap-1 mt-1 text-orange-600">
                        <span>🔒</span>
                        <span>{record.kapanmaTarihi}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {record.aciklama && (
                        <Badge variant="outline" className="text-xs">
                          📝
                        </Badge>
                      )}
                      {record.fotograf && (
                        <Badge variant="outline" className="text-xs">
                          📷
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                {/* İşlemler */}
                <TableCell className="py-2 w-32" rowSpan={activeVadeler.length} onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-2">
                    {record.aktif ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 h-8 px-3"
                        onClick={() => onEdit(record)}
                      >
                        <Pencil size={14} className="mr-1" />
                        Düzenle
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 border-orange-300 text-orange-600"
                        onClick={() => onEdit(record)}
                      >
                        <Pencil size={14} className="mr-1" />
                        Görüntüle
                      </Button>
                    )}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(record.id)}
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </Button>
                      {record.aktif && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={() => onClose(record)}
                          title="Anlaşmayı Kapat"
                        >
                          <XCircle size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
              </>
            )}
          </TableRow>
        );
      })}
    </>
  );
}
