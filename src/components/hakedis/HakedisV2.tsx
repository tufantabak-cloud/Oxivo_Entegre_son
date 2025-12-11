/**
 * HAKEDİŞ V2 - ANA COMPONENT
 * Minimal, temiz, Supabase-first yaklaşım
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useHakedisV2 } from '../../hooks/useHakedisV2';
import { HakedisV2Record } from './types';
import { TabelaRecord, TabelaGroup } from '../TabelaTab';
import { calculateHakedis, formatCurrency, formatNumber, generateHakedisDetayRows } from './calculations';

interface HakedisV2Props {
  firmaId: string;
  kurumAdi: string;
  tabelaRecords?: TabelaRecord[];
  tabelaGroups?: TabelaGroup[];
  hakedisRecords?: HakedisV2Record[]; // Opsiyonel: Parent'tan gelen
  onHakedisRecordsChange?: (records: HakedisV2Record[]) => void; // Callback
  earnings?: any[]; // Global state (kullanılmayacak)
  onEarningsChange?: (earnings: any[]) => void; // Global callback (kullanılmayacak)
}

export function HakedisV2({ 
  firmaId, 
  kurumAdi,
  tabelaRecords = [],
  tabelaGroups = [],
  hakedisRecords,
  onHakedisRecordsChange
}: HakedisV2Props) {
  const { 
    hakedisler, 
    loading, 
    error,
    createHakedis,
    updateHakedis,
    deleteHakedis,
    confirmHakedis,
    refresh 
  } = useHakedisV2(firmaId);

  const [view, setView] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedHakedis, setSelectedHakedis] = useState<HakedisV2Record | null>(null);

  // 📊 Liste Görünümü
  if (view === 'list') {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📊 Hakediş Yönetimi V2 - {kurumAdi}
            {loading && <RefreshCw className="size-4 animate-spin text-blue-500" />}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className="size-4 mr-2" />
              Yenile
            </Button>
            <Button 
              size="sm"
              onClick={() => setView('create')}
              disabled={loading}
            >
              <Plus className="size-4 mr-2" />
              Yeni Hakediş
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Hata gösterimi */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
              ❌ Hata: {error}
            </div>
          )}

          {/* Loading state */}
          {loading && hakedisler.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Yükleniyor...
            </div>
          )}

          {/* Boş liste */}
          {!loading && hakedisler.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Henüz hakediş kaydı yok. "Yeni Hakediş" butonuna tıklayarak başlayın.
            </div>
          )}

          {/* Liste tablosu */}
          {hakedisler.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Dönem</th>
                    <th className="px-4 py-2 text-left">Grup</th>
                    <th className="px-4 py-2 text-left">Vade</th>
                    <th className="px-4 py-2 text-right">İşlem Hacmi</th>
                    <th className="px-4 py-2 text-right">Net Tutar</th>
                    <th className="px-4 py-2 text-left">Durum</th>
                    <th className="px-4 py-2 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {hakedisler.map((hakedis, index) => {
                    const hesap = calculateHakedis(hakedis, tabelaRecords, tabelaGroups);
                    return (
                      <tr key={hakedis.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2">{hakedis.donem}</td>
                        <td className="px-4 py-2 text-sm">
                          {hakedis.tabelaGroupAd || hakedis.tabelaGroupId}
                        </td>
                        <td className="px-4 py-2">{hakedis.vade}</td>
                        <td className="px-4 py-2 text-right">{formatNumber(hesap.toplamIslemHacmi)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(hesap.toplamNetTutar)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            hakedis.durum === 'Kesinleşmiş' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {hakedis.durum}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedHakedis(hakedis);
                                setView('view');
                              }}
                            >
                              Görüntüle
                            </Button>
                            {hakedis.durum === 'Taslak' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedHakedis(hakedis);
                                    setView('edit');
                                  }}
                                >
                                  Düzenle
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    if (window.confirm('Bu hakediş kaydını silmek istediğinize emin misiniz?')) {
                                      await deleteHakedis(hakedis.id);
                                    }
                                  }}
                                >
                                  Sil
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* İstatistikler */}
          {hakedisler.length > 0 && (
            <div className="mt-4 pt-4 border-t flex gap-4 text-sm text-gray-600">
              <div>
                <strong>Toplam:</strong> {hakedisler.length}
              </div>
              <div>
                <strong>Taslak:</strong> {hakedisler.filter(h => h.durum === 'Taslak').length}
              </div>
              <div>
                <strong>Kesinleşmiş:</strong> {hakedisler.filter(h => h.durum === 'Kesinleşmiş').length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 📝 Görüntüleme
  if (view === 'view' && selectedHakedis) {
    // 🆕 YENİ: Her tabela × aktif vade için satır oluştur
    const detayRows = generateHakedisDetayRows(
      tabelaRecords,
      tabelaGroups,
      selectedHakedis.islemHacmiMap || {}
    );
    
    // Kümüle toplamlar
    const toplamIslemHacmi = detayRows.reduce((sum, row) => sum + row.islemHacmi, 0);
    const toplamKazanc = detayRows.reduce((sum, row) => sum + row.kazanc, 0);
    const toplamPFPayi = detayRows.reduce((sum, row) => sum + row.pfPayiHesaplama, 0);
    const toplamOxivoPayi = detayRows.reduce((sum, row) => sum + row.oxivoPayiHesaplama, 0);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Hakediş Detayı - {selectedHakedis.donem}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-4 gap-4 pb-4 border-b">
              <div>
                <label className="text-sm text-gray-600">Dönem</label>
                <div>{selectedHakedis.donem}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Vade</label>
                <div>{selectedHakedis.vade}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Durum</label>
                <div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedHakedis.durum === 'Kesinleşmiş' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedHakedis.durum}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Grup</label>
                <div>{selectedHakedis.tabelaGroupAd}</div>
              </div>
            </div>

            {/* 🆕 EXCEL FORMATINDA HAKEDİŞ TABLOSU */}
            {detayRows.length > 0 && (
              <div>
                <h3 className="mb-3">📊 Hakediş Tablosu</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm border-collapse">
                    {/* ÇİFT SATIRLI HEADER */}
                    <thead>
                      {/* 1. Satır: Ana Başlıklar */}
                      <tr className="bg-yellow-100 border-b-2 border-gray-400">
                        <th rowSpan={2} className="px-3 py-3 border text-center">KLM</th>
                        <th rowSpan={2} className="px-3 py-3 border text-left">Grup</th>
                        <th rowSpan={2} className="px-3 py-3 border text-left">Kısa Açıklama</th>
                        <th rowSpan={2} className="px-3 py-3 border text-left">Ürün</th>
                        <th rowSpan={2} className="px-3 py-3 border text-left">Gelir Modeli</th>
                        <th rowSpan={2} className="px-3 py-3 border text-center">Kart Tipi</th>
                        <th rowSpan={2} className="px-3 py-3 border text-center">Yurt İçi/Dışı</th>
                        <th rowSpan={2} className="px-3 py-3 border text-center">Vade</th>
                        <th rowSpan={2} className="px-3 py-3 border text-center">Tabela Oranları</th>
                        <th rowSpan={2} className="px-3 py-3 border text-right bg-white">İşlem Hacmi</th>
                        <th rowSpan={2} className="px-3 py-3 border text-right bg-blue-100">Kazanç (TL)</th>
                        <th colSpan={2} className="px-3 py-3 border text-center bg-blue-200">PF Payı</th>
                        <th colSpan={2} className="px-3 py-3 border text-center bg-purple-200">OXIVO Payı</th>
                      </tr>
                      {/* 2. Satır: Alt Başlıklar */}
                      <tr className="bg-yellow-50 border-b-2 border-gray-400">
                        <th className="px-3 py-2 border text-center bg-yellow-100">Kuruluş %</th>
                        <th className="px-3 py-2 border text-right bg-blue-100">Hesaplama (TL)</th>
                        <th className="px-3 py-2 border text-center bg-yellow-100">OXIVO %</th>
                        <th className="px-3 py-2 border text-right bg-purple-100">Hesaplama (TL)</th>
                      </tr>
                    </thead>
                    
                    <tbody>
                      {detayRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 border-b">
                          <td className="px-3 py-2 border text-center bg-yellow-50">{idx + 1}</td>
                          <td className="px-3 py-2 border bg-yellow-50">{row.grupAdi}</td>
                          <td className="px-3 py-2 border bg-yellow-50">{row.kisaAciklama}</td>
                          <td className="px-3 py-2 border bg-yellow-50">{row.urun}</td>
                          <td className="px-3 py-2 border bg-yellow-50">{row.gelirModeli}</td>
                          <td className="px-3 py-2 border text-center bg-yellow-50">{row.kartTipi}</td>
                          <td className="px-3 py-2 border text-center bg-yellow-50">{row.yurtIciDisi}</td>
                          <td className="px-3 py-2 border text-center bg-yellow-50">{row.vade}</td>
                          <td className="px-3 py-2 border text-center bg-yellow-50">{row.tabelaOrani}</td>
                          <td className="px-3 py-2 border text-right">{formatNumber(row.islemHacmi)}</td>
                          <td className="px-3 py-2 border text-right bg-blue-50">{formatCurrency(row.kazanc)}</td>
                          <td className="px-3 py-2 border text-center bg-yellow-50">%{row.kurulusOrani.toFixed(2)}</td>
                          <td className="px-3 py-2 border text-right bg-blue-100">{formatCurrency(row.pfPayiHesaplama)}</td>
                          <td className="px-3 py-2 border text-center bg-yellow-50">%{row.oxivoOrani.toFixed(2)}</td>
                          <td className="px-3 py-2 border text-right bg-purple-100">{formatCurrency(row.oxivoPayiHesaplama)}</td>
                        </tr>
                      ))}
                      
                      {/* KÜMÜLE TOPLAMLAR */}
                      <tr className="bg-gradient-to-r from-blue-200 to-purple-200 border-t-2 border-gray-500">
                        <td colSpan={9} className="px-3 py-3 border text-right">
                          <strong>KÜMÜLE TOPLAMLAR:</strong>
                        </td>
                        <td className="px-3 py-3 border text-right bg-gray-100">
                          <strong>{formatNumber(toplamIslemHacmi)}</strong>
                        </td>
                        <td className="px-3 py-3 border text-right bg-blue-200">
                          <strong>{formatCurrency(toplamKazanc)}</strong>
                        </td>
                        <td className="px-3 py-3 border"></td>
                        <td className="px-3 py-3 border text-right bg-blue-300">
                          <strong>{formatCurrency(toplamPFPayi)}</strong>
                        </td>
                        <td className="px-3 py-3 border"></td>
                        <td className="px-3 py-3 border text-right bg-purple-300">
                          <strong>{formatCurrency(toplamOxivoPayi)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Açıklama Notları */}
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700 space-y-1">
                  <div><strong>🟨 Sarı Hücreler:</strong> TABELA kaydından gelen veriler</div>
                  <div><strong>⚪ Beyaz Hücreler:</strong> Kullanıcı manuel girişi (İşlem Hacmi)</div>
                  <div><strong>🟦 Mavi Hücreler:</strong> Otomatik hesaplanan (PF tarafı)</div>
                  <div><strong>🟪 Mor Hücreler:</strong> Otomatik hesaplanan (OXIVO tarafı)</div>
                  <div className="pt-2 border-t mt-2">
                    <strong>Formüller:</strong>
                  </div>
                  <div>• <strong>Kazanç (Gelir Ortaklığı):</strong> İşlem Hacmi × Satış TL</div>
                  <div>• <strong>Kazanç (Sabit Komisyon):</strong> İşlem Hacmi × (Komisyon % / 100)</div>
                  <div>• <strong>PF Payı Hesaplama:</strong> Kazanç × (Kuruluş % / 100)</div>
                  <div>• <strong>OXIVO Payı Hesaplama:</strong> Kazanç × (OXIVO % / 100)</div>
                </div>
              </div>
            )}

            {/* Boş durum */}
            {detayRows.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded">
                Bu hakediş için henüz işlem hacmi girişi yapılmamış.
              </div>
            )}

            {selectedHakedis.notlar && (
              <div>
                <label className="text-sm text-gray-600">Notlar</label>
                <div className="bg-gray-50 p-3 rounded mt-1">{selectedHakedis.notlar}</div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => setView('list')}>Listeye Dön</Button>
              {selectedHakedis.durum === 'Taslak' && (
                <Button
                  variant="outline"
                  onClick={() => setView('edit')}
                >
                  Düzenle
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🆕 Oluşturma veya ✏️ Düzenleme
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {view === 'create' ? '🆕 Yeni Hakediş' : '✏️ Hakediş Düzenle'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          Form bileşeni geliştirilme aşamasında...
          <br />
          <Button 
            className="mt-4"
            onClick={() => setView('list')}
          >
            Listeye Dön
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}