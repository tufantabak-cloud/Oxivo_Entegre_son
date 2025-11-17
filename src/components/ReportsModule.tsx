import React, { useState, Fragment, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FileText, Download, Users, FileDown, BarChart3, Calculator, Database, Building2, Filter, Info } from 'lucide-react';
import { FilterDropdown, FilterOption } from './FilterDropdown';
import { BankPF, ContactPerson } from './BankPFModule';
import { Customer } from './CustomerModule';
import { Bank, EPK, OK } from './DefinitionsModule';
import { KartProgram } from './KartProgramTab';
import { HakedisReportTab } from './HakedisReportTab';
import { CustomerReportTab } from './CustomerReportTab';
import { DomainReportTab } from './DomainReportTab';
import { TabelaSimulationDialog } from './TabelaSimulationDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface ReportsModuleProps {
  customers?: Customer[];
  bankPFRecords?: BankPF[];
  banks?: Bank[];
  epkList?: EPK[];
  okList?: OK[];
  kartProgramlar?: KartProgram[];
}

// PERFORMANCE: React.memo prevents unnecessary re-renders
export const ReportsModule = React.memo(function ReportsModule({
  customers = [],
  bankPFRecords = [],
  banks = [],
  epkList = [],
  okList = [],
  kartProgramlar = [],
}: ReportsModuleProps) {
  const [activeTab, setActiveTab] = useState('banka-pf');
  const [isSimulationDialogOpen, setIsSimulationDialogOpen] = useState(false);
  const [selectedBankPFId, setSelectedBankPFId] = useState<string>('ALL'); // ÜİY Listesi filtresi için

  // ÜİY Listesi için Banka/PF dropdown options
  const bankPFFilterOptions = useMemo<FilterOption[]>(() => {
    const options: FilterOption[] = [];
    
    // BankPF kayıtlarını ekle
    bankPFRecords
      .sort((a, b) => {
        if (a.bankaOrPF === 'Banka' && b.bankaOrPF !== 'Banka') return -1;
        if (a.bankaOrPF !== 'Banka' && b.bankaOrPF === 'Banka') return 1;
        if (a.odemeKurulusuTipi === 'EPK' && b.odemeKurulusuTipi === 'ÖK') return -1;
        if (a.odemeKurulusuTipi === 'ÖK' && b.odemeKurulusuTipi === 'EPK') return 1;
        return a.firmaUnvan.localeCompare(b.firmaUnvan, 'tr');
      })
      .forEach(bp => {
        const type = bp.bankaOrPF === 'Banka' ? '🏦 Banka' : bp.odemeKurulusuTipi === 'EPK' ? '💳 EPK' : '💰 ÖK';
        options.push({
          value: bp.id,
          label: `${type} • ${bp.firmaUnvan}`
        });
      });
    
    // Tanımlar modülündeki bankaları ekle
    banks
      .filter(b => b.bankaAdi)
      .sort((a, b) => (a.bankaAdi || '').localeCompare(b.bankaAdi || '', 'tr'))
      .forEach(b => {
        options.push({
          value: b.id,
          label: `🏦 Banka • ${b.bankaAdi}`
        });
      });
    
    // Tanımlar modülündeki EPK'ları ekle
    epkList
      .filter(e => e.kurumAdi)
      .sort((a, b) => (a.kurumAdi || '').localeCompare(b.kurumAdi || '', 'tr'))
      .forEach(e => {
        options.push({
          value: e.id,
          label: `💳 EPK • ${e.kurumAdi}`
        });
      });
    
    // Tanımlar modülündeki ÖK'ları ekle
    okList
      .filter(o => o.kurumAdi)
      .sort((a, b) => (a.kurumAdi || '').localeCompare(b.kurumAdi || '', 'tr'))
      .forEach(o => {
        options.push({
          value: o.id,
          label: `💰 ÖK • ${o.kurumAdi}`
        });
      });
    
    return options;
  }, [bankPFRecords, banks, epkList, okList]);

  // ÜİY İcmal Tablosu Verisi - Her banka için Aktif/Pasif müşteri ayrımı
  const uiySummaryData = useMemo(() => {
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

    // Her banka için aktif ve pasif müşteri sayılarını hesapla
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

      // Aktif ve pasif müşterileri ayır
      const aktifCustomers = relatedCustomers.filter(c => c.durum === 'Aktif');
      const pasifCustomers = relatedCustomers.filter(c => c.durum !== 'Aktif');

      // Aktif müşterilerin cihazlarını say
      const aktifDevices = aktifCustomers.reduce((sum, customer) => {
        const assignment = customer.bankDeviceAssignments?.find(
          a => a.bankId === def.id || 
               a.bankId === `bank-${def.id}` || 
               a.bankId === `ok-epk-${def.id}` || 
               a.bankId === `ok-ok-${def.id}`
        );
        return sum + (assignment?.deviceIds?.length || 0);
      }, 0);

      // Pasif müşterilerin cihazlarını say
      const pasifDevices = pasifCustomers.reduce((sum, customer) => {
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
        aktifUiy: aktifCustomers.length,
        aktifCihaz: aktifDevices,
        pasifUiy: pasifCustomers.length,
        pasifCihaz: pasifDevices,
        toplamUiy: relatedCustomers.length,
        toplamCihaz: aktifDevices + pasifDevices
      };
    });

    // En az 1 ÜİY'si olan bankaları filtrele ve toplam cihaz sayısına göre sırala
    const filteredBankaStats = bankaStats
      .filter(b => b.toplamUiy > 0)
      .sort((a, b) => b.toplamCihaz - a.toplamCihaz);

    // Genel toplamları hesapla
    const genelToplam = {
      aktifUiy: filteredBankaStats.reduce((sum, b) => sum + b.aktifUiy, 0),
      aktifCihaz: filteredBankaStats.reduce((sum, b) => sum + b.aktifCihaz, 0),
      pasifUiy: filteredBankaStats.reduce((sum, b) => sum + b.pasifUiy, 0),
      pasifCihaz: filteredBankaStats.reduce((sum, b) => sum + b.pasifCihaz, 0),
      toplamUiy: filteredBankaStats.reduce((sum, b) => sum + b.toplamUiy, 0),
      toplamCihaz: filteredBankaStats.reduce((sum, b) => sum + b.toplamCihaz, 0)
    };

    return {
      bankalar: filteredBankaStats,
      genelToplam
    };
  }, [bankPFRecords, banks, epkList, okList, customers]);

  // İletişim matrisi için tüm görev başlıklarını topla
  const getAllJobTitles = () => {
    const titles = new Set<string>();
    bankPFRecords.forEach(record => {
      record.iletisimMatrisi?.forEach(contact => {
        if (contact.gorevi) {
          titles.add(contact.gorevi);
        }
      });
    });
    return Array.from(titles).sort();
  };

  // Belirli bir firma ve görev için kişileri bul
  const getContactsForFirmaAndJob = (firma: BankPF, jobTitle: string): ContactPerson[] => {
    return (firma.iletisimMatrisi || []).filter(contact => contact.gorevi === jobTitle);
  };

  // İletişim matrisi PDF export
  const handleExportPDF = () => {
    try {
      const jobTitles = getAllJobTitles();
      
      if (jobTitles.length === 0 || bankPFRecords.length === 0) {
        toast.error('PDF oluşturmak için veri bulunmuyor!');
        return;
      }

      // PDF oluştur - Landscape yönünde (yatay)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Başlık
      doc.setFontSize(16);
      doc.text('Iletisim Matrisi - Banka / EPK / OK', 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);

      // Tablo başlıkları - 2 seviyeli başlık
      const headerRow1: any[] = ['Gorev'];
      const headerRow2: any[] = [''];
      
      // Her firma için 3 kolon ekle
      bankPFRecords.forEach(firma => {
        const firmaTip = firma.bankaOrPF === 'PF' ? firma.odemeKurulusuTipi : 'Banka';
        const firmaBaslik = `${firma.firmaUnvan} (${firmaTip})`;
        
        // İlk satırda firma adı (3 kolonu birleştir)
        headerRow1.push({ content: firmaBaslik, colSpan: 3, styles: { halign: 'center' } });
        
        // İkinci satırda kolon başlıkları
        headerRow2.push('Ad Soyad', 'Cep', 'E-Posta');
      });

      const headers = [headerRow1, headerRow2];

      // Tablo verileri
      const tableData: any[] = [];
      
      jobTitles.forEach(jobTitle => {
        const row: any[] = [jobTitle];
        
        bankPFRecords.forEach(firma => {
          const contacts = getContactsForFirmaAndJob(firma, jobTitle);
          
          if (contacts.length > 0) {
            // Birden fazla kişi varsa, hepsini alt alta yaz
            const names = contacts.map(c => c.adiSoyadi).join('\n');
            const phones = contacts.map(c => c.gsm || c.tel || '-').join('\n');
            const emails = contacts.map(c => c.mail || '-').join('\n');
            
            row.push(names, phones, emails);
          } else {
            row.push('-', '-', '-');
          }
        });
        
        tableData.push(row);
      });

      // Dinamik kolon genişlikleri hesapla
      const totalColumns = 1 + (bankPFRecords.length * 3); // 1 görev kolonu + her firma için 3 kolon
      const availableWidth = 297 - 20; // A4 landscape genişlik - margin
      const gorevColWidth = 30; // Görev kolonu sabit genişlik
      const remainingWidth = availableWidth - gorevColWidth;
      const firmaColWidth = remainingWidth / (bankPFRecords.length * 3);

      // Kolon stilleri oluştur
      const columnStyles: any = {
        0: { 
          cellWidth: gorevColWidth, 
          halign: 'left',
          fontStyle: 'bold',
          fontSize: 6
        }
      };

      // Her firma kolonu için stil ekle
      for (let i = 1; i < totalColumns; i++) {
        columnStyles[i] = {
          cellWidth: firmaColWidth,
          halign: 'center',
          fontSize: 5,
          overflow: 'linebreak'
        };
      }

      // Tablo oluştur
      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 28,
        styles: {
          fontSize: 6,
          cellPadding: 1.5,
          overflow: 'linebreak',
          halign: 'center',
          valign: 'middle',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontSize: 6,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 2
        },
        columnStyles: columnStyles,
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { top: 28, right: 10, bottom: 10, left: 10 },
        theme: 'grid',
        tableWidth: 'auto'
      });

      // Özet istatistikler - Yeni sayfa veya son satırın altına
      const finalY = (doc as any).lastAutoTable.finalY || 28;
      
      // Eğer sayfa sonuna yakınsak yeni sayfa ekle
      if (finalY > 180) {
        doc.addPage();
        doc.setFontSize(10);
        doc.text('Ozet Istatistikler:', 14, 15);
        
        doc.setFontSize(8);
        const stats = [
          `Toplam Kurulus: ${bankPFRecords.length}`,
          `Banka: ${bankPFRecords.filter(f => f.bankaOrPF === 'Banka').length}`,
          `EPK: ${bankPFRecords.filter(f => f.odemeKurulusuTipi === 'EPK').length}`,
          `OK: ${bankPFRecords.filter(f => f.odemeKurulusuTipi === 'ÖK').length}`,
          `Farkli Gorev: ${jobTitles.length}`,
          `Toplam Kisi: ${bankPFRecords.reduce((sum, f) => sum + (f.iletisimMatrisi?.length || 0), 0)}`
        ];
        
        stats.forEach((stat, index) => {
          doc.text(stat, 14, 22 + (index * 5));
        });
      } else {
        doc.setFontSize(10);
        doc.text('Ozet Istatistikler:', 14, finalY + 10);
        
        doc.setFontSize(8);
        const stats = [
          `Toplam Kurulus: ${bankPFRecords.length}`,
          `Banka: ${bankPFRecords.filter(f => f.bankaOrPF === 'Banka').length}`,
          `EPK: ${bankPFRecords.filter(f => f.odemeKurulusuTipi === 'EPK').length}`,
          `OK: ${bankPFRecords.filter(f => f.odemeKurulusuTipi === 'ÖK').length}`,
          `Farkli Gorev: ${jobTitles.length}`,
          `Toplam Kisi: ${bankPFRecords.reduce((sum, f) => sum + (f.iletisimMatrisi?.length || 0), 0)}`
        ];
        
        stats.forEach((stat, index) => {
          doc.text(stat, 14, finalY + 16 + (index * 5));
        });
      }

      // PDF'i kaydet
      const fileName = `iletisim-matrisi-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success(`PDF basariyla olusturuldu!\n${fileName}`);
    } catch (error) {
      console.error('PDF olusturma hatasi:', error);
      toast.error(`PDF olusturulurken hata olustu!\n${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  const jobTitles = getAllJobTitles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Raporlar</h2>
          <p className="text-sm font-medium text-gray-600 mt-1">Tüm verileriniz için detaylı raporlar ve analizler</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="banka-pf">
            <Building2 size={16} className="mr-2" />
            Banka/PF
          </TabsTrigger>
          <TabsTrigger value="iletisim-matrisi">
            <Users size={16} className="mr-2" />
            İletişim Matrisi
          </TabsTrigger>
          <TabsTrigger value="musteriler">
            <Users size={16} className="mr-2" />
            Müşteriler
          </TabsTrigger>
          <TabsTrigger value="domain">
            <Database size={16} className="mr-2" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="tabela">
            <BarChart3 size={16} className="mr-2" />
            Tabela
          </TabsTrigger>
          <TabsTrigger value="hakedis">
            <Calculator size={16} className="mr-2" />
            Hakediş
          </TabsTrigger>
        </TabsList>

        {/* İletişim Matrisi Tab */}
        <TabsContent value="iletisim-matrisi" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>İletişim Matrisi - Banka / EPK / ÖK</CardTitle>
                  <CardDescription>
                    Tüm kuruluşların görev bazında iletişim bilgileri
                  </CardDescription>
                </div>
                <Button 
                  variant="default" 
                  onClick={handleExportPDF}
                  className="flex items-center gap-2"
                  disabled={bankPFRecords.length === 0 || jobTitles.length === 0}
                >
                  <FileDown size={16} />
                  PDF İndir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bankPFRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Henüz Banka/PF kaydı bulunmuyor.</p>
                </div>
              ) : jobTitles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Henüz iletişim matrisi verisi bulunmuyor.</p>
                  <p className="text-sm mt-2">Banka/PF detay sayfalarından iletişim kişileri ekleyin.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-white z-10 border-r-2 border-gray-300 min-w-[200px]">
                          Görev
                        </TableHead>
                        {bankPFRecords.map(firma => (
                          <TableHead 
                            key={firma.id} 
                            colSpan={3}
                            className="text-center border-r-2 border-gray-300 bg-blue-50"
                          >
                            <div className="space-y-1">
                              <div>{firma.firmaUnvan}</div>
                              <div className="text-xs text-gray-500">
                                {firma.bankaOrPF === 'PF' && firma.odemeKurulusuTipi && (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    {firma.odemeKurulusuTipi}
                                  </span>
                                )}
                                {firma.bankaOrPF === 'Banka' && (
                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                    Banka
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-white z-10 border-r-2 border-gray-300"></TableHead>
                        {bankPFRecords.map(firma => (
                          <Fragment key={`${firma.id}-headers`}>
                            <TableHead className="text-center bg-gray-50 text-xs">
                              Adı Soyadı
                            </TableHead>
                            <TableHead className="text-center bg-gray-50 text-xs">
                              Cep
                            </TableHead>
                            <TableHead className="text-center bg-gray-50 border-r-2 border-gray-300 text-xs">
                              E-Posta
                            </TableHead>
                          </Fragment>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobTitles.map((jobTitle, rowIndex) => (
                        <TableRow key={jobTitle} className={rowIndex % 2 === 0 ? 'bg-gray-50/30' : ''}>
                          <TableCell className="sticky left- bg-white z-10 border-r-2 border-gray-300 text-xs">
                            {jobTitle}
                          </TableCell>
                          {bankPFRecords.map(firma => {
                            const contacts = getContactsForFirmaAndJob(firma, jobTitle);
                            return (
                              <Fragment key={`${firma.id}-${jobTitle}`}>
                                <TableCell 
                                  className={`text-center text-xs ${contacts.length > 0 ? 'bg-green-50' : ''}`}
                                >
                                  {contacts.length > 0 ? (
                                    <div className="space-y-1">
                                      {contacts.map(contact => (
                                        <div key={contact.id}>{contact.adiSoyadi}</div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                                <TableCell 
                                  className={`text-center text-xs ${contacts.length > 0 ? 'bg-green-50' : ''}`}
                                >
                                  {contacts.length > 0 ? (
                                    <div className="space-y-1">
                                      {contacts.map(contact => (
                                        <div key={contact.id}>{contact.gsm || contact.tel || '-'}</div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                                <TableCell 
                                  className={`text-center text-xs border-r-2 border-gray-300 ${contacts.length > 0 ? 'bg-green-50' : ''}`}
                                >
                                  {contacts.length > 0 ? (
                                    <div className="space-y-1">
                                      {contacts.map(contact => (
                                        <div key={contact.id} className="truncate max-w-[200px]">
                                          {contact.mail || '-'}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                              </Fragment>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}


            </CardContent>
          </Card>
        </TabsContent>

        {/* Tabela Raporu Tab */}
        <TabsContent value="tabela" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>TABELA Raporu</CardTitle>
                  <CardDescription>
                    Tüm firmaların TABELA kayıtları ve özet bilgileri
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSimulationDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Calculator size={16} />
                    Simülasyon
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => {
                      // TABELA PDF export fonksiyonu
                    try {
                      const allTabelaRecords = bankPFRecords.flatMap(firma => 
                        (firma.tabelaRecords || [])
                          .filter(tr => !tr.kapanmaTarihi) // Sadece aktif TABELA kayıtları
                          .map(tr => ({
                            ...tr,
                            firmaUnvan: firma.firmaUnvan,
                            firmaTip: firma.bankaOrPF === 'PF' ? firma.odemeKurulusuTipi : 'Banka'
                          }))
                      );

                      if (allTabelaRecords.length === 0) {
                        toast.error('PDF oluşturmak için TABELA kaydı bulunmuyor!');
                        return;
                      }

                      const doc = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: 'a4'
                      });

                      doc.setFontSize(16);
                      doc.text('TABELA Raporu', 14, 15);
                      
                      doc.setFontSize(10);
                      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);

                      // Tablo başlıkları
                      const headers = [['Firma', 'Tip', 'Gelir Modeli', 'Urun', 'Kart Tipi', 'Yurt', 'Program', 'Kurulus%', 'OXIVO%', 'Tarih']];

                      // Tablo verileri (Sadece aktif TABELA kayıtları)
                      const tableData = allTabelaRecords.map(tr => [
                        tr.firmaUnvan || '-',
                        tr.firmaTip || '-',
                        tr.gelirModeli?.ad || '-',
                        tr.urunTipi || '-',
                        tr.kartTipi || '-',
                        tr.yurtIciDisi || '-',
                        tr.kartProgramIds?.includes('ALL') ? 'Tumü' : `${(tr.kartProgramIds || []).length}`,
                        tr.kurulusOrani ? `${tr.kurulusOrani}%` : '-',
                        tr.oxivoOrani ? `${tr.oxivoOrani}%` : '-',
                        new Date(tr.olusturmaTarihi).toLocaleDateString('tr-TR')
                      ]);

                      autoTable(doc, {
                        head: headers,
                        body: tableData,
                        startY: 28,
                        styles: {
                          fontSize: 7,
                          cellPadding: 2,
                          overflow: 'linebreak',
                          halign: 'center',
                          valign: 'middle'
                        },
                        headStyles: {
                          fillColor: [249, 115, 22],
                          textColor: [255, 255, 255],
                          fontSize: 8,
                          fontStyle: 'bold',
                          halign: 'center'
                        },
                        alternateRowStyles: {
                          fillColor: [249, 250, 251]
                        },
                        columnStyles: {
                          0: { cellWidth: 40, halign: 'left' }, // Firma
                          1: { cellWidth: 20 }, // Tip
                          2: { cellWidth: 35, halign: 'left' }, // Gelir Modeli
                          3: { cellWidth: 25 }, // Ürün
                          4: { cellWidth: 25 }, // Kart Tipi
                          5: { cellWidth: 20 }, // Yurt
                          6: { cellWidth: 22 }, // Program
                          7: { cellWidth: 22 }, // Kuruluş%
                          8: { cellWidth: 22 }, // OXIVO%
                          9: { cellWidth: 28 } // Tarih
                        },
                        margin: { top: 28, right: 10, bottom: 10, left: 10 },
                        theme: 'grid'
                      });

                      // Özet istatistikler
                      const finalY = (doc as any).lastAutoTable.finalY || 28;
                      const firmaCount = bankPFRecords.filter(f => 
                        (f.tabelaRecords?.filter(tr => !tr.kapanmaTarihi)?.length || 0) > 0
                      ).length;

                      if (finalY > 180) {
                        doc.addPage();
                        doc.setFontSize(10);
                        doc.text('Ozet Istatistikler:', 14, 15);
                        doc.setFontSize(8);
                        const stats = [
                          `Aktif TABELA: ${allTabelaRecords.length}`,
                          `Firmalar: ${firmaCount}`
                        ];
                        stats.forEach((stat, index) => {
                          doc.text(stat, 14, 22 + (index * 5));
                        });
                      } else {
                        doc.setFontSize(10);
                        doc.text('Ozet Istatistikler:', 14, finalY + 10);
                        doc.setFontSize(8);
                        const stats = [
                          `Aktif TABELA: ${allTabelaRecords.length}`,
                          `Firmalar: ${firmaCount}`
                        ];
                        stats.forEach((stat, index) => {
                          doc.text(stat, 14, finalY + 16 + (index * 5));
                        });
                      }

                      const fileName = `tabela-raporu-${new Date().toISOString().split('T')[0]}.pdf`;
                      doc.save(fileName);
                      toast.success(`PDF başarıyla oluşturuldu!\\n${fileName}`);
                    } catch (error) {
                      console.error('PDF oluşturma hatası:', error);
                      toast.error('PDF oluşturulurken hata oluştu!');
                    }
                  }}
                  className="flex items-center gap-2"
                  disabled={bankPFRecords.reduce((sum, f) => sum + (f.tabelaRecords?.filter(tr => !tr.kapanmaTarihi)?.length || 0), 0) === 0}
                >
                  <FileDown size={16} />
                  PDF İndir
                </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {bankPFRecords.reduce((sum, f) => sum + (f.tabelaRecords?.filter(tr => !tr.kapanmaTarihi)?.length || 0), 0) === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Henüz aktif TABELA kaydı bulunmuyor.</p>
                  <p className="text-sm mt-2">Banka/PF detay sayfalarından TABELA kayıtları ekleyin.</p>
                </div>
              ) : (
                <div className="space-y-8">{/* Firma bazlı TABELA raporları */}
                {bankPFRecords
                  .filter(firma => (firma.tabelaRecords || []).length > 0)
                  .map(firma => {
                    // Her firma için aktif TABELA kayıtlarını grupla
                    // Hem TABELA kaydı aktif olmalı (kapanmamış) hem de ait olduğu grup aktif olmalı
                    const aktifTabelalar = (firma.tabelaRecords || []).filter(t => {
                      // TABELA kaydı kapanmamış olmalı
                      if (t.kapanmaTarihi) return false;
                      
                      // TABELA'nın ait olduğu grubu bul
                      const tabelaGroup = firma.tabelaGroups?.find(g => 
                        g.recordIds.includes(t.id)
                      );
                      
                      // Grup bulundu mu ve aktif mi?
                      return tabelaGroup && tabelaGroup.aktif === true;
                    });
                    
                    if (aktifTabelalar.length === 0) return null;

                    return (
                      <div key={firma.id} className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50/30">
                        {/* Firma Başlığı */}
                        <div className="mb-4 pb-3 border-b-2 border-orange-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="text-orange-900">{firma.firmaUnvan}</h3>
                              {firma.bankaOrPF === 'PF' ? (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                  {firma.odemeKurulusuTipi}
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                  Banka
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">
                              {aktifTabelalar.length} aktif TABELA
                            </span>
                          </div>
                        </div>

                        {/* Her TABELA Grubu için tablo */}
                        <div className="space-y-6">
                          {/* Gruplu TABELA kayıtları */}
                          {firma.tabelaGroups?.filter(g => g.aktif !== false).map((tabelaGroup) => {
                            // Bu gruba ait aktif kayıtları al
                            const grupTabelalar = aktifTabelalar.filter(t => 
                              tabelaGroup.recordIds.includes(t.id)
                            );
                            
                            if (grupTabelalar.length === 0) return null;
                            
                            // İlk kaydı referans al (ürün, kart tipi, gelir modeli aynı olmalı)
                            const referansTabela = grupTabelalar[0];
                            
                            // Gelir modeli kontrolü
                            const isSabitKomisyon = referansTabela.gelirModeli?.ad === 'Sabit Komisyon';
                            
                            // Yurt İçi ve Yurt Dışı kayıtlarını ayır
                            const yurtIciTabela = grupTabelalar.find(t => t.yurtIciDisi === 'Yurt İçi');
                            const yurtDisiTabela = grupTabelalar.find(t => t.yurtIciDisi === 'Yurt Dışı');
                            
                            // Vade listesi - ilk kayıttan al
                            const aktifVadeler = (referansTabela.komisyonOranları || [])
                              .filter(k => k.aktif)
                              .map(k => k.vade);
                            
                            if (aktifVadeler.length === 0) return null;

                            // Kart programlarını al
                            let kartPrograms: Array<{ id: string; ad: string }> = [];
                            if (referansTabela.kartProgramIds?.includes('ALL')) {
                              kartPrograms = kartProgramlar
                                .filter(kp => kp.aktif)
                                .map(kp => ({ id: kp.id, ad: kp.kartAdi }));
                            } else if (referansTabela.kartProgramIds) {
                              kartPrograms = referansTabela.kartProgramIds
                                .map(id => {
                                  const kp = kartProgramlar.find(k => k.id === id);
                                  return kp ? { id: kp.id, ad: kp.kartAdi } : null;
                                })
                                .filter((kp): kp is { id: string; ad: string } => kp !== null);
                            }

                            if (kartPrograms.length === 0) return null;

                            return (
                              <div key={`${firma.id}-${tabelaGroup.id}`} className="bg-white rounded-lg border border-orange-200">
                                {/* TABELA Başlık Bilgileri */}
                                <div className="px-4 py-3 bg-orange-100 border-b border-orange-200 rounded-t-lg">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <Badge variant="outline" className="bg-white">
                                        {/* Grup ve Geçerlilik bilgisi */}
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                                          Grup: {tabelaGroup.name}
                                        </Badge>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                          {new Date(tabelaGroup.gecerlilikBaslangic).toLocaleDateString('tr-TR')}
                                          {tabelaGroup.gecerlilikBitis && ` - ${new Date(tabelaGroup.gecerlilikBitis).toLocaleDateString('tr-TR')}`}
                                        </Badge>
                                        {referansTabela.gelirModeli?.ad || 'Gelir Modeli'}
                                      </Badge>
                                      <Badge variant="outline" className="bg-white">
                                        {referansTabela.urun || 'Ürün'}
                                      </Badge>
                                      <Badge variant="outline" className="bg-white">
                                        {referansTabela.kartTipi}
                                      </Badge>
                                      {referansTabela.paylaşımOranları?.kurulusOrani && referansTabela.paylaşımOranları?.oxivoOrani && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                          Payla��ım: {referansTabela.paylaşımOranları.kurulusOrani}% / {referansTabela.paylaşımOranları.oxivoOrani}%
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {new Date(referansTabela.olusturmaTarihi).toLocaleDateString('tr-TR')}
                                    </span>
                                  </div>
                                </div>

                                {/* Kart Program x Kullanım x Vade Tablosu */}
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      {/* Başlık Satırı 1: Kart Tipi */}
                                      <TableRow className="bg-gray-100">
                                        <TableHead rowSpan={4} className="border-r-2 border-gray-300 bg-white sticky left-0 z-10 align-middle">
                                          Kart Tipi
                                        </TableHead>
                                        <TableHead colSpan={isSabitKomisyon ? aktifVadeler.length * 2 : aktifVadeler.length * 4} className="text-center border-r border-gray-200">
                                          {referansTabela.kartTipi}
                                        </TableHead>
                                      </TableRow>
                                      
                                      {/* Başlık Satırı 2: Kullanım (Yurt İçi / Yurt Dışı) */}
                                      <TableRow className="bg-gray-50">
                                        <TableHead colSpan={isSabitKomisyon ? aktifVadeler.length : aktifVadeler.length * 2} className="text-center border-r-2 border-gray-400">
                                          Yurt İçi
                                        </TableHead>
                                        <TableHead colSpan={isSabitKomisyon ? aktifVadeler.length : aktifVadeler.length * 2} className="text-center border-r border-gray-200">
                                          Yurt Dışı
                                        </TableHead>
                                      </TableRow>
                                      
                                      {/* Başlık Satırı 3: Vadeler */}
                                      <TableRow className="bg-gray-50">
                                        {/* Yurt İçi vadeler */}
                                        {aktifVadeler.map((vade, vIndex) => {
                                          const vadeData = yurtIciTabela?.komisyonOranları?.find(k => k.vade === vade);
                                          const isInactive = vadeData?.aktif === false;
                                          
                                          return (
                                            <TableHead 
                                              key={`yurtici-${vIndex}`}
                                              colSpan={isSabitKomisyon ? 1 : 2}
                                              className={`text-center border-r border-gray-200 ${
                                                vIndex === aktifVadeler.length - 1 ? 'border-r-2 border-gray-400' : ''
                                              } ${isInactive ? 'line-through text-gray-400' : ''}`}
                                            >
                                              {vade.replace(' (Peşin)', '')}
                                            </TableHead>
                                          );
                                        })}
                                        {/* Yurt Dışı vadeler */}
                                        {aktifVadeler.map((vade, vIndex) => {
                                          const vadeData = yurtDisiTabela?.komisyonOranları?.find(k => k.vade === vade);
                                          const isInactive = vadeData?.aktif === false;
                                          
                                          return (
                                            <TableHead 
                                              key={`yurtdisi-${vIndex}`}
                                              colSpan={isSabitKomisyon ? 1 : 2}
                                              className={`text-center border-r border-gray-200 ${isInactive ? 'line-through text-gray-400' : ''}`}
                                            >
                                              {vade.replace(' (Peşin)', '')}
                                            </TableHead>
                                          );
                                        })}
                                      </TableRow>

                                      {/* Başlık Satırı 4: Kar% (Sabit Komisyon) veya Alış/Satış (%) */}
                                      <TableRow className="bg-gray-50">
                                        {isSabitKomisyon ? (
                                          <>
                                            {/* Sabit Komisyon - Yurt İçi Kar% başlıkları */}
                                            {aktifVadeler.map((vade, vIndex) => (
                                              <TableHead 
                                                key={`yurtici-kar-${vIndex}`}
                                                className={`text-center text-xs bg-amber-50 min-w-[80px] ${
                                                  vIndex === aktifVadeler.length - 1 ? 'border-r-2 border-gray-400' : 'border-r border-gray-200'
                                                }`}
                                              >
                                                Kar%
                                              </TableHead>
                                            ))}
                                            {/* Sabit Komisyon - Yurt Dışı Kar% başlıkları */}
                                            {aktifVadeler.map((vade, vIndex) => (
                                              <TableHead 
                                                key={`yurtdisi-kar-${vIndex}`}
                                                className={`text-center text-xs bg-amber-50 min-w-[80px] ${
                                                  vIndex === aktifVadeler.length - 1 ? 'border-r border-gray-200' : 'border-r border-gray-200'
                                                }`}
                                              >
                                                Kar%
                                              </TableHead>
                                            ))}
                                          </>
                                        ) : (
                                          <>
                                            {/* Paçal / Gelir Ortaklığı - Yurt İçi Alış/Satış başlıkları */}
                                            {aktifVadeler.map((vade, vIndex) => (
                                              <Fragment key={`yurtici-subsub-${vIndex}`}>
                                                <TableHead className="text-center text-xs border-r border-gray-100 bg-blue-50 min-w-[80px]">
                                                  Alış (%)
                                                </TableHead>
                                                <TableHead className={`text-center text-xs bg-green-50 min-w-[80px] ${
                                                  vIndex === aktifVadeler.length - 1 ? 'border-r-2 border-gray-400' : 'border-r border-gray-200'
                                                }`}>
                                                  Satış (%)
                                                </TableHead>
                                              </Fragment>
                                            ))}
                                            {/* Paçal / Gelir Ortaklığı - Yurt Dışı Alış/Satış başlıkları */}
                                            {aktifVadeler.map((vade, vIndex) => (
                                              <Fragment key={`yurtdisi-subsub-${vIndex}`}>
                                                <TableHead className="text-center text-xs border-r border-gray-100 bg-blue-50 min-w-[80px]">
                                                  Alış (%)
                                                </TableHead>
                                                <TableHead className={`text-center text-xs bg-green-50 min-w-[80px] ${
                                                  vIndex === aktifVadeler.length - 1 ? 'border-r border-gray-200' : 'border-r border-gray-200'
                                                }`}>
                                                  Satış (%)
                                                </TableHead>
                                              </Fragment>
                                            ))}
                                          </>
                                        )}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {kartPrograms.map((program, pIndex) => (
                                        <TableRow 
                                          key={program.id}
                                          className={pIndex % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}
                                        >
                                          <TableCell className="border-r-2 border-gray-300 bg-white sticky left-0 z-10">
                                            {program.ad}
                                          </TableCell>
                                          
                                          {/* Yurt İçi değerleri */}
                                          {aktifVadeler.map((vade, vIndex) => {
                                            // Yurt İçi kaydını kullan
                                            const vadeData = yurtIciTabela?.komisyonOranları?.find(k => k.vade === vade);
                                            const isInactive = vadeData?.aktif === false;
                                            
                                            // Sabit Komisyon için tek sütun, diğerleri için çift sütun
                                            if (isSabitKomisyon) {
                                              const karValue = vadeData?.oran || '';
                                              return (
                                                <TableCell 
                                                  key={`yurtici-${vIndex}`}
                                                  className={`text-center ${
                                                    vIndex === aktifVadeler.length - 1 ? 'border-r-2 border-gray-400' : 'border-r border-gray-200'
                                                  } ${isInactive ? 'bg-gray-100' : 'bg-amber-50/30'}`}
                                                >
                                                  {karValue && karValue !== '' ? (
                                                    <span className={`text-sm ${isInactive ? 'line-through text-gray-400' : ''}`}>
                                                      {parseFloat(karValue).toFixed(2)}%
                                                    </span>
                                                  ) : (
                                                    <span className={isInactive ? 'text-gray-300 line-through' : 'text-gray-300'}>-</span>
                                                  )}
                                                </TableCell>
                                              );
                                            } else {
                                              // Paçal ve Gelir Ortaklığı için: alisTL ve satisTL
                                              const alisValue = vadeData?.alisTL || '';
                                              const satisValue = vadeData?.satisTL || '';
                                              
                                              return (
                                                <Fragment key={`yurtici-${vIndex}`}>
                                                  {/* Alış (%) */}
                                                  <TableCell 
                                                    className={`text-center border-r border-gray-100 ${isInactive ? 'bg-gray-100' : 'bg-blue-50/30'}`}
                                                  >
                                                    {alisValue && alisValue !== '' ? (
                                                      <span className={`text-sm ${isInactive ? 'line-through text-gray-400' : ''}`}>
                                                        {parseFloat(alisValue).toFixed(2)}%
                                                      </span>
                                                    ) : (
                                                      <span className={isInactive ? 'text-gray-300 line-through' : 'text-gray-300'}>-</span>
                                                    )}
                                                  </TableCell>
                                                  {/* Satış (%) */}
                                                  <TableCell 
                                                    className={`text-center ${
                                                      vIndex === aktifVadeler.length - 1 ? 'border-r-2 border-gray-400' : 'border-r border-gray-200'
                                                    } ${isInactive ? 'bg-gray-100' : 'bg-green-50/30'}`}
                                                  >
                                                    {satisValue && satisValue !== '' ? (
                                                      <span className={`text-sm ${isInactive ? 'line-through text-gray-400' : ''}`}>
                                                        {parseFloat(satisValue).toFixed(2)}%
                                                      </span>
                                                    ) : (
                                                      <span className={isInactive ? 'text-gray-300 line-through' : 'text-gray-300'}>-</span>
                                                    )}
                                                  </TableCell>
                                                </Fragment>
                                              );
                                            }
                                          })}
                                          
                                          {/* Yurt Dışı değerleri */}
                                          {aktifVadeler.map((vade, vIndex) => {
                                            // Yurt Dışı kaydını kullan
                                            const vadeData = yurtDisiTabela?.komisyonOranları?.find(k => k.vade === vade);
                                            const isInactive = vadeData?.aktif === false;
                                            
                                            // Sabit Komisyon için tek sütun, diğerleri için çift sütun
                                            if (isSabitKomisyon) {
                                              const karValue = vadeData?.oran || '';
                                              return (
                                                <TableCell 
                                                  key={`yurtdisi-${vIndex}`}
                                                  className={`text-center border-r border-gray-200 ${isInactive ? 'bg-gray-100' : 'bg-amber-50/30'}`}
                                                >
                                                  {karValue && karValue !== '' ? (
                                                    <span className={`text-sm ${isInactive ? 'line-through text-gray-400' : ''}`}>
                                                      {parseFloat(karValue).toFixed(2)}%
                                                    </span>
                                                  ) : (
                                                    <span className={isInactive ? 'text-gray-300 line-through' : 'text-gray-300'}>-</span>
                                                  )}
                                                </TableCell>
                                              );
                                            } else {
                                              // Paçal ve Gelir Ortaklığı için: alisTL ve satisTL
                                              const alisValue = vadeData?.alisTL || '';
                                              const satisValue = vadeData?.satisTL || '';
                                              
                                              return (
                                                <Fragment key={`yurtdisi-${vIndex}`}>
                                                  {/* Alış (%) */}
                                                  <TableCell 
                                                    className={`text-center border-r border-gray-100 ${isInactive ? 'bg-gray-100' : 'bg-blue-50/30'}`}
                                                  >
                                                    {alisValue && alisValue !== '' ? (
                                                      <span className={`text-sm ${isInactive ? 'line-through text-gray-400' : ''}`}>
                                                        {parseFloat(alisValue).toFixed(2)}%
                                                      </span>
                                                    ) : (
                                                      <span className={isInactive ? 'text-gray-300 line-through' : 'text-gray-300'}>-</span>
                                                    )}
                                                  </TableCell>
                                                  {/* Satış (%) */}
                                                  <TableCell 
                                                    className={`text-center border-r border-gray-200 ${isInactive ? 'bg-gray-100' : 'bg-green-50/30'}`}
                                                  >
                                                    {satisValue && satisValue !== '' ? (
                                                      <span className={`text-sm ${isInactive ? 'line-through text-gray-400' : ''}`}>
                                                        {parseFloat(satisValue).toFixed(2)}%
                                                      </span>
                                                    ) : (
                                                      <span className={isInactive ? 'text-gray-300 line-through' : 'text-gray-300'}>-</span>
                                                    )}
                                                  </TableCell>
                                                </Fragment>
                                              );
                                            }
                                          })}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                {/* Açıklama varsa göster */}
                                {(yurtIciTabela?.aciklama || yurtDisiTabela?.aciklama) && (
                                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg space-y-1">
                                    {yurtIciTabela?.aciklama && (
                                      <p className="text-xs text-gray-600">
                                        <span className="font-medium">Yurt İçi Not:</span> {yurtIciTabela.aciklama}
                                      </p>
                                    )}
                                    {yurtDisiTabela?.aciklama && (
                                      <p className="text-xs text-gray-600">
                                        <span className="font-medium">Yurt Dışı Not:</span> {yurtDisiTabela.aciklama}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Müşteriler Raporu Tab */}
        <TabsContent value="musteriler" className="space-y-6">
          <CustomerReportTab 
            customers={customers}
            bankPFRecords={bankPFRecords}
          />
        </TabsContent>

        {/* Domain Raporu Tab */}
        <TabsContent value="domain" className="space-y-6">
          <DomainReportTab customers={customers} />
        </TabsContent>

        {/* Banka/PF Raporu Tab */}
        <TabsContent value="banka-pf" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banka/PF Raporu</CardTitle>
              <CardDescription>
                Tüm Banka ve Ödeme Kuruluşlarının özet bilgileri ve üye işyeri ilişkileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="genel-ozet" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="genel-ozet">Genel Özet</TabsTrigger>
                  <TabsTrigger value="uiy-listesi">ÜİY Listesi</TabsTrigger>
                </TabsList>

                {/* Genel Özet Alt Sekmesi */}
                <TabsContent value="genel-ozet" className="space-y-4 mt-4">
                  <div className="flex items-center justify-end mb-4">
                    <Button 
                      variant="default" 
                      onClick={() => {
                        // Banka/PF PDF export
                        try {
                      if (bankPFRecords.length === 0) {
                        toast.error('PDF oluşturmak için Banka/PF kaydı bulunmuyor!');
                        return;
                      }

                      const doc = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: 'a4'
                      });

                      doc.setFontSize(16);
                      doc.text('Banka / PF Raporu', 14, 15);
                      
                      doc.setFontSize(10);
                      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);

                      // ÖZET TABLOSU - Üye İşyeri ve Cihaz Sayıları
                      let currentY = 30;
                      
                      doc.setFontSize(12);
                      doc.setFont(undefined, 'bold');
                      doc.text('Banka/PF Ozet Tablosu - Uye Isyeri ve Cihaz Sayilari', 14, currentY);
                      currentY += 8;
                      
                      // Özet tablo başlıkları
                      const ozetHeaders = [['Firma Unvan', 'Tip', 'Uye Isyeri', 'Cihaz']];
                      
                      // Özet tablo verileri
                      const ozetTableData = bankPFRecords.map(record => {
                        const uiyCount = record.uyeIsyerleri?.length || 0;
                        const deviceCount = record.uyeIsyerleri?.reduce((sum, uiy) => {
                          const customer = customers.find(c => c.id === uiy.cariId);
                          if (!customer) return sum;
                          const customerDevices = customer.products?.filter(p => 
                            p.serialNumber && 
                            p.serialNumber.trim() !== '' &&
                            !p.iptalTarihi
                          ).length || 0;
                          return sum + customerDevices;
                        }, 0) || 0;
                        
                        return [
                          record.firmaUnvan || '-',
                          record.bankaOrPF === 'PF' ? record.odemeKurulusuTipi || 'PF' : 'Banka',
                          uiyCount.toString(),
                          deviceCount.toString()
                        ];
                      });
                      
                      autoTable(doc, {
                        head: ozetHeaders,
                        body: ozetTableData,
                        startY: currentY,
                        styles: {
                          fontSize: 8,
                          cellPadding: 2,
                          overflow: 'linebreak',
                          halign: 'center',
                          valign: 'middle'
                        },
                        headStyles: {
                          fillColor: [147, 51, 234], // Purple
                          textColor: [255, 255, 255],
                          fontSize: 9,
                          fontStyle: 'bold',
                          halign: 'center'
                        },
                        alternateRowStyles: {
                          fillColor: [249, 250, 251]
                        },
                        columnStyles: {
                          0: { cellWidth: 80, halign: 'left' },
                          1: { cellWidth: 30 },
                          2: { cellWidth: 30 },
                          3: { cellWidth: 30 }
                        },
                        margin: { top: currentY, right: 10, bottom: 10, left: 10 },
                        theme: 'grid'
                      });
                      
                      // Yeni sayfa ekle
                      doc.addPage();

                      // DETAYLI TABLO
                      doc.setFontSize(12);
                      doc.setFont(undefined, 'bold');
                      doc.text('Detayli Banka/PF Bilgileri', 14, 15);
                      
                      // Tablo başlıkları
                      const headers = [['Firma Ünvan', 'Tip', 'Muhasebe Kodu', 'Vergi No', 'Telefon', 'E-Posta', 'Durum']];

                      // Tablo verileri
                      const tableData = bankPFRecords.map(record => [
                        record.firmaUnvan || '-',
                        record.bankaOrPF === 'PF' ? record.odemeKurulusuTipi || 'PF' : 'Banka',
                        record.muhasebeKodu || '-',
                        record.vergiNo || '-',
                        record.telefon || '-',
                        record.email || '-',
                        record.durum || 'Aktif'
                      ]);

                      autoTable(doc, {
                        head: headers,
                        body: tableData,
                        startY: 22,
                        styles: {
                          fontSize: 8,
                          cellPadding: 2,
                          overflow: 'linebreak',
                          halign: 'center',
                          valign: 'middle'
                        },
                        headStyles: {
                          fillColor: [59, 130, 246],
                          textColor: [255, 255, 255],
                          fontSize: 9,
                          fontStyle: 'bold',
                          halign: 'center'
                        },
                        alternateRowStyles: {
                          fillColor: [249, 250, 251]
                        },
                        columnStyles: {
                          0: { cellWidth: 50, halign: 'left' },
                          1: { cellWidth: 25 },
                          2: { cellWidth: 30 },
                          3: { cellWidth: 35 },
                          4: { cellWidth: 35 },
                          5: { cellWidth: 50, halign: 'left' },
                          6: { cellWidth: 20 }
                        },
                        margin: { top: 28, right: 10, bottom: 10, left: 10 },
                        theme: 'grid'
                      });

                      // Özet istatistikler
                      const finalY = (doc as any).lastAutoTable.finalY || 28;
                      const bankaCount = bankPFRecords.filter(f => f.bankaOrPF === 'Banka').length;
                      const epkCount = bankPFRecords.filter(f => f.odemeKurulusuTipi === 'EPK').length;
                      const okCount = bankPFRecords.filter(f => f.odemeKurulusuTipi === 'ÖK').length;
                      const aktifCount = bankPFRecords.filter(f => f.durum === 'Aktif').length;
                      
                      // Toplam üye işyeri ve cihaz sayıları
                      const totalUiyCount = bankPFRecords.reduce((sum, pf) => sum + (pf.uyeIsyerleri?.length || 0), 0);
                      const totalDeviceCount = bankPFRecords.reduce((sum, pf) => {
                        const pfDevices = pf.uyeIsyerleri?.reduce((devSum, uiy) => {
                          const customer = customers.find(c => c.id === uiy.cariId);
                          if (!customer) return devSum;
                          const customerDevices = customer.products?.filter(p => 
                            p.serialNumber && 
                            p.serialNumber.trim() !== '' &&
                            !p.iptalTarihi
                          ).length || 0;
                          return devSum + customerDevices;
                        }, 0) || 0;
                        return sum + pfDevices;
                      }, 0);

                      if (finalY > 180) {
                        doc.addPage();
                        doc.setFontSize(10);
                        doc.text('Ozet Istatistikler:', 14, 15);
                        doc.setFontSize(8);
                        const stats = [
                          `Toplam Kurulus: ${bankPFRecords.length}`,
                          `Banka: ${bankaCount}`,
                          `EPK: ${epkCount}`,
                          `OK: ${okCount}`,
                          `Aktif: ${aktifCount}`,
                          `Pasif: ${bankPFRecords.length - aktifCount}`,
                          `Toplam Uye Isyeri: ${totalUiyCount}`,
                          `Toplam Cihaz: ${totalDeviceCount}`
                        ];
                        stats.forEach((stat, index) => {
                          doc.text(stat, 14, 22 + (index * 5));
                        });
                      } else {
                        doc.setFontSize(10);
                        doc.text('Ozet Istatistikler:', 14, finalY + 10);
                        doc.setFontSize(8);
                        const stats = [
                          `Toplam Kurulus: ${bankPFRecords.length}`,
                          `Banka: ${bankaCount}`,
                          `EPK: ${epkCount}`,
                          `OK: ${okCount}`,
                          `Aktif: ${aktifCount}`,
                          `Pasif: ${bankPFRecords.length - aktifCount}`,
                          `Toplam Uye Isyeri: ${totalUiyCount}`,
                          `Toplam Cihaz: ${totalDeviceCount}`
                        ];
                        stats.forEach((stat, index) => {
                          doc.text(stat, 14, finalY + 16 + (index * 5));
                        });
                      }

                      const fileName = `banka-pf-raporu-${new Date().toISOString().split('T')[0]}.pdf`;
                      doc.save(fileName);
                      toast.success(`PDF başarıyla oluşturuldu!\n${fileName}`);
                    } catch (error) {
                      console.error('PDF oluşturma hatası:', error);
                      toast.error('PDF oluşturulurken hata oluştu!');
                    }
                  }}
                  className="flex items-center gap-2"
                      disabled={bankPFRecords.length === 0}
                    >
                      <FileDown size={16} />
                      PDF İndir
                    </Button>
                  </div>

                  {bankPFRecords.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
                          <p>Henüz Banka/PF kaydı bulunmuyor.</p>
                      <p className="text-sm mt-2">Banka/PF modülünden kayıt ekleyin.</p>
                    </div>
                  ) : (
                    <>
                      {/* Özet İstatistikler */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600">Toplam Kuruluş</p>
                            <h3 className="text-blue-700 mt-1">{bankPFRecords.length}</h3>
                            <p className="text-xs text-blue-500 mt-1">
                              {(() => {
                                const totalCustomers = bankPFRecords.reduce((sum, pf) => {
                                  const assignedCustomers = customers.filter(c => 
                                    pf.uyeIsyerleri?.some(uiy => uiy.cariId === c.id)
                                  );
                                  return sum + assignedCustomers.length;
                                }, 0);
                                return `${totalCustomers} atanmış cari`;
                              })()}
                            </p>
                          </div>
                          <Building2 className="text-blue-600" size={32} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600">Banka</p>
                            <h3 className="text-green-700 mt-1">
                              {bankPFRecords.filter(f => f.bankaOrPF === 'Banka').length}
                            </h3>
                            <p className="text-xs text-green-500 mt-1">
                              {(() => {
                                const bankaCustomers = bankPFRecords
                                  .filter(f => f.bankaOrPF === 'Banka')
                                  .reduce((sum, pf) => {
                                    const assignedCustomers = customers.filter(c => 
                                      pf.uyeIsyerleri?.some(uiy => uiy.cariId === c.id)
                                    );
                                    return sum + assignedCustomers.length;
                                  }, 0);
                                return `${bankaCustomers} atanmış cari`;
                              })()}
                            </p>
                          </div>
                          <Building2 className="text-green-600" size={32} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600">EPK</p>
                            <h3 className="text-purple-700 mt-1">
                              {bankPFRecords.filter(f => f.odemeKurulusuTipi === 'EPK').length}
                            </h3>
                            <p className="text-xs text-purple-500 mt-1">
                              {(() => {
                                const epkCustomers = bankPFRecords
                                  .filter(f => f.odemeKurulusuTipi === 'EPK')
                                  .reduce((sum, pf) => {
                                    const assignedCustomers = customers.filter(c => 
                                      pf.uyeIsyerleri?.some(uiy => uiy.cariId === c.id)
                                    );
                                    return sum + assignedCustomers.length;
                                  }, 0);
                                return `${epkCustomers} atanmış cari`;
                              })()}
                            </p>
                          </div>
                          <Building2 className="text-purple-600" size={32} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-600">ÖK</p>
                            <h3 className="text-orange-700 mt-1">
                              {bankPFRecords.filter(f => f.odemeKurulusuTipi === 'ÖK').length}
                            </h3>
                            <p className="text-xs text-orange-500 mt-1">
                              {(() => {
                                const okCustomers = bankPFRecords
                                  .filter(f => f.odemeKurulusuTipi === 'ÖK')
                                  .reduce((sum, pf) => {
                                    const assignedCustomers = customers.filter(c => 
                                      pf.uyeIsyerleri?.some(uiy => uiy.cariId === c.id)
                                    );
                                    return sum + assignedCustomers.length;
                                  }, 0);
                                return `${okCustomers} atanmış cari`;
                              })()}
                            </p>
                          </div>
                          <Building2 className="text-orange-600" size={32} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-indigo-50 border-indigo-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-indigo-600">Toplam Cihaz</p>
                            <h3 className="text-indigo-700 mt-1">
                              {(() => {
                                const totalDevices = bankPFRecords.reduce((sum, pf) => {
                                  const pfDevices = pf.uyeIsyerleri?.reduce((devSum, uiy) => {
                                    const customer = customers.find(c => c.id === uiy.cariId);
                                    if (!customer) return devSum;
                                    const customerDevices = customer.products?.filter(p => 
                                      p.serialNumber && 
                                      p.serialNumber.trim() !== '' &&
                                      !p.iptalTarihi
                                    ).length || 0;
                                    return devSum + customerDevices;
                                  }, 0) || 0;
                                  return sum + pfDevices;
                                }, 0);
                                return totalDevices;
                              })()}
                            </h3>
                            <p className="text-xs text-indigo-500 mt-1">
                              {(() => {
                                const totalUiy = bankPFRecords.reduce((sum, pf) => sum + (pf.uyeIsyerleri?.length || 0), 0);
                                return `${totalUiy} üye işyeri`;
                              })()}
                            </p>
                          </div>
                          <Building2 className="text-indigo-600" size={32} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Banka/PF Özet Tablosu - Üye İşyeri ve Cihaz Sayıları */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Banka/PF Özet Tablosu</CardTitle>
                      <CardDescription>
                        Her kuruluş için atanmış üye işyeri ve cihaz sayıları
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6">
                        {/* Banka Bölümü */}
                        {bankPFRecords.filter(f => f.bankaOrPF === 'Banka').length > 0 && (
                          <div>
                            <h4 className="text-green-700 mb-3 flex items-center gap-2">
                              <Building2 size={20} />
                              Bankalar
                            </h4>
                            <div className="space-y-2">
                              {bankPFRecords
                                .filter(f => f.bankaOrPF === 'Banka')
                                .map(banka => {
                                  const uiyCount = banka.uyeIsyerleri?.length || 0;
                                  const deviceCount = banka.uyeIsyerleri?.reduce((sum, uiy) => {
                                    const customer = customers.find(c => c.id === uiy.cariId);
                                    if (!customer) return sum;
                                    const customerDevices = customer.products?.filter(p => 
                                      p.serialNumber && 
                                      p.serialNumber.trim() !== '' &&
                                      !p.iptalTarihi
                                    ).length || 0;
                                    return sum + customerDevices;
                                  }, 0) || 0;
                                  
                                  return (
                                    <Card key={banka.id} className="bg-green-50/30 border-green-200">
                                      <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900">{banka.firmaUnvan}</p>
                                          </div>
                                          <div className="flex items-center gap-6">
                                            <div className="text-right">
                                              <p className="text-sm text-gray-600">Üye İşyeri</p>
                                              <p className="text-green-700">{uiyCount}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm text-gray-600">Cihaz</p>
                                              <p className="text-green-700">{deviceCount}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* EPK Bölümü */}
                        {bankPFRecords.filter(f => f.odemeKurulusuTipi === 'EPK').length > 0 && (
                          <div>
                            <h4 className="text-purple-700 mb-3 flex items-center gap-2">
                              <Building2 size={20} />
                              EPK (Elektronik Para Kuruluşu)
                            </h4>
                            <div className="space-y-2">
                              {bankPFRecords
                                .filter(f => f.odemeKurulusuTipi === 'EPK')
                                .map(epk => {
                                  const uiyCount = epk.uyeIsyerleri?.length || 0;
                                  const deviceCount = epk.uyeIsyerleri?.reduce((sum, uiy) => {
                                    const customer = customers.find(c => c.id === uiy.cariId);
                                    if (!customer) return sum;
                                    const customerDevices = customer.products?.filter(p => 
                                      p.serialNumber && 
                                      p.serialNumber.trim() !== '' &&
                                      !p.iptalTarihi
                                    ).length || 0;
                                    return sum + customerDevices;
                                  }, 0) || 0;
                                  
                                  return (
                                    <Card key={epk.id} className="bg-purple-50/30 border-purple-200">
                                      <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900">{epk.firmaUnvan}</p>
                                          </div>
                                          <div className="flex items-center gap-6">
                                            <div className="text-right">
                                              <p className="text-sm text-gray-600">Üye İşyeri</p>
                                              <p className="text-purple-700">{uiyCount}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm text-gray-600">Cihaz</p>
                                              <p className="text-purple-700">{deviceCount}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* ÖK Bölümü */}
                        {bankPFRecords.filter(f => f.odemeKurulusuTipi === 'ÖK').length > 0 && (
                          <div>
                            <h4 className="text-orange-700 mb-3 flex items-center gap-2">
                              <Building2 size={20} />
                              ÖK (Ödeme Kuruluşu)
                            </h4>
                            <div className="space-y-2">
                              {bankPFRecords
                                .filter(f => f.odemeKurulusuTipi === 'ÖK')
                                .map(ok => {
                                  const uiyCount = ok.uyeIsyerleri?.length || 0;
                                  const deviceCount = ok.uyeIsyerleri?.reduce((sum, uiy) => {
                                    const customer = customers.find(c => c.id === uiy.cariId);
                                    if (!customer) return sum;
                                    const customerDevices = customer.products?.filter(p => 
                                      p.serialNumber && 
                                      p.serialNumber.trim() !== '' &&
                                      !p.iptalTarihi
                                    ).length || 0;
                                    return sum + customerDevices;
                                  }, 0) || 0;
                                  
                                  return (
                                    <Card key={ok.id} className="bg-orange-50/30 border-orange-200">
                                      <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900">{ok.firmaUnvan}</p>
                                          </div>
                                          <div className="flex items-center gap-6">
                                            <div className="text-right">
                                              <p className="text-sm text-gray-600">Üye İşyeri</p>
                                              <p className="text-orange-700">{uiyCount}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm text-gray-600">Cihaz</p>
                                              <p className="text-orange-700">{deviceCount}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Banka/PF Listesi Tablosu */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Firma Ünvan</TableHead>
                          <TableHead className="text-center">Tip</TableHead>
                          <TableHead>Muhasebe Kodu</TableHead>
                          <TableHead>Vergi No</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>E-Posta</TableHead>
                          <TableHead className="text-center">İletişim</TableHead>
                          <TableHead className="text-center">TABELA</TableHead>
                          <TableHead className="text-center">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bankPFRecords.map((record, index) => (
                          <TableRow 
                            key={record.id}
                            className={index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}
                          >
                            <TableCell>{record.firmaUnvan}</TableCell>
                            <TableCell className="text-center">
                              {record.bankaOrPF === 'PF' ? (
                                <Badge className="bg-blue-100 text-blue-800">
                                  {record.odemeKurulusuTipi}
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">
                                  Banka
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {record.muhasebeKodu || '-'}
                              </code>
                            </TableCell>
                            <TableCell className="text-sm">{record.vergiNo || '-'}</TableCell>
                            <TableCell className="text-sm">{record.telefon || '-'}</TableCell>
                            <TableCell className="text-sm truncate max-w-[200px]">
                              {record.email || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {record.iletisimMatrisi?.length || 0} kişi
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-orange-50">
                                {record.tabelaRecords?.filter(t => !t.kapanmaTarihi).length || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={record.durum === 'Aktif' ? 'default' : 'secondary'}
                                className={record.durum === 'Aktif' ? 'bg-green-600' : ''}
                              >
                                {record.durum}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ÜİY Listesi Alt Sekmesi */}
              <TabsContent value="uiy-listesi" className="space-y-4 mt-4">
                {/* Banka/PF Filtresi ve Export Butonu */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FilterDropdown
                      label="Banka/PF Filtresi"
                      icon={<Building2 size={16} />}
                      options={bankPFFilterOptions}
                      value={selectedBankPFId}
                      onChange={setSelectedBankPFId}
                      allLabel="Tüm Banka/PF/EPK/ÖK"
                      allValue="ALL"
                      className="min-w-[280px]"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // ÜİY Listesi Excel Export
                        try {
                          // TÜM banka/PF/EPK/ÖK tanımlarını birleştir (Excel için)
                          const allBankDefinitionsExcel = [
                            ...bankPFRecords.filter(bp => bp.firmaUnvan).map(bp => ({
                              id: bp.id,
                              name: bp.firmaUnvan,
                              type: bp.bankaOrPF === 'Banka' ? 'Banka' : bp.odemeKurulusuTipi || 'PF',
                              source: 'bankPF' as const
                            })),
                            ...banks.filter(b => b.bankaAdi).map(b => ({
                              id: b.id,
                              name: b.bankaAdi,
                              type: 'Banka' as const,
                              source: 'definitions' as const
                            })),
                            ...epkList.filter(epk => epk.kurumAdi).map(epk => ({
                              id: epk.id,
                              name: epk.kurumAdi,
                              type: 'EPK' as const,
                              source: 'definitions' as const
                            })),
                            ...okList.filter(ok => ok.kurumAdi).map(ok => ({
                              id: ok.id,
                              name: ok.kurumAdi,
                              type: 'ÖK' as const,
                              source: 'definitions' as const
                            }))
                          ];

                          const filteredDefinitionsExcel = selectedBankPFId === 'ALL' 
                            ? allBankDefinitionsExcel 
                            : allBankDefinitionsExcel.filter(def => def.id === selectedBankPFId);

                          const bankPFWithCustomers = filteredDefinitionsExcel.map(definition => {
                            const relatedCustomers = customers.filter(customer => {
                              // 1. linkedBankPFIds kontrolü
                              if (definition.source === 'bankPF' && customer.linkedBankPFIds?.includes(definition.id)) {
                                return true;
                              }
                              
                              // 2. bankDeviceAssignments kontrolü
                              if (customer.bankDeviceAssignments && customer.bankDeviceAssignments.length > 0) {
                                const hasAssignment = customer.bankDeviceAssignments.some(assignment => {
                                  if (assignment.bankId === definition.id) return true;
                                  if (assignment.bankId === `bank-${definition.id}`) return true;
                                  if (assignment.bankId === `ok-epk-${definition.id}`) return true;
                                  if (assignment.bankId === `ok-ok-${definition.id}`) return true;
                                  return false;
                                });
                                
                                if (hasAssignment) return true;
                              }
                              
                              return false;
                            });
                            return { 
                              bankPF: {
                                id: definition.id,
                                firmaUnvan: definition.name,
                                bankaOrPF: definition.type === 'Banka' ? 'Banka' as const : 'PF' as const,
                                odemeKurulusuTipi: definition.type !== 'Banka' ? definition.type : undefined
                              }, 
                              customers: relatedCustomers 
                            };
                          }).filter(item => item.customers.length > 0);

                          if (bankPFWithCustomers.length === 0) {
                            toast.error('Excel oluşturmak için veri bulunmuyor!');
                            return;
                          }

                          // Excel verilerini hazırla
                          const excelData: any[] = [];
                          
                          bankPFWithCustomers.forEach((item) => {
                            const firmaTip = item.bankPF.bankaOrPF === 'PF' 
                              ? item.bankPF.odemeKurulusuTipi 
                              : 'Banka';
                            
                            // Bu Banka/PF için toplam cihaz sayısını hesapla
                            const totalDevices = item.customers.reduce((sum, customer) => {
                              const assignment = customer.bankDeviceAssignments?.find(
                                a => a.bankId === item.bankPF.id || 
                                     a.bankId === `bank-${item.bankPF.id}` || 
                                     a.bankId === `ok-epk-${item.bankPF.id}` || 
                                     a.bankId === `ok-ok-${item.bankPF.id}`
                              );
                              return sum + (assignment?.deviceIds?.length || 0);
                            }, 0);
                            
                            // Banka/PF başlığı satırı
                            excelData.push({
                              'Cari Kodu': '',
                              'Cari Adı': `${item.bankPF.firmaUnvan} (${firmaTip}) - ${item.customers.length} ÜİY - ${totalDevices} Cihaz`,
                              'Cihaz Sayısı': '',
                              'Sektör': '',
                              'MCC': '',
                              'Güncel Mypayter Domain': '',
                              'Vergi Dairesi': '',
                              'Vergi No': '',
                              'Adres': '',
                              'İlçe': '',
                              'Posta Kodu': '',
                              'Email': '',
                              'Tel': '',
                              'Yetkili': '',
                              'P6X': '',
                              'APOLLO': '',
                              'Durum': ''
                            });
                            
                            // Müşteri satırları
                            item.customers.forEach(customer => {
                              // Bu müşteri için bu Banka/PF'ye atanmış cihaz sayısı
                              const assignment = customer.bankDeviceAssignments?.find(
                                a => a.bankId === item.bankPF.id || 
                                     a.bankId === `bank-${item.bankPF.id}` || 
                                     a.bankId === `ok-epk-${item.bankPF.id}` || 
                                     a.bankId === `ok-ok-${item.bankPF.id}`
                              );
                              const deviceCount = assignment?.deviceIds?.length || 0;
                              
                              excelData.push({
                                'Cari Kodu': customer.cariHesapKodu,
                                'Cari Adı': customer.cariAdi,
                                'Cihaz Sayısı': deviceCount > 0 ? deviceCount : '-',
                                'Sektör': customer.sektor || '-',
                                'MCC': customer.mcc || '-',
                                'Güncel Mypayter Domain': customer.guncelMyPayterDomain || '-',
                                'Vergi Dairesi': customer.vergiDairesi || '-',
                                'Vergi No': customer.vergiNo || '-',
                                'Adres': customer.adres || '-',
                                'İlçe': customer.ilce || '-',
                                'Posta Kodu': customer.postaKodu || '-',
                                'Email': customer.email || '-',
                                'Tel': customer.tel || '-',
                                'Yetkili': customer.yetkili || '-',
                                'P6X': customer.p6x || '-',
                                'APOLLO': customer.apollo || '-',
                                'Durum': customer.durum
                              });
                            });
                            
                            // Boş satır
                            excelData.push({
                              'Cari Kodu': '',
                              'Cari Adı': '',
                              'Cihaz Sayısı': '',
                              'Sektör': '',
                              'MCC': '',
                              'Güncel Mypayter Domain': '',
                              'Vergi Dairesi': '',
                              'Vergi No': '',
                              'Adres': '',
                              'İlçe': '',
                              'Posta Kodu': '',
                              'Email': '',
                              'Tel': '',
                              'Yetkili': '',
                              'P6X': '',
                              'APOLLO': '',
                              'Durum': ''
                            });
                          });

                          // Özet bilgiler
                          const totalCustomers = bankPFWithCustomers.reduce((sum, item) => sum + item.customers.length, 0);
                          const totalDevicesAll = bankPFWithCustomers.reduce((sum, item) => {
                            return sum + item.customers.reduce((customerSum, customer) => {
                              const assignment = customer.bankDeviceAssignments?.find(
                                a => a.bankId === item.bankPF.id || 
                                     a.bankId === `bank-${item.bankPF.id}` || 
                                     a.bankId === `ok-epk-${item.bankPF.id}` || 
                                     a.bankId === `ok-ok-${item.bankPF.id}`
                              );
                              return customerSum + (assignment?.deviceIds?.length || 0);
                            }, 0);
                          }, 0);
                          
                          excelData.push({
                            'Cari Kodu': '',
                            'Cari Adı': '─────────────────────────────────────',
                            'Cihaz Sayısı': '',
                            'Sektör': '',
                            'MCC': '',
                            'Güncel Mypayter Domain': '',
                            'Vergi Dairesi': '',
                            'Vergi No': '',
                            'Adres': '',
                            'İlçe': '',
                            'Posta Kodu': '',
                            'Email': '',
                            'Tel': '',
                            'Yetkili': '',
                            'P6X': '',
                            'APOLLO': '',
                            'Durum': ''
                          });
                          excelData.push({
                            'Cari Kodu': '',
                            'Cari Adı': 'ÖZET İSTATİSTİKLER',
                            'Cihaz Sayısı': '',
                            'Sektör': '',
                            'MCC': '',
                            'Güncel Mypayter Domain': '',
                            'Vergi Dairesi': '',
                            'Vergi No': '',
                            'Adres': '',
                            'İlçe': '',
                            'Posta Kodu': '',
                            'Email': '',
                            'Tel': '',
                            'Yetkili': '',
                            'P6X': '',
                            'APOLLO': '',
                            'Durum': ''
                          });
                          excelData.push({
                            'Cari Kodu': '',
                            'Cari Adı': `Toplam Banka/PF: ${bankPFWithCustomers.length}`,
                            'Cihaz Sayısı': '',
                            'Sektör': '',
                            'MCC': '',
                            'Güncel Mypayter Domain': '',
                            'Vergi Dairesi': '',
                            'Vergi No': '',
                            'Adres': '',
                            'İlçe': '',
                            'Posta Kodu': '',
                            'Email': '',
                            'Tel': '',
                            'Yetkili': '',
                            'P6X': '',
                            'APOLLO': '',
                            'Durum': ''
                          });
                          excelData.push({
                            'Cari Kodu': '',
                            'Cari Adı': `Toplam ÜİY: ${totalCustomers}`,
                            'Cihaz Sayısı': '',
                            'Sektör': '',
                            'MCC': '',
                            'Güncel Mypayter Domain': '',
                            'Vergi Dairesi': '',
                            'Vergi No': '',
                            'Adres': '',
                            'İlçe': '',
                            'Posta Kodu': '',
                            'Email': '',
                            'Tel': '',
                            'Yetkili': '',
                            'P6X': '',
                            'APOLLO': '',
                            'Durum': ''
                          });
                          excelData.push({
                            'Cari Kodu': '',
                            'Cari Adı': `Toplam Cihaz: ${totalDevicesAll}`,
                            'Cihaz Sayısı': totalDevicesAll,
                            'Sektör': '',
                            'MCC': '',
                            'Güncel Mypayter Domain': '',
                            'Vergi Dairesi': '',
                            'Vergi No': '',
                            'Adres': '',
                            'İlçe': '',
                            'Posta Kodu': '',
                            'Email': '',
                            'Tel': '',
                            'Yetkili': '',
                            'P6X': '',
                            'APOLLO': '',
                            'Durum': ''
                          });

                          // Excel oluştur
                          import('xlsx').then((XLSX) => {
                            const ws = XLSX.utils.json_to_sheet(excelData);
                            const wb = XLSX.utils.book_new();
                            
                            // Sütun genişlikleri
                            ws['!cols'] = [
                              { wch: 15 }, // Cari Kodu
                              { wch: 40 }, // Cari Adı
                              { wch: 12 }, // Cihaz Sayısı
                              { wch: 20 }, // Sektör
                              { wch: 12 }, // MCC
                              { wch: 30 }, // Güncel Mypayter Domain
                              { wch: 15 }, // Vergi Dairesi
                              { wch: 15 }, // Vergi No
                              { wch: 45 }, // Adres
                              { wch: 15 }, // İlçe
                              { wch: 12 }, // Posta Kodu
                              { wch: 25 }, // Email
                              { wch: 15 }, // Tel
                              { wch: 20 }, // Yetkili
                              { wch: 10 }, // P6X
                              { wch: 10 }, // APOLLO
                              { wch: 12 }  // Durum
                            ];
                            
                            const selectedBankPF = selectedBankPFId === 'ALL' 
                              ? 'Tum' 
                              : allBankDefinitionsExcel.find(def => def.id === selectedBankPFId)?.name.replace(/[^a-z0-9]/gi, '-') || 'Secili';
                            
                            XLSX.utils.book_append_sheet(wb, ws, 'ÜİY Listesi');
                            
                            const fileName = `uiy-listesi-${selectedBankPF.toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;
                            XLSX.writeFile(wb, fileName);
                            
                            toast.success(`Excel başarıyla oluşturuldu!\n${fileName}`);
                          });
                        } catch (error) {
                          console.error('Excel oluşturma hatası:', error);
                          toast.error('Excel oluşturulurken hata oluştu!');
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={(() => {
                        // TÜM tanımları kontrol et
                        const allDefs = [
                          ...bankPFRecords.filter(bp => bp.firmaUnvan).map(bp => ({ id: bp.id, source: 'bankPF' as const })),
                          ...banks.filter(b => b.bankaAdi).map(b => ({ id: b.id, source: 'definitions' as const })),
                          ...epkList.filter(e => e.kurumAdi).map(e => ({ id: e.id, source: 'definitions' as const })),
                          ...okList.filter(o => o.kurumAdi).map(o => ({ id: o.id, source: 'definitions' as const }))
                        ];
                        const filteredDefs = selectedBankPFId === 'ALL' ? allDefs : allDefs.filter(d => d.id === selectedBankPFId);
                        
                        const hasData = filteredDefs.some(def => 
                          customers.some(customer => {
                            if (def.source === 'bankPF' && customer.linkedBankPFIds?.includes(def.id)) return true;
                            if (customer.bankDeviceAssignments && customer.bankDeviceAssignments.length > 0) {
                              return customer.bankDeviceAssignments.some(assignment => {
                                if (assignment.bankId === def.id) return true;
                                if (assignment.bankId === `bank-${def.id}`) return true;
                                if (assignment.bankId === `ok-epk-${def.id}`) return true;
                                if (assignment.bankId === `ok-ok-${def.id}`) return true;
                                return false;
                              });
                            }
                            return false;
                          })
                        );
                        return !hasData;
                      })()}
                    >
                      <Download size={16} />
                      Excel İndir
                    </Button>
                  
                    <Button 
                      variant="default" 
                      onClick={() => {
                        // ÜİY Listesi PDF Export
                        try {
                          // TÜM banka/PF/EPK/ÖK tanımlarını birleştir (PDF için)
                          const allBankDefinitionsPDF = [
                            ...bankPFRecords.filter(bp => bp.firmaUnvan).map(bp => ({
                              id: bp.id,
                              name: bp.firmaUnvan,
                              type: bp.bankaOrPF === 'Banka' ? 'Banka' : bp.odemeKurulusuTipi || 'PF',
                              source: 'bankPF' as const
                            })),
                            ...banks.filter(b => b.bankaAdi).map(b => ({
                              id: b.id,
                              name: b.bankaAdi,
                              type: 'Banka' as const,
                              source: 'definitions' as const
                            })),
                            ...epkList.filter(epk => epk.kurumAdi).map(epk => ({
                              id: epk.id,
                              name: epk.kurumAdi,
                              type: 'EPK' as const,
                              source: 'definitions' as const
                            })),
                            ...okList.filter(ok => ok.kurumAdi).map(ok => ({
                              id: ok.id,
                              name: ok.kurumAdi,
                              type: 'ÖK' as const,
                              source: 'definitions' as const
                            }))
                          ];

                          const filteredDefinitionsPDF = selectedBankPFId === 'ALL' 
                            ? allBankDefinitionsPDF 
                            : allBankDefinitionsPDF.filter(def => def.id === selectedBankPFId);

                          const bankPFWithCustomers = filteredDefinitionsPDF.map(definition => {
                            const relatedCustomers = customers.filter(customer => {
                              // 1. linkedBankPFIds kontrolü
                              if (definition.source === 'bankPF' && customer.linkedBankPFIds?.includes(definition.id)) {
                                return true;
                              }
                              
                              // 2. bankDeviceAssignments kontrolü (Banka/PF Kategorisi)
                              if (customer.bankDeviceAssignments && customer.bankDeviceAssignments.length > 0) {
                                const hasAssignment = customer.bankDeviceAssignments.some(assignment => {
                                  if (assignment.bankId === definition.id) return true;
                                  if (assignment.bankId === `bank-${definition.id}`) return true;
                                  if (assignment.bankId === `ok-epk-${definition.id}`) return true;
                                  if (assignment.bankId === `ok-ok-${definition.id}`) return true;
                                  return false;
                                });
                                
                                if (hasAssignment) return true;
                              }
                              
                              return false;
                            });
                            return { 
                              bankPF: {
                                id: definition.id,
                                firmaUnvan: definition.name,
                                bankaOrPF: definition.type === 'Banka' ? 'Banka' as const : 'PF' as const,
                                odemeKurulusuTipi: definition.type !== 'Banka' ? definition.type : undefined
                              }, 
                              customers: relatedCustomers 
                            };
                          }).filter(item => item.customers.length > 0);

                          if (bankPFWithCustomers.length === 0) {
                            toast.error('PDF oluşturmak için veri bulunmuyor!');
                            return;
                          }

                        const doc = new jsPDF({
                          orientation: 'landscape',
                          unit: 'mm',
                          format: 'a4'
                        });

                        doc.setFontSize(16);
                        const selectedBankPF = selectedBankPFId === 'ALL' 
                          ? 'Tum Banka/PF' 
                          : allBankDefinitionsPDF.find(def => def.id === selectedBankPFId)?.name || '';
                        doc.text(`UİY Listesi - ${selectedBankPF}`, 14, 15);
                        
                        doc.setFontSize(10);
                        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);

                        let currentY = 30;

                        bankPFWithCustomers.forEach((item, index) => {
                          if (index > 0 && currentY > 180) {
                            doc.addPage();
                            currentY = 15;
                          }

                          // Firma başlığı
                          doc.setFontSize(12);
                          const firmaTip = item.bankPF.bankaOrPF === 'PF' 
                            ? item.bankPF.odemeKurulusuTipi 
                            : 'Banka';
                          
                          // Toplam cihaz sayısını hesapla
                          const totalDevicesPDF = item.customers.reduce((sum, customer) => {
                            const assignment = customer.bankDeviceAssignments?.find(
                              a => a.bankId === item.bankPF.id || 
                                   a.bankId === `bank-${item.bankPF.id}` || 
                                   a.bankId === `ok-epk-${item.bankPF.id}` || 
                                   a.bankId === `ok-ok-${item.bankPF.id}`
                            );
                            return sum + (assignment?.deviceIds?.length || 0);
                          }, 0);
                          
                          doc.text(`${item.bankPF.firmaUnvan} (${firmaTip}) - ${item.customers.length} UİY - ${totalDevicesPDF} Cihaz`, 14, currentY);
                          currentY += 5;

                          // Tablo
                          const headers = [['Cari Kod', 'Cari Adi', 'Cihaz', 'Sektor', 'MCC', 'Domain', 'V.Dairesi', 'Vergi No', 'Adres', 'Ilce', 'P.Kodu', 'Email', 'Tel', 'Yetkili', 'P6X', 'APOLLO', 'Durum']];
                          const tableData = item.customers.map(c => {
                            // Bu müşteri için cihaz sayısı
                            const assignment = c.bankDeviceAssignments?.find(
                              a => a.bankId === item.bankPF.id || 
                                   a.bankId === `bank-${item.bankPF.id}` || 
                                   a.bankId === `ok-epk-${item.bankPF.id}` || 
                                   a.bankId === `ok-ok-${item.bankPF.id}`
                            );
                            const deviceCount = assignment?.deviceIds?.length || 0;
                            
                            return [
                              c.cariHesapKodu,
                              c.cariAdi,
                              deviceCount > 0 ? deviceCount.toString() : '-',
                              c.sektor || '-',
                              c.mcc || '-',
                              c.guncelMyPayterDomain || '-',
                              c.vergiDairesi || '-',
                              c.vergiNo || '-',
                              c.adres || '-',
                              c.ilce || '-',
                              c.postaKodu || '-',
                              c.email || '-',
                              c.tel || '-',
                              c.yetkili || '-',
                              c.p6x || '-',
                              c.apollo || '-',
                              c.durum
                            ];
                          });

                          autoTable(doc, {
                            head: headers,
                            body: tableData,
                            startY: currentY,
                            styles: {
                              fontSize: 5,
                              cellPadding: 1,
                              overflow: 'linebreak',
                              halign: 'left',
                              valign: 'middle'
                            },
                            headStyles: {
                              fillColor: [59, 130, 246],
                              textColor: [255, 255, 255],
                              fontSize: 5.5,
                              fontStyle: 'bold',
                              halign: 'center'
                            },
                            columnStyles: {
                              0: { cellWidth: 16 },  // Cari Kod
                              1: { cellWidth: 28 },  // Cari Adi
                              2: { cellWidth: 8, halign: 'center' },   // Cihaz
                              3: { cellWidth: 14 },  // Sektor
                              4: { cellWidth: 9 },   // MCC
                              5: { cellWidth: 20 },  // Domain
                              6: { cellWidth: 14 },  // V.Dairesi
                              7: { cellWidth: 14 },  // Vergi No
                              8: { cellWidth: 26 },  // Adres
                              9: { cellWidth: 13 },  // Ilce
                              10: { cellWidth: 9 },  // P.Kodu
                              11: { cellWidth: 18 }, // Email
                              12: { cellWidth: 14 }, // Tel
                              13: { cellWidth: 14 }, // Yetkili
                              14: { cellWidth: 7 },  // P6X
                              15: { cellWidth: 7 },  // APOLLO
                              16: { cellWidth: 11, halign: 'center' } // Durum
                            },
                            alternateRowStyles: {
                              fillColor: [249, 250, 251]
                            },
                            margin: { left: 10, right: 10 },
                            theme: 'grid'
                          });

                          currentY = (doc as any).lastAutoTable.finalY + 10;
                        });

                        // Özet istatistikler
                        const totalCustomers = bankPFWithCustomers.reduce((sum, item) => sum + item.customers.length, 0);
                        const totalDevicesAllPDF = bankPFWithCustomers.reduce((sum, item) => {
                          return sum + item.customers.reduce((customerSum, customer) => {
                            const assignment = customer.bankDeviceAssignments?.find(
                              a => a.bankId === item.bankPF.id || 
                                   a.bankId === `bank-${item.bankPF.id}` || 
                                   a.bankId === `ok-epk-${item.bankPF.id}` || 
                                   a.bankId === `ok-ok-${item.bankPF.id}`
                            );
                            return customerSum + (assignment?.deviceIds?.length || 0);
                          }, 0);
                        }, 0);
                        
                        if (currentY > 180) {
                          doc.addPage();
                          currentY = 15;
                        }

                        doc.setFontSize(10);
                        doc.text('Ozet Istatistikler:', 14, currentY);
                        doc.setFontSize(8);
                        doc.text(`Toplam Banka/PF: ${bankPFWithCustomers.length}`, 14, currentY + 6);
                        doc.text(`Toplam UİY: ${totalCustomers}`, 14, currentY + 11);
                        doc.text(`Toplam Cihaz: ${totalDevicesAllPDF}`, 14, currentY + 16);

                        const fileName = selectedBankPFId === 'ALL'
                          ? `uiy-listesi-tumu-${new Date().toISOString().split('T')[0]}.pdf`
                          : `uiy-listesi-${selectedBankPF.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
                        
                        doc.save(fileName);
                        toast.success(`PDF başarıyla oluşturuldu!\n${fileName}`);
                      } catch (error) {
                        console.error('PDF oluşturma hatası:', error);
                        toast.error('PDF oluşturulurken hata oluştu!');
                      }
                    }}
                    className="flex items-center gap-2"
                    disabled={(() => {
                      // TÜM tanımları kontrol et
                      const allDefs = [
                        ...bankPFRecords.filter(bp => bp.firmaUnvan).map(bp => ({ id: bp.id, source: 'bankPF' as const })),
                        ...banks.filter(b => b.bankaAdi).map(b => ({ id: b.id, source: 'definitions' as const })),
                        ...epkList.filter(e => e.kurumAdi).map(e => ({ id: e.id, source: 'definitions' as const })),
                        ...okList.filter(o => o.kurumAdi).map(o => ({ id: o.id, source: 'definitions' as const }))
                      ];
                      const filteredDefs = selectedBankPFId === 'ALL' ? allDefs : allDefs.filter(d => d.id === selectedBankPFId);
                      
                      const hasData = filteredDefs.some(def => 
                        customers.some(customer => {
                          if (def.source === 'bankPF' && customer.linkedBankPFIds?.includes(def.id)) return true;
                          if (customer.bankDeviceAssignments && customer.bankDeviceAssignments.length > 0) {
                            return customer.bankDeviceAssignments.some(assignment => {
                              if (assignment.bankId === def.id) return true;
                              if (assignment.bankId === `bank-${def.id}`) return true;
                              if (assignment.bankId === `ok-epk-${def.id}`) return true;
                              if (assignment.bankId === `ok-ok-${def.id}`) return true;
                              return false;
                            });
                          }
                          return false;
                        })
                      );
                      return !hasData;
                    })()}
                  >
                    <FileDown size={16} />
                    PDF İndir
                  </Button>
                  </div>
                </div>

                {/* Bilgilendirme Kartı - ÜİY Listesi Hakkında */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Info className="text-green-600 mt-0.5" size={20} />
                      <div className="text-sm text-green-900">
                        <p className="font-medium mb-1">💡 ÜİY Listesi Hakkında</p>
                        <p className="text-green-800 mb-2">
                          Bu liste, aşağıdaki iki yöntemden biriyle Banka/PF'ye bağlanmış müşterileri gösterir:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-green-800">
                          <li>
                            <strong>Yöntem 1:</strong> Müşteri Cari Kart modülünde <strong>"💾 Otomatik Eşleştirmeleri Kaydet"</strong> butonuyla 
                            veya manuel Excel import ile linkedBankPFIds alanına kayıt edilmiş müşteriler
                          </li>
                          <li>
                            <strong>Yöntem 2:</strong> Müşteri Detayı &gt; Banka/PF sekmesinde <strong>"Banka/PF Kategorisi"</strong> 
                            altında cihaz ilişkilendirmesi yapılmış müşteriler
                          </li>
                        </ul>
                        <p className="text-green-800 mt-2 text-xs italic">
                          ℹ️ Her iki yöntem de bu listede görüntülenir. Sipay gibi EPK kategorilerinde cihaz atamış müşteriler de artık görünür olacaktır.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ÜİY İcmal Tablosu */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 size={20} />
                      ÜİY İcmal Tablosu
                    </CardTitle>
                    <CardDescription>
                      Banka/PF bazında müşteri durumlarına göre ÜİY ve cihaz sayıları
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="border-r-2 border-gray-300" rowSpan={2}>
                              <div className="py-2">Banka/PF Adı</div>
                            </TableHead>
                            <TableHead className="text-center border-r-2 border-gray-300 bg-green-50" colSpan={2}>
                              Aktif
                            </TableHead>
                            <TableHead className="text-center border-r-2 border-gray-300 bg-yellow-50" colSpan={2}>
                              Pasif
                            </TableHead>
                            <TableHead className="text-center bg-blue-50" colSpan={2}>
                              Toplam
                            </TableHead>
                          </TableRow>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-center text-xs bg-green-50 border-r">ÜİY</TableHead>
                            <TableHead className="text-center text-xs bg-green-50 border-r-2 border-gray-300">Cihaz</TableHead>
                            <TableHead className="text-center text-xs bg-yellow-50 border-r">ÜİY</TableHead>
                            <TableHead className="text-center text-xs bg-yellow-50 border-r-2 border-gray-300">Cihaz</TableHead>
                            <TableHead className="text-center text-xs bg-blue-50 border-r">ÜİY</TableHead>
                            <TableHead className="text-center text-xs bg-blue-50">Cihaz</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uiySummaryData.bankalar.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                Henüz ÜİY verisi bulunmuyor
                              </TableCell>
                            </TableRow>
                          ) : (
                            <>
                              {uiySummaryData.bankalar.map((banka, index) => (
                                <TableRow 
                                  key={index}
                                  className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'}
                                >
                                  <TableCell className="border-r-2 border-gray-300">
                                    {banka.name}
                                  </TableCell>
                                  <TableCell className="text-center text-green-700 border-r">
                                    {banka.aktifUiy}
                                  </TableCell>
                                  <TableCell className="text-center text-green-700 border-r-2 border-gray-300">
                                    {banka.aktifCihaz}
                                  </TableCell>
                                  <TableCell className="text-center text-yellow-700 border-r">
                                    {banka.pasifUiy}
                                  </TableCell>
                                  <TableCell className="text-center text-yellow-700 border-r-2 border-gray-300">
                                    {banka.pasifCihaz}
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
                                  <strong className="text-green-700">{uiySummaryData.genelToplam.aktifUiy}</strong>
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-300">
                                  <strong className="text-green-700">{uiySummaryData.genelToplam.aktifCihaz}</strong>
                                </TableCell>
                                <TableCell className="text-center border-r">
                                  <strong className="text-yellow-700">{uiySummaryData.genelToplam.pasifUiy}</strong>
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-300">
                                  <strong className="text-yellow-700">{uiySummaryData.genelToplam.pasifCihaz}</strong>
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
                        Müşteriler durum alanına göre (Aktif/Pasif) ayrılmıştır. Toplam cihaz sayısına göre sıralıdır.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {(() => {
                    // TÜM banka/PF/EPK/ÖK tanımlarını birleştir
                    const allBankDefinitions = [
                      // Banka/PF Modülündeki kayıtlar
                      ...bankPFRecords
                        .filter(bp => bp.firmaUnvan) // Firma ünvanı olan kayıtları filtrele
                        .map(bp => ({
                          id: bp.id,
                          name: bp.firmaUnvan,
                          type: bp.bankaOrPF === 'Banka' ? 'Banka' : bp.odemeKurulusuTipi || 'PF',
                          source: 'bankPF' as const
                        })),
                      // Tanımlar modülündeki Banka kayıtları
                      ...banks
                        .filter(b => b.bankaAdi) // bankaAdi alanı olan kayıtları filtrele
                        .map(b => ({
                          id: b.id,
                          name: b.bankaAdi,
                          type: 'Banka' as const,
                          source: 'definitions' as const
                        })),
                      // Tanımlar modülündeki EPK kayıtları
                      ...epkList
                        .filter(epk => epk.kurumAdi) // kurumAdi alanı olan kayıtları filtrele
                        .map(epk => ({
                          id: epk.id,
                          name: epk.kurumAdi,
                          type: 'EPK' as const,
                          source: 'definitions' as const
                        })),
                      // Tanımlar modülündeki ÖK kayıtları
                      ...okList
                        .filter(ok => ok.kurumAdi) // kurumAdi alanı olan kayıtları filtrele
                        .map(ok => ({
                          id: ok.id,
                          name: ok.kurumAdi,
                          type: 'ÖK' as const,
                          source: 'definitions' as const
                        }))
                    ];

                    // Filtrelenmiş tanım listesi
                    const filteredDefinitions = selectedBankPFId === 'ALL' 
                      ? allBankDefinitions 
                      : allBankDefinitions.filter(def => def.id === selectedBankPFId);

                    // Her tanım için, o tanımla ilişkili müşterileri grupla
                    const bankPFWithCustomers = filteredDefinitions.map(definition => {
                      const relatedCustomers = customers.filter(customer => {
                        let matchReason = '';
                        
                        // 1. linkedBankPFIds kontrolü (Manuel veya otomatik eşleşmiş Banka/PF kayıtları)
                        // Sadece bankPF modülündeki kayıtlar için geçerli
                        if (definition.source === 'bankPF' && customer.linkedBankPFIds?.includes(definition.id)) {
                          matchReason = 'linkedBankPFIds';
                          console.log(`✅ ÜİY Match: ${customer.cariAdi} <-> ${definition.name} (${matchReason})`);
                          return true;
                        }
                        
                        // 2. bankDeviceAssignments kontrolü (Banka/PF Kategorisi - Cihaz İlişkilendirme)
                        if (customer.bankDeviceAssignments && customer.bankDeviceAssignments.length > 0) {
                          const hasAssignment = customer.bankDeviceAssignments.some(assignment => {
                            // bankDeviceAssignments'taki bankId formatı: "bank-{id}", "ok-epk-{id}", "ok-ok-{id}"
                            // Bu ID'leri parse edip definition.id ile karşılaştır
                            
                            // Direkt ID eşleşmesi
                            if (assignment.bankId === definition.id) {
                              matchReason = 'bankDeviceAssignments (direct)';
                              return true;
                            }
                            
                            // Prefix'li eşleşmeler
                            if (assignment.bankId === `bank-${definition.id}`) {
                              matchReason = 'bankDeviceAssignments (bank prefix)';
                              return true;
                            }
                            if (assignment.bankId === `ok-epk-${definition.id}`) {
                              matchReason = 'bankDeviceAssignments (ok-epk prefix)';
                              return true;
                            }
                            if (assignment.bankId === `ok-ok-${definition.id}`) {
                              matchReason = 'bankDeviceAssignments (ok-ok prefix)';
                              return true;
                            }
                            
                            return false;
                          });
                          
                          if (hasAssignment) {
                            console.log(`✅ ÜİY Match: ${customer.cariAdi} <-> ${definition.name} (${matchReason})`);
                            return true;
                          }
                        }
                        
                        return false;
                      });
                      return { 
                        bankPF: {
                          id: definition.id,
                          firmaUnvan: definition.name,
                          bankaOrPF: definition.type === 'Banka' ? 'Banka' as const : 'PF' as const,
                          odemeKurulusuTipi: definition.type !== 'Banka' ? definition.type : undefined
                        }, 
                        customers: relatedCustomers 
                      };
                    }).filter(item => item.customers.length > 0); // Sadece müşterisi olanları göster
                    
                    // Debug: ÜİY listesi özeti
                    console.log('📊 ÜİY Listesi Özeti:', {
                      toplamBankPF: filteredDefinitions.length,
                      musteriOlanBankPF: bankPFWithCustomers.length,
                      toplamMusteri: bankPFWithCustomers.reduce((sum, item) => sum + item.customers.length, 0)
                    });

                    if (bankPFWithCustomers.length === 0) {
                      if (selectedBankPFId === 'ALL') {
                        return (
                          <div className="text-center py-12 text-gray-500">
                            <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
                            <p>Henüz Banka/PF ile ilişkilendirilmiş müşteri bulunmuyor.</p>
                            <p className="text-sm mt-2">Müşteri Cari Kart modülünden Banka/PF ilişkilendirmesi yapın.</p>
                          </div>
                        );
                      } else {
                        const selectedDefinition = allBankDefinitions.find(def => def.id === selectedBankPFId);
                        return (
                          <div className="text-center py-12 text-gray-500">
                            <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
                            <p>
                              <strong>{selectedDefinition?.name}</strong> ile ilişkilendirilmiş müşteri bulunmuyor.
                            </p>
                            <p className="text-sm mt-2">Müşteri Cari Kart modülünden bu Banka/PF ile ilişkilendirme yapın.</p>
                          </div>
                        );
                      }
                    }

                    return bankPFWithCustomers.map(({ bankPF, customers: relatedCustomers }) => {
                      // Bu Banka/PF için toplam cihaz sayısını hesapla
                      const totalDeviceCount = relatedCustomers.reduce((sum, customer) => {
                        const assignment = customer.bankDeviceAssignments?.find(
                          a => a.bankId === bankPF.id || 
                               a.bankId === `bank-${bankPF.id}` || 
                               a.bankId === `ok-epk-${bankPF.id}` || 
                               a.bankId === `ok-ok-${bankPF.id}`
                        );
                        return sum + (assignment?.deviceIds?.length || 0);
                      }, 0);

                      return (
                      <Card key={bankPF.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {bankPF.firmaUnvan}
                                {bankPF.bankaOrPF === 'PF' ? (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {bankPF.odemeKurulusuTipi}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800">
                                    Banka
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-3 mt-1">
                                <span>{relatedCustomers.length} üye işyeri ile çalışmaktadır</span>
                                <span className="text-gray-400">•</span>
                                <span className="flex items-center gap-1">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {totalDeviceCount} Cihaz
                                  </Badge>
                                </span>
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Muhasebe Kodu</p>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {bankPF.muhasebeKodu}
                              </code>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Cari Hesap Kodu</TableHead>
                                  <TableHead>Cari Adı</TableHead>
                                  <TableHead className="text-center">Cihaz Sayısı</TableHead>
                                  <TableHead>Sektör</TableHead>
                                  <TableHead>MCC</TableHead>
                                  <TableHead>Güncel Mypayter Domain</TableHead>
                                  <TableHead>Vergi Dairesi</TableHead>
                                  <TableHead>Vergi No</TableHead>
                                  <TableHead>Adres</TableHead>
                                  <TableHead>İlçe</TableHead>
                                  <TableHead>Posta Kodu</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Tel</TableHead>
                                  <TableHead>Yetkili</TableHead>
                                  <TableHead>P6X</TableHead>
                                  <TableHead>APOLLO</TableHead>
                                  <TableHead className="text-center">Durum</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {relatedCustomers.map((customer, index) => {
                                  // Bu müşteri için bu Banka/PF'ye atanmış cihaz sayısını hesapla
                                  const assignment = customer.bankDeviceAssignments?.find(
                                    a => a.bankId === bankPF.id || 
                                         a.bankId === `bank-${bankPF.id}` || 
                                         a.bankId === `ok-epk-${bankPF.id}` || 
                                         a.bankId === `ok-ok-${bankPF.id}`
                                  );
                                  const deviceCount = assignment?.deviceIds?.length || 0;

                                  return (
                                  <TableRow 
                                    key={customer.id}
                                    className={index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}
                                  >
                                    <TableCell>
                                      <code className={`text-xs bg-blue-50 px-2 py-1 rounded ${customer.durum === 'Pasif' ? 'line-through text-gray-500' : ''}`}>
                                        {customer.cariHesapKodu}
                                      </code>
                                    </TableCell>
                                    <TableCell>
                                      <span className={customer.durum === 'Pasif' ? 'line-through text-gray-500' : ''}>
                                        {customer.cariAdi}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {deviceCount > 0 ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                          {deviceCount}
                                        </Badge>
                                      ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm">{customer.sektor || '-'}</TableCell>
                                    <TableCell>
                                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {customer.mcc || '-'}
                                      </code>
                                    </TableCell>
                                    <TableCell className="text-sm truncate max-w-[200px]">
                                      {customer.guncelMyPayterDomain || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm">{customer.vergiDairesi || '-'}</TableCell>
                                    <TableCell className="text-sm">{customer.vergiNo || '-'}</TableCell>
                                    <TableCell className="text-sm truncate max-w-[250px]">
                                      {customer.adres || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm">{customer.ilce || '-'}</TableCell>
                                    <TableCell className="text-sm">{customer.postaKodu || '-'}</TableCell>
                                    <TableCell className="text-sm truncate max-w-[200px]">
                                      {customer.email || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm">{customer.tel || '-'}</TableCell>
                                    <TableCell className="text-sm">{customer.yetkili || '-'}</TableCell>
                                    <TableCell className="text-sm">{customer.p6x || '-'}</TableCell>
                                    <TableCell className="text-sm">{customer.apollo || '-'}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge 
                                        variant={customer.durum === 'Aktif' ? 'default' : 'secondary'}
                                        className={customer.durum === 'Aktif' ? 'bg-green-600' : ''}
                                      >
                                        {customer.durum}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    });
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Hakediş Raporu Tab */}
      <TabsContent value="hakedis" className="space-y-6">
        <HakedisReportTab bankPFRecords={bankPFRecords} />
      </TabsContent>
    </Tabs>

      {/* TABELA Simülasyon Dialog */}
      <TabelaSimulationDialog 
        open={isSimulationDialogOpen}
        onOpenChange={setIsSimulationDialogOpen}
        bankPFRecords={bankPFRecords}
      />
    </div>
  );
});
