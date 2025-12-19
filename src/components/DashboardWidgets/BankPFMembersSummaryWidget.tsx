// Banka/PF ÜİY Özet Widget'ı - Dashboard için
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
// Tooltip removed - import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { Building2, Maximize2, Minimize2, Users, Building, HardDrive, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import type { BankPF } from '../BankPFModule';
import { FullListModal } from './FullListModal';

interface BankPFMembersSummaryWidgetProps {
  customers: Customer[];
  bankPFRecords: BankPF[];
}

interface BankPFSummary {
  id: string;
  name: string;
  type: string;
  customerCount: number;
  deviceCount: number;
  customers: Customer[];
}

export const BankPFMembersSummaryWidget = React.memo(function BankPFMembersSummaryWidget({
  customers = [],
  bankPFRecords = []
}: BankPFMembersSummaryWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });

  // Banka/PF başına müşteri ve cihaz sayılarını hesapla
  const bankPFSummaries = useMemo(() => {
    const summaries: BankPFSummary[] = [];

    // ✅ NULL SAFETY: bankPFRecords boş olabilir
    (bankPFRecords || []).forEach(bankPF => {
      // Bu Banka/PF ile ilişkili müşterileri bul (2 yöntem)
      const relatedCustomers = customers.filter(customer => {
        // Yöntem 1: linkedBankPFIds kontrolü
        if (customer.linkedBankPFIds?.includes(bankPF.id)) {
          return true;
        }
        
        // Yöntem 2: bankDeviceAssignments kontrolü - ✅ ARRAY SAFETY
        const assignments = Array.isArray(customer.bankDeviceAssignments) 
          ? customer.bankDeviceAssignments 
          : [];
          
        if (assignments.length > 0) {
          const hasAssignment = assignments.some(assignment => {
            if (assignment.bankId === bankPF.id) return true;
            if (assignment.bankId === `bank-${bankPF.id}`) return true;
            if (assignment.bankId === `ok-epk-${bankPF.id}`) return true;
            if (assignment.bankId === `ok-ok-${bankPF.id}`) return true;
            return false;
          });
          
          if (hasAssignment) return true;
        }
        
        return false;
      });

      // Toplam cihaz sayısını hesapla
      const totalDevices = relatedCustomers.reduce((sum, customer) => {
        // ✅ ARRAY SAFETY: bankDeviceAssignments kontrolü
        const assignments = Array.isArray(customer.bankDeviceAssignments) 
          ? customer.bankDeviceAssignments 
          : [];
          
        const assignment = assignments.find(
          a => a.bankId === bankPF.id || 
               a.bankId === `bank-${bankPF.id}` || 
               a.bankId === `ok-epk-${bankPF.id}` || 
               a.bankId === `ok-ok-${bankPF.id}`
        );
        return sum + (assignment?.deviceIds?.length || 0);
      }, 0);

      // Sadece müşterisi olanları ekle
      if (relatedCustomers.length > 0) {
        summaries.push({
          id: bankPF.id,
          name: bankPF.firmaUnvan || 'İsimsiz',
          type: bankPF.bankaOrPF === 'Banka' ? 'Banka' : (bankPF.odemeKurulusuTipi || 'PF'),
          customerCount: relatedCustomers.length,
          deviceCount: totalDevices,
          customers: relatedCustomers
        });
      }
    });

    // Müşteri sayısına göre sırala (çoktan aza)
    return summaries.sort((a, b) => b.customerCount - a.customerCount);
  }, [customers, bankPFRecords]);

  // Toplam istatistikler
  const totalStats = useMemo(() => {
    const totalBankPF = bankPFSummaries.length;
    const totalCustomers = bankPFSummaries.reduce((sum, s) => sum + s.customerCount, 0);
    const totalDevices = bankPFSummaries.reduce((sum, s) => sum + s.deviceCount, 0);
    
    const bankaCount = bankPFSummaries.filter(s => s.type === 'Banka').length;
    const epkCount = bankPFSummaries.filter(s => s.type === 'EPK').length;
    const okCount = bankPFSummaries.filter(s => s.type === 'ÖK').length;

    return {
      totalBankPF,
      totalCustomers,
      totalDevices,
      bankaCount,
      epkCount,
      okCount
    };
  }, [bankPFSummaries]);

  const handleShowFullList = () => {
    const allItems = bankPFSummaries.map((summary) => ({
      id: summary.id, // ✅ FIX: Add unique ID
      label: summary.name,
      value: `${summary.customerCount} müşteri • ${summary.deviceCount} cihaz`,
      badge: summary.type,
    }));
    
    setModalData({
      title: 'Banka/PF Üye Özeti - Tüm Liste',
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
            <Users className="text-indigo-600" size={20} />
            Banka/PF ÜİY Özeti
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
            {/* Özet İstatistikler */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-2xl text-indigo-600">{totalStats.totalBankPF}</div>
                <div className="text-xs text-gray-600 mt-1">Aktif Banka/PF</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl text-blue-600">{totalStats.totalCustomers}</div>
                <div className="text-xs text-gray-600 mt-1">Toplam ÜİY</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl text-purple-600">{totalStats.totalDevices}</div>
                <div className="text-xs text-gray-600 mt-1">Toplam Cihaz</div>
              </div>
            </div>

            {/* Tip Bazlı Özet */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <Building className="mx-auto text-green-600 mb-1" size={20} />
                <div className="text-lg text-green-700">{totalStats.bankaCount}</div>
                <div className="text-xs text-gray-600">Banka</div>
              </div>
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Building2 className="mx-auto text-blue-600 mb-1" size={20} />
                <div className="text-lg text-blue-700">{totalStats.epkCount}</div>
                <div className="text-xs text-gray-600">EPK</div>
              </div>
              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Building2 className="mx-auto text-orange-600 mb-1" size={20} />
                <div className="text-lg text-orange-700">{totalStats.okCount}</div>
                <div className="text-xs text-gray-600">ÖK</div>
              </div>
            </div>

            {/* Banka/PF Listesi */}
            {bankPFSummaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Henüz Banka/PF ile ilişkilendirilmiş müşteri bulunmuyor.</p>
                <p className="text-xs mt-2">Müşteri modülünden Banka/PF ataması yapın.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm text-gray-700">Detaylı Dağılım (Top 6)</h4>
                  {bankPFSummaries.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShowFullList}
                      className="h-8 gap-1"
                    >
                      <ExternalLink size={14} />
                      <span className="text-xs">Tümünü Göster ({bankPFSummaries.length})</span>
                    </Button>
                  )}
                </div>
                
                {/* Scrollable tablo */}
                <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-[40%]">Banka/PF</TableHead>
                        <TableHead className="text-center w-[15%]">Tip</TableHead>
                        <TableHead className="text-center w-[20%]">ÜİY</TableHead>
                        <TableHead className="text-center w-[25%]">Cihaz</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankPFSummaries.slice(0, 6).map((summary, index) => (
                        <TableRow 
                          key={summary.id}
                          className={index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}
                        >
                          <TableCell className="font-medium text-sm">
                            {summary.name}
                          </TableCell>
                          <TableCell className="text-center">
                            {summary.type === 'Banka' ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Banka
                              </Badge>
                            ) : summary.type === 'EPK' ? (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                EPK
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                ÖK
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-indigo-700">
                              {summary.customerCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {summary.deviceCount > 0 ? (
                              <span className="text-purple-700">
                                <HardDrive className="inline mr-1" size={14} />
                                {summary.deviceCount}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Bilgilendirme */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>ℹ️ Not:</strong> Bu liste, Müşteri modülünde Banka/PF ile ilişkilendirilmiş 
                (linkedBankPFIds veya Banka/PF Kategorisi ile cihaz atanmış) tüm müşterileri gösterir.
              </p>
            </div>
          </div>
        </CardContent>
      )}
      </Card>
    </>
  );
});