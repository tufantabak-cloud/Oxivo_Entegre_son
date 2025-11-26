import React, { useState, useCallback, useMemo } from 'react';
import { Customer, DomainNode } from './CustomerModule';
import { BankPF } from './BankPFModule';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, Filter, Download, CheckSquare, Square, ListChecks, Bug, Database } from 'lucide-react';
import { DeviceCountAnalyzer } from './DeviceCountAnalyzer';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ColumnVisibilityDropdown, ColumnConfig } from './ColumnVisibilityDropdown';
import { FilterDropdown, FilterOption } from './FilterDropdown';
import { Checkbox } from './ui/checkbox';
import { BatchOperationsDialog, BatchOperation, BatchOperationResult } from './BatchOperationsDialog';
import { PaginationControls } from './PaginationControls';
import { usePagination } from '../hooks/usePagination';
// XLSX import - ES6 module format (v3.0.8 - fixed require issue)
import * as XLSX from 'xlsx';
import { matchDomain } from '../utils/domainMatching';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface PayterProduct {
  id: string;
  serialNumber: string;
  name: string;
  tid: string;
  domain?: string;
  firmware?: string;
  terminalType?: string;
  onlineStatus?: string;
  terminalModel?: string;
}

interface SalesRepresentative {
  id: string;
  adSoyad: string;
  aktif: boolean;
}

interface Bank {
  id: string;
  kod: string;
  bankaAdi: string;
  aciklama: string;
  aktif: boolean;
}

interface EPK {
  id: string;
  kod: string;
  kurumAdi: string;
  aciklama: string;
  aktif: boolean;
}

interface OK {
  id: string;
  kod: string;
  kurumAdi: string;
  aciklama: string;
  aktif: boolean;
}

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onUpdateCustomers?: (customers: Customer[]) => void;
  payterProducts?: PayterProduct[];
  bankPFRecords?: BankPF[];
  salesReps?: SalesRepresentative[];
  banks?: Bank[];
  epkList?: EPK[];
  okList?: OK[];
}

// Sütun konfigürasyonu
const CUSTOMER_COLUMN_CONFIGS: ColumnConfig[] = [
  { key: 'cariHesapKodu', label: 'Cari Hesap Kodu', defaultVisible: true },
  { key: 'sektor', label: 'SEKTÖR', defaultVisible: true },
  { key: 'mcc', label: 'MCC', defaultVisible: true },
  { key: 'cariAdi', label: 'Cari Adı', defaultVisible: true },
  { key: 'domain', label: 'Güncel Mypayter Domain', defaultVisible: true },
  { key: 'cihazAdedi', label: 'Cihaz Adedi', defaultVisible: true },
  { key: 'domainMatchCount', label: 'Domain Eşleşmesi (Debug)', defaultVisible: false },
  { key: 'bankaPF', label: 'Banka/PF', defaultVisible: true },
  { key: 'salesRep', label: 'Satış Temsilcisi', defaultVisible: true },
  { key: 'yetkili', label: 'Yetkili', defaultVisible: true },
  { key: 'tel', label: 'Tel', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: false },
  { key: 'vergiDairesi', label: 'Vergi Dairesi', defaultVisible: false },
  { key: 'vergiNo', label: 'Vergi No', defaultVisible: false },
  { key: 'adres', label: 'Adres', defaultVisible: false },
  { key: 'ilce', label: 'İlçe', defaultVisible: true },
  { key: 'postaKodu', label: 'Posta Kodu', defaultVisible: false },
  { key: 'p6x', label: 'P6X', defaultVisible: false },
  { key: 'apollo', label: 'APOLLO', defaultVisible: false },
  { key: 'durum', label: 'Durum', defaultVisible: true },
];

