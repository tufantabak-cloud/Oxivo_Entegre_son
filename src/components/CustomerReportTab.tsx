import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Customer } from './CustomerModule';
import { BankPF } from './BankPFModule';
import { Search, ArrowUpDown, Filter, Download, Users, Package, DollarSign, Euro, Briefcase, CheckCircle } from 'lucide-react';
import { ColumnVisibilityDropdown, ColumnConfig } from './ColumnVisibilityDropdown';
import { FilterDropdown, FilterOption } from './FilterDropdown';
import { toast } from 'sonner@2.0.3';
import * as XLSX from 'xlsx';

interface CustomerReportTabProps {
  customers: Customer[];
  bankPFRecords: BankPF[];
}

interface CustomerReportData {
  musteri: Customer;
  cihazSayisi: number;
  aktifCihazSayisi: number;
  aylıkAidatGeliri: number; // Aylık aidat geliri (Euro)
}

// Sütun konfigürasyonu
const COLUMN_CONFIGS: ColumnConfig[] = [
  { key: 'cariHesapKodu', label: 'Cari Hesap Kodu', defaultVisible: true },
  { key: 'cariAdi', label: 'Cari Adı', defaultVisible: true },
  { key: 'sektor', label: 'Sektör', defaultVisible: true },
  { key: 'mcc', label: 'MCC', defaultVisible: false },
  { key: 'ilce', label: 'İlçe', defaultVisible: true },
  { key: 'cihazSayisi', label: 'Cihaz Sayısı', defaultVisible: true },
  { key: 'aylıkAidatGeliri', label: 'Aylık Aidat (€)', defaultVisible: true },
  { key: 'yetkili', label: 'Yetkili', defaultVisible: false },
  { key: 'tel', label: 'Telefon', defaultVisible: false },
  { key: 'durum', label: 'Durum', defaultVisible: true },
];

