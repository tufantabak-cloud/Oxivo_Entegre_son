import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { BankPF } from './BankPFModule';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';

interface TabelaSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankPFRecords: BankPF[];
}

interface SimulationResult {
  firmaId: string;
  firmaAdi: string;
  firmaTipi: 'Banka' | 'PF';
  aktifTabelaSayisi: number;
  ortalamaAlis: number;
  ortalamaSatis: number;
  toplamKar: number;
  karMarji: number;
  tabelaDetaylari: {
    kurulusAdi: string;
    kartTipi: string;
    gelirModeli: string;
    alis: number;
    satis: number;
    kar: number;
  }[];
}

export function TabelaSimulationDialog({ 
  open, 
  onOpenChange, 
  bankPFRecords 
}: TabelaSimulationDialogProps) {
  const [tutar, setTutar] = useState<string>('100000');
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [expandedFirms, setExpandedFirms] = useState<Set<string>>(new Set());

  const hesaplaSimulasyon = () => {
    if (!tutar || parseFloat(tutar) <= 0) {
      toast.error('Lütfen geçerli bir tutar giriniz!');
      return;
    }

    const tutarSayisal = parseFloat(tutar);
    const results: SimulationResult[] = [];

    bankPFRecords.forEach(firma => {
      // Sadece aktif ve kapanmamış TABELA kayıtlarını al
      const aktifTabelalar = (firma.tabelaRecords || []).filter(
        tr => tr.aktif && !tr.kapanmaTarihi && !tr.ekGelirDetay
      );

      if (aktifTabelalar.length === 0) return;

      let toplamAlis = 0;
      let toplamSatis = 0;
      let toplamKar = 0;
      let gecerliTabelaSayisi = 0;
      const tabelaDetaylari: SimulationResult['tabelaDetaylari'] = [];

      aktifTabelalar.forEach(tabela => {
        // Gelir Ortaklığı modelinde alış-satış var
        if (tabela.gelirModeli.ad === 'Gelir Ortaklığı') {
          // Aktif komisyon oranlarını al
          const aktifVadeler = tabela.komisyonOranları.filter(k => k.aktif);
          
          aktifVadeler.forEach(vade => {
            const alis = parseFloat(String(vade.alisTL || '0'));
            const satis = parseFloat(String(vade.satisTL || '0'));
            
            if (alis > 0 && satis > 0) {
              // İşlem sayısı hesapla (tutar / satis)
              const islemSayisi = tutarSayisal / satis;
              const karTL = (satis - alis) * islemSayisi;
              
              toplamAlis += alis * islemSayisi;
              toplamSatis += satis * islemSayisi;
              toplamKar += karTL;
              gecerliTabelaSayisi++;

              tabelaDetaylari.push({
                kurulusAdi: tabela.kurulus.ad,
                kartTipi: `${tabela.kartTipi} - ${vade.vade}`,
                gelirModeli: tabela.gelirModeli.ad,
                alis: alis,
                satis: satis,
                kar: satis - alis
              });
            }
          });
        } 
        // Sabit Komisyon modelinde yüzde bazlı hesaplama
        else if (tabela.gelirModeli.ad === 'Sabit Komisyon') {
          const aktifVadeler = tabela.komisyonOranları.filter(k => k.aktif);
          
          aktifVadeler.forEach(vade => {
            const komisyonYuzde = parseFloat(vade.oran || '0');
            
            if (komisyonYuzde > 0) {
              const komisyonTL = (tutarSayisal * komisyonYuzde) / 100;
              
              // Kuruluş ve Oxivo paylaşım oranlarını uygula
              const kurulusOrani = parseFloat(tabela.paylaşımOranları?.kurulusOrani || '0');
              const oxivoOrani = parseFloat(tabela.paylaşımOranları?.oxivoOrani || '0');
              
              const oxivoKazanc = (komisyonTL * oxivoOrani) / 100;
              
              toplamKar += oxivoKazanc;
              gecerliTabelaSayisi++;

              tabelaDetaylari.push({
                kurulusAdi: tabela.kurulus.ad,
                kartTipi: `${tabela.kartTipi} - ${vade.vade}`,
                gelirModeli: `${tabela.gelirModeli.ad} (${komisyonYuzde}%)`,
                alis: 0,
                satis: tutarSayisal,
                kar: oxivoKazanc
              });
            }
          });
        }
        // Hazine Geliri modeli
        else if (tabela.gelirModeli.ad === 'Hazine Geliri' && tabela.hazineGeliri) {
          const hazineTutar = parseFloat(tabela.hazineGeliri.tutarTL || '0');
          const oxivoYuzde = parseFloat(tabela.hazineGeliri.oxivoYuzde || '0');
          const kazanc = parseFloat(tabela.hazineGeliri.kazancTL || '0');
          
          if (kazanc > 0) {
            // Orantısal hesaplama
            const carpan = tutarSayisal / (hazineTutar || 1);
            const oranliKazanc = kazanc * carpan;
            
            toplamKar += oranliKazanc;
            gecerliTabelaSayisi++;

            tabelaDetaylari.push({
              kurulusAdi: tabela.kurulus.ad,
              kartTipi: tabela.kartTipi,
              gelirModeli: `${tabela.gelirModeli.ad} (${oxivoYuzde}%)`,
              alis: 0,
              satis: tutarSayisal,
              kar: oranliKazanc
            });
          }
        }
      });

      if (gecerliTabelaSayisi > 0) {
        const ortalamaAlis = toplamAlis / gecerliTabelaSayisi;
        const ortalamaSatis = toplamSatis / gecerliTabelaSayisi;
        const karMarji = ortalamaSatis > 0 ? ((toplamKar / toplamSatis) * 100) : 0;

        results.push({
          firmaId: firma.id,
          firmaAdi: firma.firmaUnvan,
          firmaTipi: firma.firmaTipi,
          aktifTabelaSayisi: gecerliTabelaSayisi,
          ortalamaAlis,
          ortalamaSatis,
          toplamKar,
          karMarji,
          tabelaDetaylari
        });
      }
    });

    // Kar bazında sırala (yüksekten düşüğe)
    results.sort((a, b) => b.toplamKar - a.toplamKar);

    setSimulationResults(results);
    setShowResults(true);

    if (results.length === 0) {
      toast.warning('Hesaplanabilir TABELA kaydı bulunamadı!');
    } else {
      toast.success(`${results.length} firma için karlılık hesaplandı!`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `%${value.toFixed(2)}`;
  };

  const resetSimulation = () => {
    setShowResults(false);
    setSimulationResults([]);
    setExpandedFirms(new Set());
  };

  const toggleFirmaExpand = (firmaId: string) => {
    const newExpanded = new Set(expandedFirms);
    if (newExpanded.has(firmaId)) {
      newExpanded.delete(firmaId);
    } else {
      newExpanded.add(firmaId);
    }
    setExpandedFirms(newExpanded);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-screen h-screen max-h-screen overflow-y-auto p-6 rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            TABELA Karlılık Simülasyonu
          </DialogTitle>
          <DialogDescription>
            Belirli bir işlem tutarı için tüm firmaların karlılığını karşılaştırın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Bölümü */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="tutar">İşlem Tutarı (TL)</Label>
                  <Input
                    id="tutar"
                    type="number"
                    value={tutar}
                    onChange={(e) => setTutar(e.target.value)}
                    placeholder="100000"
                    className="mt-1.5"
                  />
                </div>
                <Button onClick={hesaplaSimulasyon} className="flex items-center gap-2">
                  <Calculator size={16} />
                  Hesapla
                </Button>
                {showResults && (
                  <Button onClick={resetSimulation} variant="outline">
                    Temizle
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sonuçlar Bölümü */}
          {showResults && simulationResults.length > 0 && (
            <div className="space-y-4">
              {/* Özet Kartlar */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">En Karlı Firma</div>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="truncate">{simulationResults[0].firmaAdi}</span>
                      </div>
                      <div className="text-green-600 mt-1">
                        {formatCurrency(simulationResults[0].toplamKar)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Toplam Kar</div>
                    <div className="mt-2">
                      <div className="text-green-600">
                        {formatCurrency(
                          simulationResults.reduce((sum, r) => sum + r.toplamKar, 0)
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Tüm firmalar
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Ortalama Kar</div>
                    <div className="mt-2">
                      <div className="text-blue-600">
                        {formatCurrency(
                          simulationResults.reduce((sum, r) => sum + r.toplamKar, 0) / 
                          simulationResults.length
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Firma başına
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Toplam Firma</div>
                    <div className="mt-2">
                      <div className="text-gray-900">
                        {simulationResults.length} firma
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {simulationResults.reduce((sum, r) => sum + r.aktifTabelaSayisi, 0)} TABELA
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Karşılaştırma Tablosu */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      Firma Karlılık Karşılaştırması
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedFirms(new Set(simulationResults.map(r => r.firmaId)))}
                        className="text-xs"
                      >
                        Tümünü Genişlet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedFirms(new Set())}
                        className="text-xs"
                      >
                        Tümünü Daralt
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="w-12">Sıra</TableHead>
                          <TableHead>Firma Adı</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead className="text-right">TABELA Sayısı</TableHead>
                          <TableHead className="text-right">Ort. Alış</TableHead>
                          <TableHead className="text-right">Ort. Satış</TableHead>
                          <TableHead className="text-right">Toplam Kar</TableHead>
                          <TableHead className="text-right">Kar Marjı</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simulationResults.map((result, index) => (
                          <Collapsible 
                            key={result.firmaId}
                            open={expandedFirms.has(result.firmaId)}
                            onOpenChange={() => toggleFirmaExpand(result.firmaId)}
                          >
                            <TableRow className="cursor-pointer hover:bg-gray-50">
                              <TableCell>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    {expandedFirms.has(result.firmaId) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  {index === 0 && (
                                    <Badge className="bg-yellow-500">1</Badge>
                                  )}
                                  {index === 1 && (
                                    <Badge className="bg-gray-400">2</Badge>
                                  )}
                                  {index === 2 && (
                                    <Badge className="bg-orange-600">3</Badge>
                                  )}
                                  {index > 2 && (
                                    <span className="text-gray-500">{index + 1}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{result.firmaAdi}</TableCell>
                              <TableCell>
                                <Badge variant={result.firmaTipi === 'Banka' ? 'default' : 'secondary'}>
                                  {result.firmaTipi}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{result.aktifTabelaSayisi}</TableCell>
                              <TableCell className="text-right">
                                {result.ortalamaAlis > 0 ? formatCurrency(result.ortalamaAlis) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {result.ortalamaSatis > 0 ? formatCurrency(result.ortalamaSatis) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={result.toplamKar > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatCurrency(result.toplamKar)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {result.karMarji > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className={result.karMarji > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatPercent(result.karMarji)}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                            
                            {/* Detay Satırları */}
                            <CollapsibleContent asChild>
                              <TableRow className="bg-gray-50/50">
                                <TableCell colSpan={9} className="p-0">
                                    <div className="px-4 py-3 border-t border-gray-200">
                                      <div className="text-sm mb-2">
                                        <span className="text-gray-600">TABELA Detayları:</span>
                                      </div>
                                      <div className="rounded-md border border-gray-200 overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="bg-gray-100">
                                              <TableHead className="text-xs">Kuruluş</TableHead>
                                              <TableHead className="text-xs">Kart Tipi</TableHead>
                                              <TableHead className="text-xs">Gelir Modeli</TableHead>
                                              <TableHead className="text-right text-xs">Alış (TL)</TableHead>
                                              <TableHead className="text-right text-xs">Satış (TL)</TableHead>
                                              <TableHead className="text-right text-xs">Kar (TL)</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {result.tabelaDetaylari.map((detay, dIndex) => (
                                              <TableRow key={dIndex} className="text-sm">
                                                <TableCell>{detay.kurulusAdi}</TableCell>
                                                <TableCell>{detay.kartTipi}</TableCell>
                                                <TableCell>{detay.gelirModeli}</TableCell>
                                                <TableCell className="text-right">
                                                  {detay.alis > 0 ? formatCurrency(detay.alis) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {formatCurrency(detay.satis)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <span className={detay.kar > 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {formatCurrency(detay.kar)}
                                                  </span>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {showResults && simulationResults.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  Hesaplanabilir TABELA kaydı bulunamadı.
                  <br />
                  Lütfen Gelir Ortaklığı modelinde alış-satış oranları tanımlı kayıtlar ekleyin.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}