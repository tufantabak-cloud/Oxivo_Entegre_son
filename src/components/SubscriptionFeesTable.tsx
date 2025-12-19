import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// Tooltip removed - import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ReminderSettingsPanel } from './ReminderSettingsPanel';
import { BatchApprovalConfirmation } from './BatchApprovalConfirmation';
import { OverdueSuspensionWarningPanel } from './OverdueSuspensionWarningPanel';
import { Switch } from './ui/switch';
import { ColumnVisibilityDropdown, ColumnConfig } from './ColumnVisibilityDropdown';
import { FilterDropdown, FilterOption } from './FilterDropdown';
import { 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle,
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  AlertTriangle, 
  Clock, 
  Snowflake, 
  Play,
  ChevronDown,
  ChevronUp,
  Ban,
  Bell,
  BellOff,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';

interface DeviceRowData {
  customer: Customer;
  device: DeviceSubscription;
  deviceDomain: string;
  bankName: string | null;
  bankCode: string | null;
  monthlyFee: number;
  subscriptionType: 'monthly' | 'yearly';
  isActive: boolean;
  hasBankAssignment: boolean;
  currentInvoice?: ServiceFeeInvoice;
  daysUntilDue?: number;
  paymentConfirmed: boolean;
}

interface SubscriptionFeesTableProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
  onUpdateCustomer: (customer: Customer) => void;
  selectedPeriod: string; // Format: "2025-01" or "2025"
  suspensionReasons: SuspensionReason[];
}

// Sütun konfigürasyonu
const DEVICE_COLUMN_CONFIGS: ColumnConfig[] = [
  { key: 'customerName', label: 'Müşteri Adı', defaultVisible: true },
  { key: 'customerCode', label: 'Cari Hesap Kodu', defaultVisible: true },
  { key: 'domain', label: 'Domain', defaultVisible: true },
  { key: 'serialNumber', label: 'Seri No', defaultVisible: true },
  { key: 'bankName', label: 'Banka', defaultVisible: true },
  { key: 'subscriptionType', label: 'Abonelik Tipi', defaultVisible: true },
  { key: 'monthlyFee', label: 'Ücret', defaultVisible: true },
  { key: 'status', label: 'Durum', defaultVisible: true },
  { key: 'payment', label: 'Ödeme', defaultVisible: true },
  { key: 'reminder', label: 'Hatırlatma', defaultVisible: true },
  { key: 'actions', label: 'Aksiyon', defaultVisible: true },
];

