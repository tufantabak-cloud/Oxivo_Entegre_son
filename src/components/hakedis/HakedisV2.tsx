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
import { calculateHakedis, formatCurrency, formatNumber } from './calculations';

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
                    const hesap = calculateHakedis(hakedis);
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
    // Hesaplamaları yap
    const hesaplama = calculateHakedis(selectedHakedis);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Hakediş Detayı - {selectedHakedis.donem}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
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

            {/* İşlem Hacmi Detayları */}
            {hesaplama.tabelaDetaylar.length > 0 && (
              <div>
                <h3 className="mb-3">📊 İşlem Hacmi Detayları</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border">Tabela</th>
                        <th className="px-3 py-2 text-right border">İşlem Hacmi</th>
                        <th className="px-3 py-2 text-right border">Kom. Oranı</th>
                        <th className="px-3 py-2 text-right border">Komisyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hesaplama.tabelaDetaylar.map((detay, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border">{detay.tabelaAd}</td>
                          <td className="px-3 py-2 text-right border">{formatNumber(detay.hacim)}</td>
                          <td className="px-3 py-2 text-right border">%{detay.komisyonOrani.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right border">{formatCurrency(detay.komisyon)}</td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50">
                        <td className="px-3 py-2 border">TOPLAM</td>
                        <td className="px-3 py-2 text-right border">{formatNumber(hesaplama.toplamIslemHacmi)}</td>
                        <td className="px-3 py-2 border"></td>
                        <td className="px-3 py-2 text-right border">{formatCurrency(hesaplama.toplamKomisyon)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Finansal Hesaplamalar */}
            <div className="grid grid-cols-2 gap-6">
              {/* PF Tarafı */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="mb-3">💳 PF Tarafı</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Komisyon:</span>
                    <span>{formatCurrency(hesaplama.toplamKomisyon)}</span>
                  </div>
                  {hesaplama.ekGelirPF > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Ek Gelir:</span>
                      <span>+ {formatCurrency(hesaplama.ekGelirPF)}</span>
                    </div>
                  )}
                  {hesaplama.ekKesintiPF > 0 && (
                    <div className="flex justify-between text-red-700">
                      <span>Kesinti:</span>
                      <span>- {formatCurrency(hesaplama.ekKesintiPF)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Brüt Tutar:</span>
                    <span>{formatCurrency(hesaplama.brutTutarPF)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KDV (%20):</span>
                    <span>{formatCurrency(hesaplama.kdvPF)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <strong>Net Tutar:</strong>
                    <strong>{formatCurrency(hesaplama.netTutarPF)}</strong>
                  </div>
                </div>
              </div>

              {/* OXİVO Tarafı */}
              <div className="border rounded-lg p-4 bg-purple-50">
                <h3 className="mb-3">🎯 OXİVO Tarafı</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Brüt Tutar:</span>
                    <span>{formatCurrency(hesaplama.brutTutarOXIVO)}</span>
                  </div>
                  {hesaplama.ekGelirOXIVO > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Ek Gelir:</span>
                      <span>+ {formatCurrency(hesaplama.ekGelirOXIVO)}</span>
                    </div>
                  )}
                  {hesaplama.ekKesintiOXIVO > 0 && (
                    <div className="flex justify-between text-red-700">
                      <span>Kesinti:</span>
                      <span>- {formatCurrency(hesaplama.ekKesintiOXIVO)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span>KDV (%20):</span>
                    <span>{formatCurrency(hesaplama.kdvOXIVO)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <strong>Net Tutar:</strong>
                    <strong>{formatCurrency(hesaplama.netTutarOXIVO)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Genel Toplam */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg">💰 TOPLAM NET TUTAR</h3>
                <div className="text-2xl">{formatCurrency(hesaplama.toplamNetTutar)}</div>
              </div>
            </div>

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