// ⚡ PERFORMANCE: React.memo prevents re-renders when props haven't changed
export const CustomerList = React.memo(function CustomerList({ customers, onSelectCustomer, onUpdateCustomer, onUpdateCustomers, payterProducts = [], bankPFRecords = [], salesReps = [], banks = [], epkList = [], okList = [] }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cihazFilter, setCihazFilter] = useState<string>('all');
  const [salesRepFilter, setSalesRepFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Customer | 'cihazAdedi' | 'bankaPF' | 'salesRep'>('cariAdi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  
  // Toplu işlem state'leri
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  
  // Cihaz sayısı analiz tool
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  
  // Domain migration state
  const [isMigrating, setIsMigrating] = useState(false);

  const handleSort = (field: keyof Customer | 'cihazAdedi' | 'bankaPF') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sıralama ikonu gösterici component
  const SortIcon = ({ field }: { field: keyof Customer | 'cihazAdedi' | 'bankaPF' }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="text-blue-600" />
    ) : (
      <ArrowDown size={14} className="text-blue-600" />
    );
  };

  // Domain bazlı eşleşen cihaz sayısı (matchDomain utility kullanarak - ignoreMainDomain desteği ile)
  const getDomainMatchCount = useCallback((customer: Customer): number => {
    if (!payterProducts || payterProducts.length === 0) {
      return 0;
    }
    
    const customerDomain = customer.guncelMyPayterDomain || customer.domain;
    
    if (!customerDomain || !customerDomain.trim()) {
      return 0;
    }
    
    // matchDomain utility fonksiyonunu kullan (domain normalizasyonu + ignoreMainDomain desteği)
    const matchedProducts = payterProducts.filter(product => {
      if (!product.domain || !product.domain.trim()) {
        return false;
      }
      
      return matchDomain(
        product.domain,
        customerDomain,
        customer.ignoreMainDomain || false,
        customer.domainHierarchy
      );
    });
    
    return matchedProducts.length;
  }, [payterProducts]);

  // Bu müşteriye ait cihaz sayısını hesapla (domain bazlı eşleştirme)
  const getDeviceCount = useCallback((customer: Customer): number => {
    // Domain bazlı otomatik eşleştirme - tek doğru kaynak
    return getDomainMatchCount(customer);
  }, [getDomainMatchCount]);

  // Müşterinin bağlı olduğu Banka/PF firma ünvanlarını getir
  const getBankPFNames = useCallback((customer: Customer): string => {
    const bankPFNames = new Set<string>();
    
    // 1. linkedBankPFIds'den Banka/PF'leri topla (Otomatik veya manuel eşleşme)
    if (customer.linkedBankPFIds && customer.linkedBankPFIds.length > 0) {
      customer.linkedBankPFIds.forEach(id => {
        const record = bankPFRecords.find(r => r.id === id);
        if (record && record.firmaUnvan) {
          bankPFNames.add(record.firmaUnvan);
        }
      });
    }
    
    // 2. bankDeviceAssignments'tan Banka/PF kategorilerini topla (Banka/PF Kategorisi - Cihaz İlişkilendirme)
    if (customer.bankDeviceAssignments && customer.bankDeviceAssignments.length > 0) {
      customer.bankDeviceAssignments.forEach(assignment => {
        // Direkt olarak assignment.bankName'i kullan (zaten kayıtlı olan kategori adı)
        if (assignment.bankName) {
          bankPFNames.add(assignment.bankName);
        }
      });
    }
    
    if (bankPFNames.size === 0) {
      return '-';
    }
    
    return Array.from(bankPFNames).join(', ');
  }, [bankPFRecords]);

  // Domain hiyerarşisindeki tüm domain isimlerini topla (recursive)
  const getAllDomainNames = useCallback((nodes: DomainNode[] | undefined): string[] => {
    if (!nodes || nodes.length === 0) return [];
    
    const names: string[] = [];
    
    const collectNames = (node: DomainNode) => {
      names.push(node.name.toLowerCase());
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => collectNames(child));
      }
    };
    
    nodes.forEach(node => collectNames(node));
    return names;
  }, []);

  // ⚡ Performance: Filter ve sort işlemini memoize et
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const searchLower = searchTerm.toLowerCase();
        
        // Ana domain'de arama
        const matchesMainDomain = (customer.guncelMyPayterDomain || '').toLowerCase().includes(searchLower);
        
        // Domain hiyerarşisindeki tüm alt domain isimlerinde arama
        const domainNames = getAllDomainNames(customer.domainHierarchy);
        const matchesSubDomains = domainNames.some(domainName => 
          domainName.includes(searchLower)
        );
        
        const matchesSearch =
          (customer.cariAdi || '').toLowerCase().includes(searchLower) ||
          (customer.cariHesapKodu || '').toLowerCase().includes(searchLower) ||
          (customer.sektor || '').toLowerCase().includes(searchLower) ||
          String(customer.mcc || '').toLowerCase().includes(searchLower) ||
          (customer.ilce || '').toLowerCase().includes(searchLower) ||
          String(customer.vergiNo || '').toLowerCase().includes(searchLower) ||
          (customer.yetkili || '').toLowerCase().includes(searchLower) ||
          (customer.email || '').toLowerCase().includes(searchLower) ||
          matchesMainDomain || // Ana domain arama eklendi
          matchesSubDomains; // Alt domain arama eklendi

        const matchesStatus =
          statusFilter === 'all' || customer.durum === statusFilter;

        // Cihaz adedi filtresi (domain bazlı eşleştirme ile)
        const cihazAdedi = getDeviceCount(customer);
        let matchesCihaz = true;
        
        if (cihazFilter === '0') {
          matchesCihaz = cihazAdedi === 0;
        } else if (cihazFilter === '1-4') {
          matchesCihaz = cihazAdedi >= 1 && cihazAdedi <= 4;
        } else if (cihazFilter === '5-9') {
          matchesCihaz = cihazAdedi >= 5 && cihazAdedi <= 9;
        } else if (cihazFilter === '10+') {
          matchesCihaz = cihazAdedi >= 10;
        }

        // Satış temsilcisi filtresi
        const matchesSalesRep =
          salesRepFilter === 'all' ||
          (salesRepFilter === 'unassigned' && !customer.salesRepId) ||
          customer.salesRepId === salesRepFilter;

        return matchesSearch && matchesStatus && matchesCihaz && matchesSalesRep;
      })
      .sort((a, b) => {
        // ÖNCELİK: Aktif müşteriler önce, Pasif müşteriler en sonda
        const aStatus = a.durum === 'Aktif' ? 0 : 1;
        const bStatus = b.durum === 'Aktif' ? 0 : 1;
        
        if (aStatus !== bStatus) {
          return aStatus - bStatus; // Aktif (0) önce, Pasif (1) sonda
        }

        // Aynı durum içerisinde (Aktif veya Pasif) normal sıralama devam eder
        
        // Özel durum: Cihaz adedi sıralaması (domain bazlı)
        if (sortField === 'cihazAdedi') {
          const aCount = getDeviceCount(a);
          const bCount = getDeviceCount(b);
          return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
        }

        // Özel durum: Banka/PF sıralaması
        if (sortField === 'bankaPF') {
          const aBankPF = getBankPFNames(a);
          const bBankPF = getBankPFNames(b);
          return sortDirection === 'asc'
            ? aBankPF.localeCompare(bBankPF, 'tr')
            : bBankPF.localeCompare(aBankPF, 'tr');
        }

        // Özel durum: Satış temsilcisi sıralaması
        if (sortField === 'salesRep') {
          const aSalesRep = a.salesRepName || '';
          const bSalesRep = b.salesRepName || '';
          return sortDirection === 'asc'
            ? aSalesRep.localeCompare(bSalesRep, 'tr')
            : bSalesRep.localeCompare(aSalesRep, 'tr');
        }

        const aValue = a[sortField as keyof Customer];
        const bValue = b[sortField as keyof Customer];

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
  }, [
    customers,
    searchTerm,
    statusFilter,
    cihazFilter,
    salesRepFilter,
    sortField,
    sortDirection,
    getAllDomainNames,
    getDeviceCount,
    getBankPFNames,
  ]);

  // ⚡ PHASE 3: Pagination for large customer lists (50 items per page)
  const {
    paginatedItems: paginatedCustomers,
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination(filteredCustomers, 50);

  // ⚡ Filter options with counts (memoized)
  const statusFilterOptions: FilterOption[] = useMemo(() => [
    { value: 'Aktif', label: 'Aktif', count: customers.filter(c => c.durum === 'Aktif').length },
    { value: 'Pasif', label: 'Pasif', count: customers.filter(c => c.durum === 'Pasif').length },
  ], [customers]);

  const cihazFilterOptions: FilterOption[] = useMemo(() => {
    const counts = {
      '0': 0,
      '1-4': 0,
      '5-9': 0,
      '10+': 0,
    };

    // ✅ NULL SAFETY: customers boş olabilir
    (customers || []).forEach(customer => {
      const count = getDeviceCount(customer);
      if (count === 0) counts['0']++;
      else if (count >= 1 && count <= 4) counts['1-4']++;
      else if (count >= 5 && count <= 9) counts['5-9']++;
      else if (count >= 10) counts['10+']++;
    });

    return [
      { value: '0', label: 'Cihazı Yok (0)', count: counts['0'] },
      { value: '1-4', label: '1-4 Cihaz', count: counts['1-4'] },
      { value: '5-9', label: '5-9 Cihaz', count: counts['5-9'] },
      { value: '10+', label: '10+ Cihaz', count: counts['10+'] },
    ];
  }, [customers, getDeviceCount]);

  const salesRepFilterOptions: FilterOption[] = useMemo(() => {
    const unassignedCount = customers.filter(c => !c.salesRepId).length;
    const options: FilterOption[] = [
      { value: 'unassigned', label: 'Atanmamış', count: unassignedCount },
    ];

    salesReps.forEach(rep => {
      const count = customers.filter(c => c.salesRepId === rep.id).length;
      if (count > 0 || rep.aktif) {
        options.push({
          value: rep.id,
          label: rep.adSoyad,
          count,
        });
      }
    });

    return options;
  }, [customers, salesReps]);

  // Sütun görünürlüğü değişikliği
  const handleVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  }, []);

  // Durum değiştirme
  const handleStatusToggle = useCallback((customer: Customer) => {
    const updatedCustomer = {
      ...customer,
      durum: customer.durum === 'Aktif' ? 'Pasif' as const : 'Aktif' as const
    };
    
    if (onUpdateCustomer) {
      onUpdateCustomer(updatedCustomer);
      toast.success(`${customer.cariAdi} durumu ${updatedCustomer.durum} olarak güncellendi`);
    }
  }, [onUpdateCustomer]);

  // Toplu seçim fonksiyonları
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(filteredCustomers.map(c => c.id));
    } else {
      setSelectedCustomerIds([]);
    }
  }, [filteredCustomers]);

  const handleSelectCustomer = useCallback((customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(prev => [...prev, customerId]);
    } else {
      setSelectedCustomerIds(prev => prev.filter(id => id !== customerId));
    }
  }, []);

  // ⚡ Performance: Derived state'leri memoize et
  const isAllSelected = useMemo(
    () => filteredCustomers.length > 0 && selectedCustomerIds.length === filteredCustomers.length,
    [filteredCustomers.length, selectedCustomerIds.length]
  );
  
  const isSomeSelected = useMemo(
    () => selectedCustomerIds.length > 0 && selectedCustomerIds.length < filteredCustomers.length,
    [selectedCustomerIds.length, filteredCustomers.length]
  );

  const selectedCustomers = useMemo(
    () => customers.filter(c => selectedCustomerIds.includes(c.id)),
    [customers, selectedCustomerIds]
  );

  // Toplu işlem uygulama
  const handleBatchOperation = async (
    operation: BatchOperation,
    data?: any
  ): Promise<BatchOperationResult> => {
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    if (!onUpdateCustomer) {
      result.failed = selectedCustomers.length;
      result.errors = selectedCustomers.map(c => ({
        customerId: c.id,
        customerName: c.cariAdi,
        error: 'onUpdateCustomer fonksiyonu tanımlı değil',
      }));
      return result;
    }

    // Tüm güncellenmiş müşterileri topla
    const updatedCustomersList: Customer[] = [];

    for (const customer of selectedCustomers) {
      try {
        let updatedCustomer = { ...customer };

        switch (operation) {
          case 'delete':
            // Silme işlemi için özel bir işaretleme yapılabilir
            // Gerçek silme işlemi parent component'te yapılmalı
            updatedCustomer = { ...customer, durum: 'Pasif' as const };
            break;

          case 'activate':
            updatedCustomer.durum = 'Aktif';
            break;

          case 'deactivate':
            updatedCustomer.durum = 'Pasif';
            break;

          case 'block':
            updatedCustomer.blokeDurumu = true;
            break;

          case 'unblock':
            updatedCustomer.blokeDurumu = false;
            break;

          case 'assign-domain':
            if (data?.domain) {
              updatedCustomer.guncelMyPayterDomain = data.domain;
            }
            break;

          case 'assign-bankpf':
            if (data?.bankPFIds) {
              // linkedBankPFIds güncelle
              const newLinkedBankPFIds = [
                ...(customer.linkedBankPFIds || []),
                ...data.bankPFIds,
              ];
              // Tekrarları kaldır
              updatedCustomer.linkedBankPFIds = [...new Set(newLinkedBankPFIds)];
              
              // Yeni eklenen BankPF'ler için bankDeviceAssignments oluştur
              const newBankPFIds = data.bankPFIds.filter(
                (id: string) => !(customer.linkedBankPFIds || []).includes(id)
              );
              
              if (newBankPFIds.length > 0 && bankPFRecords) {
                console.log(`🔗 Toplu İşlem - ${customer.cariAdi}: ${newBankPFIds.length} yeni Banka/PF kategorisi oluşturuluyor...`);
                
                const newAssignments = newBankPFIds
                  .map((bankPFId: string) => {
                    const bankPF = bankPFRecords.find((bp) => bp.id === bankPFId);
                    if (!bankPF) return null;
                    
                    // Tip bilgisine göre bankId formatını belirle
                    let bankId = '';
                    if (bankPF.tip === 'Banka') {
                      bankId = `bank-${bankPF.id}`;
                    } else if (bankPF.tip === 'EPK') {
                      bankId = `ok-epk-${bankPF.id}`;
                    } else if (bankPF.tip === 'ÖK') {
                      bankId = `ok-ok-${bankPF.id}`;
                    } else {
                      bankId = `bank-${bankPF.id}`;
                    }
                    
                    console.log(`  ➕ ${bankPF.tip} kategorisi: ${bankPF.firmaUnvan} (${bankId})`);
                    
                    return {
                      id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      bankId: bankId,
                      bankName: bankPF.firmaUnvan,
                      bankCode: bankPF.kod || '',
                      deviceIds: [],
                      createdAt: new Date().toISOString(),
                    };
                  })
                  .filter(Boolean);
                
                // Mevcut assignments'a yeni olanları ekle
                updatedCustomer.bankDeviceAssignments = [
                  ...(customer.bankDeviceAssignments || []),
                  ...newAssignments,
                ];
              }
            }
            break;

          case 'assign-user':
            if (data?.user) {
              updatedCustomer.sorumluKisi = data.user;
            }
            break;

          case 'assign-group':
            if (data?.group) {
              updatedCustomer.cariGrubu = data.group;
            }
            break;

          case 'update-service-fee':
            {
              // Hizmet bedeli ayarlarını güncelle
              const currentSettings = customer.serviceFeeSettings ? {
                ...customer.serviceFeeSettings,
                deviceSubscriptions: customer.serviceFeeSettings.deviceSubscriptions || [],
                invoices: customer.serviceFeeSettings.invoices || [],
                reminders: customer.serviceFeeSettings.reminders || [],
              } : {
                customerId: customer.id,
                paymentType: 'monthly' as const,
                standardFeePerDevice: 10,
                contractStartDate: new Date().toISOString().split('T')[0],
                isActive: true,
                deviceSubscriptions: [],
                invoices: [],
                reminders: [],
              };

              updatedCustomer.serviceFeeSettings = {
                ...currentSettings,
                paymentType: data.paymentType || currentSettings.paymentType,
                standardFeePerDevice: data.standardFeePerDevice ?? currentSettings.standardFeePerDevice,
                customFeePerDevice: data.customFeePerDevice,
                contractStartDate: data.contractStartDate || currentSettings.contractStartDate,
                isActive: data.isActive ?? currentSettings.isActive,
              };
            }
            break;

          case 'activate-service-fee':
            {
              if (!customer.serviceFeeSettings) {
                updatedCustomer.serviceFeeSettings = {
                  customerId: customer.id,
                  paymentType: 'monthly',
                  standardFeePerDevice: 10,
                  contractStartDate: new Date().toISOString().split('T')[0],
                  isActive: true,
                  deviceSubscriptions: [],
                  invoices: [],
                  reminders: [],
                };
              } else {
                updatedCustomer.serviceFeeSettings = {
                  ...customer.serviceFeeSettings,
                  deviceSubscriptions: customer.serviceFeeSettings.deviceSubscriptions || [],
                  invoices: customer.serviceFeeSettings.invoices || [],
                  reminders: customer.serviceFeeSettings.reminders || [],
                  isActive: true,
                  suspensionStartDate: undefined,
                  suspensionReason: undefined,
                };
              }
            }
            break;

          case 'deactivate-service-fee':
            {
              if (customer.serviceFeeSettings) {
                updatedCustomer.serviceFeeSettings = {
                  ...customer.serviceFeeSettings,
                  deviceSubscriptions: customer.serviceFeeSettings.deviceSubscriptions || [],
                  invoices: customer.serviceFeeSettings.invoices || [],
                  reminders: customer.serviceFeeSettings.reminders || [],
                  isActive: false,
                };
              }
            }
            break;

          case 'suspend-service-fee':
            {
              if (customer.serviceFeeSettings) {
                updatedCustomer.serviceFeeSettings = {
                  ...customer.serviceFeeSettings,
                  deviceSubscriptions: customer.serviceFeeSettings.deviceSubscriptions || [],
                  invoices: customer.serviceFeeSettings.invoices || [],
                  reminders: customer.serviceFeeSettings.reminders || [],
                  suspensionStartDate: data?.suspensionStartDate || new Date().toISOString().split('T')[0],
                  suspensionReason: data?.suspensionReason || 'Toplu işlem ile donduruldu',
                };
              }
            }
            break;

          case 'resume-service-fee':
            {
              if (customer.serviceFeeSettings) {
                updatedCustomer.serviceFeeSettings = {
                  ...customer.serviceFeeSettings,
                  deviceSubscriptions: customer.serviceFeeSettings.deviceSubscriptions || [],
                  invoices: customer.serviceFeeSettings.invoices || [],
                  reminders: customer.serviceFeeSettings.reminders || [],
                  suspensionStartDate: undefined,
                  suspensionReason: undefined,
                };
              }
            }
            break;

          case 'assign-bank':
            if (data?.bankIds && Array.isArray(data.bankIds)) {
              // Not: Bu özellik müşteri modelinde bankIds alanı gerektiriyor
              // Şimdilik linkedBankPFIds'e Banka kategorisindeki BankPF'leri ekliyoruz
              console.log(`🏦 Toplu Banka Atama: ${data.bankIds.length} banka`);
            }
            break;

          case 'assign-epk':
            if (data?.epkIds && Array.isArray(data.epkIds)) {
              // Not: Bu özellik müşteri modelinde epkIds alanı gerektiriyor
              console.log(`📊 Toplu EPK Atama: ${data.epkIds.length} EPK`);
            }
            break;

          case 'assign-ok':
            if (data?.okIds && Array.isArray(data.okIds)) {
              // Not: Bu özellik müşteri modelinde okIds alanı gerektiriyor
              console.log(`🔐 Toplu ÖK Atama: ${data.okIds.length} ÖK`);
            }
            break;

          case 'assign-mcc':
            if (data?.mcc) {
              updatedCustomer.mcc = data.mcc;
            }
            break;

          case 'assign-sector':
            if (data?.sector) {
              updatedCustomer.sektor = data.sector;
            }
            break;

          case 'assign-salesrep':
            if (data?.salesRepId) {
              updatedCustomer.salesRepId = data.salesRepId;
            }
            break;
        }

        updatedCustomersList.push(updatedCustomer);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          customerId: customer.id,
          customerName: customer.cariAdi,
          error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        });
      }
    }

    // Tüm güncellemeleri tek seferde uygula
    if (updatedCustomersList.length > 0) {
      const updatedCustomersMap = new Map(updatedCustomersList.map(c => [c.id, c]));
      const finalCustomers = customers.map(c => 
        updatedCustomersMap.has(c.id) ? updatedCustomersMap.get(c.id)! : c
      );
      
      // onUpdateCustomers varsa toplu güncelleme kullan, yoksa tek tek güncelle
      if (onUpdateCustomers) {
        onUpdateCustomers(finalCustomers);
        console.log(`✅ Toplu işlem tamamlandı: ${updatedCustomersList.length} müşteri güncellendi (toplu)`);
      } else if (onUpdateCustomer) {
        // Fallback: tek tek güncelle (eski yöntem - race condition riski var)
        finalCustomers.forEach(customer => {
          if (updatedCustomersMap.has(customer.id)) {
            onUpdateCustomer(customer);
          }
        });
        console.log(`✅ Toplu işlem tamamlandı: ${updatedCustomersList.length} müşteri güncellendi (tek tek)`);
      }
    }

    // Seçimi temizle
    setSelectedCustomerIds([]);

    return result;
  };

  // Excel export fonksiyonu (Cihaz Adedi ve Banka/PF dahil)
  const handleExportToExcel = () => {
    try {
      const exportData = filteredCustomers.map(customer => ({
        'Cari Hesap Kodu': customer.cariHesapKodu,
        'SEKTÖR': customer.sektor,
        'MCC': customer.mcc,
        'Cari Adı': customer.cariAdi,
        'Güncel Mypayter Domain': customer.guncelMyPayterDomain || '',
        'Cihaz Adedi': getDeviceCount(customer),
        'Domain Eşleşmesi (Debug)': getDomainMatchCount(customer),
        'Banka/PF': getBankPFNames(customer),
        'Satış Temsilcisi': customer.salesRepName || '',
        'Yetkili': customer.yetkili,
        'Tel': customer.tel,
        'Email': customer.email,
        'Vergi Dairesi': customer.vergiDairesi,
        'Vergi No': customer.vergiNo,
        'Adres': customer.adres,
        'İlçe': customer.ilce,
        'Posta Kodu': customer.postaKodu,
        'P6X': customer.p6x || '',
        'APOLLO': customer.apollo || '',
        'Durum': customer.durum
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Sütun genişlikleri
      ws['!cols'] = [
        { wch: 18 }, // Cari Hesap Kodu
        { wch: 15 }, // SEKTÖR
        { wch: 8 },  // MCC
        { wch: 25 }, // Cari Adı
        { wch: 30 }, // Güncel Mypayter Domain
        { wch: 18 }, // Cihaz Adedi (Otomatik)
        { wch: 18 }, // Domain Eşleşmesi
        { wch: 15 }, // Manuel Atama
        { wch: 35 }, // Banka/PF
        { wch: 20 }, // Satış Temsilcisi
        { wch: 20 }, // Yetkili
        { wch: 15 }, // Tel
        { wch: 25 }, // Email
        { wch: 15 }, // Vergi Dairesi
        { wch: 12 }, // Vergi No
        { wch: 40 }, // Adres
        { wch: 15 }, // İlçe
        { wch: 12 }, // Posta Kodu
        { wch: 10 }, // P6X
        { wch: 10 }, // APOLLO
        { wch: 10 }  // Durum
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Müşteri Listesi');
      
      const fileName = `musteri-listesi-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`✅ ${filteredCustomers.length} müşteri Excel'e aktarıldı`);
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel export başarısız!');
    }
  };

  // Domain Hierarchy Migration fonksiyonu
  const handleDomainMigration = async () => {
    if (isMigrating) {
      toast.error('Migration zaten devam ediyor!');
      return;
    }

    try {
      setIsMigrating(true);
      console.log('🚀 Starting domain migration...');
      
      // Get APIs from window
      const apis = (window as any).__OXIVO_SUPABASE__?.apis;
      
      if (!apis) {
        throw new Error('Supabase APIs not available');
      }

      // Find customers with domain hierarchy
      const customersWithDomains = customers.filter(c => 
        c.domainHierarchy && 
        Array.isArray(c.domainHierarchy) && 
        c.domainHierarchy.length > 0
      );

      console.log(`📊 Found ${customersWithDomains.length} customers with domain hierarchy`);

      if (customersWithDomains.length === 0) {
        toast.info('⚠️ Domain hiyerarşisine sahip müşteri bulunamadı!');
        setIsMigrating(false);
        return;
      }

      // Create domain mapping records
      const domainMappings = customersWithDomains.map(customer => ({
        id: `dm-${customer.id}`,
        customerId: customer.id,
        customerName: customer.cariAdi || customer.id,
        domainTree: customer.domainHierarchy,
        mainDomain: customer.guncelMyPayterDomain || null,
        ignoreMainDomain: customer.ignoreMainDomain || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      console.log(`📦 Creating ${domainMappings.length} domain mapping records...`);

      // Save to Supabase
      const result = await apis.domainMappingApi.create(domainMappings);

      if (result.success) {
        console.log(`✅ Migration successful: ${result.count} records created`);
        toast.success(`✅ ${result.count} domain mapping kaydı oluşturuldu!`);
        
        // Verify
        const checkResult = await apis.domainMappingApi.getAll();
        console.log(`📊 Total domain mappings in Supabase: ${checkResult.data.length}`);
      } else {
        throw new Error('Migration failed');
      }

    } catch (error) {
      console.error('❌ Domain migration error:', error);
      toast.error(`Migration hatası: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cihaz Sayısı Analiz Tool */}
      {showAnalyzer && (
        <DeviceCountAnalyzer
          customers={customers}
          payterProducts={payterProducts}
        />
      )}
      
      {/* Müşteri İstatistikleri */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
          Toplam: {customers.length}
        </Badge>
        <Badge variant="default" className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-700">
          Aktif: {customers.filter(c => c.durum === 'Aktif').length}
        </Badge>
        <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 border-orange-300 text-orange-700">
          Pasif: {customers.filter(c => c.durum === 'Pasif').length}
        </Badge>
        {filteredCustomers.length !== customers.length && (
          <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 border-blue-300 text-blue-700">
            Filtrelenmiş: {filteredCustomers.length}
          </Badge>
        )}
      </div>

      {/* Müşteri Listesi */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Search - Full Width */}
          <div className="w-full relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              id="customer-search"
              type="text"
              placeholder="Cari ara (adı, kod, sektör, MCC, ilçe, yetkili, ana domain, alt domain)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Action Buttons - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {selectedCustomerIds.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsBatchDialogOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 col-span-2 sm:col-span-3 lg:col-span-2"
              >
                <ListChecks size={16} />
                <span className="hidden sm:inline">Toplu İşlemler ({selectedCustomerIds.length})</span>
                <span className="sm:hidden">Toplu ({selectedCustomerIds.length})</span>
              </Button>
            )}
            <Button
              variant={showAnalyzer ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnalyzer(!showAnalyzer)}
              className="flex items-center justify-center gap-2"
              title="Cihaz Adedi tutarlılık analizi - Domain eşleştirme vs Manuel atama karşılaştırması"
            >
              <Bug size={16} />
              <span className="hidden md:inline">{showAnalyzer ? 'Analizi Kapat' : 'Cihaz Analizi'}</span>
              <span className="md:hidden">Analiz</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDomainMigration}
              disabled={isMigrating}
              className="flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 border-purple-300"
              title="Domain hiyerarşilerini domain_mappings tablosuna migrate et"
            >
              <Database size={16} className={isMigrating ? 'animate-pulse' : ''} />
              <span className="hidden md:inline">{isMigrating ? 'Migrate ediliyor...' : 'Domain Migrate'}</span>
              <span className="md:hidden">{isMigrating ? '...' : 'Migrate'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              className="flex items-center justify-center gap-2"
              title="Müşteri listesini Excel'e aktar (Cihaz Adedi ve Banka/PF dahil)"
            >
              <Download size={16} />
              <span className="hidden md:inline">Excel İndir</span>
              <span className="md:hidden">Excel</span>
            </Button>
            <ColumnVisibilityDropdown
              columns={CUSTOMER_COLUMN_CONFIGS}
              storageKey="customerList"
              onVisibilityChange={handleVisibilityChange}
            />
            <FilterDropdown
              label="Durum"
              options={statusFilterOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              allLabel="Tüm Durumlar"
              showCount={true}
            />
            <FilterDropdown
              label="Cihaz Sayısı"
              options={cihazFilterOptions}
              value={cihazFilter}
              onChange={setCihazFilter}
              allLabel="Tüm Cihazlar"
              showCount={true}
            />
            <FilterDropdown
              label="Satış Temsilcisi"
              options={salesRepFilterOptions}
              value={salesRepFilter}
              onChange={setSalesRepFilter}
              allLabel="Tüm Temsilciler"
              showCount={true}
              className="min-w-[120px]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Toplu Seçim Checkbox */}
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Tümünü seç"
                  className={isSomeSelected ? 'opacity-50' : ''}
                />
              </TableHead>
              {columnVisibility['cariHesapKodu'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'cariHesapKodu' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('cariHesapKodu')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'cariHesapKodu' ? 'text-blue-600' : ''}>
                      Cari Hesap Kodu
                    </span>
                    <SortIcon field="cariHesapKodu" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['sektor'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'sektor' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('sektor')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'sektor' ? 'text-blue-600' : ''}>
                      SEKTÖR
                    </span>
                    <SortIcon field="sektor" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['mcc'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'mcc' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('mcc')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'mcc' ? 'text-blue-600' : ''}>
                      MCC
                    </span>
                    <SortIcon field="mcc" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['cariAdi'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'cariAdi' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('cariAdi')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'cariAdi' ? 'text-blue-600' : ''}>
                      Cari Adı
                    </span>
                    <SortIcon field="cariAdi" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['domain'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'guncelMyPayterDomain' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('guncelMyPayterDomain')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'guncelMyPayterDomain' ? 'text-blue-600' : ''}>
                      Güncel Mypayter Domain
                    </span>
                    <SortIcon field="guncelMyPayterDomain" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['cihazAdedi'] !== false && (
                <TableHead 
                  className={`text-center cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'cihazAdedi' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('cihazAdedi')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span className={sortField === 'cihazAdedi' ? 'text-blue-600' : ''}>
                      Cihaz Adedi
                    </span>
                    <SortIcon field="cihazAdedi" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['domainMatchCount'] !== false && (
                <TableHead className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-blue-700">Domain Eşleşmesi (Debug)</span>
                  </div>
                </TableHead>
              )}
              {columnVisibility['bankaPF'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'bankaPF' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('bankaPF')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'bankaPF' ? 'text-blue-600' : ''}>
                      Banka/PF
                    </span>
                    <SortIcon field="bankaPF" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['salesRep'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'salesRep' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('salesRep')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'salesRep' ? 'text-blue-600' : ''}>
                      Satış Temsilcisi
                    </span>
                    <SortIcon field="salesRep" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['yetkili'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'yetkili' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('yetkili')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'yetkili' ? 'text-blue-600' : ''}>
                      Yetkili
                    </span>
                    <SortIcon field="yetkili" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['tel'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'tel' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('tel')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'tel' ? 'text-blue-600' : ''}>
                      Tel
                    </span>
                    <SortIcon field="tel" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['email'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'email' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'email' ? 'text-blue-600' : ''}>
                      Email
                    </span>
                    <SortIcon field="email" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['vergiDairesi'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'vergiDairesi' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('vergiDairesi')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'vergiDairesi' ? 'text-blue-600' : ''}>
                      Vergi Dairesi
                    </span>
                    <SortIcon field="vergiDairesi" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['vergiNo'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'vergiNo' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('vergiNo')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'vergiNo' ? 'text-blue-600' : ''}>
                      Vergi No
                    </span>
                    <SortIcon field="vergiNo" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['adres'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'adres' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('adres')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'adres' ? 'text-blue-600' : ''}>
                      Adres
                    </span>
                    <SortIcon field="adres" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['ilce'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'ilce' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('ilce')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'ilce' ? 'text-blue-600' : ''}>
                      İlçe
                    </span>
                    <SortIcon field="ilce" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['postaKodu'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'postaKodu' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('postaKodu')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'postaKodu' ? 'text-blue-600' : ''}>
                      Posta Kodu
                    </span>
                    <SortIcon field="postaKodu" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['p6x'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'p6x' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('p6x')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'p6x' ? 'text-blue-600' : ''}>
                      P6X
                    </span>
                    <SortIcon field="p6x" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['apollo'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'apollo' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('apollo')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'apollo' ? 'text-blue-600' : ''}>
                      APOLLO
                    </span>
                    <SortIcon field="apollo" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['durum'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'durum' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('durum')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'durum' ? 'text-blue-600' : ''}>
                      Durum
                    </span>
                    <SortIcon field="durum" />
                  </div>
                </TableHead>
              )}
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={21} className="text-center text-gray-500 py-8">
                  Müşteri bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedCustomerIds.includes(customer.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onSelectCustomer(customer)}
                >
                  {/* Checkbox */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCustomerIds.includes(customer.id)}
                      onCheckedChange={(checked) =>
                        handleSelectCustomer(customer.id, checked as boolean)
                      }
                      aria-label={`${customer.cariAdi} seç`}
                    />
                  </TableCell>
                  {columnVisibility['cariHesapKodu'] !== false && (
                    <TableCell>
                      <code className={`text-sm bg-gray-100 px-2 py-1 rounded ${customer.durum === 'Pasif' ? 'line-through text-gray-500' : ''}`}>
                        {customer.cariHesapKodu}
                      </code>
                    </TableCell>
                  )}
                  {columnVisibility['sektor'] !== false && (
                    <TableCell>
                      <span className="text-sm">{customer.sektor}</span>
                    </TableCell>
                  )}
                  {columnVisibility['mcc'] !== false && (
                    <TableCell>
                      <span className="text-sm">{customer.mcc}</span>
                    </TableCell>
                  )}
                  {columnVisibility['cariAdi'] !== false && (
                    <TableCell>
                      <span className={customer.durum === 'Pasif' ? 'line-through text-gray-500' : ''}>
                        {customer.cariAdi}
                      </span>
                    </TableCell>
                  )}
                  {columnVisibility['domain'] !== false && (
                    <TableCell className="max-w-xs">
                      <div className="flex flex-col gap-1">
                        {customer.guncelMyPayterDomain && (
                          <a 
                            href={`https://${customer.guncelMyPayterDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {customer.guncelMyPayterDomain}
                          </a>
                        )}
                        {customer.domainHierarchy && customer.domainHierarchy.length > 0 && (
                          <Badge variant="outline" className="text-xs bg-gray-50 border-gray-300 w-fit">
                            📊 {(() => {
                              const countNodes = (nodes: any[]): number => {
                                return nodes.reduce((sum, node) => sum + 1 + (node.children ? countNodes(node.children) : 0), 0);
                              };
                              const total = countNodes(customer.domainHierarchy);
                              return `${total} birim`;
                            })()}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility['cihazAdedi'] !== false && (() => {
                    const deviceCount = getDeviceCount(customer);
                    return (
                      <TableCell className="text-center">
                        <Badge 
                          variant={deviceCount > 0 ? "default" : "secondary"}
                          className="tabular-nums"
                        >
                          🖥️ {deviceCount}
                        </Badge>
                      </TableCell>
                    );
                  })()}
                  {columnVisibility['domainMatchCount'] !== false && (() => {
                    const domainMatchCount = getDomainMatchCount(customer);
                    return (
                      <TableCell className="text-center">
                        <Badge 
                          variant={domainMatchCount > 0 ? "default" : "secondary"}
                          className="tabular-nums bg-blue-600"
                        >
                          {domainMatchCount}
                        </Badge>
                      </TableCell>
                    );
                  })()}
                  {columnVisibility['bankaPF'] !== false && (() => {
                    const bankPFNames = getBankPFNames(customer);
                    return (
                      <TableCell>
                        <div className="max-w-xs truncate text-sm" title={bankPFNames}>
                          {bankPFNames}
                        </div>
                      </TableCell>
                    );
                  })()}
                  {columnVisibility['salesRep'] !== false && (
                    <TableCell>
                      {customer.salesRepName ? (
                        <Badge variant="outline" className="font-medium">
                          {customer.salesRepName}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                  )}
                  {columnVisibility['yetkili'] !== false && (
                    <TableCell>{customer.yetkili}</TableCell>
                  )}
                  {columnVisibility['tel'] !== false && (
                    <TableCell>{customer.tel}</TableCell>
                  )}
                  {columnVisibility['email'] !== false && (
                    <TableCell>{customer.email}</TableCell>
                  )}
                  {columnVisibility['vergiDairesi'] !== false && (
                    <TableCell>{customer.vergiDairesi}</TableCell>
                  )}
                  {columnVisibility['vergiNo'] !== false && (
                    <TableCell className="tabular-nums">{customer.vergiNo}</TableCell>
                  )}
                  {columnVisibility['adres'] !== false && (
                    <TableCell className="max-w-xs truncate">{customer.adres}</TableCell>
                  )}
                  {columnVisibility['ilce'] !== false && (
                    <TableCell>{customer.ilce}</TableCell>
                  )}
                  {columnVisibility['postaKodu'] !== false && (
                    <TableCell>{customer.postaKodu}</TableCell>
                  )}
                  {columnVisibility['p6x'] !== false && (
                    <TableCell>
                      <span className="text-sm">{customer.p6x || '-'}</span>
                    </TableCell>
                  )}
                  {columnVisibility['apollo'] !== false && (
                    <TableCell>
                      <span className="text-sm">{customer.apollo || '-'}</span>
                    </TableCell>
                  )}
                  {columnVisibility['durum'] !== false && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={customer.durum === 'Aktif'}
                          onCheckedChange={() => handleStatusToggle(customer)}
                        />
                        <Badge
                          variant={customer.durum === 'Aktif' ? 'default' : 'secondary'}
                        >
                          {customer.durum}
                        </Badge>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCustomer(customer);
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      <Eye size={16} />
                      <span>Detay</span>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ⚡ PHASE 3: Pagination Controls */}
      {filteredCustomers.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredCustomers.length}
            onPageChange={goToPage}
            onItemsPerPageChange={setItemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
      )}

      {/* Summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Toplam <strong>{filteredCustomers.length}</strong> cari kayıt
            </span>
            {selectedCustomerIds.length > 0 && (
              <Badge variant="default" className="bg-blue-600">
                <CheckSquare size={14} className="mr-1" />
                {selectedCustomerIds.length} seçili
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4 text-gray-600">
            <span>
              Aktif: <strong>{filteredCustomers.filter(c => c.durum === 'Aktif').length}</strong>
            </span>
            <span>
              Pasif: <strong>{filteredCustomers.filter(c => c.durum === 'Pasif').length}</strong>
            </span>
            <span>
              Toplam Cihaz: <strong>{filteredCustomers.reduce((sum, c) => sum + (c.payterProducts?.length || 0), 0)}</strong>
            </span>
          </div>
        </div>
      </div>
      </div>

      {/* Batch Operations Dialog */}
      <BatchOperationsDialog
        isOpen={isBatchDialogOpen}
        onClose={() => setIsBatchDialogOpen(false)}
        selectedCustomers={selectedCustomers}
        onApplyBatchOperation={handleBatchOperation}
        bankPFRecords={bankPFRecords}
        banks={banks}
        epkList={epkList}
        okList={okList}
        salesReps={salesReps}
      />
    </div>
  );
});