export function SubscriptionFeesTable({ 
  customers, 
  payterProducts, 
  onUpdateCustomer,
  selectedPeriod,
  suspensionReasons
}: SubscriptionFeesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'bankless'>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'confirmed' | 'pending' | 'overdue'>('all');
  const [filterSubscriptionType, setFilterSubscriptionType] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'customerName' | 'domain' | 'serialNumber' | 'bankName' | 'monthlyFee'>('customerName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  
  // Dondurma dialog
  const [suspensionDialog, setSuspensionDialog] = useState<{
    open: boolean;
    devices: DeviceRowData[];
  }>({ open: false, devices: [] });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionUntilDate, setSuspensionUntilDate] = useState('');

  // Toplu onay dialog
  const [batchApprovalDialog, setBatchApprovalDialog] = useState<{
    open: boolean;
    customerId?: string;
  }>({ open: false });

  // Sıralama fonksiyonu
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sıralama ikonu gösterici component
  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="text-blue-600" />
    ) : (
      <ArrowDown size={14} className="text-blue-600" />
    );
  };

  // Sütun görünürlüğü değişikliği
  const handleVisibilityChange = (visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  };

  // Domain normalizasyon fonksiyonu
  const normalizeDomain = (domain: string | undefined): string => {
    if (!domain) return '';
    return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  // Domain eşleştirme fonksiyonu (Ana Domain görmezden gelme desteği ile)
  const matchDomainFn = (
    productDomain: string | undefined,
    customerDomain: string | undefined,
    ignoreMainDomain: boolean = false
  ): boolean => {
    const normalizedProduct = normalizeDomain(productDomain);
    const normalizedCustomer = normalizeDomain(customerDomain);
    
    if (!normalizedProduct || !normalizedCustomer) return false;
    
    if (ignoreMainDomain) {
      // Ana domain'i görmezden gel, SADECE alt domainleri kabul et
      // Ana domain eşleşmesini engelle
      if (normalizedProduct === normalizedCustomer) return false;
      
      // Alt domain kontrolü: product domain customer domain ile bitmeli ve önünde subdomain olmalı
      return normalizedProduct.endsWith('.' + normalizedCustomer);
    } else {
      // Tam eşleşme (Ana domain eşleştirmesi)
      return normalizedProduct === normalizedCustomer;
    }
  };

  // Cihaz verilerini topla
  const deviceRows = useMemo((): DeviceRowData[] => {
    const rows: DeviceRowData[] = [];

    customers.forEach(customer => {
      if (!customer.serviceFeeSettings) return;

      const serviceFee = customer.serviceFeeSettings;
      
      // Müşterinin Payter cihazlarını bul (Ana Domain görmezden gelme desteği ile)
      const customerDomain = customer.domain || customer.guncelMyPayterDomain;
      if (!customerDomain) return;
      
      const matchedProducts = payterProducts.filter(product => {
        if (!product.domain) return false;
        return matchDomainFn(product.domain, customerDomain, customer.ignoreMainDomain || false);
      });

      matchedProducts.forEach(product => {
        // ✅ ARRAY SAFETY: deviceSubscriptions kontrolü
        const deviceSubscriptions = Array.isArray(serviceFee.deviceSubscriptions) 
          ? serviceFee.deviceSubscriptions 
          : [];
          
        // Cihaz abonelik kaydını bul veya oluştur
        const subscription = deviceSubscriptions.find(d => d.deviceId === product.id);
        const deviceSub: DeviceSubscription = subscription || {
          deviceId: product.id,
          deviceSerialNumber: product.serialNumber || '',
          deviceName: product.name || '',
          monthlyFee: serviceFee.customFeePerDevice || serviceFee.standardFeePerDevice || 0,
          isActive: true,
          activationDate: new Date().toISOString().split('T')[0],
          paymentStatus: 'pending'
        };

        // ✅ ARRAY SAFETY: bankDeviceAssignments kontrolü
        const bankAssignments = Array.isArray(customer.bankDeviceAssignments)
          ? customer.bankDeviceAssignments
          : [];
          
        // Banka atamasını bul
        const bankAssignment = bankAssignments.find(
          ba => Array.isArray(ba.deviceIds) && ba.deviceIds.includes(product.id)
        );

        // ✅ ARRAY SAFETY: invoices kontrolü
        const invoices = Array.isArray(serviceFee.invoices)
          ? serviceFee.invoices
          : [];
          
        // Mevcut dönem faturasını bul
        const currentInvoice = invoices.find(inv => inv.period === selectedPeriod);

        // Ödeme son tarihi hesaplama
        let daysUntilDue: number | undefined = undefined;
        if (currentInvoice) {
          const dueDate = new Date(currentInvoice.dueDate);
          const today = new Date();
          daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        rows.push({
          customer,
          device: deviceSub,
          deviceDomain: product.domain || '',
          bankName: bankAssignment?.bankName || null,
          bankCode: bankAssignment?.bankCode || null,
          monthlyFee: deviceSub.monthlyFee,
          subscriptionType: serviceFee.paymentType,
          isActive: deviceSub.isActive && !currentInvoice?.isSuspended,
          hasBankAssignment: !!bankAssignment,
          currentInvoice,
          daysUntilDue,
          paymentConfirmed: currentInvoice?.paymentConfirmed || false
        });
      });
    });

    return rows;
  }, [customers, payterProducts, selectedPeriod]);

  // ⚡ Filter options with counts (memoized)
  const statusFilterOptions: FilterOption[] = useMemo(() => {
    const counts = {
      active: 0,
      suspended: 0,
      bankless: 0,
    };

    deviceRows.forEach(row => {
      if (row.isActive && row.hasBankAssignment) counts.active++;
      if (!row.isActive) counts.suspended++;
      if (!row.hasBankAssignment) counts.bankless++;
    });

    return [
      { value: 'active', label: 'Aktif', count: counts.active },
      { value: 'suspended', label: 'Dondurulmuş', count: counts.suspended },
      { value: 'bankless', label: 'Banka Tanımsız', count: counts.bankless },
    ];
  }, [deviceRows]);

  const paymentStatusFilterOptions: FilterOption[] = useMemo(() => {
    const counts = {
      confirmed: 0,
      pending: 0,
      overdue: 0,
    };

    deviceRows.forEach(row => {
      if (row.paymentConfirmed) counts.confirmed++;
      else if (row.daysUntilDue && row.daysUntilDue < 0) counts.overdue++;
      else counts.pending++;
    });

    return [
      { value: 'confirmed', label: 'Onaylandı', count: counts.confirmed },
      { value: 'pending', label: 'Bekliyor', count: counts.pending },
      { value: 'overdue', label: 'Gecikmiş', count: counts.overdue },
    ];
  }, [deviceRows]);

  const subscriptionTypeFilterOptions: FilterOption[] = useMemo(() => {
    const counts = {
      monthly: 0,
      yearly: 0,
    };

    deviceRows.forEach(row => {
      if (row.subscriptionType === 'monthly') counts.monthly++;
      if (row.subscriptionType === 'yearly') counts.yearly++;
    });

    return [
      { value: 'monthly', label: 'Aylık', count: counts.monthly },
      { value: 'yearly', label: 'Yıllık', count: counts.yearly },
    ];
  }, [deviceRows]);

  // Filtreleme ve sıralama
  const filteredRows = useMemo(() => {
    let filtered = deviceRows.filter(row => {
      // Arama
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = 
          row.customer.cariAdi.toLowerCase().includes(searchLower) ||
          row.customer.cariHesapKodu.toLowerCase().includes(searchLower) ||
          row.device.deviceSerialNumber.toLowerCase().includes(searchLower) ||
          row.deviceDomain.toLowerCase().includes(searchLower) ||
          (row.bankName && row.bankName.toLowerCase().includes(searchLower));
        if (!matches) return false;
      }

      // Durum filtresi
      if (filterStatus === 'active' && !row.isActive) return false;
      if (filterStatus === 'suspended' && row.isActive) return false;
      if (filterStatus === 'bankless' && row.hasBankAssignment) return false;

      // Ödeme durumu filtresi
      if (filterPaymentStatus === 'confirmed' && !row.paymentConfirmed) return false;
      if (filterPaymentStatus === 'pending' && (row.paymentConfirmed || (row.daysUntilDue && row.daysUntilDue < 0))) return false;
      if (filterPaymentStatus === 'overdue' && (!row.daysUntilDue || row.daysUntilDue >= 0)) return false;

      // Abonelik tipi filtresi
      if (filterSubscriptionType === 'monthly' && row.subscriptionType !== 'monthly') return false;
      if (filterSubscriptionType === 'yearly' && row.subscriptionType !== 'yearly') return false;

      return true;
    });

    // Sıralama
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'customerName':
          aValue = a.customer.cariAdi;
          bValue = b.customer.cariAdi;
          break;
        case 'domain':
          aValue = a.deviceDomain;
          bValue = b.deviceDomain;
          break;
        case 'serialNumber':
          aValue = a.device.deviceSerialNumber;
          bValue = b.device.deviceSerialNumber;
          break;
        case 'bankName':
          aValue = a.bankName || '';
          bValue = b.bankName || '';
          break;
        case 'monthlyFee':
          aValue = a.monthlyFee;
          bValue = b.monthlyFee;
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        default:
          aValue = a.customer.cariAdi;
          bValue = b.customer.cariAdi;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'tr') 
          : bValue.localeCompare(aValue, 'tr');
      }

      return 0;
    });

    return filtered;
  }, [deviceRows, searchTerm, filterStatus, filterPaymentStatus, filterSubscriptionType, sortField, sortDirection]);

  // Müşteri bazlı gruplama
  const groupedByCustomer = useMemo(() => {
    const groups = new Map<string, {
      customer: Customer;
      devices: DeviceRowData[];
      totalDevices: number;
      activeDevices: number;
      suspendedDevices: number;
      totalRevenue: number;
      confirmedPayments: number;
      pendingPayments: number;
      overduePayments: number;
      banklessDevices: number;
    }>();

    filteredRows.forEach(row => {
      const customerId = row.customer.id;
      
      if (!groups.has(customerId)) {
        groups.set(customerId, {
          customer: row.customer,
          devices: [],
          totalDevices: 0,
          activeDevices: 0,
          suspendedDevices: 0,
          totalRevenue: 0,
          confirmedPayments: 0,
          pendingPayments: 0,
          overduePayments: 0,
          banklessDevices: 0
        });
      }

      const group = groups.get(customerId)!;
      group.devices.push(row);
      group.totalDevices++;
      
      if (row.isActive) {
        group.activeDevices++;
        if (row.hasBankAssignment) {
          group.totalRevenue += (row.monthlyFee || 0);
        }
      } else {
        group.suspendedDevices++;
      }

      if (!row.hasBankAssignment) {
        group.banklessDevices++;
      }

      if (row.paymentConfirmed) {
        group.confirmedPayments++;
      } else if (row.daysUntilDue !== undefined) {
        if (row.daysUntilDue < 0) {
          group.overduePayments++;
        } else {
          group.pendingPayments++;
        }
      }
    });

    // Map'i array'e çevir ve müşteri adına göre sırala
    return Array.from(groups.values()).sort((a, b) => 
      a.customer.cariAdi.localeCompare(b.customer.cariAdi, 'tr')
    );
  }, [filteredRows]);

  // Ödeme onayı toggle
  const handlePaymentConfirm = (row: DeviceRowData, confirmed: boolean) => {
    if (!row.currentInvoice) {
      toast.error('Bu dönem için fatura bulunamadı');
      return;
    }

    const updatedCustomer = { ...row.customer };
    if (!updatedCustomer.serviceFeeSettings) return;

    const invoices = updatedCustomer.serviceFeeSettings.invoices;
    if (!invoices || !Array.isArray(invoices)) return;

    const invoiceIndex = invoices.findIndex(
      inv => inv.id === row.currentInvoice!.id
    );

    if (invoiceIndex === -1) return;

    updatedCustomer.serviceFeeSettings.invoices[invoiceIndex] = {
      ...row.currentInvoice,
      paymentConfirmed: confirmed,
      paymentConfirmedDate: confirmed ? new Date().toISOString().split('T')[0] : undefined,
      status: confirmed ? 'paid' : 'pending'
    };

    onUpdateCustomer(updatedCustomer);
    toast.success(confirmed ? '✅ Ödeme onaylandı' : '❌ Ödeme onayı kaldırıldı');
  };

  // Hatırlatma gönderme (simülasyon)
  const handleSendReminder = (row: DeviceRowData, dayNumber: number) => {
    if (!row.currentInvoice) return;

    const updatedCustomer = { ...row.customer };
    if (!updatedCustomer.serviceFeeSettings) return;

    // ✅ ARRAY SAFETY: invoices kontrolü
    const invoices = Array.isArray(updatedCustomer.serviceFeeSettings.invoices)
      ? updatedCustomer.serviceFeeSettings.invoices
      : [];
      
    const invoiceIndex = invoices.findIndex(
      inv => inv.id === row.currentInvoice!.id
    );

    if (invoiceIndex === -1) return;

    const currentRemindersSent = row.currentInvoice.remindersSent || [];
    if (currentRemindersSent.includes(dayNumber)) {
      toast.info(`${dayNumber}. gün hatırlatması zaten gönderildi`);
      return;
    }

    updatedCustomer.serviceFeeSettings.invoices[invoiceIndex] = {
      ...row.currentInvoice,
      remindersSent: [...currentRemindersSent, dayNumber]
    };

    onUpdateCustomer(updatedCustomer);

    // Simülasyon - gerçek uygulamada buradan SMS/Email API çağrılacak
    console.log('📧 HATIRLATMA GÖNDERİLDİ:', {
      müşteri: row.customer.cariAdi,
      email: row.customer.email,
      telefon: row.customer.tel,
      gün: dayNumber,
      mesaj: `Sayın ${row.customer.yetkili}, ${selectedPeriod} dönemi aidat bedeliniz (${(row.monthlyFee || 0).toFixed(2)} €) için ödeme beklenmektedir.`
    });

    toast.success(`📧 ${dayNumber}. gün hatırlatması gönderildi (simülasyon)`);
  };

  // Excel export
  const handleExportToExcel = () => {
    try {
      const exportData = filteredRows.map(row => ({
        'Müşteri Adı': row.customer.cariAdi,
        'Cari Hesap Kodu': row.customer.cariHesapKodu,
        'Domain': row.deviceDomain,
        'Seri No': row.device.deviceSerialNumber,
        'Banka': row.bankName || 'Tanımsız',
        'Banka Kodu': row.bankCode || '-',
        'Abonelik Tipi': row.subscriptionType === 'monthly' ? 'Aylık' : 'Yıllık',
        'Aylık Ücret (€)': (row.monthlyFee || 0).toFixed(2),
        'Durum': row.isActive ? 'Aktif' : 'Askıda',
        'Ödeme Durumu': row.paymentConfirmed ? 'Alındı' : (row.daysUntilDue && row.daysUntilDue < 0 ? 'Gecikmiş' : 'Bekliyor'),
        'Kalan Gün': row.daysUntilDue || '-',
        'Dönem': selectedPeriod
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aidat Cihaz Listesi');
      
      // Sütun genişliklerini ayarla
      const colWidths = [
        { wch: 30 }, // Müşteri Adı
        { wch: 20 }, // Cari Hesap Kodu
        { wch: 25 }, // Domain
        { wch: 15 }, // Seri No
        { wch: 25 }, // Banka
        { wch: 15 }, // Banka Kodu
        { wch: 15 }, // Abonelik Tipi
        { wch: 15 }, // Aylık Ücret
        { wch: 12 }, // Durum
        { wch: 15 }, // Ödeme Durumu
        { wch: 12 }, // Kalan Gün
        { wch: 12 }  // Dönem
      ];
      ws['!cols'] = colWidths;

      const fileName = `Aidat_Cihaz_Listesi_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`✅ ${filteredRows.length} kayıt Excel'e aktarıldı`);
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel export sırasında hata oluştu');
    }
  };

  // Toplu dondurma
  const handleBulkSuspension = () => {
    const selectedRows = filteredRows.filter(row => 
      selectedDevices.has(`${row.customer.id}-${row.device.deviceId}`)
    );

    if (selectedRows.length === 0) {
      toast.error('Lütfen en az bir cihaz seçin');
      return;
    }

    setSuspensionDialog({ open: true, devices: selectedRows });
  };

  const confirmSuspension = () => {
    suspensionDialog.devices.forEach(row => {
      const updatedCustomer = { ...row.customer };
      if (!updatedCustomer.serviceFeeSettings || !row.currentInvoice) return;

      // ✅ ARRAY SAFETY: invoices kontrolü
      const invoices = Array.isArray(updatedCustomer.serviceFeeSettings.invoices)
        ? updatedCustomer.serviceFeeSettings.invoices
        : [];
        
      const invoiceIndex = invoices.findIndex(
        inv => inv.id === row.currentInvoice!.id
      );

      if (invoiceIndex !== -1) {
        updatedCustomer.serviceFeeSettings.invoices[invoiceIndex] = {
          ...row.currentInvoice,
          isSuspended: true,
          suspensionDate: new Date().toISOString().split('T')[0],
          manualSuspensionReason: suspensionReason,
          suspensionUntilDate: suspensionUntilDate || undefined
        };

        onUpdateCustomer(updatedCustomer);

        // Simülasyon - bildirim gönderimi
        console.log('🚫 HİZMET DONDURMA BİLDİRİMİ:', {
          müşteri: row.customer.cariAdi,
          cihaz: row.device.deviceSerialNumber,
          sebep: suspensionReason,
          tarih: suspensionUntilDate
        });
      }
    });

    toast.success(`🚫 ${suspensionDialog.devices.length} cihaz donduruldu`);
    setSuspensionDialog({ open: false, devices: [] });
    setSuspensionReason('');
    setSuspensionUntilDate('');
    setSelectedDevices(new Set());
  };

  // Toplu onay handler'ı
  const handleBatchApproval = (customerId?: string) => {
    setBatchApprovalDialog({ open: true, customerId });
  };

  // Toplu onay callback'i
  const handleBatchApprovalConfirm = (approvedDevices: any[], createInvoice: boolean) => {
    // Her cihaz için ödeme onayı yap
    approvedDevices.forEach((device) => {
      const customer = customers.find(c => c.id === device.customerId);
      if (!customer || !customer.serviceFeeSettings) return;

      const updatedCustomer = { ...customer };
      
      // ✅ ARRAY SAFETY: invoices kontrolü
      const invoices = Array.isArray(updatedCustomer.serviceFeeSettings!.invoices)
        ? updatedCustomer.serviceFeeSettings!.invoices
        : [];
      
      // Fatura var mı kontrol et
      let invoiceIndex = invoices.findIndex(
        inv => inv.id === device.invoiceId
      );

      if (invoiceIndex === -1 && createInvoice) {
        // Fatura yoksa oluştur
        const newInvoice: ServiceFeeInvoice = {
          id: `INV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          invoiceNumber: `AI-${selectedPeriod}-${customer.cariHesapKodu}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          period: selectedPeriod,
          deviceCount: 1,
          totalAmount: device.monthlyFee || 0,
          status: 'paid',
          paymentDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          devices: [device],
          paymentConfirmed: true,
          paymentConfirmedDate: new Date().toISOString().split('T')[0]
        };
        invoices.push(newInvoice);
        updatedCustomer.serviceFeeSettings!.invoices = invoices;
      } else if (invoiceIndex !== -1) {
        // Fatura varsa güncelle
        invoices[invoiceIndex] = {
          ...invoices[invoiceIndex],
          paymentConfirmed: true,
          paymentConfirmedDate: new Date().toISOString().split('T')[0],
          status: 'paid',
          paymentDate: new Date().toISOString().split('T')[0]
        };
        updatedCustomer.serviceFeeSettings!.invoices = invoices;
      }

      onUpdateCustomer(updatedCustomer);
    });

    toast.success(`✅ ${approvedDevices.length} cihaz ödemesi onaylandı${createInvoice ? ' ve fatura kayıtları oluşturuldu' : ''}`);
    setBatchApprovalDialog({ open: false });
    setSelectedDevices(new Set());
  };

  // 10+ gün gecikmiş cihazları dondurma handler'ı
  const handleOverdueSuspension = (devices: any[]) => {
    setSuspensionDialog({ open: true, devices });
    setSuspensionReason('10 gün ödeme gecikmesi - otomatik dondurma');
  };

  return (
    <div className="space-y-4">
      {/* 10. Gün Dondurma Uyarı Paneli */}
      <OverdueSuspensionWarningPanel
        customers={customers}
        payterProducts={payterProducts}
        selectedPeriod={selectedPeriod}
        onSuspendDevices={handleOverdueSuspension}
      />

      {/* Üst Kontrol Paneli */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Toplam: {deviceRows.length} cihaz
          </Badge>
          {filteredRows.length !== deviceRows.length && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              Filtrelenmiş: {filteredRows.length} cihaz
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportToExcel}
            className="flex items-center gap-2"
            title="Cihaz listesini Excel'e aktar"
          >
            <Download size={16} />
            <span>Excel İndir</span>
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Müşteri, cihaz seri no, domain, banka ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <FilterDropdown
                label="Durum"
                options={statusFilterOptions}
                value={filterStatus}
                onChange={setFilterStatus}
                allLabel="Tüm Durumlar"
                showCount={true}
              />

              <FilterDropdown
                label="Ödeme Durumu"
                options={paymentStatusFilterOptions}
                value={filterPaymentStatus}
                onChange={setFilterPaymentStatus}
                allLabel="Tüm Ödemeler"
                showCount={true}
              />

              <FilterDropdown
                label="Abonelik Tipi"
                options={subscriptionTypeFilterOptions}
                value={filterSubscriptionType}
                onChange={setFilterSubscriptionType}
                allLabel="Tüm Abonelikler"
                showCount={true}
              />

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterPaymentStatus('all');
                  setFilterSubscriptionType('all');
                }}
              >
                <Filter size={16} className="mr-2" />
                Sıfırla
              </Button>
            </div>
            
            <div className="flex justify-start">
              <ColumnVisibilityDropdown
                columns={DEVICE_COLUMN_CONFIGS}
                storageKey="subscriptionFeesTable"
                onVisibilityChange={handleVisibilityChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toplu İşlemler */}
      {selectedDevices.size > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <strong>{selectedDevices.size}</strong> cihaz seçildi
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDevices(new Set())}
                >
                  Seçimi Temizle
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkSuspension}
                >
                  <Ban size={16} className="mr-2" />
                  Toplu Dondur
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tablo - Müşteri Bazlı Gruplandırılmış */}
      <Card>
        <CardHeader>
          <CardTitle>
            Aidat Bedelleri - Cihaz Detaylı Liste ({filteredRows.length} cihaz, {groupedByCustomer.length} müşteri)
          </CardTitle>
          <p className="text-sm text-gray-600">Dönem: {selectedPeriod}</p>
        </CardHeader>
        <CardContent>
          {filteredRows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Filtreye uygun kayıt bulunamadı</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {groupedByCustomer.map((group) => {
                const groupKey = group.customer.id;
                
                // Gecikme hesaplama - grup içindeki en kısa daysUntilDue
                const minDaysUntilDue = group.devices.reduce((min, device) => {
                  if (device.daysUntilDue === undefined) return min;
                  return min === undefined ? device.daysUntilDue : Math.min(min, device.daysUntilDue);
                }, undefined as number | undefined);

                // Hatırlatma ayarları
                const reminderSettings = group.customer.serviceFeeSettings?.reminderSettings || {
                  day3Enabled: true,
                  day5Enabled: true,
                  day10AutoSuspend: true
                };

                // Toplu onay yapılacak cihazlar (ödeme alınmamış, aktif, banka atamalı)
                const devicesForApproval = group.devices.filter(d => 
                  !d.paymentConfirmed && d.isActive && d.hasBankAssignment
                );
                
                return (
                  <AccordionItem 
                    key={groupKey} 
                    value={groupKey}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Müşteri Grup Başlığı ve Toplu Aksiyonlar */}
                    <div className="bg-gray-100 border-b border-gray-200">
                      <div className="px-4 py-3 flex items-center justify-between gap-4">
                        {/* Sol Taraf - Müşteri Bilgisi */}
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <p className={`font-medium ${group.customer.durum === 'Pasif' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {group.customer.cariAdi}
                            </p>
                            <p className={`text-xs ${group.customer.durum === 'Pasif' ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                              {group.customer.cariHesapKodu}
                            </p>
                          </div>
                          
                          {/* Gecikme Sayacı */}
                          {minDaysUntilDue !== undefined && minDaysUntilDue < 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Clock size={14} />
                              Ödeme Gecikmesi: {Math.abs(minDaysUntilDue)} Gün
                            </Badge>
                          )}
                        </div>

                        {/* Orta - İstatistikler */}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50">
                            {group.totalDevices} cihaz
                          </Badge>
                          {group.activeDevices > 0 && (
                            <Badge className="bg-green-100 text-green-700">
                              {group.activeDevices} aktif
                            </Badge>
                          )}
                          {group.suspendedDevices > 0 && (
                            <Badge className="bg-orange-100 text-orange-700">
                              {group.suspendedDevices} askıda
                            </Badge>
                          )}
                        </div>

                        {/* Sağ Taraf - Aksiyonlar */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {/* Toplu Onay Butonu */}
                          {devicesForApproval.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                              onClick={() => handleBatchApproval(group.customer.id)}
                            >
                              <CheckCircle size={16} className="mr-2" />
                              Ödemeyi Toplu Onayla ({devicesForApproval.length})
                            </Button>
                          )}

                          {/* Hatırlatma Ayarları */}
                          <ReminderSettingsPanel
                            customer={group.customer}
                            onUpdate={onUpdateCustomer}
                          />
                        </div>
                      </div>

                      {/* Hatırlatma Toggle'ları */}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* 3. Gün Hatırlatma */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={reminderSettings.day3Enabled}
                              disabled
                              className="h-4 w-8"
                            />
                            <span className={`text-xs ${reminderSettings.day3Enabled ? 'text-green-700' : 'text-gray-400'}`}>
                              {reminderSettings.day3Enabled ? <Bell size={14} className="inline mr-1" /> : <BellOff size={14} className="inline mr-1" />}
                              3. Gün Hatırlat
                            </span>
                          </div>

                          {/* 5. Gün Hatırlatma */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={reminderSettings.day5Enabled}
                              disabled
                              className="h-4 w-8"
                            />
                            <span className={`text-xs ${reminderSettings.day5Enabled ? 'text-orange-700' : 'text-gray-400'}`}>
                              {reminderSettings.day5Enabled ? <Bell size={14} className="inline mr-1" /> : <BellOff size={14} className="inline mr-1" />}
                              5. Gün Hatırlat
                            </span>
                          </div>

                          {/* 10. Gün Otomatik Dondur */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={reminderSettings.day10AutoSuspend}
                              disabled
                              className="h-4 w-8"
                            />
                            <span className={`text-xs ${reminderSettings.day10AutoSuspend ? 'text-red-700' : 'text-gray-400'}`}>
                              {reminderSettings.day10AutoSuspend ? <Ban size={14} className="inline mr-1" /> : ''}
                              10. Gün Otomatik Dondur
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="text-green-600">{group.totalRevenue.toFixed(2)} €</span>
                          {' / '}
                          <span className="text-xs">
                            ✓ {group.confirmedPayments} | 
                            ⏱ {group.pendingPayments} |  
                            ! {group.overduePayments}
                          </span>
                        </div>
                      </div>
                    </div>

                    <AccordionTrigger className="px-4 py-2 hover:bg-gray-50 hover:no-underline">
                      <div className="text-sm text-gray-600">
                        Cihaz Detaylarını Göster / Gizle
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-0 pb-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 w-8">
                                <Checkbox
                                  checked={group.devices.every(d => 
                                    selectedDevices.has(`${d.customer.id}-${d.device.deviceId}`)
                                  )}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedDevices);
                                    group.devices.forEach(d => {
                                      const key = `${d.customer.id}-${d.device.deviceId}`;
                                      if (checked) {
                                        newSet.add(key);
                                      } else {
                                        newSet.delete(key);
                                      }
                                    });
                                    setSelectedDevices(newSet);
                                  }}
                                />
                              </th>
                              {columnVisibility['domain'] !== false && (
                                <th className="text-left py-2 px-3">Domain</th>
                              )}
                              {columnVisibility['serialNumber'] !== false && (
                                <th className="text-left py-2 px-3">Seri No</th>
                              )}
                              {columnVisibility['bankName'] !== false && (
                                <th className="text-left py-2 px-3">Banka</th>
                              )}
                              {columnVisibility['subscriptionType'] !== false && (
                                <th className="text-left py-2 px-3">Abonelik</th>
                              )}
                              {columnVisibility['monthlyFee'] !== false && (
                                <th className="text-left py-2 px-3">Ücret</th>
                              )}
                              {columnVisibility['status'] !== false && (
                                <th className="text-center py-2 px-3">Durum</th>
                              )}
                              {columnVisibility['payment'] !== false && (
                                <th className="text-center py-2 px-3">Ödeme</th>
                              )}
                              {columnVisibility['reminder'] !== false && (
                                <th className="text-center py-2 px-3">Hatırlatma</th>
                              )}
                              {columnVisibility['actions'] !== false && (
                                <th className="text-center py-2 px-3">Aksiyon</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {group.devices.map((row) => {
                              const rowKey = `${row.customer.id}-${row.device.deviceId}`;
                              const isSelected = selectedDevices.has(rowKey);
                              const remindersSent = row.currentInvoice?.remindersSent || [];

                              return (
                                <tr 
                                  key={rowKey} 
                                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                                    !row.isActive ? 'bg-orange-50' : ''
                                  } ${!row.hasBankAssignment ? 'bg-purple-50' : ''}`}
                                >
                                  <td className="py-2 px-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        const newSet = new Set(selectedDevices);
                                        if (checked) {
                                          newSet.add(rowKey);
                                        } else {
                                          newSet.delete(rowKey);
                                        }
                                        setSelectedDevices(newSet);
                                      }}
                                    />
                                  </td>
                                  {columnVisibility['domain'] !== false && (
                                    <td className="py-2 px-3">
                                      <p className="text-xs">{row.deviceDomain}</p>
                                    </td>
                                  )}
                                  {columnVisibility['serialNumber'] !== false && (
                                    <td className="py-2 px-3">
                                      <p className="text-xs">{row.device.deviceSerialNumber}</p>
                                    </td>
                                  )}
                                  {columnVisibility['bankName'] !== false && (
                                    <td className="py-2 px-3">
                                      {row.hasBankAssignment ? (
                                        <div>
                                          <p className="text-xs">{row.bankName}</p>
                                          <p className="text-xs text-gray-500">{row.bankCode}</p>
                                        </div>
                                      ) : (
                                        <Badge variant="destructive" className="text-xs">
                                          Tanımsız
                                        </Badge>
                                      )}
                                    </td>
                                  )}
                                  {columnVisibility['subscriptionType'] !== false && (
                                    <td className="py-2 px-3">
                                      <Badge variant="outline" className="text-xs">
                                        {row.subscriptionType === 'monthly' ? 'Aylık' : 'Yıllık'}
                                      </Badge>
                                    </td>
                                  )}
                                  {columnVisibility['monthlyFee'] !== false && (
                                    <td className="py-2 px-3">
                                      <p className="text-green-600 text-xs">{(row.monthlyFee || 0).toFixed(2)} €</p>
                                    </td>
                                  )}
                                  {columnVisibility['status'] !== false && (
                                    <td className="py-2 px-3 text-center">
                                      {row.isActive ? (
                                        <Badge className="bg-green-100 text-green-700 text-xs">
                                          <Play size={10} className="mr-1" />
                                          Aktif
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-orange-100 text-orange-700 text-xs">
                                          <Pause size={10} className="mr-1" />
                                          Askıda
                                        </Badge>
                                      )}
                                    </td>
                                  )}
                                  {columnVisibility['payment'] !== false && (
                                    <td className="py-2 px-3 text-center">
                                      {!row.hasBankAssignment ? (
                                        <Badge variant="secondary" className="text-xs">
                                          Hesaplanamaz
                                        </Badge>
                                      ) : (
                                        <div className="flex flex-col items-center gap-1">
                                          <Checkbox
                                            checked={row.paymentConfirmed}
                                            onCheckedChange={(checked) => handlePaymentConfirm(row, checked as boolean)}
                                          />
                                          {row.paymentConfirmed ? (
                                            <Badge className="bg-green-100 text-green-700 text-xs">
                                              <CheckCircle size={10} className="mr-1" />
                                              Alındı
                                            </Badge>
                                          ) : row.daysUntilDue !== undefined && row.daysUntilDue < 0 ? (
                                            <Badge variant="destructive" className="text-xs">
                                              <AlertTriangle size={10} className="mr-1" />
                                              {Math.abs(row.daysUntilDue)} gün geçti
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-xs">
                                              <Clock size={10} className="mr-1" />
                                              {row.daysUntilDue} gün kaldı
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  )}
                                  {columnVisibility['reminder'] !== false && (
                                    <td className="py-2 px-3">
                                      <div className="flex flex-col gap-1">
                                        {[3, 5].map(day => (
                                          <Button
                                            key={day}
                                            variant={remindersSent.includes(day) ? "secondary" : "outline"}
                                            size="sm"
                                            disabled={!row.hasBankAssignment || row.paymentConfirmed}
                                            onClick={() => handleSendReminder(row, day)}
                                            className="text-xs h-6"
                                          >
                                            <Bell size={10} className="mr-1" />
                                            {day}. gün {remindersSent.includes(day) ? '✓' : ''}
                                          </Button>
                                        ))}
                                      </div>
                                    </td>
                                  )}
                                  {columnVisibility['actions'] !== false && (
                                    <td className="py-2 px-3 text-center">
                                      {row.isActive && row.hasBankAssignment && !row.paymentConfirmed && row.daysUntilDue !== undefined && row.daysUntilDue < 0 && (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedDevices(new Set([rowKey]));
                                            handleBulkSuspension();
                                          }}
                                          className="h-7 text-xs"
                                        >
                                          <Ban size={12} className="mr-1" />
                                          Dondur
                                        </Button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Toplu Onay Dialog */}
      {batchApprovalDialog.open && (() => {
        const customerId = batchApprovalDialog.customerId;
        let devicesToApprove: any[] = [];

        if (customerId) {
          // Tek müşteri için onay
          const customer = customers.find(c => c.id === customerId);
          if (customer && customer.serviceFeeSettings) {
            const customerDomain = customer.domain || customer.guncelMyPayterDomain;
            const matchedProducts = customerDomain ? payterProducts.filter(product => {
              if (!product.domain) return false;
              return matchDomainFn(product.domain, customerDomain, customer.ignoreMainDomain || false);
            }) : [];

            matchedProducts.forEach(product => {
              // ✅ ARRAY SAFETY
              const deviceSubscriptions = Array.isArray(customer.serviceFeeSettings!.deviceSubscriptions)
                ? customer.serviceFeeSettings!.deviceSubscriptions
                : [];
              const invoices = Array.isArray(customer.serviceFeeSettings!.invoices)
                ? customer.serviceFeeSettings!.invoices
                : [];
              const bankAssignments = Array.isArray(customer.bankDeviceAssignments)
                ? customer.bankDeviceAssignments
                : [];
                
              const subscription = deviceSubscriptions.find(d => d.deviceId === product.id);
              const currentInvoice = invoices.find(inv => inv.period === selectedPeriod);
              const bankAssignment = bankAssignments.find(ba => Array.isArray(ba.deviceIds) && ba.deviceIds.includes(product.id));
              
              if (subscription && subscription.isActive && bankAssignment && (!currentInvoice || !currentInvoice.paymentConfirmed)) {
                devicesToApprove.push({
                  customerId: customer.id,
                  customerName: customer.cariAdi,
                  deviceId: product.id,
                  deviceSerial: subscription.deviceSerialNumber,
                  monthlyFee: subscription.monthlyFee || 0,
                  invoiceId: currentInvoice?.id,
                  currentInvoice
                });
              }
            });
          }
        }

        return devicesToApprove.length > 0 ? (
          <BatchApprovalConfirmation
            devices={devicesToApprove}
            selectedPeriod={selectedPeriod}
            onApprove={handleBatchApprovalConfirm}
            onCancel={() => setBatchApprovalDialog({ open: false })}
          />
        ) : null;
      })()}

      {/* Dondurma Dialog */}
      <Dialog open={suspensionDialog.open} onOpenChange={(open) => !open && setSuspensionDialog({ open: false, devices: [] })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>🚫 Hizmet Dondurma</DialogTitle>
            <DialogDescription>
              {suspensionDialog.devices.length} cihaz için hizmet dondurulacak
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Dondurma Sebebi</Label>
              <Select value={suspensionReason} onValueChange={setSuspensionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sebep seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {suspensionReasons
                    .filter(r => r.aktif)
                    .map((reasonObj) => (
                      <SelectItem key={reasonObj.id} value={reasonObj.reason}>
                        {reasonObj.reason}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Dondurma Bitiş Tarihi (Opsiyonel)</Label>
              <Input
                type="date"
                value={suspensionUntilDate}
                onChange={(e) => setSuspensionUntilDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Boş bırakılırsa belirsiz sürelidir
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <p className="text-sm">
                <strong>Dondurulacak Cihazlar:</strong>
              </p>
              <ul className="text-xs space-y-1 mt-2">
                {suspensionDialog.devices.slice(0, 5).map((d, i) => (
                  <li key={i}>
                    • {d.customer.cariAdi} - {d.device.deviceSerialNumber}
                  </li>
                ))}
                {suspensionDialog.devices.length > 5 && (
                  <li className="text-gray-500">... ve {suspensionDialog.devices.length - 5} cihaz daha</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspensionDialog({ open: false, devices: [] })}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSuspension}
              disabled={!suspensionReason}
            >
              <Ban size={16} className="mr-2" />
              Dondur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}