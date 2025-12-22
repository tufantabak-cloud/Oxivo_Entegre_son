import React, { useState, Fragment, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FileText, Download, Users, FileDown, BarChart3, Calculator, Database, Building2, Info } from 'lucide-react';
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
import * as XLSX from 'xlsx';

interface ReportsModuleProps {
  customers?: Customer[];
  bankPFRecords?: BankPF[];
  banks?: Bank[];
  epkList?: EPK[];
  okList?: OK[];
  kartProgramlar?: KartProgram[];
}

// Type definitions for better type safety
interface BankDefinition {
  id: string;
  name: string;
  type: 'Banka' | 'EPK' | 'ÖK' | 'PF';
  source: 'bankPF' | 'definitions';
}

interface UiySummaryBankaStats {
  name: string;
  aktifUiy: number;
  aktifCihaz: number;
  pasifUiy: number;
  pasifCihaz: number;
  toplamUiy: number;
  toplamCihaz: number;
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
  const [selectedBankPFId, setSelectedBankPFId] = useState<string>('ALL');

  // ✅ OPTIMIZATION: All bank/PF/EPK/ÖK definitions combined - memoized
  const allBankDefinitions = useMemo<BankDefinition[]>(() => {
    return [
      ...bankPFRecords.filter(bp => bp.firmaUnvan).map(bp => ({
        id: bp.id,
        name: bp.firmaUnvan,
        type: (bp.bankaOrPF === 'Banka' ? 'Banka' : bp.odemeKurulusuTipi || 'PF') as 'Banka' | 'EPK' | 'ÖK' | 'PF',
        source: 'bankPF' as const
      })),
      ...banks.filter(b => b.bankaAdi).map(b => ({
        id: b.id,
        name: b.bankaAdi,
        type: 'Banka' as const,
        source: 'definitions' as const
      })),
      ...epkList.filter(e => e.kurumAdi).map(e => ({
        id: e.id,
        name: e.kurumAdi,
        type: 'EPK' as const,
        source: 'definitions' as const
      })),
      ...okList.filter(o => o.kurumAdi).map(o => ({
        id: o.id,
        name: o.kurumAdi,
        type: 'ÖK' as const,
        source: 'definitions' as const
      }))
    ];
  }, [bankPFRecords, banks, epkList, okList]);

  // ✅ OPTIMIZATION: ÜİY Listesi için Banka/PF dropdown options - memoized
  const bankPFFilterOptions = useMemo<FilterOption[]>(() => {
    const options: FilterOption[] = [];
    
    bankPFRecords
      .slice()
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
    
    banks
      .filter(b => b.bankaAdi)
      .slice()
      .sort((a, b) => (a.bankaAdi || '').localeCompare(b.bankaAdi || '', 'tr'))
      .forEach(b => {
        options.push({
          value: b.id,
          label: `🏦 Banka • ${b.bankaAdi}`
        });
      });
    
    epkList
      .filter(e => e.kurumAdi)
      .slice()
      .sort((a, b) => (a.kurumAdi || '').localeCompare(b.kurumAdi || '', 'tr'))
      .forEach(e => {
        options.push({
          value: e.id,
          label: `💳 EPK • ${e.kurumAdi}`
        });
      });
    
    okList
      .filter(o => o.kurumAdi)
      .slice()
      .sort((a, b) => (a.kurumAdi || '').localeCompare(b.kurumAdi || '', 'tr'))
      .forEach(o => {
        options.push({
          value: o.id,
          label: `💰 ÖK • ${o.kurumAdi}`
        });
      });
    
    return options;
  }, [bankPFRecords, banks, epkList, okList]);

  // ✅ OPTIMIZATION: Helper function to check if customer is related to bank - memoized callback
  const isCustomerRelatedToBank = useCallback((customer: Customer, bankDefId: string): boolean => {
    // Method 1: linkedBankPFIds check (primary source)
    if (customer.linkedBankPFIds?.includes(bankDefId)) {
      return true;
    }
    
    // Method 2: bankDeviceAssignments check (secondary source)
    if (Array.isArray(customer.bankDeviceAssignments) && customer.bankDeviceAssignments.length > 0) {
      return customer.bankDeviceAssignments.some(assignment => 
        assignment.bankId === bankDefId || 
        assignment.bankId === `bank-${bankDefId}` || 
        assignment.bankId === `ok-epk-${bankDefId}` || 
        assignment.bankId === `ok-ok-${bankDefId}`
      );
    }
    
    return false;
  }, []);