export function CustomerReportTab({ customers, bankPFRecords }: CustomerReportTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sektorFilter, setSektorFilter] = useState<string>('all');
  const [durumFilter, setDurumFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof CustomerReportData | 'sektor' | 'ilce' | 'cariHesapKodu' | 'cariAdi'>('cihazSayisi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  // Müşteri rapor verilerini hesapla
  const reportData = useMemo<CustomerReportData[]>(() => {
    return customers.map(customer => {
      // Cihaz bilgilerini al
      const deviceSubscriptions = customer.serviceFeeSettings?.deviceSubscriptions || [];
      const aktifCihazlar = deviceSubscriptions.filter(d => d.isActive);
      
      // Aylık aidat gelirini hesapla (sadece aktif cihazlar)
      const aylıkAidatGeliri = aktifCihazlar.reduce((sum, device) => sum + (device.monthlyFee || 0), 0);

      return {
        musteri: customer,
        cihazSayisi: deviceSubscriptions.length,
        aktifCihazSayisi: aktifCihazlar.length,
        aylıkAidatGeliri: aylıkAidatGeliri
      };
    });
  }, [customers]);

  // Sektör filter options
  const sektorFilterOptions = useMemo<FilterOption[]>(() => {
    const sektors = new Set<string>();
    // ✅ NULL SAFETY: customers boş olabilir
    (customers || []).forEach(c => {
      if (c.sektor && c.sektor.trim() !== '') {
        sektors.add(c.sektor);
      }
    });
    return Array.from(sektors).sort().map(sektor => ({
      value: sektor,
      label: sektor
    }));
  }, [customers]);

  // Durum filter options
  const durumFilterOptions = useMemo<FilterOption[]>(() => {
    return [
      { value: 'Aktif', label: 'Aktif' },
      { value: 'Pasif', label: 'Pasif' }
    ];
  }, []);

  // Filtreleme ve sıralama
  const filteredData = useMemo(() => {
    let result = reportData.filter(data => {
      // Arama filtresi
      const searchMatch = 
        data.musteri.cariAdi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.musteri.cariHesapKodu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.musteri.sektor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.musteri.ilce?.toLowerCase().includes(searchTerm.toLowerCase());

      // Sektör filtresi
      const sektorMatch = sektorFilter === 'all' || data.musteri.sektor === sektorFilter;

      // Durum filtresi
      const durumMatch = durumFilter === 'all' || data.musteri.durum === durumFilter;

      return searchMatch && sektorMatch && durumMatch;
    });

    // Sıralama
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'sektor' || sortField === 'ilce' || sortField === 'cariHesapKodu' || sortField === 'cariAdi') {
        aValue = a.musteri[sortField];
        bValue = b.musteri[sortField];
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue, 'tr')
          : bValue.localeCompare(aValue, 'tr');
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [reportData, searchTerm, sektorFilter, durumFilter, sortField, sortDirection]);

  // Özet istatistikler
  const stats = useMemo(() => {
    return {
      toplamMusteri: filteredData.length,
      toplamCihazSayisi: filteredData.reduce((sum, d) => sum + d.cihazSayisi, 0),
      toplamAktifCihaz: filteredData.reduce((sum, d) => sum + d.aktifCihazSayisi, 0),
      toplamAylıkAidat: filteredData.reduce((sum, d) => sum + d.aylıkAidatGeliri, 0),
      aktifMusteriSayisi: filteredData.filter(d => d.musteri.durum === 'Aktif').length,
      pasifMusteriSayisi: filteredData.filter(d => d.musteri.durum === 'Pasif').length,
    };
  }, [filteredData]);

  // Sıralama işlevi
  const handleSort = (field: keyof CustomerReportData | 'sektor' | 'ilce' | 'cariHesapKodu' | 'cariAdi') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sütun görünürlüğü değişikliği
  const handleVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  }, []);

  // Excel export
  const handleExportExcel = () => {
    try {
      const exportData = filteredData.map(data => ({
        'Cari Hesap Kodu': data.musteri.cariHesapKodu,
        'Cari Adı': data.musteri.cariAdi,
        'Sektör': data.musteri.sektor,
        'MCC': data.musteri.mcc,
        'İlçe': data.musteri.ilce,
        'Yetkili': data.musteri.yetkili,
        'Telefon': data.musteri.tel,
        'Toplam Cihaz': data.cihazSayisi,
        'Aktif Cihaz': data.aktifCihazSayisi,
        'Aylık Aidat (€)': data.aylıkAidatGeliri.toFixed(2),
        'Durum': data.musteri.durum,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Müşteri Raporu');

      const fileName = `musteri-raporu-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Excel raporu indirildi: ${fileName}`);
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel export sırasında hata oluştu');
    }
  };

  // Para formatı (Euro)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Müşteri Raporu</h2>
          <p className="text-gray-600 mt-1">Müşterilerin cihaz sayısı ve aidat geliri analizi</p>
        </div>
        <Button onClick={handleExportExcel} className="gap-2">
          <Download size={18} />
          Excel İndir
        </Button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Müşteri</p>
                <h3 className="text-blue-600 mt-1">{stats.toplamMusteri}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.aktifMusteriSayisi} aktif, {stats.pasifMusteriSayisi} pasif
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Cihaz</p>
                <h3 className="text-green-600 mt-1">{stats.toplamCihazSayisi}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.toplamAktifCihaz} aktif cihaz
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aylık Aidat Geliri</p>
                <h3 className="text-purple-600 mt-1">€{formatCurrency(stats.toplamAylıkAidat)}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Aktif cihazlardan
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Euro className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ort. Cihaz/Müşteri</p>
                <h3 className="text-orange-600 mt-1">
                  {stats.toplamMusteri > 0 ? (stats.toplamCihazSayisi / stats.toplamMusteri).toFixed(1) : 0}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Cihaz dağılımı
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Arama */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Müşteri adı, cari kod, sektör, ilçe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sektör Filtresi */}
            <FilterDropdown
              label="Sektör"
              icon={<Briefcase size={16} />}
              options={sektorFilterOptions}
              value={sektorFilter}
              onChange={setSektorFilter}
              allLabel="Tüm Sektörler"
              allValue="all"
            />

            {/* Durum Filtresi */}
            <FilterDropdown
              label="Durum"
              icon={<CheckCircle size={16} />}
              options={durumFilterOptions}
              value={durumFilter}
              onChange={setDurumFilter}
              allLabel="Tümü"
              allValue="all"
            />
          </div>

          {/* Sütun Görünürlüğü */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <Filter size={16} className="inline mr-2" />
              {filteredData.length} müşteri listeleniyor
              {filteredData.length !== reportData.length && (
                <span className="text-blue-600 ml-1">
                  ({reportData.length} toplam)
                </span>
              )}
            </div>
            <ColumnVisibilityDropdown
              columns={COLUMN_CONFIGS}
              visibility={columnVisibility}
              onVisibilityChange={handleVisibilityChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Müşteri Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>
            Müşteri Listesi
            {filteredData.length !== reportData.length && (
              <span className="text-sm text-gray-500 ml-2">
                ({filteredData.length} / {reportData.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Kriterlere uygun müşteri bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnVisibility['cariHesapKodu'] !== false && (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('cariHesapKodu')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Cari Hesap Kodu</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility['cariAdi'] !== false && (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('cariAdi')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Cari Adı</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility['sektor'] !== false && (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('sektor')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Sektör</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility['mcc'] !== false && <TableHead>MCC</TableHead>}
                    {columnVisibility['ilce'] !== false && (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('ilce')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>İlçe</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility['cihazSayisi'] !== false && (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 text-center"
                        onClick={() => handleSort('cihazSayisi')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Cihaz Sayısı</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility['aylıkAidatGeliri'] !== false && (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 text-right"
                        onClick={() => handleSort('aylıkAidatGeliri')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Aylık Aidat (€)</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility['yetkili'] !== false && <TableHead>Yetkili</TableHead>}
                    {columnVisibility['tel'] !== false && <TableHead>Telefon</TableHead>}
                    {columnVisibility['durum'] !== false && <TableHead>Durum</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((data) => (
                    <TableRow key={data.musteri.id} className="hover:bg-gray-50">
                      {columnVisibility['cariHesapKodu'] !== false && (
                        <TableCell>
                          <code className={`text-sm bg-gray-100 px-2 py-1 rounded ${data.musteri.durum === 'Pasif' ? 'line-through text-gray-500' : ''}`}>
                            {data.musteri.cariHesapKodu}
                          </code>
                        </TableCell>
                      )}
                      {columnVisibility['cariAdi'] !== false && (
                        <TableCell className="max-w-xs">
                          <div className={`truncate ${data.musteri.durum === 'Pasif' ? 'line-through text-gray-500' : ''}`} title={data.musteri.cariAdi}>
                            {data.musteri.cariAdi}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility['sektor'] !== false && (
                        <TableCell>
                          <span className="text-sm">{data.musteri.sektor}</span>
                        </TableCell>
                      )}
                      {columnVisibility['mcc'] !== false && (
                        <TableCell>
                          <span className="text-sm">{data.musteri.mcc}</span>
                        </TableCell>
                      )}
                      {columnVisibility['ilce'] !== false && (
                        <TableCell>
                          <span className="text-sm">{data.musteri.ilce}</span>
                        </TableCell>
                      )}
                      {columnVisibility['cihazSayisi'] !== false && (
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            {data.cihazSayisi}
                            {data.aktifCihazSayisi < data.cihazSayisi && (
                              <span className="text-xs text-gray-500">
                                ({data.aktifCihazSayisi} aktif)
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                      )}
                      {columnVisibility['aylıkAidatGeliri'] !== false && (
                        <TableCell className="text-right tabular-nums">
                          <span className="text-sm text-purple-600">
                            €{formatCurrency(data.aylıkAidatGeliri)}
                          </span>
                        </TableCell>
                      )}
                      {columnVisibility['yetkili'] !== false && (
                        <TableCell>
                          <span className="text-sm">{data.musteri.yetkili}</span>
                        </TableCell>
                      )}
                      {columnVisibility['tel'] !== false && (
                        <TableCell>
                          <span className="text-sm">{data.musteri.tel}</span>
                        </TableCell>
                      )}
                      {columnVisibility['durum'] !== false && (
                        <TableCell>
                          <Badge variant={data.musteri.durum === 'Aktif' ? 'default' : 'secondary'}>
                            {data.musteri.durum}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Özet Footer */}
      {filteredData.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600">Müşteri Sayısı</p>
                <p className="text-blue-600 mt-1">{stats.toplamMusteri}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Toplam Cihaz</p>
                <p className="text-green-600 mt-1">{stats.toplamCihazSayisi}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Aktif Cihaz</p>
                <p className="text-green-600 mt-1">{stats.toplamAktifCihaz}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Aylık Aidat</p>
                <p className="text-purple-600 mt-1">€{formatCurrency(stats.toplamAylıkAidat)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}