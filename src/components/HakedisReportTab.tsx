import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FilterDropdown, FilterOption } from './FilterDropdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FileDown, Calculator, TrendingUp, DollarSign, Calendar, Building2, Filter, PieChart, X } from 'lucide-react';
import { BankPF, HakedisRecord } from './BankPFModule';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

interface HakedisReportTabProps {
  bankPFRecords: BankPF[];
}

// Dönem formatla (YYYY-MM -> Ocak 2025)
const formatDonem = (donem: string) => {
  const [year, month] = donem.split('-');
  const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${aylar[parseInt(month) - 1]} ${year}`;
};

export function HakedisReportTab({ bankPFRecords }: HakedisReportTabProps) {
  const [selectedPF, setSelectedPF] = useState<string>('all');
  const [selectedDonem, setSelectedDonem] = useState<string>('all');
  const [selectedDurum, setSelectedDurum] = useState<string>('all');
  
  // Tablo içi filtreler
  const [tablePFFilter, setTablePFFilter] = useState<string>('');
  const [tableDonemFilter, setTableDonemFilter] = useState<string>('');
  const [tableTabelaGrupFilter, setTableTabelaGrupFilter] = useState<string>('');
  const [tableIslemHacmiMin, setTableIslemHacmiMin] = useState<string>('');
  const [tableIslemHacmiMax, setTableIslemHacmiMax] = useState<string>('');
  const [tablePFPayiMin, setTablePFPayiMin] = useState<string>('');
  const [tablePFPayiMax, setTablePFPayiMax] = useState<string>('');
  const [tableOxivoPayiMin, setTableOxivoPayiMin] = useState<string>('');
  const [tableOxivoPayiMax, setTableOxivoPayiMax] = useState<string>('');
  const [tableDurumFilter, setTableDurumFilter] = useState<string>('all');
  const [tableTarihBaslangic, setTableTarihBaslangic] = useState<string>('');
  const [tableTarihBitis, setTableTarihBitis] = useState<string>('');

  // Tüm hakediş kayıtlarını topla ve PF bilgisiyle birleştir
  const allHakedisRecords = useMemo(() => {
    return bankPFRecords.flatMap(pf => 
      (pf.hakedisRecords || []).map(hakediş => ({
        ...hakediş,
        pfId: pf.id,
        pfUnvan: pf.firmaUnvan,
        pfTip: pf.bankaOrPF === 'PF' ? pf.odemeKurulusuTipi : 'Banka'
      }))
    );
  }, [bankPFRecords]);

  // Filtrelenmiş hakediş kayıtları (üst filtreler + tablo içi filtreler)
  const filteredHakedisRecords = useMemo(() => {
    return allHakedisRecords.filter(h => {
      // Üst filtreler (dropdown'lar)
      if (selectedPF !== 'all' && h.pfId !== selectedPF) return false;
      if (selectedDonem !== 'all' && h.donem !== selectedDonem) return false;
      if (selectedDurum !== 'all' && h.durum !== selectedDurum) return false;
      
      // Tablo içi filtreler - text bazlı
      // PF filtresi
      if (tablePFFilter && tablePFFilter.trim()) {
        if (!h.pfUnvan?.toLowerCase().includes(tablePFFilter.toLowerCase())) {
          return false;
        }
      }
      
      // Dönem filtresi
      if (tableDonemFilter && tableDonemFilter.trim()) {
        if (!h.donem?.includes(tableDonemFilter)) {
          return false;
        }
      }
      
      // TABELA Grubu filtresi
      if (tableTabelaGrupFilter && tableTabelaGrupFilter.trim()) {
        const pf = bankPFRecords.find(p => p.id === h.pfId);
        const tabelaGroup = pf?.tabelaGroups?.find(g => g.id === h.tabelaGroupId);
        const displayGroupName = tabelaGroup?.name || h.tabelaGroupAd;
        if (!displayGroupName?.toLowerCase().includes(tableTabelaGrupFilter.toLowerCase())) {
          return false;
        }
      }
      
      // Tablo içi filtreler - sayısal bazlı
      // İşlem Hacmi filtresi
      if ((tableIslemHacmiMin && tableIslemHacmiMin.trim()) || (tableIslemHacmiMax && tableIslemHacmiMax.trim())) {
        const islemHacmi = h.totalIslemHacmi ?? 0;
        const min = (tableIslemHacmiMin && tableIslemHacmiMin.trim()) ? parseFloat(tableIslemHacmiMin) : -Infinity;
        const max = (tableIslemHacmiMax && tableIslemHacmiMax.trim()) ? parseFloat(tableIslemHacmiMax) : Infinity;
        if (isNaN(min) && isNaN(max)) {
          // Geçersiz sayı girişi - filtreleme yapma
        } else if (!isNaN(min) && islemHacmi < min) {
          return false;
        } else if (!isNaN(max) && islemHacmi > max) {
          return false;
        }
      }
      
      // PF Payı filtresi
      if ((tablePFPayiMin && tablePFPayiMin.trim()) || (tablePFPayiMax && tablePFPayiMax.trim())) {
        const pfPayi = h.totalPFPay ?? 0;
        const min = (tablePFPayiMin && tablePFPayiMin.trim()) ? parseFloat(tablePFPayiMin) : -Infinity;
        const max = (tablePFPayiMax && tablePFPayiMax.trim()) ? parseFloat(tablePFPayiMax) : Infinity;
        if (isNaN(min) && isNaN(max)) {
          // Geçersiz sayı girişi - filtreleme yapma
        } else if (!isNaN(min) && pfPayi < min) {
          return false;
        } else if (!isNaN(max) && pfPayi > max) {
          return false;
        }
      }
      
      // OXİVO Payı filtresi
      if ((tableOxivoPayiMin && tableOxivoPayiMin.trim()) || (tableOxivoPayiMax && tableOxivoPayiMax.trim())) {
        const oxivoPayi = h.totalOxivoPay ?? 0;
        const min = (tableOxivoPayiMin && tableOxivoPayiMin.trim()) ? parseFloat(tableOxivoPayiMin) : -Infinity;
        const max = (tableOxivoPayiMax && tableOxivoPayiMax.trim()) ? parseFloat(tableOxivoPayiMax) : Infinity;
        if (isNaN(min) && isNaN(max)) {
          // Geçersiz sayı girişi - filtreleme yapma
        } else if (!isNaN(min) && oxivoPayi < min) {
          return false;
        } else if (!isNaN(max) && oxivoPayi > max) {
          return false;
        }
      }
      
      // Durum filtresi (tablo içi)
      if (tableDurumFilter !== 'all' && h.durum !== tableDurumFilter) {
        return false;
      }
      
      // Tarih filtresi
      if ((tableTarihBaslangic && tableTarihBaslangic.trim()) || (tableTarihBitis && tableTarihBitis.trim())) {
        const hakedisDate = new Date(h.olusturmaTarihi);
        if (tableTarihBaslangic && tableTarihBaslangic.trim()) {
          const baslangic = new Date(tableTarihBaslangic);
          baslangic.setHours(0, 0, 0, 0);
          if (hakedisDate < baslangic) return false;
        }
        if (tableTarihBitis && tableTarihBitis.trim()) {
          const bitis = new Date(tableTarihBitis);
          bitis.setHours(23, 59, 59, 999);
          if (hakedisDate > bitis) return false;
        }
      }
      
      return true;
    });
  }, [
    allHakedisRecords, 
    selectedPF, 
    selectedDonem, 
    selectedDurum,
    tablePFFilter,
    tableDonemFilter,
    tableTabelaGrupFilter,
    tableIslemHacmiMin,
    tableIslemHacmiMax,
    tablePFPayiMin,
    tablePFPayiMax,
    tableOxivoPayiMin,
    tableOxivoPayiMax,
    tableDurumFilter,
    tableTarihBaslangic,
    tableTarihBitis,
    bankPFRecords
  ]);

  // Benzersiz PF listesi
  const uniquePFs = useMemo(() => {
    return Array.from(new Set(allHakedisRecords.map(h => h.pfId)))
      .map(id => {
        const pf = bankPFRecords.find(p => p.id === id);
        return pf ? { id: pf.id, unvan: pf.firmaUnvan, tip: pf.bankaOrPF === 'PF' ? pf.odemeKurulusuTipi : 'Banka' } : null;
      })
      .filter((p): p is { id: string; unvan: string; tip: string } => p !== null);
  }, [allHakedisRecords, bankPFRecords]);

  // Benzersiz dönem listesi (son döneme göre sıralı)
  const uniqueDonemler = useMemo(() => {
    return Array.from(new Set(allHakedisRecords.map(h => h.donem)))
      .sort((a, b) => b.localeCompare(a)); // En yeni dönem önce
  }, [allHakedisRecords]);

  // ⚡ Filter options for FilterDropdown
  const pfFilterOptions: FilterOption[] = useMemo(() => 
    uniquePFs.map(pf => ({
      value: pf.id,
      label: `${pf.unvan} (${pf.tip})`,
      count: allHakedisRecords.filter(h => h.pfId === pf.id).length
    })), [uniquePFs, allHakedisRecords]
  );

  const donemFilterOptions: FilterOption[] = useMemo(() => 
    uniqueDonemler.map(donem => ({
      value: donem,
      label: formatDonem(donem),
      count: allHakedisRecords.filter(h => h.donem === donem).length
    })), [uniqueDonemler, allHakedisRecords]
  );

  const durumFilterOptions: FilterOption[] = useMemo(() => [
    { value: 'Kesinleşmiş', label: 'Kesinleşmiş', count: allHakedisRecords.filter(h => h.durum === 'Kesinleşmiş').length },
    { value: 'Taslak', label: 'Taslak', count: allHakedisRecords.filter(h => h.durum === 'Taslak').length }
  ], [allHakedisRecords]);

  // Özet istatistikler
  const summary = useMemo(() => {
    const records = filteredHakedisRecords;
    
    const calculateTotals = (hakedisRecord: typeof filteredHakedisRecords[0]) => {
      // Önce kayıtlı değerleri kontrol et (performans optimizasyonu)
      if (hakedisRecord.totalPFPay !== undefined && hakedisRecord.totalOxivoPay !== undefined) {
        return { 
          kazanc: hakedisRecord.totalPFPay + hakedisRecord.totalOxivoPay,
          pfPayi: hakedisRecord.totalPFPay, 
          oxivoPayi: hakedisRecord.totalOxivoPay 
        };
      }
      
      // Kayıtlı değer yoksa hesapla (eski kayıtlar için fallback)
      const pf = bankPFRecords.find(p => p.id === hakedisRecord.pfId);
      if (!pf || !pf.tabelaRecords) return { kazanc: 0, pfPayi: 0, oxivoPayi: 0 };

      // İlgili TABELA grubundaki kayıtları bul
      const tabelaGroup = pf.tabelaGroups?.find(g => g.id === hakedisRecord.tabelaGroupId);
      const grupTabelalar = pf.tabelaRecords.filter(tr => 
        tabelaGroup?.recordIds?.includes(tr.id) || false
      );

      let totalKazanc = 0;
      let totalPFPayi = 0;
      let totalOxivoPayi = 0;

      grupTabelalar.forEach(tabela => {
        const aktifVadeler = (tabela.komisyonOranları || []).filter(ko => ko.aktif !== false);
        const isSabitKomisyon = tabela.gelirModeli?.ad === 'Sabit Komisyon';
        
        aktifVadeler.forEach(vadeData => {
          const vadeKey = `${tabela.id}-${vadeData.vade}`;
          const islemHacmi = parseFloat(hakedisRecord.islemHacmiMap?.[vadeKey] || '0');
          
          if (islemHacmi > 0) {
            let kazancTL = 0;
            
            if (isSabitKomisyon) {
              // Sabit Komisyon: Kar = İşlem Hacmi × (Komisyon Oranı / 100)
              const komisyonOrani = parseFloat(vadeData.oran || '0');
              kazancTL = islemHacmi * (komisyonOrani / 100);
            } else {
              // Gelir Ortaklığı: Kar = Satış - Alış
              const alisYuzde = parseFloat(vadeData.alisTL || '0');
              const satisYuzde = parseFloat(vadeData.satisTL || '0');
              const alisTL = islemHacmi * (alisYuzde / 100);
              const satisTL = islemHacmi * (satisYuzde / 100);
              kazancTL = satisTL - alisTL;
            }
            
            const pfOrani = parseFloat(tabela.paylaşımOranları?.kurulusOrani || '0');
            const oxivoOrani = parseFloat(tabela.paylaşımOranları?.oxivoOrani || '0');
            
            const pfPayi = kazancTL * (pfOrani / 100);
            const oxivoPayi = kazancTL * (oxivoOrani / 100);
            
            totalKazanc += kazancTL;
            totalPFPayi += pfPayi;
            totalOxivoPayi += oxivoPayi;
          }
        });
      });

      return { kazanc: totalKazanc, pfPayi: totalPFPayi, oxivoPayi: totalOxivoPayi };
    };

    let totalKazanc = 0;
    let totalPFPayi = 0;
    let totalOxivoPayi = 0;
    let totalIslemHacmi = 0;
    let kesinlesmisSayi = 0;
    let taslakSayi = 0;

    records.forEach(h => {
      const totals = calculateTotals(h);
      totalKazanc += totals.kazanc;
      totalPFPayi += totals.pfPayi;
      totalOxivoPayi += totals.oxivoPayi;
      
      // İşlem hacmi - önce kayıtlı değeri kontrol et
      if (h.totalIslemHacmi !== undefined) {
        totalIslemHacmi += h.totalIslemHacmi;
      } else {
        // Yoksa hesapla
        Object.values(h.islemHacmiMap || {}).forEach(hacim => {
          totalIslemHacmi += parseFloat(hacim || '0');
        });
      }

      if (h.durum === 'Kesinleşmiş') kesinlesmisSayi++;
      else taslakSayi++;
    });

    return {
      totalHakedisSayisi: records.length,
      totalKazanc,
      totalPFPayi,
      totalOxivoPayi,
      totalIslemHacmi,
      kesinlesmisSayi,
      taslakSayi,
      avgKazanc: records.length > 0 ? totalKazanc / records.length : 0
    };
  }, [filteredHakedisRecords, bankPFRecords]);

  // PF bazında özet (grafik için)
  const pfSummary = useMemo(() => {
    const pfMap = new Map<string, { unvan: string; kazanc: number; pfPayi: number; oxivoPayi: number }>();

    filteredHakedisRecords.forEach(h => {
      const pf = bankPFRecords.find(p => p.id === h.pfId);
      if (!pf) return;

      const calculateTotals = (hakedisRecord: typeof h) => {
        if (!pf.tabelaRecords) return { kazanc: 0, pfPayi: 0, oxivoPayi: 0 };

        const tabelaGroup = pf.tabelaGroups?.find(g => g.id === hakedisRecord.tabelaGroupId);
        const grupTabelalar = pf.tabelaRecords.filter(tr => 
          tabelaGroup?.recordIds?.includes(tr.id) || false
        );

        let totalKazanc = 0;
        let totalPFPayi = 0;
        let totalOxivoPayi = 0;

        grupTabelalar.forEach(tabela => {
          const aktifVadeler = (tabela.komisyonOranları || []).filter(ko => ko.aktif !== false);
          const isSabitKomisyon = tabela.gelirModeli?.ad === 'Sabit Komisyon';
          
          aktifVadeler.forEach(vadeData => {
            const vadeKey = `${tabela.id}-${vadeData.vade}`;
            const islemHacmi = parseFloat(hakedisRecord.islemHacmiMap?.[vadeKey] || '0');
            
            if (islemHacmi > 0) {
              let kazancTL = 0;
              
              if (isSabitKomisyon) {
                // Sabit Komisyon: Kar = İşlem Hacmi × (Komisyon Oranı / 100)
                const komisyonOrani = parseFloat(vadeData.oran || '0');
                kazancTL = islemHacmi * (komisyonOrani / 100);
              } else {
                // Gelir Ortaklığı: Kar = Satış - Alış
                const alisYuzde = parseFloat(vadeData.alisTL || '0');
                const satisYuzde = parseFloat(vadeData.satisTL || '0');
                const alisTL = islemHacmi * (alisYuzde / 100);
                const satisTL = islemHacmi * (satisYuzde / 100);
                kazancTL = satisTL - alisTL;
              }
              
              const pfOrani = parseFloat(tabela.paylaşımOranları?.kurulusOrani || '0');
              const oxivoOrani = parseFloat(tabela.paylaşımOranları?.oxivoOrani || '0');
              
              totalKazanc += kazancTL;
              totalPFPayi += kazancTL * (pfOrani / 100);
              totalOxivoPayi += kazancTL * (oxivoOrani / 100);
            }
          });
        });

        return { kazanc: totalKazanc, pfPayi: totalPFPayi, oxivoPayi: totalOxivoPayi };
      };

      const totals = calculateTotals(h);

      if (pfMap.has(h.pfId)) {
        const existing = pfMap.get(h.pfId)!;
        pfMap.set(h.pfId, {
          unvan: existing.unvan,
          kazanc: existing.kazanc + totals.kazanc,
          pfPayi: existing.pfPayi + totals.pfPayi,
          oxivoPayi: existing.oxivoPayi + totals.oxivoPayi
        });
      } else {
        pfMap.set(h.pfId, {
          unvan: pf.firmaUnvan,
          kazanc: totals.kazanc,
          pfPayi: totals.pfPayi,
          oxivoPayi: totals.oxivoPayi
        });
      }
    });

    return Array.from(pfMap.values()).sort((a, b) => b.kazanc - a.kazanc);
  }, [filteredHakedisRecords, bankPFRecords]);

  // Dönem bazında özet (grafik için)
  const donemSummary = useMemo(() => {
    const donemMap = new Map<string, { kazanc: number; pfPayi: number; oxivoPayi: number }>();

    filteredHakedisRecords.forEach(h => {
      const pf = bankPFRecords.find(p => p.id === h.pfId);
      if (!pf || !pf.tabelaRecords) return;

      const tabelaGroup = pf.tabelaGroups?.find(g => g.id === h.tabelaGroupId);
      const grupTabelalar = pf.tabelaRecords.filter(tr => 
        tabelaGroup?.recordIds?.includes(tr.id) || false
      );

      let totalKazanc = 0;
      let totalPFPayi = 0;
      let totalOxivoPayi = 0;

      grupTabelalar.forEach(tabela => {
        const aktifVadeler = (tabela.komisyonOranları || []).filter(ko => ko.aktif !== false);
        const isSabitKomisyon = tabela.gelirModeli?.ad === 'Sabit Komisyon';
        
        aktifVadeler.forEach(vadeData => {
          const vadeKey = `${tabela.id}-${vadeData.vade}`;
          const islemHacmi = parseFloat(h.islemHacmiMap?.[vadeKey] || '0');
          
          if (islemHacmi > 0) {
            let kazancTL = 0;
            
            if (isSabitKomisyon) {
              // Sabit Komisyon: Kar = İşlem Hacmi × (Komisyon Oranı / 100)
              const komisyonOrani = parseFloat(vadeData.oran || '0');
              kazancTL = islemHacmi * (komisyonOrani / 100);
            } else {
              // Gelir Ortaklığı: Kar = Satış - Alış
              const alisYuzde = parseFloat(vadeData.alisTL || '0');
              const satisYuzde = parseFloat(vadeData.satisTL || '0');
              const alisTL = islemHacmi * (alisYuzde / 100);
              const satisTL = islemHacmi * (satisYuzde / 100);
              kazancTL = satisTL - alisTL;
            }
            
            const pfOrani = parseFloat(tabela.paylaşımOranları?.kurulusOrani || '0');
            const oxivoOrani = parseFloat(tabela.paylaşımOranları?.oxivoOrani || '0');
            
            totalKazanc += kazancTL;
            totalPFPayi += kazancTL * (pfOrani / 100);
            totalOxivoPayi += kazancTL * (oxivoOrani / 100);
          }
        });
      });

      if (donemMap.has(h.donem)) {
        const existing = donemMap.get(h.donem)!;
        donemMap.set(h.donem, {
          kazanc: existing.kazanc + totalKazanc,
          pfPayi: existing.pfPayi + totalPFPayi,
          oxivoPayi: existing.oxivoPayi + totalOxivoPayi
        });
      } else {
        donemMap.set(h.donem, {
          kazanc: totalKazanc,
          pfPayi: totalPFPayi,
          oxivoPayi: totalOxivoPayi
        });
      }
    });

    return Array.from(donemMap.entries())
      .map(([donem, data]) => ({ donem, ...data }))
      .sort((a, b) => a.donem.localeCompare(b.donem)); // Kronolojik sıra
  }, [filteredHakedisRecords, bankPFRecords]);

  // Grafik renkleri
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  // Dönem formatla (YYYY-MM -> Ocak 2025)
  const formatDonem = (donem: string) => {
    const [year, month] = donem.split('-');
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${aylar[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PF Filtresi */}
            <FilterDropdown
              label="Ödeme Kuruluşu"
              options={pfFilterOptions}
              value={selectedPF}
              onChange={setSelectedPF}
              allLabel="Tüm Kuruluşlar"
              showCount={true}
            />

            {/* Dönem Filtresi */}
            <FilterDropdown
              label="Dönem"
              options={donemFilterOptions}
              value={selectedDonem}
              onChange={setSelectedDonem}
              allLabel="Tüm Dönemler"
              showCount={true}
            />

            {/* Durum Filtresi */}
            <FilterDropdown
              label="Durum"
              options={durumFilterOptions}
              value={selectedDurum}
              onChange={setSelectedDurum}
              allLabel="Tüm Durumlar"
              showCount={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator size={16} />
              Toplam Hakediş
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-900">{summary.totalHakedisSayisi}</div>
            <div className="text-xs text-blue-700 mt-1">
              {summary.kesinlesmisSayi} kesinleşmiş, {summary.taslakSayi} taslak
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={16} />
              Toplam İşlem Hacmi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-900">
              {summary.totalIslemHacmi.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div className="text-xs text-green-700 mt-1">
              Ort: {(summary.totalHakedisSayisi > 0 ? summary.totalIslemHacmi / summary.totalHakedisSayisi : 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 size={16} />
              PF Payı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-purple-900">
              {summary.totalPFPayi.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div className="text-xs text-purple-700 mt-1">
              %{summary.totalKazanc > 0 ? ((summary.totalPFPayi / summary.totalKazanc) * 100).toFixed(1) : 0} paylaşım
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign size={16} />
              OXİVO Payı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-indigo-900">
              {summary.totalOxivoPayi.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div className="text-xs text-indigo-700 mt-1">
              %{summary.totalKazanc > 0 ? ((summary.totalOxivoPayi / summary.totalKazanc) * 100).toFixed(1) : 0} paylaşım
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PF Bazında Kazanç */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">PF Bazında Kazanç Dağılımı</CardTitle>
            <CardDescription>Her ödeme kuruluşunun toplam kazancı</CardDescription>
          </CardHeader>
          <CardContent>
            {pfSummary.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <PieChart size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Veri bulunmuyor</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pfSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="unvan" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'}
                  />
                  <Legend />
                  <Bar dataKey="kazanc" fill="#10b981" name="Toplam Kazanç" />
                  <Bar dataKey="pfPayi" fill="#8b5cf6" name="PF Payı" />
                  <Bar dataKey="oxivoPayi" fill="#3b82f6" name="OXİVO Payı" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Dönem Bazında Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dönem Bazında Trend</CardTitle>
            <CardDescription>Aylık kazanç gelişimi</CardDescription>
          </CardHeader>
          <CardContent>
            {donemSummary.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Veri bulunmuyor</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={donemSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="donem" 
                    tickFormatter={formatDonem}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'}
                    labelFormatter={(label) => formatDonem(label as string)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="kazanc" stroke="#10b981" name="Toplam Kazanç" strokeWidth={2} />
                  <Line type="monotone" dataKey="pfPayi" stroke="#8b5cf6" name="PF Payı" strokeWidth={2} />
                  <Line type="monotone" dataKey="oxivoPayi" stroke="#3b82f6" name="OXİVO Payı" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Tablo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hakediş Detay Tablosu</CardTitle>
              <CardDescription>
                {filteredHakedisRecords.length} kayıt gösteriliyor
                {allHakedisRecords.length !== filteredHakedisRecords.length && (
                  <span className="text-blue-600"> (toplam {allHakedisRecords.length} kayıttan)</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setTablePFFilter('');
                  setTableDonemFilter('');
                  setTableTabelaGrupFilter('');
                  setTableIslemHacmiMin('');
                  setTableIslemHacmiMax('');
                  setTablePFPayiMin('');
                  setTablePFPayiMax('');
                  setTableOxivoPayiMin('');
                  setTableOxivoPayiMax('');
                  setTableDurumFilter('all');
                  setTableTarihBaslangic('');
                  setTableTarihBitis('');
                  toast.success('Tablo filtreleri temizlendi');
                }}
              >
                <X size={16} className="mr-2" />
                Filtreleri Temizle
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.info('Excel export özelliği yakında eklenecek');
                }}
              >
                <FileDown size={16} className="mr-2" />
                Excel İndir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Aktif Filtre Bildirimi */}
          {(() => {
            const activeFilters = [
              tablePFFilter && tablePFFilter.trim(),
              tableDonemFilter && tableDonemFilter.trim(),
              tableTabelaGrupFilter && tableTabelaGrupFilter.trim(),
              tableIslemHacmiMin && tableIslemHacmiMin.trim(),
              tableIslemHacmiMax && tableIslemHacmiMax.trim(),
              tablePFPayiMin && tablePFPayiMin.trim(),
              tablePFPayiMax && tablePFPayiMax.trim(),
              tableOxivoPayiMin && tableOxivoPayiMin.trim(),
              tableOxivoPayiMax && tableOxivoPayiMax.trim(),
              tableDurumFilter !== 'all',
              tableTarihBaslangic && tableTarihBaslangic.trim(),
              tableTarihBitis && tableTarihBitis.trim()
            ].filter(Boolean).length;
            
            if (activeFilters > 0) {
              return (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-blue-600" />
                    <span className="text-sm text-blue-700">
                      {activeFilters} tablo filtresi aktif
                    </span>
                  </div>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                    onClick={() => {
                      setTablePFFilter('');
                      setTableDonemFilter('');
                      setTableTabelaGrupFilter('');
                      setTableIslemHacmiMin('');
                      setTableIslemHacmiMax('');
                      setTablePFPayiMin('');
                      setTablePFPayiMax('');
                      setTableOxivoPayiMin('');
                      setTableOxivoPayiMax('');
                      setTableDurumFilter('all');
                      setTableTarihBaslangic('');
                      setTableTarihBitis('');
                    }}
                  >
                    <X size={14} className="mr-1" />
                    Temizle
                  </Button>
                </div>
              );
            }
            return null;
          })()}
          
          {filteredHakedisRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calculator size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Filtrelere uygun hakediş kaydı bulunmuyor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PF</TableHead>
                    <TableHead>Dönem</TableHead>
                    <TableHead>TABELA Grubu</TableHead>
                    <TableHead className="text-right">Toplam İşlem Hacmi</TableHead>
                    <TableHead className="text-right">Toplam PF Payı</TableHead>
                    <TableHead className="text-right">Toplam OXİVO Payı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Oluşturma</TableHead>
                  </TableRow>
                  {/* Filtre Satırı */}
                  <TableRow className="bg-gray-50 border-b-2">
                    <TableHead className="p-2">
                      <Input
                        id="hakedis-pf-filter"
                        placeholder="🔍 PF ara..."
                        value={tablePFFilter}
                        onChange={(e) => setTablePFFilter(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableHead>
                    <TableHead className="p-2">
                      <Input
                        id="hakedis-donem-filter"
                        placeholder="📅 2024-01..."
                        value={tableDonemFilter}
                        onChange={(e) => setTableDonemFilter(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableHead>
                    <TableHead className="p-2">
                      <Input
                        id="hakedis-grup-filter"
                        placeholder="🔍 Grup ara..."
                        value={tableTabelaGrupFilter}
                        onChange={(e) => setTableTabelaGrupFilter(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableHead>
                    <TableHead className="p-2">
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={tableIslemHacmiMin}
                          onChange={(e) => setTableIslemHacmiMin(e.target.value)}
                          className="h-8 text-xs w-1/2"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={tableIslemHacmiMax}
                          onChange={(e) => setTableIslemHacmiMax(e.target.value)}
                          className="h-8 text-xs w-1/2"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="p-2">
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={tablePFPayiMin}
                          onChange={(e) => setTablePFPayiMin(e.target.value)}
                          className="h-8 text-xs w-1/2"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={tablePFPayiMax}
                          onChange={(e) => setTablePFPayiMax(e.target.value)}
                          className="h-8 text-xs w-1/2"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="p-2">
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={tableOxivoPayiMin}
                          onChange={(e) => setTableOxivoPayiMin(e.target.value)}
                          className="h-8 text-xs w-1/2"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={tableOxivoPayiMax}
                          onChange={(e) => setTableOxivoPayiMax(e.target.value)}
                          className="h-8 text-xs w-1/2"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="p-2">
                      <Select value={tableDurumFilter} onValueChange={setTableDurumFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="Kesinleşmiş">Kesinleşmiş</SelectItem>
                          <SelectItem value="Taslak">Taslak</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="p-2">
                      <div className="flex gap-1">
                        <Input
                          type="date"
                          value={tableTarihBaslangic}
                          onChange={(e) => setTableTarihBaslangic(e.target.value)}
                          className="h-8 text-xs w-1/2"
                          placeholder="Başlangıç"
                        />
                        <Input
                          type="date"
                          value={tableTarihBitis}
                          onChange={(e) => setTableTarihBitis(e.target.value)}
                          className="h-8 text-xs w-1/2"
                          placeholder="Bitiş"
                        />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHakedisRecords.map(hakediş => {
                    // TABELA tablosundaki hesaplama mantığını kullan
                    const pf = bankPFRecords.find(p => p.id === hakediş.pfId);
                    const tabelaGroup = pf?.tabelaGroups?.find(g => g.id === hakediş.tabelaGroupId);
                    const displayGroupName = tabelaGroup?.name || hakediş.tabelaGroupAd;
                    
                    // Gruba ait TABELA kayıtlarını filtrele
                    const grupTabelalar = pf?.tabelaRecords?.filter(tr => 
                      tabelaGroup?.recordIds?.includes(tr.id) && !tr.kapanmaTarihi
                    ) || [];
                    
                    // Önce kayıtlı değerleri kontrol et (performans optimizasyonu)
                    let totalIslemHacmi: number;
                    let totalPFPayi: number;
                    let totalOxivoPayi: number;
                    
                    if (hakediş.totalIslemHacmi !== undefined && 
                        hakediş.totalPFPay !== undefined && 
                        hakediş.totalOxivoPay !== undefined) {
                      // Kayıtlı değerleri kullan
                      totalIslemHacmi = hakediş.totalIslemHacmi;
                      totalPFPayi = hakediş.totalPFPay;
                      totalOxivoPayi = hakediş.totalOxivoPay;
                    } else {
                      // Kayıtlı değer yoksa hesapla (eski kayıtlar için fallback)
                      const normalRecords = grupTabelalar.filter(r => !r.ekGelirDetay);
                      const ekGelirRecords = grupTabelalar.filter(r => r.ekGelirDetay);
                      
                      // Ana TABELA toplamları
                      let normalTotalIslemHacmi = 0;
                      let normalTotalPFPay = 0;
                      let normalTotalOxivoPay = 0;
                      
                      normalRecords.forEach(record => {
                        const aktifVadeler = (record.komisyonOranları || []).filter(ko => ko.aktif !== false);
                        
                        aktifVadeler.forEach(vadeData => {
                          const vadeKey = `${record.id}-${vadeData.vade}`;
                          const islemHacmi = parseFloat(hakediş.islemHacmiMap?.[vadeKey] || '0');
                          
                          let kazancTL = 0;
                          
                          if (record.gelirModeli?.ad === 'Sabit Komisyon') {
                            // Sabit Komisyon: Kar = İşlem Hacmi × (Komisyon Oranı / 100)
                            const komisyonOrani = parseFloat(vadeData.oran || '0');
                            kazancTL = islemHacmi * (komisyonOrani / 100);
                          } else {
                            // Gelir Ortaklığı: Kar = Satış - Alış
                            const alisYuzde = parseFloat(vadeData.alisTL || '0');
                            const satisYuzde = parseFloat(vadeData.satisTL || '0');
                            const alisTL = islemHacmi * (alisYuzde / 100);
                            const satisTL = islemHacmi * (satisYuzde / 100);
                            kazancTL = satisTL - alisTL;
                          }
                          
                          const pfOrani = parseFloat(record.paylaşımOranları?.kurulusOrani || '0');
                          const oxivoOrani = parseFloat(record.paylaşımOranları?.oxivoOrani || '0');
                          const pfPayi = kazancTL * (pfOrani / 100);
                          const oxivoPayi = kazancTL * (oxivoOrani / 100);
                          
                          normalTotalIslemHacmi += islemHacmi;
                          normalTotalPFPay += pfPayi;
                          normalTotalOxivoPay += oxivoPayi;
                        });
                      });
                      
                      // Ek Gelir toplamları
                      let ekGelirTotalIslemHacmi = 0;
                      let ekGelirTotalPFTL = 0;
                      let ekGelirTotalOXTL = 0;
                      
                      // ✅ NULL SAFETY: ekGelirRecords boş olabilir
                      (ekGelirRecords || []).forEach(record => {
                        const islemHacmi = parseFloat(hakediş.islemHacmiMap?.[record.id] || '0');
                        const pfYuzde = parseFloat(record.ekGelirDetay?.pfYuzde || '0');
                        const oxYuzde = parseFloat(record.ekGelirDetay?.oxYuzde || '0');
                        
                        ekGelirTotalIslemHacmi += islemHacmi;
                        ekGelirTotalPFTL += islemHacmi * (pfYuzde / 100);
                        ekGelirTotalOXTL += islemHacmi * (oxYuzde / 100);
                      });
                      
                      totalIslemHacmi = normalTotalIslemHacmi + ekGelirTotalIslemHacmi;
                      totalPFPayi = normalTotalPFPay + ekGelirTotalPFTL;
                      totalOxivoPayi = normalTotalOxivoPay + ekGelirTotalOXTL;
                    }

                    return (
                      <TableRow key={hakediş.id}>
                        <TableCell>
                          <div>
                            <div>{hakediş.pfUnvan}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {hakediş.pfTip}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {formatDonem(hakediş.donem)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm">{displayGroupName}</span>
                            {tabelaGroup?.name !== hakediş.tabelaGroupAd && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                (Eski: {hakediş.tabelaGroupAd})
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-blue-700">
                            {totalIslemHacmi.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-purple-700">
                            {totalPFPayi.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-indigo-700">
                            {totalOxivoPayi.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={hakediş.durum === 'Kesinleşmiş' ? 'default' : 'secondary'}
                            className={hakediş.durum === 'Kesinleşmiş' ? 'bg-green-600' : ''}
                          >
                            {hakediş.durum}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-600">
                            {new Date(hakediş.olusturmaTarihi).toLocaleDateString('tr-TR')}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}