  // ✅ OPTIMIZATION: ÜİY İcmal Tablosu Verisi - memoized with improved calculations
  const uiySummaryData = useMemo(() => {
    const bankaStats: UiySummaryBankaStats[] = allBankDefinitions.map(def => {
      const relatedCustomers = customers.filter(customer => isCustomerRelatedToBank(customer, def.id));
      
      const aktifCustomers = relatedCustomers.filter(c => c.durum === 'Aktif');
      const pasifCustomers = relatedCustomers.filter(c => c.durum !== 'Aktif');
      
      const aktifDevices = aktifCustomers.reduce((sum, customer) => {
        if (!customer.serviceFeeSettings?.isActive) return sum;
        
        const activeDeviceCount = (customer.serviceFeeSettings.deviceSubscriptions || [])
          .filter(sub => sub.isActive && sub.paymentStatus !== 'cancelled')
          .length;
        
        return sum + activeDeviceCount;
      }, 0);
      
      const pasifDevices = pasifCustomers.reduce((sum, customer) => {
        if (!customer.serviceFeeSettings?.isActive) return sum;
        
        const activeDeviceCount = (customer.serviceFeeSettings.deviceSubscriptions || [])
          .filter(sub => sub.isActive && sub.paymentStatus !== 'cancelled')
          .length;
        
        return sum + activeDeviceCount;
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
    
    const filteredBankaStats = bankaStats
      .filter(b => b.toplamUiy > 0)
      .sort((a, b) => b.toplamCihaz - a.toplamCihaz);
    
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
  }, [allBankDefinitions, customers, isCustomerRelatedToBank]);

  // ✅ OPTIMIZATION: İletişim matrisi için tüm görev başlıklarını topla - memoized
  const jobTitles = useMemo(() => {
    const titles = new Set<string>();
    bankPFRecords.forEach(record => {
      record.iletisimMatrisi?.forEach(contact => {
        if (contact.gorev) {
          titles.add(contact.gorev);
        }
      });
    });
    return Array.from(titles).sort();
  }, [bankPFRecords]);

  // ✅ OPTIMIZATION: Belirli bir firma ve görev için kişileri bul - useCallback
  const getContactsForFirmaAndJob = useCallback((firma: BankPF, jobTitle: string): ContactPerson[] => {
    return (firma.iletisimMatrisi || []).filter(contact => contact.gorev === jobTitle);
  }, []);

  // ✅ OPTIMIZATION: İletişim matrisi PDF export - useCallback
  const handleExportPDF = useCallback(() => {
    try {
      if (jobTitles.length === 0 || bankPFRecords.length === 0) {
        toast.error('PDF oluşturmak için veri bulunmuyor!');
        return;
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFontSize(16);
      doc.text('Iletisim Matrisi - Banka / EPK / OK', 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);

      const headerRow1: Array<string | { content: string; colSpan: number; styles: { halign: string } }> = ['Gorev'];
      const headerRow2: string[] = [''];
      
      bankPFRecords.forEach(firma => {
        const firmaTip = firma.bankaOrPF === 'PF' ? firma.odemeKurulusuTipi : 'Banka';
        const firmaBaslik = `${firma.firmaUnvan} (${firmaTip})`;
        
        headerRow1.push({ content: firmaBaslik, colSpan: 3, styles: { halign: 'center' } });
        headerRow2.push('Ad Soyad', 'Cep', 'E-Posta');
      });

      const headers = [headerRow1, headerRow2];

      const tableData: string[][] = [];
      
      jobTitles.forEach(jobTitle => {
        const row: string[] = [jobTitle];
        
        bankPFRecords.forEach(firma => {
          const contacts = getContactsForFirmaAndJob(firma, jobTitle);
          
          if (contacts.length > 0) {
            const names = contacts.map(c => `${c.ad} ${c.soyad}`).join('\n');
            const phones = contacts.map(c => c.gsm || c.telefon || '-').join('\n');
            const emails = contacts.map(c => c.email || '-').join('\n');
            
            row.push(names, phones, emails);
          } else {
            row.push('-', '-', '-');
          }
        });
        
        tableData.push(row);
      });

      const totalColumns = 1 + (bankPFRecords.length * 3);
      const availableWidth = 297 - 20;
      const gorevColWidth = 30;
      const remainingWidth = availableWidth - gorevColWidth;
      const firmaColWidth = remainingWidth / (bankPFRecords.length * 3);

      const columnStyles: Record<number, { cellWidth: number; halign: string; fontStyle?: string; fontSize: number; overflow?: string }> = {
        0: { 
          cellWidth: gorevColWidth, 
          halign: 'left',
          fontStyle: 'bold',
          fontSize: 6
        }
      };

      for (let i = 1; i < totalColumns; i++) {
        columnStyles[i] = {
          cellWidth: firmaColWidth,
          halign: 'center',
          fontSize: 5,
          overflow: 'linebreak'
        };
      }

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

      const finalY = (doc as any).lastAutoTable.finalY || 28;
      
      const stats = [
        `Toplam Kurulus: ${bankPFRecords.length}`,
        `Banka: ${bankPFRecords.filter(f => f.bankaOrPF === 'Banka').length}`,
        `EPK: ${bankPFRecords.filter(f => f.odemeKurulusuTipi === 'EPK').length}`,
        `OK: ${bankPFRecords.filter(f => f.odemeKurulusuTipi === 'ÖK').length}`,
        `Farkli Gorev: ${jobTitles.length}`,
        `Toplam Kisi: ${bankPFRecords.reduce((sum, f) => sum + (f.iletisimMatrisi?.length || 0), 0)}`
      ];
      
      if (finalY > 180) {
        doc.addPage();
        doc.setFontSize(10);
        doc.text('Ozet Istatistikler:', 14, 15);
        doc.setFontSize(8);
        stats.forEach((stat, index) => {
          doc.text(stat, 14, 22 + (index * 5));
        });
      } else {
        doc.setFontSize(10);
        doc.text('Ozet Istatistikler:', 14, finalY + 10);
        doc.setFontSize(8);
        stats.forEach((stat, index) => {
          doc.text(stat, 14, finalY + 16 + (index * 5));
        });
      }

      const fileName = `iletisim-matrisi-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success(`PDF basariyla olusturuldu!\n${fileName}`);
    } catch (error) {
      console.error('PDF olusturma hatasi:', error);
      toast.error(`PDF olusturulurken hata olustu!\n${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }, [bankPFRecords, jobTitles, getContactsForFirmaAndJob]);

  // ✅ OPTIMIZATION: Aktif TABELA sayısı - memoized
  const activeTabelaCount = useMemo(() => {
    return bankPFRecords.reduce((sum, f) => sum + (f.tabelaRecords?.filter(tr => !tr.kapanmaTarihi)?.length || 0), 0);
  }, [bankPFRecords]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Raporlar</h2>
          <p className="text-sm font-medium text-gray-600 mt-1">Tüm verileriniz için detaylı raporlar ve analizler</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-auto min-w-full md:w-auto">
            <TabsTrigger value="banka-pf" className="flex-shrink-0 text-xs sm:text-sm">
              <Building2 size={14} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Banka/PF</span>
              <span className="inline sm:hidden">Banka</span>
            </TabsTrigger>
            <TabsTrigger value="iletisim-matrisi" className="flex-shrink-0 text-xs sm:text-sm">
              <Users size={14} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">İletişim Matrisi</span>
              <span className="inline sm:hidden">İletişim</span>
            </TabsTrigger>
            <TabsTrigger value="musteriler" className="flex-shrink-0 text-xs sm:text-sm">
              <Users size={14} className="mr-1 sm:mr-2" />
              Müşteriler
            </TabsTrigger>
            <TabsTrigger value="domain" className="flex-shrink-0 text-xs sm:text-sm">
              <Database size={14} className="mr-1 sm:mr-2" />
              Domain
            </TabsTrigger>
            <TabsTrigger value="tabela" className="flex-shrink-0 text-xs sm:text-sm">
              <BarChart3 size={14} className="mr-1 sm:mr-2" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="hakedis" className="flex-shrink-0 text-xs sm:text-sm">
              <Calculator size={14} className="mr-1 sm:mr-2" />
              Hakediş
            </TabsTrigger>
          </TabsList>
        </div>

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
                          <TableCell className="sticky left-0 bg-white z-10 border-r-2 border-gray-300 text-xs">
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
                                        <div key={contact.id}>{contact.ad} {contact.soyad}</div>
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
                                        <div key={contact.id}>{contact.gsm || contact.telefon || '-'}</div>
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
                                          {contact.email || '-'}
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
                    try {
                      const allTabelaRecords = bankPFRecords.flatMap(firma => 
                        (firma.tabelaRecords || [])
                          .filter(tr => !tr.kapanmaTarihi)
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

                      const headers = [['Firma', 'Tip', 'Gelir Modeli', 'Urun', 'Kart Tipi', 'Yurt', 'Program', 'Kurulus%', 'OXIVO%', 'Tarih']];

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
                          0: { cellWidth: 40, halign: 'left' },
                          1: { cellWidth: 20 },
                          2: { cellWidth: 35, halign: 'left' },
                          3: { cellWidth: 25 },
                          4: { cellWidth: 25 },
                          5: { cellWidth: 20 },
                          6: { cellWidth: 22 },
                          7: { cellWidth: 22 },
                          8: { cellWidth: 22 },
                          9: { cellWidth: 28 }
                        },
                        margin: { top: 28, right: 10, bottom: 10, left: 10 },
                        theme: 'grid'
                      });

                      const finalY = (doc as any).lastAutoTable.finalY || 28;
                      const firmaCount = bankPFRecords.filter(f => 
                        (f.tabelaRecords?.filter(tr => !tr.kapanmaTarihi)?.length || 0) > 0
                      ).length;

                      const stats = [
                        `Aktif TABELA: ${allTabelaRecords.length}`,
                        `Firmalar: ${firmaCount}`
                      ];
                      
                      if (finalY > 180) {
                        doc.addPage();
                        doc.setFontSize(10);
                        doc.text('Ozet Istatistikler:', 14, 15);
                        doc.setFontSize(8);
                        stats.forEach((stat, index) => {
                          doc.text(stat, 14, 22 + (index * 5));
                        });
                      } else {
                        doc.setFontSize(10);
                        doc.text('Ozet Istatistikler:', 14, finalY + 10);
                        doc.setFontSize(8);
                        stats.forEach((stat, index) => {
                          doc.text(stat, 14, finalY + 16 + (index * 5));
                        });
                      }

                      const fileName = `tabela-raporu-${new Date().toISOString().split('T')[0]}.pdf`;
                      doc.save(fileName);
                      toast.success(`PDF başarıyla oluşturuldu!\n${fileName}`);
                    } catch (error) {
                      console.error('PDF oluşturma hatası:', error);
                      toast.error('PDF oluşturulurken hata oluştu!');
                    }
                  }}
                  className="flex items-center gap-2"
                  disabled={activeTabelaCount === 0}
                >
                  <FileDown size={16} />
                  PDF İndir
                </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTabelaCount === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Henüz aktif TABELA kaydı bulunmuyor.</p>
                  <p className="text-sm mt-2">Banka/PF detay sayfalarından TABELA kayıtları ekleyin.</p>
                </div>
              ) : (
                <div className="space-y-8">
                {bankPFRecords
                  .filter(firma => (firma.tabelaRecords || []).length > 0)
                  .map(firma => {
                    const aktifTabelalar = (firma.tabelaRecords || []).filter(t => {
                      if (t.kapanmaTarihi) return false;
                      
                      const tabelaGroup = firma.tabelaGroups?.find(g => 
                        g.recordIds?.includes(t.id)
                      );
                      
                      return tabelaGroup && tabelaGroup.aktif === true;
                    });
                    
                    if (aktifTabelalar.length === 0) return null;

                    return (
                      <div key={firma.id} className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50/30">
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

                        <div className="space-y-6">
                          {firma.tabelaGroups?.filter(g => g.aktif !== false).map((tabelaGroup) => {
                            const grupTabelalar = aktifTabelalar.filter(t => 
                              tabelaGroup.recordIds?.includes(t.id)
                            );
                            
                            if (grupTabelalar.length === 0) return null;
                            
                            const referansTabela = grupTabelalar[0];
                            const isSabitKomisyon = referansTabela.gelirModeli?.ad === 'Sabit Komisyon';
                            const yurtIciTabela = grupTabelalar.find(t => t.yurtIciDisi === 'Yurt İçi');
                            const yurtDisiTabela = grupTabelalar.find(t => t.yurtIciDisi === 'Yurt Dışı');
                            
                            const aktifVadeler = (referansTabela.komisyonOranları || [])
                              .filter(k => k.aktif)
                              .map(k => k.vade);
                            
                            if (aktifVadeler.length === 0) return null;

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
                              <div key={tabelaGroup.id} className="bg-white rounded-lg border border-orange-200">
                                <div className="px-4 py-3 bg-orange-100 border-b border-orange-200 rounded-t-lg">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <Badge variant="outline" className="bg-white">
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
                                          Paylaşım: {referansTabela.paylaşımOranları.kurulusOrani}% / {referansTabela.paylaşımOranları.oxivoOrani}%
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {new Date(referansTabela.olusturmaTarihi).toLocaleDateString('tr-TR')}
                                    </span>
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-gray-100">
                                        <TableHead rowSpan={4} className="border-r-2 border-gray-300 bg-white sticky left-0 z-10 align-middle">
                                          Kart Tipi
                                        </TableHead>
                                        <TableHead colSpan={isSabitKomisyon ? aktifVadeler.length * 2 : aktifVadeler.length * 4} className="text-center border-r border-gray-200">
                                          {referansTabela.kartTipi}
                                        </TableHead>
                                      </TableRow>
                                      
                                      <TableRow className="bg-gray-50">
                                        <TableHead colSpan={isSabitKomisyon ? aktifVadeler.length : aktifVadeler.length * 2} className="text-center border-r-2 border-gray-400">
                                          Yurt İçi
                                        </TableHead>
                                        <TableHead colSpan={isSabitKomisyon ? aktifVadeler.length : aktifVadeler.length * 2} className="text-center border-r border-gray-200">
                                          Yurt Dışı
                                        </TableHead>
                                      </TableRow>
                                      
                                      <TableRow className="bg-gray-50">
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

                                      <TableRow className="bg-gray-50">
                                        {isSabitKomisyon ? (
                                          <>
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
                                          
                                          {aktifVadeler.map((vade, vIndex) => {
                                            const vadeData = yurtIciTabela?.komisyonOranları?.find(k => k.vade === vade);
                                            const isInactive = vadeData?.aktif === false;
                                            
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
                                              const alisValue = vadeData?.alisTL || '';
                                              const satisValue = vadeData?.satisTL || '';
                                              
                                              return (
                                                <Fragment key={`yurtici-${vIndex}`}>
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
                                          
                                          {aktifVadeler.map((vade, vIndex) => {
                                            const vadeData = yurtDisiTabela?.komisyonOranları?.find(k => k.vade === vade);
                                            const isInactive = vadeData?.aktif === false;
                                            
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
                                              const alisValue = vadeData?.alisTL || '';
                                              const satisValue = vadeData?.satisTL || '';
                                              
                                              return (
                                                <Fragment key={`yurtdisi-${vIndex}`}>
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
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banka/PF Raporu Tab - ÜİY Listesi (Genel Özet kaldırıldı) */}
        <TabsContent value="banka-pf" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banka/PF Raporu - ÜİY Listesi</CardTitle>
              <CardDescription>
                Tüm Banka ve Ödeme Kuruluşlarının üye işyeri ilişkileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                </div>

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
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>📊 Not:</strong> Bu tablo, en az 1 ÜİY'si olan Banka/PF kayıtlarını gösterir. 
                        Müşteriler durum alanına göre (Aktif/Pasif) ayrılmıştır. Toplam cihaz sayısına göre sıralıdır.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hakediş Raporu Tab */}
        <TabsContent value="hakedis" className="space-y-6">
          <HakedisReportTab bankPFRecords={bankPFRecords} />
        </TabsContent>
      </Tabs>

      <TabelaSimulationDialog 
        open={isSimulationDialogOpen}
        onOpenChange={setIsSimulationDialogOpen}
        bankPFRecords={bankPFRecords}
      />
    </div>
  );
});
