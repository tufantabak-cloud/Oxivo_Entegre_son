import { useState, useMemo, useEffect, useRef } from 'react';
import { Customer, DomainNode, BankDeviceAssignment, ServiceFeeSettings, DeviceSubscription, ServiceFeeInvoice, PaymentReminder } from './CustomerModule';
import { PayterProduct } from './PayterProductTab';
import { BankPF } from './BankPFModule';
import { BankDeviceManagementTab } from './BankDeviceManagementTab';
import { SendContractDialog } from './DSYM/SendContractDialog';
import { CustomerContractPreview } from './CustomerContractPreview';
import { ArrowLeft, Save, Trash2, X, Plus, ChevronDown, ChevronRight, Edit2, Trash, Monitor, CheckCircle, XCircle, FileSpreadsheet, FileText, Download, FileDown, Calendar, AlertTriangle, Clock, Euro, Bell, Ban, Play, DollarSign, FileSignature, Upload, Folder, CheckCircle2, XOctagon } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from './ui/button';
import { documentApi } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { FilterDropdown, FilterOption } from './FilterDropdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
// Tooltip removed - import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';
import { matchDomain as utilMatchDomain, normalizeDomain as utilNormalizeDomain } from '../utils/domainMatching';

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

interface SalesRepresentative {
  id: string;
  adSoyad: string;
  aktif: boolean;
}

interface SuspensionReason {
  id: string;
  reason: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
}

interface CustomerDetailProps {
  customer: Customer | null;
  onSave: (customer: Customer, options?: { autoSave?: boolean }) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  isCreating?: boolean;
  mccList?: Array<{ kod: string; kategori: string }>;
  payterProducts?: PayterProduct[];
  bankPFRecords?: BankPF[];
  onBankPFNavigate?: (id: string) => void;
  banks?: Bank[];
  epkList?: EPK[];
  okList?: OK[];
  salesReps?: SalesRepresentative[];
  suspensionReasons?: SuspensionReason[];
  // Navigasyon için yeni props
  allCustomers?: Customer[];
  onNavigateToCustomer?: (customer: Customer) => void;
}

// DisplayDevice type for device subscription with new device flag
type DisplayDevice = DeviceSubscription & { _isNew?: boolean };

// Domain Tree Node Component - Recursive yapı
interface DomainTreeNodeProps {
  node: DomainNode;
  path: number[];
  level: number;
  onUpdate: (path: number[], name: string) => void;
  onDelete: (path: number[]) => void;
  onAddChild: (path: number[]) => void;
  onAddSibling: (path: number[]) => void;
}

function DomainTreeNode({ 
  node, 
  path, 
  level, 
  onUpdate, 
  onDelete, 
  onAddChild,
  onAddSibling 
}: DomainTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(!node.name);
  const [editValue, setEditValue] = useState(node.name);

  // Numaralandırma fonksiyonu - Hiyerarşik sıralama
  const getNumbering = (level: number, index: number): string => {
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    
    if (level === 0) return `${index + 1}.`; // 1. 2. 3.
    if (level === 1) return String.fromCharCode(97 + index) + '.'; // a. b. c.
    if (level === 2) return romanNumerals[index] || `${index + 1}.`; // i. ii. iii.
    if (level === 3) return `${index + 1}.`; // 1. 2. 3.
    if (level === 4) return romanNumerals[index] || `${index + 1}.`; // i. ii. iii.
    return `${index + 1}.`; // Fallback
  };

  // ✅ SAFETY: level NaN kontrolü
  const safeLevel = typeof level === 'number' && !isNaN(level) ? level : 0;
  const numbering = getNumbering(safeLevel, path[path.length - 1]);
  const indent = safeLevel * 20; // Kompakt girinti (20px per level)

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(path, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(node.name);
      setIsEditing(false);
    }
  };

  return (
    <div className="select-none">
      <div 
        className="flex items-center gap-2 py-2 px-2 rounded hover:bg-gray-50 group transition-colors mb-1"
        style={{ marginLeft: `${indent}px` }}
      >
        {/* Toggle button */}
        {node.children.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? 'Daralt' : 'Genişlet'}
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-gray-600" />
            ) : (
              <ChevronRight size={14} className="text-gray-600" />
            )}
          </button>
        )}
        {node.children.length === 0 && <div className="w-[18px]" />}

        {/* Numaralandırma */}
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded min-w-[28px] text-center tabular-nums">
          {numbering}
        </span>

        {/* Domain adı */}
        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Birim adı girin..."
            className="h-7 text-sm flex-1 max-w-md"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span 
              className="text-sm flex-1 cursor-pointer text-gray-900 hover:text-blue-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Düzenlemek için tıklayın"
            >
              {node.name || '(Boş)'}
            </span>
            {node.children.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {node.children.length}
              </span>
            )}
          </div>
        )}

        {/* Butonlar */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setIsEditing(true)}
            title="Düzenle"
          >
            <Edit2 size={12} className="text-gray-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onAddChild(path)}
            title="Alt birim ekle"
          >
            <Plus size={12} className="text-green-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onAddSibling(path)}
            title="Yan birim ekle"
          >
            <Plus size={12} className="text-blue-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onDelete(path)}
            title="Sil"
          >
            <Trash size={12} className="text-red-600" />
          </Button>
        </div>
      </div>

      {/* Alt domainler (recursive) */}
      {isExpanded && node.children.length > 0 && (
        <div className="relative">
          {/* Dikey bağlantı çizgisi */}
          <div 
            className="absolute left-2 top-0 bottom-2 w-px bg-gray-200"
            style={{ marginLeft: `${indent}px` }}
          />
          {node.children.map((child, index) => (
            <DomainTreeNode
              key={child.id}
              node={child}
              path={[...path, index]}
              level={safeLevel + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onAddSibling={onAddSibling}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper fonksiyon: BankDeviceAssignments'tan linkedBankPFIds'i çıkar
function extractBankPFIdsFromAssignments(assignments: BankDeviceAssignment[] | any, bankPFRecords: BankPF[]): string[] {
  const bankPFIds: string[] = [];
  
  // ✅ CRITICAL ARRAY SAFETY: assignments derin kontrolü
  if (!assignments) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ extractBankPFIdsFromAssignments: assignments is null/undefined');
    }
    return bankPFIds;
  }
  
  if (!Array.isArray(assignments)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ extractBankPFIdsFromAssignments: assignments is not an array, type:', typeof assignments, assignments);
    }
    return bankPFIds;
  }
  
  if (assignments.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ extractBankPFIdsFromAssignments: assignments array is empty');
    }
    return bankPFIds;
  }
  
  // ✅ ARRAY SAFETY: bankPFRecords kontrolü
  if (!Array.isArray(bankPFRecords) || bankPFRecords.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ extractBankPFIdsFromAssignments: bankPFRecords is not a valid array');
    }
    return bankPFIds;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 extractBankPFIdsFromAssignments başladı:', {
      assignmentsCount: assignments.length,
      bankPFRecordsCount: bankPFRecords.length,
      assignmentsType: typeof assignments,
      isArray: Array.isArray(assignments)
    });
  }
  
  assignments.forEach(assignment => {
    // ✅ NULL SAFETY: assignment ve bankId kontrolü
    // NOT: JSONB'den gelen veri snake_case (bank_id) olabilir, camelCase (bankId) de olabilir
    const bankId = assignment.bankId || assignment.bank_id; // Her iki formatı da destekle
    
    if (!assignment || !bankId || typeof bankId !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Invalid assignment object:', assignment);
      }
      return; // Bu assignment'ı atla
    }
    
    // assignment.bankId formatı: "bank-{id}", "ok-epk-{id}", "ok-ok-{id}"
    // Bu ID'lerden asıl BankPF kaydının ID'sini bul
    
    if (bankId.startsWith('bank-')) {
      // Banka ID'si
      const actualBankId = bankId.replace('bank-', '');
      
      // BankPF records içinde bu banka ile eşleşen kaydı bul
      const matchingRecord = bankPFRecords.find((record: BankPF) => 
        record.linkedBankIds?.includes(actualBankId)
      );
      
      if (matchingRecord && !bankPFIds.includes(matchingRecord.id)) {
        bankPFIds.push(matchingRecord.id);
      }
    } else if (bankId.startsWith('ok-epk-')) {
      // EPK ID'si
      const actualEPKId = bankId.replace('ok-epk-', '');
      
      const matchingRecord = bankPFRecords.find((record: BankPF) => 
        record.linkedEPKIds?.includes(actualEPKId)
      );
      
      if (matchingRecord && !bankPFIds.includes(matchingRecord.id)) {
        bankPFIds.push(matchingRecord.id);
      }
    } else if (bankId.startsWith('ok-ok-')) {
      // ÖK ID'si
      const actualOKId = bankId.replace('ok-ok-', '');
      
      const matchingRecord = bankPFRecords.find((record: BankPF) => 
        record.linkedOKIds?.includes(actualOKId)
      );
      
      if (matchingRecord && !bankPFIds.includes(matchingRecord.id)) {
        bankPFIds.push(matchingRecord.id);
      }
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ extractBankPFIdsFromAssignments tamamlandı, bulunan IDs:', bankPFIds);
  }
  return bankPFIds;
}

// ✅ All Select components converted to FilterDropdown (v2.1 - Cache Buster)
// Debug flag - sadece geliştirme sırasında detaylı log için
const DEBUG_DOMAIN_MATCHING = false;

export function CustomerDetail({
  customer,
  onSave,
  onCancel,
  onDelete,
  isCreating = false,
  mccList = [],
  payterProducts = [],
  bankPFRecords = [],
  onBankPFNavigate,
  banks = [],
  epkList = [],
  okList = [],
  salesReps = [],
  suspensionReasons = [],
  allCustomers = [],
  onNavigateToCustomer,
}: CustomerDetailProps) {
  const [formData, setFormData] = useState<Customer>(
    customer || {
      id: '',
      cariHesapKodu: '',
      sektor: '',
      mcc: '',
      cariAdi: '',
      guncelMyPayterDomain: '',
      domainHierarchy: [],
      vergiDairesi: '',
      vergiNo: '',
      adres: '',
      ilce: '',
      postaKodu: '',
      email: '',
      yetkili: '',
      tel: '',
      durum: 'Aktif',
      p6x: '',
      apollo: '',
      // ✅ EKSIK ALANLAR EKLENDİ - Veri akış sorununu çözer
      linkedBankPFIds: [],
      bankDeviceAssignments: [],
      blokeDurumu: false,
      sorumluKisi: '',
      cariGrubu: '',
      serviceFeeSettings: undefined,
      salesRepId: '',
      salesRepName: '',
      kayitTarihi: new Date().toISOString(),
      musteriTipi: '',
      domain: '',
      ignoreMainDomain: false,
      ignoreMainDomainNote: '',
      subscriptionFee: undefined,
    }
  );

  // Kayıt edilmemiş değişiklikler takip state'i
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState<Customer | null>(customer);
  
  // SEVIYE 1 FIX: Controlled Tabs State
  const [activeTab, setActiveTab] = useState<string>('genel');
  
  // Otomatik kayıt için timeout ref
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  
  // Domain eşleştirme için özel timeout ref (ignoreMainDomain değişikliklerinde)
  const domainMatchTimeoutRef = useRef<number | null>(null);
  
  // ignoreMainDomainNote textarea ref (focus için)
  const ignoreMainDomainNoteRef = useRef<HTMLTextAreaElement | null>(null);

  // Dondurma sebebi dialog state'leri
  const [suspensionDialogOpen, setSuspensionDialogOpen] = useState(false);
  const [deviceToSuspend, setDeviceToSuspend] = useState<{
    deviceId: string;
    deviceIndex: number;
  } | null>(null);
  const [selectedSuspensionReason, setSelectedSuspensionReason] = useState('');
  
  // DSYM (Dijital Sözleşme Yönetim Modülü) state
  const [isDSYMDialogOpen, setIsDSYMDialogOpen] = useState(false);
  const [dsymActiveTab, setDsymActiveTab] = useState<'documents' | 'contracts'>('documents');
  const [suspensionNotes, setSuspensionNotes] = useState('');
  
  // Document upload state
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Global dondurma sebepleri - Tanımlar modülünden gelen aktif sebepler
  const activeSuspensionReasons = (suspensionReasons || [])
    .filter(r => r.aktif)
    .map(r => r.reason);
  
  // Debug: Konsola yazdır (sadece dropdown açıldığında)
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Dondurma Sebepleri Debug');
    console.log('Total sebep sayısı:', suspensionReasons?.length || 0);
    console.log('Aktif sebep sayısı:', activeSuspensionReasons.length);
    console.log('Pasif sebep sayısı:', (suspensionReasons?.length || 0) - activeSuspensionReasons.length);
    console.table(suspensionReasons?.map(r => ({
      'Sebep': r.reason,
      'Aktif': r.aktif ? '✅' : '❌',
      'Açıklama': r.aciklama
    })));
    console.groupEnd();
  }

  // ⚡ Domain utility functions - use centralized utilities
  const normalizeDomain = utilNormalizeDomain;
  const matchDomain = utilMatchDomain;

  // ⚡ Dropdown options (memoized)
  const mccOptions: FilterOption[] = useMemo(() => {
    const options = mccList.map(mcc => ({
      value: mcc.kod,
      label: `${mcc.kod} - ${mcc.kategori}`
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [CustomerDetail] mccOptions created:', {
        mccListLength: mccList.length,
        optionsLength: options.length,
        sampleOptions: options.slice(0, 5),
        allOptions: options
      });
      
      // 🚨 ALERT DEBUG - Console çalışmıyorsa popup ile göster
      if (mccList.length < 10) {
        alert(`⚠️ MCC DROPDOWN DEBUG:\n\nmccList.length = ${mccList.length}\noptions.length = ${options.length}\n\nİlk 3 MCC:\n${JSON.stringify(mccList.slice(0, 3), null, 2)}`);
      }
    }
    
    return options;
  }, [mccList]);

  const durumOptions: FilterOption[] = useMemo(() => [
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Pasif', label: 'Pasif' }
  ], []);

  const salesRepOptions: FilterOption[] = useMemo(() => [
    { value: 'unassigned', label: 'Atanmamış' },
    ...salesReps
      .filter(rep => rep.aktif)
      .map(rep => ({
        value: rep.id,
        label: rep.adSoyad
      }))
  ], [salesReps]);

  const paymentTypeOptions: FilterOption[] = useMemo(() => [
    { value: 'monthly', label: 'Aylık Ödeme' },
    { value: 'yearly', label: 'Yıllık Ödeme' }
  ], []);

  const suspensionReasonOptions: FilterOption[] = useMemo(() => {
    // 🔍 DEBUG: Log incoming suspensionReasons
    console.log('🔍 [CustomerDetail] suspensionReasons prop:', {
      count: suspensionReasons?.length || 0,
      data: suspensionReasons,
      firstItem: suspensionReasons?.[0]
    });
    
    // TÜM sebepleri göster (aktif olanlar + pasif olanlar disabled olarak)
    const allReasons = (suspensionReasons || []).map(r => ({
      value: r.reason,
      label: r.aktif ? r.reason : `${r.reason} (Pasif)`,
      // Pasif sebepleri ayırt etmek için ekstra bilgi eklenebilir
      isDisabled: !r.aktif
    }));
    
    // Sadece AKTİF sebepleri göstermek isterseniz:
    // const activeOnly = allReasons.filter(r => !r.isDisabled);
    
    // 🔍 DEBUG: Always log final options
    console.log('🎯 [CustomerDetail] Dropdown sebep listesi:', {
      toplam: allReasons.length,
      aktif: allReasons.filter(r => !r.isDisabled).length,
      pasif: allReasons.filter(r => r.isDisabled).length,
      aktivSebepler: allReasons.filter(r => !r.isDisabled).map(r => r.label)
    });
    
    // Sadece aktif olanları döndür (pasif sebepleri gösterme)
    const activeOptions = allReasons.filter(r => !r.isDisabled);
    console.log('🎯 [CustomerDetail] Döndürülen aktif sebepler:', activeOptions);
    return activeOptions;
  }, [suspensionReasons]);

  // Müşteriye atanmış toplam cihaz sayısını hesapla (domain bazlı eşleştirme - PRIMARY)
  const totalAssignedDevices = useMemo(() => {
    // PRIMARY: PayterProducts'tan domain bazlı eşleştirme yap
    // ✅ CRITICAL FIX: matchedProducts ile aynı algoritma kullanılmalı (ignoreMainDomain desteği)
    if (payterProducts && payterProducts.length > 0) {
      const customerDomain = formData.domain || formData.guncelMyPayterDomain;
      
      if (!customerDomain) {
        return 0;
      }
      
      // matchDomain fonksiyonunu kullan (ignoreMainDomain desteği ile)
      const matched = payterProducts.filter(product => {
        if (!product.domain || !product.domain.trim()) {
          return false;
        }
        
        return matchDomain(
          product.domain, 
          customerDomain, 
          formData.ignoreMainDomain || false,
          formData.domainHierarchy
        );
      });
      
      if (matched.length > 0) {
        return matched.length;
      }
    }
    
    // FALLBACK: Domain eşleştirmesi bulunamazsa, bankDeviceAssignments'a bak
    if (!formData.bankDeviceAssignments || !Array.isArray(formData.bankDeviceAssignments) || formData.bankDeviceAssignments.length === 0) {
      return 0;
    }
    return formData.bankDeviceAssignments.reduce(
      (total, assignment) => total + (assignment.deviceIds?.length || 0),
      0
    );
  }, [formData.cariAdi, formData.guncelMyPayterDomain, formData.domain, formData.ignoreMainDomain, formData.domainHierarchy, formData.bankDeviceAssignments, payterProducts]);

  // Müşteriye ait P6X ve APOLLO cihaz sayılarını hesapla
  const deviceModelCounts = useMemo(() => {
    let p6xCount = 0;
    let apolloCount = 0;

    if (!payterProducts || payterProducts.length === 0) {
      return { p6x: p6xCount, apollo: apolloCount };
    }

    // Müşteri domain'ini al
    const customerDomain = formData.domain || formData.guncelMyPayterDomain;
    
    if (!customerDomain) {
      return { p6x: p6xCount, apollo: apolloCount };
    }

    // PayterProduct'ları filtrele ve say (Ana Domain görmezden gelme desteği ile)
    // ✅ NULL SAFETY: payterProducts boş olabilir
    (payterProducts || []).forEach(product => {
      const isMatch = matchDomain(product.domain, customerDomain, formData.ignoreMainDomain || false);

      if (isMatch) {
        const model = product.terminalModel?.toUpperCase() || '';
        // ✅ P6 ile başlayan tüm modelleri P6X ailesinden kabul et (P66.7.23, P68.7.20, P6X vb.)
        const isP6X = model.startsWith('P6');
        const isApollo = model.includes('APOLLO');
        
        if (isP6X) p6xCount++;
        else if (isApollo) apolloCount++;
      }
    });

    return { p6x: p6xCount, apollo: apolloCount };
  }, [payterProducts, formData.guncelMyPayterDomain, formData.domainHierarchy, formData.domain, formData.ignoreMainDomain]);

  // Customer prop'u değiştiğinde formData'yı güncelle
  // NOT: Sadece müşteri ID'si değiştiğinde (farklı müşteri seçildiğinde) güncelle
  // Aynı müşterinin güncellenmesi durumunda formData'yı koruyarak kullanıcı girişini koru
  useEffect(() => {
    if (customer && customer.id !== formData.id) {
      // Farklı bir müşteri seçildi - formData'yı yeniden başlat
      // ✅ CRITICAL FIX: bankDeviceAssignments array güvenliği
      const safeCustomer = {
        ...customer,
        bankDeviceAssignments: Array.isArray(customer.bankDeviceAssignments) 
          ? customer.bankDeviceAssignments 
          : []
      };
      setFormData(safeCustomer);
      setOriginalData(safeCustomer);
      setHasUnsavedChanges(false);
      // SEVIYE 1 FIX: Navigation sırasında sekmeyi sıfırla
      setActiveTab('genel');
    }
  }, [customer, formData.id]);
  
  // Cleanup: Component unmount olduğunda timeout temizle
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (domainMatchTimeoutRef.current) {
        clearTimeout(domainMatchTimeoutRef.current);
      }
    };
  }, []);

  // Navigation butonları için hesaplamalar - Alfabetik sıralama
  const navigationInfo = useMemo(() => {
    if (isCreating || !customer || allCustomers.length === 0) {
      return null;
    }
    
    // Müşterileri alfabetik sıraya göre sırala (cariAdi'na göre)
    const sortedCustomers = [...allCustomers].sort((a, b) => {
      const nameA = (a.cariAdi || '').toLowerCase();
      const nameB = (b.cariAdi || '').toLowerCase();
      return nameA.localeCompare(nameB, 'tr');
    });
    
    const currentIndex = sortedCustomers.findIndex(c => c.id === customer.id);
    if (currentIndex === -1) return null;
    
    return {
      currentIndex,
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < sortedCustomers.length - 1,
      total: sortedCustomers.length,
      previousCustomer: currentIndex > 0 ? sortedCustomers[currentIndex - 1] : null,
      nextCustomer: currentIndex < sortedCustomers.length - 1 ? sortedCustomers[currentIndex + 1] : null
    };
  }, [isCreating, customer?.id, allCustomers]);

  // Müşteri yüklendiğinde linkedBankPFIds'i otomatik eşleştirmelerle senkronize et
  useEffect(() => {
    // SADECE farklı bir müşteri yüklendiğinde çalış (customer.id değiştiğinde)
    if (!customer || !customer.cariAdi || bankPFRecords.length === 0 || customer.id !== formData.id) {
      return;
    }
    
    // 🔍 DEBUG: Supabase'den gelen müşteri verisini logla
    console.log('🔍 [CustomerDetail] Supabase\'den gelen customer verisi:', {
      id: customer.id,
      cariAdi: customer.cariAdi,
      linkedBankPfIds: customer.linkedBankPfIds,
      bankDeviceAssignments: customer.bankDeviceAssignments,
      serviceFeeSettings: customer.serviceFeeSettings,
      rawCustomer: customer
    });
    
    // 1. bankDeviceAssignments'tan gelen ID'ler
    // ✅ CRITICAL ARRAY SAFETY: bankDeviceAssignments derin kontrolü ve JSONB parsing
    let safeAssignments: BankDeviceAssignment[] = [];
    
    try {
      const rawAssignments = customer.bankDeviceAssignments;
      
      if (!rawAssignments) {
        // undefined veya null
        safeAssignments = [];
      } else if (Array.isArray(rawAssignments)) {
        // Zaten array
        safeAssignments = rawAssignments;
      } else if (typeof rawAssignments === 'string') {
        // String ise parse et (JSONB'den string gelebilir)
        try {
          const parsed = JSON.parse(rawAssignments);
          safeAssignments = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.error('❌ bankDeviceAssignments parse error:', parseError);
          safeAssignments = [];
        }
      } else if (typeof rawAssignments === 'object') {
        // Object ise array'e dönüştür
        safeAssignments = Object.values(rawAssignments).filter(v => v !== null && v !== undefined);
      } else {
        // Başka bir tip - güvenli fallback
        console.warn('⚠️ Unexpected bankDeviceAssignments type:', typeof rawAssignments, rawAssignments);
        safeAssignments = [];
      }
    } catch (error) {
      console.error('❌ Error processing bankDeviceAssignments:', error);
      safeAssignments = [];
    }
    
    const assignmentBasedIds = safeAssignments.length > 0
      ? extractBankPFIdsFromAssignments(safeAssignments, bankPFRecords)
      : [];
    
    // 2. Otomatik eşleşen BankPF kayıtları (firma ünvanı = cari adı)
    const normalizedCariAdi = customer.cariAdi.trim().toLowerCase();
    const autoMatchedIds = bankPFRecords
      .filter((record: BankPF) => {
        const normalizedFirmaUnvan = record.firmaUnvan?.trim().toLowerCase() || '';
        return normalizedCariAdi === normalizedFirmaUnvan;
      })
      .map((record: BankPF) => record.id);
    
    // 3. Mevcut manuel bağlantılar
    const manuallyLinkedIds = customer.linkedBankPFIds || [];
    
    // Tüm ID'leri birleştir ve unique yap
    const allIds = Array.from(new Set([
      ...manuallyLinkedIds,
      ...assignmentBasedIds,
      ...autoMatchedIds
    ]));
    
    // Eğer değişiklik varsa güncelle
    const currentIds = formData.linkedBankPFIds || [];
    const needsSync = JSON.stringify([...currentIds].sort()) !== JSON.stringify([...allIds].sort());
    
    if (needsSync && allIds.length > 0) {
      console.log('🔄 linkedBankPFIds otomatik senkronize ediliyor:', {
        cariAdi: customer.cariAdi,
        manuallyLinkedIds,
        assignmentBasedIds,
        autoMatchedIds,
        allIds
      });
      
      setFormData(prev => ({
        ...prev,
        linkedBankPFIds: allIds
      }));
    }
  }, [customer, bankPFRecords, formData.id]);

  // FormData değişikliklerini izle ve otomatik kaydet
  useEffect(() => {
    if (!originalData || isCreating || !formData.id) {
      return; // İlk yükleme, yeni kayıt oluşturma veya ID yoksa kontrol yapma
    }

    // FormData ile orijinal data'yı karşılaştır
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);

    // Eğer değişiklik varsa ve kayıt işlemi devam etmiyorsa, otomatik kaydet
    if (hasChanges && !isSavingRef.current) {
      // Önceki timeout varsa iptal et
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // 1.5 saniye sonra otomatik kaydet (debounce)
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        if (isSavingRef.current) return; // Zaten kayıt işlemi varsa atla
        
        isSavingRef.current = true;
        
        // Otomatik eşleştirilen Banka/PF kayıtlarını linkedBankPFIds'e ekle
        const normalizedCariAdi = formData.cariAdi.trim().toLowerCase();
        const autoMatchedBankPFIds = bankPFRecords
          .filter((record: BankPF) => {
            const normalizedFirmaUnvan = record.firmaUnvan?.trim().toLowerCase() || '';
            return normalizedCariAdi === normalizedFirmaUnvan;
          })
          .map((record: BankPF) => record.id);
        
        // Mevcut linkedBankPFIds ile birleştir
        const existingIds = formData.linkedBankPFIds || [];
        const allLinkedIds = Array.from(new Set([...existingIds, ...autoMatchedBankPFIds]));
        
        const updatedFormData = {
          ...formData,
          linkedBankPFIds: allLinkedIds
        };
        
        onSave(updatedFormData, { autoSave: true });
        setOriginalData(updatedFormData);
        setHasUnsavedChanges(false);
        
        // Sessiz kayıt - kullanıcıya bildirim gösterme (çok sık görünmesin)
        console.log('✅ Otomatik kayıt yapıldı:', new Date().toLocaleTimeString('tr-TR'));
        
        isSavingRef.current = false;
      }, 1500);
    }
  }, [formData, originalData, isCreating, bankPFRecords, onSave]);

  // Sayfa kapatılma/yenileme uyarısı - KALDIRILDI (Otomatik kayıt aktif)
  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     if (hasUnsavedChanges) {
  //       e.preventDefault();
  //       e.returnValue = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinizden emin misiniz?';
  //       return e.returnValue;
  //     }
  //   };
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  // }, [hasUnsavedChanges]);

  // SEVIYE 1 FIX: Tab Change Handler with Validation
  const handleTabChange = (newTab: string) => {
    // Genel bilgiler sekmesinden çıkılırken zorunlu alanları kontrol et
    if (activeTab === 'genel' && !isCreating) {
      const validationErrors: string[] = [];
      
      if (!formData.cariHesapKodu.trim()) {
        validationErrors.push('Cari Hesap Kodu');
      }
      if (!formData.cariAdi.trim()) {
        validationErrors.push('Cari Adı');
      }
      // MCC tip kontrolü - string veya array olabilir
      const mccValue = typeof formData.mcc === 'string' 
        ? formData.mcc 
        : Array.isArray(formData.mcc) 
          ? formData.mcc.join(',') 
          : String(formData.mcc || '');
      if (!mccValue.trim()) {
        validationErrors.push('MCC');
      }
      if (!formData.email.trim()) {
        validationErrors.push('Email');
      }
      
      if (validationErrors.length > 0) {
        toast.error(`Lütfen önce zorunlu alanları doldurun: ${validationErrors.join(', ')}`);
        return; // Sekme değişimini engelle
      }
    }
    
    // Domain sekmesinden çıkılırken "Ana Domaini Görmezden Gel" kontrolü
    if (activeTab === 'domain' && !isCreating) {
      const noteValue = typeof formData.ignoreMainDomainNote === 'string' 
        ? formData.ignoreMainDomainNote 
        : String(formData.ignoreMainDomainNote || '');
      if (formData.ignoreMainDomain && !noteValue.trim()) {
        toast.error('Lütfen "Ana Domaini Görmezden Gel" için not alanını doldurun!');
        return; // Sekme değişimini engelle
      }
    }
    
    // Sekme değiştirmeyi onayla
    setActiveTab(newTab);
    console.log('✅ Sekme değiştirildi:', activeTab, '->', newTab);
  };

  // Document functions
  const fetchDocuments = async () => {
    if (!formData.id) return;
    
    const result = await documentApi.getByCustomerId(formData.id);
    if (result.success) {
      setDocuments(result.data);
    }
  };

  // Fetch documents when customer ID changes
  useEffect(() => {
    if (formData.id) {
      fetchDocuments();
    }
  }, [formData.id]);

  const handleDocumentUpload = async (documentType: 'vergi_levhasi' | 'ticaret_sicil_gazetesi' | 'faaliyet_belgesi') => {
    const fileInput = fileInputRefs.current[documentType];
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
    
    const file = fileInput.files[0];
    
    if (!formData.id) {
      toast.error('Önce müşteriyi kaydedin!');
      return;
    }

    setUploadingDocument(documentType);

    const isRequired = documentType === 'vergi_levhasi' || documentType === 'ticaret_sicil_gazetesi';

    const result = await documentApi.upload({
      customerId: formData.id,
      documentType,
      file,
      isRequired,
      uploadedBy: 'current-user-id' // TODO: Get from auth context
    });

    setUploadingDocument(null);

    if (result.success) {
      toast.success(result.message || 'Evrak başarıyla yüklendi');
      fetchDocuments();
      // Clear file input
      if (fileInput) fileInput.value = '';
    } else {
      toast.error(result.error || 'Evrak yüklenirken hata oluştu');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Bu evrakı silmek istediğinizden emin misiniz?')) return;

    const result = await documentApi.delete(documentId);
    
    if (result.success) {
      toast.success('Evrak silindi');
      fetchDocuments();
    } else {
      toast.error(result.error || 'Evrak silinirken hata oluştu');
    }
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find(d => d.documentType === documentType);
    return doc ? doc.status : null;
  };

  const getDocument = (documentType: string) => {
    return documents.find(d => d.documentType === documentType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu - Type-safe string kontrolü
    if (!formData.cariHesapKodu.trim()) {
      alert('Cari Hesap Kodu zorunludur!');
      return;
    }
    if (!formData.cariAdi.trim()) {
      alert('Cari Adı zorunludur!');
      return;
    }
    
    // MCC tip kontrolü - string veya array olabilir
    const mccValue = typeof formData.mcc === 'string' 
      ? formData.mcc 
      : Array.isArray(formData.mcc) 
        ? formData.mcc.join(',') 
        : String(formData.mcc || '');
    if (!mccValue.trim()) {
      alert('MCC zorunludur!');
      return;
    }
    
    if (!formData.email.trim()) {
      alert('Email zorunludur!');
      return;
    }
    
    // Ana Domaini Görmezden Gel validasyonu - Type-safe
    const noteValue = typeof formData.ignoreMainDomainNote === 'string' 
      ? formData.ignoreMainDomainNote 
      : String(formData.ignoreMainDomainNote || '');
    if (formData.ignoreMainDomain && !noteValue.trim()) {
      toast.error('"Ana Domaini Görmezden Gel" seçeneği aktifse not alanı zorunludur!');
      setActiveTab('domain'); // Domain sekmesine yönlendir
      return;
    }
    
    // Otomatik eşleştirilen Banka/PF kayıtlarını linkedBankPFIds'e ekle
    const normalizedCariAdi = formData.cariAdi.trim().toLowerCase();
    const autoMatchedBankPFIds = bankPFRecords
      .filter((record: BankPF) => {
        const normalizedFirmaUnvan = record.firmaUnvan.trim().toLowerCase();
        return normalizedCariAdi === normalizedFirmaUnvan;
      })
      .map((record: BankPF) => record.id);
    
    // Mevcut linkedBankPFIds ile birleştir (duplicate'leri kaldır)
    const existingIds = formData.linkedBankPFIds || [];
    const allLinkedIds = Array.from(new Set([...existingIds, ...autoMatchedBankPFIds]));
    
    // FormData'yı güncelle
    const updatedFormData = {
      ...formData,
      linkedBankPFIds: allLinkedIds
    };
    
    console.log('✅ Otomatik eşleştirmeler linkedBankPFIds\'e eklendi:', {
      cariAdi: formData.cariAdi,
      eskiLinkedIds: existingIds,
      otomatikEslesmeler: autoMatchedBankPFIds,
      yeniLinkedIds: allLinkedIds
    });
    
    onSave(updatedFormData);
    setHasUnsavedChanges(false); // Kayıt sonrası unsaved flag'i temizle
  };

  const handleChange = (
    field: keyof Customer,
    value: string | number
  ) => {
    // CRITICAL FIX: Functional state update kullan - stale closure'ı önle
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Müşterinin tüm domain'lerini topla (ana domain + tüm alt domain'ler) - seviye bilgisi ile
  const collectAllDomainsWithLevel = (customer: Customer): Map<string, { level: string; order: number }> => {
    const domainsMap = new Map<string, { level: string; order: number }>();
    
    // Ana domain ekle
    if (customer.guncelMyPayterDomain && customer.guncelMyPayterDomain.trim()) {
      domainsMap.set(
        customer.guncelMyPayterDomain.trim().toLowerCase(),
        { level: 'Ana Domain', order: 0 }
      );
    }
    
    // Domain hiyerarşisinden tüm domain'leri topla (recursive)
    const collectFromHierarchy = (nodes: DomainNode[], currentLevel: number) => {
      nodes.forEach(node => {
        if (node.name && node.name.trim()) {
          const levelName = currentLevel === 0 
            ? 'Ana Domain' 
            : `${currentLevel}. Alt Domain`;
          domainsMap.set(
            node.name.trim().toLowerCase(),
            { level: levelName, order: currentLevel + 1 }
          );
        }
        if (node.children && node.children.length > 0) {
          collectFromHierarchy(node.children, currentLevel + 1);
        }
      });
    };
    
    if (customer.domainHierarchy && customer.domainHierarchy.length > 0) {
      collectFromHierarchy(customer.domainHierarchy, 0);
    }
    
    return domainsMap;
  };

  // Bu müşteriye ait Payter ürünlerini filtrele (PROPS'TAN GELEN GLOBAL LİSTEDEN)
  // Domain sekmesi ve Payter sekmesi için kullanılır
  const matchedProducts = useMemo(() => {
    if (!formData || payterProducts.length === 0) {
      return [];
    }
    
    const customerDomain = formData.domain || formData.guncelMyPayterDomain;
    
    if (!customerDomain) {
      if (DEBUG_DOMAIN_MATCHING) {
        console.warn(`⚠️ Müşteri "${formData.cariAdi}" için domain bilgisi yok`);
      }
      return [];
    }
    
    // Domain eşleşmesi olan ürünleri filtrele (Ana Domain görmezden gelme desteği ile)
    const matched = (payterProducts as PayterProduct[]).filter(product => {
      if (!product.domain || !product.domain.trim()) {
        return false;
      }
      
      // matchDomain fonksiyonu artık domain hierarchy kontrolünü de yapıyor
      return matchDomain(
        product.domain, 
        customerDomain, 
        formData.ignoreMainDomain || false,
        formData.domainHierarchy
      );
    });

    // Sadece önemli sonuçları logla
    if (DEBUG_DOMAIN_MATCHING || formData.ignoreMainDomain) {
      console.log(`🔗 Domain Eşleştirme Sonucu: ${formData.cariAdi}`, {
        domain: customerDomain,
        ignoreMainDomain: formData.ignoreMainDomain || false,
        eşleşenÜrünSayısı: matched.length,
        toplamÜrün: payterProducts.length
      });
    }
    
    // Alt domain modunda eşleşme yoksa bilgilendirici uyarı (sadece bir kez)
    if (formData.ignoreMainDomain && matched.length === 0 && DEBUG_DOMAIN_MATCHING) {
      console.warn(`⚠️ Alt domain eşleşmesi yok: ${formData.cariAdi} (${customerDomain})`);
    }
    
    return matched;
  }, [formData, payterProducts]);

  // Domain bazlı gruplama - seviye bilgisi ile
  const productsByDomain = useMemo(() => {
    const domainsWithLevel = collectAllDomainsWithLevel(formData);
    const grouped = new Map<string, PayterProduct[]>();
    
    matchedProducts.forEach(product => {
      const domain = product.domain?.trim() || 'Bilinmeyen';
      if (!grouped.has(domain)) {
        grouped.set(domain, []);
      }
      grouped.get(domain)!.push(product);
    });
    
    return Array.from(grouped.entries()).map(([domain, products]) => {
      const levelInfo = domainsWithLevel.get(domain.toLowerCase()) || { level: 'Bilinmeyen', order: 999 };
      return {
        domain,
        domainLevel: levelInfo.level,
        domainOrder: levelInfo.order,
        products,
        count: products.length
      };
    }).sort((a, b) => {
      // Önce domain seviyesine göre (ana domain önce)
      if (a.domainOrder !== b.domainOrder) {
        return a.domainOrder - b.domainOrder;
      }
      // Sonra ürün sayısına göre
      return b.count - a.count;
    });
  }, [matchedProducts, formData]);

  // Domain Hiyerarşisi Yönetimi
  const addDomain = (parentPath: number[] = []) => {
    const newDomain: DomainNode = {
      id: `domain-${Date.now()}-${Math.random()}`,
      name: '',
      children: []
    };

    setFormData(prev => {
      const newHierarchy = [...(prev.domainHierarchy || [])];
      
      if (parentPath.length === 0) {
        // Kök seviyeye ekle
        newHierarchy.push(newDomain);
      } else {
        // Alt seviyeye ekle
        let current: DomainNode[] = newHierarchy;
        for (let i = 0; i < parentPath.length - 1; i++) {
          current = current[parentPath[i]].children;
        }
        current[parentPath[parentPath.length - 1]].children.push(newDomain);
      }

      return { ...prev, domainHierarchy: newHierarchy };
    });
  };

  const updateDomainName = (path: number[], name: string) => {
    setFormData(prev => {
      const newHierarchy = [...(prev.domainHierarchy || [])];
      
      let current: DomainNode[] = newHierarchy;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      current[path[path.length - 1]].name = name;

      return { ...prev, domainHierarchy: newHierarchy };
    });
  };

  const deleteDomain = (path: number[]) => {
    setFormData(prev => {
      const newHierarchy = [...(prev.domainHierarchy || [])];
      
      if (path.length === 1) {
        // Kök seviyeden sil
        newHierarchy.splice(path[0], 1);
      } else {
        // Alt seviyeden sil
        let current: DomainNode[] = newHierarchy;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]].children;
        }
        current.splice(path[path.length - 1], 1);
      }

      return { ...prev, domainHierarchy: newHierarchy };
    });
  };

  const addSiblingDomain = (path: number[]) => {
    const newDomain: DomainNode = {
      id: `domain-${Date.now()}-${Math.random()}`,
      name: '',
      children: []
    };

    setFormData(prev => {
      const newHierarchy = [...(prev.domainHierarchy || [])];
      
      if (path.length === 1) {
        // Kök seviyeye kardeş ekle
        newHierarchy.splice(path[0] + 1, 0, newDomain);
      } else {
        // Alt seviyeye kardeş ekle
        let current: DomainNode[] = newHierarchy;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]].children;
        }
        current.splice(path[path.length - 1] + 1, 0, newDomain);
      }

      return { ...prev, domainHierarchy: newHierarchy };
    });
  };

  // Domain hiyerarşisini düz listeye çevirme fonksiyonu (Excel/PDF export için)
  const flattenDomainHierarchy = (nodes: DomainNode[], parentPath: string = '', level: number = 0): any[] => {
    const result: any[] = [];
    
    const getNumbering = (level: number, index: number): string => {
      const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
      
      if (level === 0) return `${index + 1}.`;
      if (level === 1) return String.fromCharCode(97 + index) + '.';
      if (level === 2) return romanNumerals[index] || `${index + 1}.`;
      if (level === 3) return `${index + 1}.`;
      if (level === 4) return romanNumerals[index] || `${index + 1}.`;
      return `${index + 1}.`;
    };
    
    nodes.forEach((node, index) => {
      const numbering = getNumbering(level, index);
      const fullPath = parentPath ? `${parentPath} ${numbering}` : numbering;
      const indent = '  '.repeat(level);
      
      result.push({
        level: level + 1,
        'Seviye': level + 1,
        'Numaralandırma': numbering,
        'Domain Adı': `${indent}${node.name}`,
        'Tam Yol': fullPath,
        'Alt Birim Sayısı': node.children.length
      });
      
      if (node.children.length > 0) {
        result.push(...flattenDomainHierarchy(node.children, fullPath, level + 1));
      }
    });
    
    return result;
  };

  // Seviyelere göre gruplama ve toplam hesaplama
  const groupByLevelWithTotals = (flatData: any[]) => {
    const grouped: { [key: number]: any[] } = {};
    
    flatData.forEach(item => {
      const level = item.level;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(item);
    });
    
    return grouped;
  };

  // Excel Export
  const exportToExcel = () => {
    if (!formData.domainHierarchy || formData.domainHierarchy.length === 0) {
      toast.error('Dışa aktarılacak domain hiyerarşisi bulunamadı!');
      return;
    }

    try {
      const flatData = flattenDomainHierarchy(formData.domainHierarchy);
      const groupedByLevel = groupByLevelWithTotals(flatData);
      
      const wb = XLSX.utils.book_new();
      
      // Ana domain sayfası
      const mainSheetData = [
        {
          'Alan': 'Müşteri',
          'Değer': formData.cariAdi || '(Belirtilmemiş)'
        },
        {
          'Alan': 'Ana Domain',
          'Değer': formData.guncelMyPayterDomain || '(Belirtilmemiş)'
        },
        {
          'Alan': 'Toplam Kök Birim',
          'Değer': formData.domainHierarchy.length
        },
        {
          'Alan': 'Rapor Tarihi',
          'Değer': new Date().toLocaleDateString('tr-TR')
        }
      ];
      
      const wsMain = XLSX.utils.json_to_sheet(mainSheetData);
      wsMain['!cols'] = [{ wch: 20 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsMain, 'Özet');
      
      // Tüm hiyerarşi sayfası
      const allData = [
        {
          'Seviye': 0,
          'Numaralandırma': 'Ana',
          'Domain Adı': formData.guncelMyPayterDomain || '(Belirtilmemiş)',
          'Tam Yol': 'Ana Domain',
          'Alt Birim Sayısı': formData.domainHierarchy.length
        },
        ...flatData.map(({ level, ...rest }) => rest)
      ];
      
      const wsAll = XLSX.utils.json_to_sheet(allData);
      wsAll['!cols'] = [
        { wch: 8 },
        { wch: 15 },
        { wch: 40 },
        { wch: 30 },
        { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, wsAll, 'Tüm Hiyerarşi');
      
      // Her seviye için ayrı sayfa
      const levels = Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b));
      
      levels.forEach(levelKey => {
        const level = Number(levelKey);
        const items = groupedByLevel[level];
        
        const levelData = items.map(({ level, ...rest }) => rest);
        
        // Toplam satırı ekle
        levelData.push({
          'Seviye': '',
          'Numaralandırma': '',
          'Domain Adı': `🔢 TOPLAM SEVİYE ${level}`,
          'Tam Yol': '',
          'Alt Birim Sayısı': items.reduce((sum, item) => sum + item['Alt Birim Sayısı'], 0)
        });
        
        const ws = XLSX.utils.json_to_sheet(levelData);
        ws['!cols'] = [
          { wch: 8 },
          { wch: 15 },
          { wch: 40 },
          { wch: 30 },
          { wch: 18 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, `Seviye ${level}`);
      });
      
      // Seviye özet sayfası
      const summaryData = levels.map(levelKey => {
        const level = Number(levelKey);
        const items = groupedByLevel[level];
        
        return {
          'Seviye': level,
          'Domain Sayısı': items.length,
          'Toplam Alt Birim': items.reduce((sum, item) => sum + item['Alt Birim Sayısı'], 0),
          'Ortalama Alt Birim': items.length > 0 
            ? (items.reduce((sum, item) => sum + item['Alt Birim Sayısı'], 0) / items.length).toFixed(2)
            : '0.00'
        };
      });
      
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Seviye Özeti');
      
      const fileName = `${formData.cariAdi || 'musteri'}_domain_hiyerarsi_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Domain hiyerarşisi Excel'e aktarıldı: ${fileName}`);
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel dosyası oluşturulurken bir hata oluştu!');
    }
  };

  // PDF Export
  const exportToPDF = () => {
    if (!formData.domainHierarchy || formData.domainHierarchy.length === 0) {
      toast.error('Dışa aktarılacak domain hiyerarşisi bulunamadı!');
      return;
    }

    try {
      const flatData = flattenDomainHierarchy(formData.domainHierarchy);
      const groupedByLevel = groupByLevelWithTotals(flatData);
      const doc = new jsPDF();
      
      let currentY = 20;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Domain Hiyerarşisi Raporu', 14, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Müşteri: ${formData.cariAdi || '(Belirtilmemiş)'}`, 14, currentY);
      currentY += 6;
      doc.text(`Ana Domain: ${formData.guncelMyPayterDomain || '(Belirtilmemiş)'}`, 14, currentY);
      currentY += 6;
      doc.text(`Toplam Kök Birim: ${formData.domainHierarchy.length}`, 14, currentY);
      currentY += 6;
      doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, currentY);
      currentY += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Seviye Özeti', 14, currentY);
      currentY += 2;
      
      const levels = Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b));
      
      const summaryData = levels.map(levelKey => {
        const level = Number(levelKey);
        const items = groupedByLevel[level];
        
        return [
          `Seviye ${level}`,
          items.length.toString(),
          items.reduce((sum, item) => sum + item['Alt Birim Sayısı'], 0).toString(),
          items.length > 0
            ? (items.reduce((sum, item) => sum + item['Alt Birim Sayısı'], 0) / items.length).toFixed(2)
            : '0.00'
        ];
      });
      
      autoTable(doc, {
        startY: currentY,
        head: [['Seviye', 'Domain Sayısı', 'Toplam Alt Birim', 'Ort. Alt Birim']],
        body: summaryData,
        theme: 'striped',
        headStyles: { 
          fillColor: [59, 130, 246],
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          font: 'helvetica'
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { cellWidth: 45 },
          3: { cellWidth: 45 }
        }
      });
      
      // Get last table position (jsPDF autoTable adds finalY to doc object)
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      levels.forEach((levelKey, index) => {
        const level = Number(levelKey);
        const items = groupedByLevel[level];
        
        if (index > 0 || currentY > 200) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Seviye ${level} - Detay`, 14, currentY);
        currentY += 2;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Toplam: ${items.length} domain | Alt birim toplamı: ${items.reduce((sum, item) => sum + item['Alt Birim Sayısı'], 0)}`, 14, currentY + 5);
        currentY += 5;
        
        const levelTableData = items.map(item => [
          item['Numaralandırma'],
          item['Domain Adı'],
          item['Alt Birim Sayısı'].toString()
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [['No', 'Domain Adı', 'Alt Birim']],
          body: levelTableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [79, 70, 229],
            fontSize: 9,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 8,
            font: 'helvetica'
          },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 130 },
            2: { cellWidth: 20 }
          },
          didDrawPage: (data) => {
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Sayfa ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
          }
        });
        
        // Get last table position (jsPDF autoTable adds finalY to doc object)
        currentY = (doc as any).lastAutoTable.finalY + 15;
      });
      
      const fileName = `${formData.cariAdi || 'musteri'}_domain_hiyerarsi_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success(`Domain hiyerarşisi PDF'e aktarıldı: ${fileName}`);
    } catch (error) {
      console.error('PDF export hatası:', error);
      toast.error('PDF dosyası oluşturulurken bir hata oluştu!');
    }
  };

  // İptal/Geri butonu handler'ı - Otomatik kayıt aktif, uyarı gereksiz
  const handleCancelWithWarning = () => {
    // Otomatik kayıt aktif olduğu için direkt çıkış yapıyoruz
    onCancel();
  };

  // Cihaz pasifleştirme onayı handler'ı
  const handleDeviceSuspensionConfirm = () => {
    if (!deviceToSuspend || !selectedSuspensionReason) {
      toast.error('Lütfen bir dondurma sebebi seçin');
      return;
    }

    const serviceFee = formData.serviceFeeSettings;
    if (!serviceFee) return;

    const updated = [...serviceFee.deviceSubscriptions];
    const device = updated[deviceToSuspend.deviceIndex];
    
    // Pasifleştirme bilgilerini kaydet
    const suspensionRecord = {
      date: new Date().toISOString(),
      reason: selectedSuspensionReason,
      action: 'suspended' as const,
      notes: suspensionNotes || undefined
    };

    updated[deviceToSuspend.deviceIndex] = {
      ...device,
      isActive: false,
      suspensionReason: selectedSuspensionReason,
      suspensionDate: new Date().toISOString(),
      suspensionHistory: [
        ...(device.suspensionHistory || []),
        suspensionRecord
      ]
    };

    setFormData({
      ...formData,
      serviceFeeSettings: {
        ...serviceFee,
        deviceSubscriptions: updated
      }
    });

    toast.success(`Cihaz pasif hale getirildi: ${selectedSuspensionReason}`);
    
    // Dialog'u kapat ve state'leri temizle
    setSuspensionDialogOpen(false);
    setDeviceToSuspend(null);
    setSelectedSuspensionReason('');
    setSuspensionNotes('');
  };

  // Cihaz aktifleştirme handler'ı
  const handleDeviceReactivation = (deviceIndex: number) => {
    const serviceFee = formData.serviceFeeSettings;
    if (!serviceFee) return;

    const updated = [...serviceFee.deviceSubscriptions];
    const device = updated[deviceIndex];
    
    // Aktifleştirme kaydı ekle
    const reactivationRecord = {
      date: new Date().toISOString(),
      reason: 'Yeniden aktifleştirildi',
      action: 'reactivated' as const,
      notes: undefined
    };

    updated[deviceIndex] = {
      ...device,
      isActive: true,
      reactivationDate: new Date().toISOString(),
      suspensionHistory: [
        ...(device.suspensionHistory || []),
        reactivationRecord
      ]
    };

    setFormData({
      ...formData,
      serviceFeeSettings: {
        ...serviceFee,
        deviceSubscriptions: updated
      }
    });

    toast.success('Cihaz aktifleştirildi');
  };

  return (
    <div className="space-y-6">
      {/* Otomatik Kayıt Aktif - Uyarı Banner'ı Kaldırıldı */}

      {/* Sticky Header - Her zaman üstte görünür */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-4 -mt-6 pt-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button type="button" variant="outline" onClick={handleCancelWithWarning} size="icon">
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h2>
                {isCreating ? 'Yeni Cari Kart Ekle' : 'Cari Kart Detayı'}
              </h2>
              {!isCreating && (
                <p className="text-gray-600">
                  {formData.cariHesapKodu} - {formData.cariAdi}
                </p>
              )}
            </div>
            
            {/* Önceki/Sonraki Navigasyon Butonları - Alfabetik Sıralama */}
            {navigationInfo && onNavigateToCustomer && (
              <div className="flex items-center gap-2 ml-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigationInfo.previousCustomer) {
                      onNavigateToCustomer(navigationInfo.previousCustomer);
                    }
                  }}
                  disabled={!navigationInfo.hasPrevious}
                  title={navigationInfo.previousCustomer 
                    ? `Önceki Cari: ${navigationInfo.previousCustomer.cariAdi}` 
                    : 'Önceki Cari (İlk Kayıtdasınız)'}
                >
                  <ChevronDown size={16} className="rotate-90" />
                  Önceki
                </Button>
                <span className="text-sm text-gray-500 px-2" title="Alfabetik sıraya göre pozisyon">
                  {navigationInfo.currentIndex + 1} / {navigationInfo.total}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigationInfo.nextCustomer) {
                      onNavigateToCustomer(navigationInfo.nextCustomer);
                    }
                  }}
                  disabled={!navigationInfo.hasNext}
                  title={navigationInfo.nextCustomer 
                    ? `Sonraki Cari: ${navigationInfo.nextCustomer.cariAdi}` 
                    : 'Sonraki Cari (Son Kayıtdasınız)'}
                >
                  Sonraki
                  <ChevronDown size={16} className="-rotate-90" />
                </Button>
              </div>
            )}
            {/* Kaydedilmemiş değişiklikler badge'i kaldırıldı - Otomatik kayıt aktif */}
          </div>
          <div className="flex items-center space-x-2">
            {/* Otomatik Kayıt Göstergesi */}
            {!hasUnsavedChanges && !isCreating && formData.id && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <CheckCircle size={14} className="mr-1" />
                Otomatik Kaydedildi
              </Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 animate-pulse">
                <Clock size={14} className="mr-1" />
                Kaydediliyor...
              </Badge>
            )}
            
            {/* Kaydet/Güncelle Butonu - Sticky Header'da */}
            <Button 
              type="button"
              className="flex items-center space-x-2"
              variant={hasUnsavedChanges ? "default" : "outline"}
              onClick={(e) => {
                e.preventDefault();
                console.log('🔘 Güncelle butonu tıklandı');
                console.log('📋 Form Data:', {
                  cariHesapKodu: formData.cariHesapKodu,
                  cariAdi: formData.cariAdi,
                  email: formData.email,
                  mcc: formData.mcc
                });
                // Create a synthetic form event for handleSubmit
                const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
                Object.defineProperty(formEvent, 'target', { writable: false, value: e.currentTarget.form });
                handleSubmit(formEvent);
              }}
            >
              <Save size={18} />
              <span>{isCreating ? 'Kaydet' : 'Manuel Kaydet'}</span>
            </Button>
            
            {/* Debug Butonu - Domain Eşleştirme Kontrolü İçin */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
              console.log('='.repeat(80));
              console.log('🔍 MÜŞTERİ DETAY DEBUG BİLGİLERİ');
              console.log('='.repeat(80));
              console.log('');
              
              console.log('📊 1. FORMDATA (Ekrandaki Veriler):');
              console.log('   Müşteri Adı:', formData.cariAdi || '(Boş)');
              console.log('   Ana Domain:', formData.guncelMyPayterDomain || '(Boş)');
              console.log('   Domain Hiyerarşisi:', {
                kokSayisi: formData.domainHierarchy?.length || 0,
                yapisi: formData.domainHierarchy || []
              });
              console.log('');
              
              console.log('📦 2. PROPS - PAYTER PRODUCTS (Props\'tan Gelen):');
              console.log('   Toplam Payter Ürün:', payterProducts.length);
              if (payterProducts.length > 0) {
                console.log('   İlk 10 Ürün (Detaylı):', payterProducts.slice(0, 10).map(p => ({
                  name: p.name || '(İsimsiz)',
                  domain: p.domain || '(DOMAIN YOK!)',
                  serialNumber: p.serialNumber || '(SN yok)',
                  terminalModel: p.terminalModel || '(Model yok)'
                })));
                
                // Domain'lere göre grupla
                const domainGroups = new Map<string, number>();
                const domainsWithoutValue: string[] = [];
                // ✅ NULL SAFETY: payterProducts boş olabilir
                (payterProducts || []).forEach(p => {
                  const domain = p.domain || 'Domain Yok';
                  if (!p.domain || !p.domain.trim()) {
                    domainsWithoutValue.push(p.serialNumber || p.name || 'Bilinmeyen');
                  }
                  domainGroups.set(domain, (domainGroups.get(domain) || 0) + 1);
                });
                console.log('   Domain Dağılımı:', Object.fromEntries(domainGroups));
                
                if (domainsWithoutValue.length > 0) {
                  console.warn('   ⚠️ UYARI: Domain\'i olmayan ürünler var!', {
                    sayı: domainsWithoutValue.length,
                    örnekler: domainsWithoutValue.slice(0, 5)
                  });
                }
                
                // Müşteri domain'i ile karşılaştırma
                const currentCustomerDomain = formData.domain || formData.guncelMyPayterDomain;
                if (currentCustomerDomain) {
                  console.log('   🔍 Domain Karşılaştırma:');
                  console.log('      Müşteri Domain:', currentCustomerDomain);
                  console.log('      ignoreMainDomain:', formData.ignoreMainDomain || false);
                  
                  if (formData.ignoreMainDomain) {
                    // Alt domain formatında olanları bul
                    const altDomainler = payterProducts.filter(p => 
                      p.domain && p.domain.trim() && p.domain.endsWith('.' + currentCustomerDomain)
                    );
                    console.log('      Alt domain formatındaki ürünler:', {
                      sayı: altDomainler.length,
                      beklenenFormat: `*.${currentCustomerDomain}`,
                      örnekler: altDomainler.slice(0, 5).map(p => p.domain)
                    });
                    
                    if (altDomainler.length === 0) {
                      console.warn('      ⚠️ INFO: "Ana Domain Hariç" seçeneği aktif ama hiç alt domain formatında ürün bulunamadı.');
                      console.warn(`      💡 Beklenen format: subdomain.${currentCustomerDomain} (örnek: vestelevc.${currentCustomerDomain})`);
                      console.warn('      🔧 Çözüm: Domain Hiyerarşisi sekmesinden alt domain\'leri ekleyin veya "Ana Domain Hariç" seçeneğini kapatın.');
                    }
                  } else {
                    // Tam eşleşen olanları bul
                    const tamEslesenler = payterProducts.filter(p => 
                      p.domain && p.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') === 
                      currentCustomerDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
                    );
                    console.log('      Tam eşleşen ürünler:', {
                      sayı: tamEslesenler.length,
                      beklenenDomain: currentCustomerDomain
                    });
                  }
                }
              } else {
                console.log('   ⚠️ UYARI: Hiç Payter ürünü yok!');
              }
              console.log('');
              
              console.log('🔗 3. MATCHED PRODUCTS (Eşleşen Ürünler):');
              console.log('   Toplam Eşleşen:', matchedProducts.length);
              if (matchedProducts.length > 0) {
                console.log('   İlk 5 Eşleşen:', matchedProducts.slice(0, 5).map(p => ({
                  name: p.name,
                  domain: p.domain
                })));
              } else {
                console.log('   ⚠️ UYARI: Hiç eşleşen ürün yok!');
              }
              console.log('');
              
              console.log('🌐 4. MÜŞTERİ DOMAIN BİLGİSİ:');
              const customerDomain = formData.domain || formData.guncelMyPayterDomain;
              console.log('   Müşteri Domain:', customerDomain || '(YOK)');
              console.log('   ignoreMainDomain:', formData.ignoreMainDomain || false);
              console.log('   ignoreMainDomainNote:', formData.ignoreMainDomainNote || '(YOK)');
              if (!customerDomain) {
                console.log('   ⚠️ UYARI: Müşterinin domain bilgisi yok!');
              }
              console.log('');
              
              console.log('💾 5. VERİ DURUMU:');
              console.log('   Payter ürün sayısı:', payterProducts.length);
              console.log('   Müşteri bilgisi:', formData.cariAdi);
              console.log('');
              
              console.log('📋 6. SONUÇ VE ÖNERİLER:');
              if (payterProducts.length === 0) {
                console.log('   ❌ Payter ürünleri yok! Ürün > Payter modülünden cihaz ekleyin.');
              }
              const currentCustomerDomain = formData.domain || formData.guncelMyPayterDomain;
              if (!currentCustomerDomain) {
                console.log('   ❌ Müşteri domain bilgisi yok! Domain sekmesinden domain ekleyin.');
              }
              if (payterProducts.length > 0 && currentCustomerDomain && matchedProducts.length === 0) {
                console.log('   ⚠️ Domain eşleşmesi bulunamadı!');
                console.log('   💡 Payter cihaz domain\'leri:', [...new Set(payterProducts.map(p => p.domain))].slice(0, 10));
                console.log('   💡 Müşteri domain\'i:', currentCustomerDomain);
                console.log('   💡 ignoreMainDomain:', formData.ignoreMainDomain || false);
                
                if (formData.ignoreMainDomain) {
                  console.log('');
                  console.log('   🔧 "Ana Domain Hariç" seçeneği aktif!');
                  console.log('   📌 Bu durumda sadece ALT DOMAIN formatındaki cihazlar eşleşir.');
                  console.log(`   📌 Beklenen format: subdomain.${currentCustomerDomain}`);
                  console.log('   📌 Örnek: vestelevc.' + currentCustomerDomain + ', test.' + currentCustomerDomain);
                  console.log('');
                  console.log('   💡 ÇÖZÜMLERİ:');
                  console.log('      1️⃣ Domain Hiyerarşisi sekmesinden alt domain\'leri ekleyin');
                  console.log('      2️⃣ VEYA "Ana Domain Hariç" seçeneğini kapatın (tam eşleşme için)');
                  console.log('      3️⃣ VEYA Manuel Cihaz Ataması yapın (Banka/PF sekmesinden)');
                } else {
                  console.log('');
                  console.log('   💡 ÇÖZÜM: Müşteri domain\'i ile Payter cihaz domain\'leri uyuşmuyor.');
                  console.log('      1️⃣ Müşteri domain\'ini kontrol edin (Domain sekmesi)');
                  console.log('      2️⃣ Payter cihaz domain\'lerini kontrol edin (Ürün > Payter modülü)');
                  console.log('      3️⃣ VEYA Manuel Cihaz Ataması yapın (Banka/PF sekmesinden)');
                }
              }
              if (matchedProducts.length > 0) {
                console.log('   ✅ Her şey normal! ' + matchedProducts.length + ' cihaz başarıyla eşleşti.');
              }
              
              console.log('');
              console.log('='.repeat(80));
              
              toast.success('Detaylı debug bilgileri konsola yazdırıldı (F12)', { duration: 3000 });
              }}
              className="text-xs"
            >
              🔍 Debug
            </Button>
          
          {!isCreating && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 size={18} />
                  <span>Sil</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cari Kartı Sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu cari kartını silmek istediğinizden emin misiniz? Bu işlem geri
                    alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(formData.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          </div>
        </div>
      </div>

      {/* Form Container - Otomatik kayıt aktif olduğu için form tag'i kaldırıldı */}
      <div id="customer-detail-form" className="space-y-6">
        {/* Tabs Yapısı - SEVIYE 1 FIX: Controlled State */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-5xl grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1">
            <TabsTrigger value="genel">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="domain">🌐 Domain</TabsTrigger>
            <TabsTrigger value="payter">📱 Payter</TabsTrigger>
            <TabsTrigger value="bankpf">🏦 Banka/PF</TabsTrigger>
            <TabsTrigger value="hizmetbedeli">💰 Hizmet Bedeli</TabsTrigger>
            <TabsTrigger value="dsym">📝 DSYM</TabsTrigger>
          </TabsList>

          {/* Genel Bilgiler Sekmesi */}
          <TabsContent value="genel" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sol Kolon - Temel Bilgiler */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Cari Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cariHesapKodu">Cari Hesap Kodu *</Label>
                  <Input
                    id="cariHesapKodu"
                    value={formData.cariHesapKodu}
                    onChange={(e) => handleChange('cariHesapKodu', e.target.value)}
                    required
                    placeholder="Örn: 120.01.001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sektor">SEKTÖR</Label>
                  <Input
                    id="sektor"
                    value={formData.sektor}
                    onChange={(e) => handleChange('sektor', e.target.value)}
                    placeholder="Örn: Teknoloji"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcc">MCC *</Label>
                  {mccList.length > 0 ? (
                    <FilterDropdown
                      label="MCC Seçiniz"
                      options={mccOptions}
                      value={formData.mcc}
                      onChange={(value) => handleChange('mcc', value)}
                      allLabel="MCC seçiniz..."
                      allValue=""
                      className="w-full"
                    />
                  ) : (
                    <Input
                      id="mcc"
                      value={formData.mcc}
                      onChange={(e) => handleChange('mcc', e.target.value)}
                      required
                      placeholder="Örn: 5411"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cariAdi">Cari Adı *</Label>
                <Input
                  id="cariAdi"
                  value={formData.cariAdi}
                  onChange={(e) => handleChange('cariAdi', e.target.value)}
                  required
                  placeholder="Firma ünvanı"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vergiDairesi">Vergi Dairesi</Label>
                  <Input
                    id="vergiDairesi"
                    value={formData.vergiDairesi}
                    onChange={(e) =>
                      handleChange('vergiDairesi', e.target.value)
                    }
                    placeholder="Vergi dairesi adı"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vergiNo">Vergi No</Label>
                  <Input
                    id="vergiNo"
                    value={formData.vergiNo}
                    onChange={(e) => handleChange('vergiNo', e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adres">Adres</Label>
                <Textarea
                  id="adres"
                  value={formData.adres}
                  onChange={(e) => handleChange('adres', e.target.value)}
                  placeholder="Tam adres bilgisi"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ilce">İlçe</Label>
                  <Input
                    id="ilce"
                    value={formData.ilce}
                    onChange={(e) => handleChange('ilce', e.target.value)}
                    placeholder="İlçe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postaKodu">Posta Kodu</Label>
                  <Input
                    id="postaKodu"
                    value={formData.postaKodu}
                    onChange={(e) => handleChange('postaKodu', e.target.value)}
                    placeholder="34398"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sağ Kolon - İletişim Bilgileri */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    placeholder="ornek@sirket.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yetkili">Yetkili</Label>
                  <Input
                    id="yetkili"
                    value={formData.yetkili}
                    onChange={(e) => handleChange('yetkili', e.target.value)}
                    placeholder="Yetkili kişi adı"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tel">Telefon</Label>
                  <Input
                    id="tel"
                    value={formData.tel}
                    onChange={(e) => handleChange('tel', e.target.value)}
                    placeholder="0532 111 2233"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durum">Durum</Label>
                  <FilterDropdown
                    label="Durum"
                    options={durumOptions}
                    value={formData.durum}
                    onChange={(value) => handleChange('durum', value as 'Aktif' | 'Pasif')}
                    allLabel="Durum seçiniz"
                    allValue=""
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesRep">Satış Temsilcisi</Label>
                  <FilterDropdown
                    label="Satış Temsilcisi"
                    options={salesRepOptions}
                    value={formData.salesRepId || 'unassigned'}
                    onChange={(value) => {
                      const selectedRep = salesReps.find(rep => rep.id === value);
                      setFormData({
                        ...formData,
                        salesRepId: value === 'unassigned' ? undefined : value,
                        salesRepName: selectedRep?.adSoyad || undefined
                      });
                    }}
                    allLabel="Seçiniz..."
                    allValue=""
                    className="w-full"
                  />
                  {formData.salesRepName && (
                    <p className="text-xs text-gray-600">
                      Atanmış: <span className="font-medium">{formData.salesRepName}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ek Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Ek Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="p6x">P6X</Label>
                    <Badge variant={deviceModelCounts.p6x > 0 ? "default" : "outline"} className="text-xs">
                      {deviceModelCounts.p6x} Cihaz
                    </Badge>
                  </div>
                  <Input
                    id="p6x"
                    value={formData.p6x || ''}
                    onChange={(e) => handleChange('p6x', e.target.value)}
                    placeholder="P6X bilgisi"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="apollo">APOLLO</Label>
                    <Badge variant={deviceModelCounts.apollo > 0 ? "default" : "outline"} className="text-xs">
                      {deviceModelCounts.apollo} Cihaz
                    </Badge>
                  </div>
                  <Input
                    id="apollo"
                    value={formData.apollo || ''}
                    onChange={(e) => handleChange('apollo', e.target.value)}
                    placeholder="APOLLO bilgisi"
                  />
                </div>

                {/* ✅ Aylık Abone Hizmet Bedeli - Dashboard Widget için */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <Label htmlFor="subscriptionFee" className="flex items-center gap-2">
                    <DollarSign size={16} className="text-green-600" />
                    Aylık Abone Hizmet Bedeli (₺)
                  </Label>
                  <Input
                    id="subscriptionFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subscriptionFee || ''}
                    onChange={(e) => handleChange('subscriptionFee', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0,00"
                  />
                  {formData.subscriptionFee && formData.subscriptionFee > 0 && (
                    <p className="text-xs text-green-600">
                      Yıllık: ₺{(formData.subscriptionFee * 12).toLocaleString('tr-TR', { 
                        minimumFractionDigits: 2 
                      })}
                    </p>
                  )}
                </div>

                {/* Atanmış Cihaz Sayısı */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <Label className="flex items-center gap-2">
                    <Monitor size={16} className="text-blue-600" />
                    Atanmış Toplam Cihaz
                  </Label>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {totalAssignedDevices} Cihaz
                    </Badge>
                    {totalAssignedDevices > 0 && (
                      <span className="text-xs text-gray-500">
                        ({formData.bankDeviceAssignments?.length || 0} banka/kurum)
                      </span>
                    )}
                  </div>
                  {totalAssignedDevices === 0 && (
                    <p className="text-xs text-gray-500">
                      Bu müşteriye henüz cihaz ataması yapılmamış
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          {/* Domain Sekmesi - SEVIYE 1 FIX: Lazy Loading */}
          <TabsContent value="domain" className="mt-6">
            {activeTab === 'domain' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>🌐 Domain Hiyerarşisi</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Müşteri domain yapısını yönetin - Hiyerarşik organizasyon yapısı
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={exportToExcel}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      disabled={!formData.domainHierarchy || formData.domainHierarchy.length === 0}
                      title="Domain hiyerarşisini Excel'e aktar"
                    >
                      <FileSpreadsheet size={14} className="mr-1" />
                      Excel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={exportToPDF}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={!formData.domainHierarchy || formData.domainHierarchy.length === 0}
                      title="Domain hiyerarşisini PDF'e aktar"
                    >
                      <FileText size={14} className="mr-1" />
                      PDF
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => addDomain([])}
                    >
                      <Plus size={14} className="mr-1" />
                      Kök Birim Ekle
                    </Button>
                  </div>
                </div>
                
                {/* Numaralandırma Sistemi Açıklama */}
                <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-600">
                    <strong>Numaralandırma:</strong> 1. → a. → i. → 1. → i. şeklinde otosmatik hiyerarşik sıralama
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ana Domain - Kök Domain Alanı */}
                <div className="bg-blue-50 border-2 border-blue-300 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="guncelMyPayterDomain" className="text-blue-900">
                        🌐 Ana Domain (Kök)
                      </Label>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Zorunlu
                      </span>
                    </div>
                    <Input
                      id="guncelMyPayterDomain"
                      value={formData.guncelMyPayterDomain}
                      onChange={(e) => handleChange('guncelMyPayterDomain', e.target.value)}
                      placeholder="ornek.mypayter.com"
                      className="bg-white border-blue-300 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-700">
                      💡 Bu alan müşterinin ana domain adresini belirtir. Aşağıdaki hiyerarşi yapısı bu domain içindeki organizasyonu gösterir.
                    </p>
                  </div>
                </div>

                {/* Ana Domaini Görmezden Gel Ayarları */}
                <div className="bg-amber-50 border-2 border-amber-300 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="ignoreMainDomain"
                        checked={formData.ignoreMainDomain || false}
                        onCheckedChange={(checked) => {
                          // State'i güncelle
                          handleChange('ignoreMainDomain', checked);
                          
                          // Checkbox kaldırıldığında not alanını temizle
                          if (!checked) {
                            handleChange('ignoreMainDomainNote', '');
                            
                            // Normal moda döndüğünde de otomatik kaydet
                            toast.info('🔄 Ana domain eşleştirmesi normal moda döndü', {
                              description: 'Cihazlar ana domain ile yeniden eşleştirilecek.'
                            });
                            
                            setTimeout(() => {
                              const updatedData = { 
                                ...formData, 
                                ignoreMainDomain: false,
                                ignoreMainDomainNote: ''
                              };
                              onSave(updatedData, { autoSave: true });
                              toast.success('✅ Domain eşleştirmesi güncellendi!', {
                                description: 'Ana domain modu aktif - cihazlar yeniden eşleştirildi.'
                              });
                            }, 150);
                          } else {
                            // ✅ CHECKBOX İŞARETLENDİĞİNDE HEMEN OTOMATIK DOMAIN EŞLEŞTIRME
                            toast.info('🔄 Alt domain eşleştirme modu aktif!', {
                              description: 'Cihazlar alt domainlerle yeniden taranıyor...'
                            });
                            
                            // Not alanı boşsa uyarı ver ama yine de eşleştirmeyi yap
                            if (!formData.ignoreMainDomainNote?.trim()) {
                              toast.warning('⚠️ Lütfen not alanını doldurmayı unutmayın!', {
                                description: 'Domain eşleştirmesi başlatıldı ama açıklama zorunludur.'
                              });
                              
                              // Not alanına focus yap
                              setTimeout(() => {
                                if (ignoreMainDomainNoteRef.current) {
                                  ignoreMainDomainNoteRef.current.focus();
                                }
                              }, 100);
                            }
                            
                            // State güncellemesinin tamamlanması için kısa gecikme
                            // HER DURUMDA domain eşleştirmesini tetikle
                            setTimeout(() => {
                              const updatedData = { 
                                ...formData, 
                                ignoreMainDomain: true 
                              };
                              onSave(updatedData, { autoSave: true });
                              toast.success('✅ Domain eşleştirmesi güncellendi!', {
                                description: 'Artık sadece alt domainler (örn: TINTCAFE) ile cihaz eşleştirmesi yapılacak.'
                              });
                            }, 150);
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor="ignoreMainDomain" className="text-amber-900 cursor-pointer">
                          🔀 Ana Domaini Görmezden Gel (Alt Domain Eşleştirme)
                        </Label>
                        <p className="text-xs text-amber-700 mt-1">
                          Bu seçenek aktifse, ürün eşleştirmesi sadece alt domainlerle yapılır. Ana domain eşleştirmede görmezden gelinir.
                        </p>
                      </div>
                    </div>

                    {formData.ignoreMainDomain && (
                      <div className="space-y-2 pl-11">
                        <Label htmlFor="ignoreMainDomainNote" className="text-amber-900">
                          Not (Zorunlu) *
                        </Label>
                        <Textarea
                          ref={ignoreMainDomainNoteRef}
                          id="ignoreMainDomainNote"
                          value={formData.ignoreMainDomainNote || ''}
                          onChange={(e) => {
                            const noteValue = e.target.value;
                            handleChange('ignoreMainDomainNote', noteValue);
                            
                            // ✅ NOT DOLDURULDUYSA VE CHECKBOX İŞARETLİYSE OTOMATIK KAYDET (Debounced)
                            if (noteValue.trim() && formData.ignoreMainDomain && !isCreating) {
                              // Önceki timeout'u temizle
                              if (domainMatchTimeoutRef.current) {
                                clearTimeout(domainMatchTimeoutRef.current);
                              }
                              
                              // Yeni timeout başlat (kullanıcı yazmayı bitirdiğinde çalışacak)
                              domainMatchTimeoutRef.current = window.setTimeout(() => {
                                toast.info('💾 Not kaydedildi - domain eşleştirmesi güncelleniyor...');
                                
                                const updatedData = { 
                                  ...formData, 
                                  ignoreMainDomain: true,
                                  ignoreMainDomainNote: noteValue
                                };
                                onSave(updatedData, { autoSave: true });
                                
                                toast.success('✅ Domain eşleştirmesi güncellendi!', {
                                  description: 'Alt domain modunda cihazlar yeniden eşleştirildi.'
                                });
                              }, 1500); // 1.5 saniye debounce - kullanıcı yazmayı bitirsin
                            }
                          }}
                          placeholder="Örn: Multi-branch yapı - şubeler kendi alt domainlerini kullanıyor"
                          rows={3}
                          className="bg-white border-amber-300 focus:border-amber-500"
                          required={formData.ignoreMainDomain}
                        />
                        <p className="text-xs text-amber-700">
                          💡 Bu özelliği neden etkinleştirdiğinizi açıklayın. Örnek: şube yapısı, multi-domain yönetimi vb.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Domain Hiyerarşisi Ağacı */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded border border-gray-200">
                    <Label className="text-gray-700 text-sm">📊 Organizasyon Yapısı</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                        {formData.domainHierarchy?.length || 0} kök
                      </span>
                      {formData.domainHierarchy && formData.domainHierarchy.length > 0 && (
                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                          {(() => {
                            const countNodes = (nodes: DomainNode[]): number => {
                              return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
                            };
                            return countNodes(formData.domainHierarchy);
                          })()} toplam
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                    {formData.domainHierarchy && formData.domainHierarchy.length > 0 ? (
                      <div className="space-y-1">
                        {formData.domainHierarchy.map((node, index) => (
                          <DomainTreeNode
                            key={node.id}
                            node={node}
                            path={[index]}
                            level={0}
                            onUpdate={updateDomainName}
                            onDelete={deleteDomain}
                            onAddChild={addDomain}
                            onAddSibling={addSiblingDomain}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="text-5xl mb-3 opacity-30">📊</div>
                        <p className="text-gray-600 mb-2">Henüz organizasyon yapısı eklenmedi</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Organizasyon yapısını modellemek için birim ekleyin
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addDomain([])}
                        >
                          <Plus size={14} className="mr-1" />
                          İlk Birimi Ekle
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kullanım Kılavuzu */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-lg">💡</span>
                    <h4 className="text-sm text-blue-900">Kullanım Kılavuzu</h4>
                  </div>
                  
                  {/* Buton açıklamaları */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-blue-200">
                      <Edit2 size={12} className="text-gray-600" />
                      <span>Birim adına tıklayarak düzenle</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-blue-200">
                      <Plus size={12} className="text-green-600" />
                      <span><strong>Yeşil:</strong> Alt birim ekle</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-blue-200">
                      <Plus size={12} className="text-blue-600" />
                      <span><strong>Mavi:</strong> Yan birim ekle</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-blue-200">
                      <Trash size={12} className="text-red-600" />
                      <span><strong>Kırmızı:</strong> Birimi sil</span>
                    </div>
                  </div>

                  {/* Örnek */}
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-xs text-gray-600 mb-2"><strong>Örnek:</strong></p>
                    <p className="text-xs text-gray-700 font-mono">
                      1. İSTANBUL → a. İSTHASTANE → i. MEDICALPARK → 1. FLORYA
                    </p>
                  </div>

                  {/* Excel bilgisi */}
                  <div className="mt-3 bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-xs text-green-900">
                      <strong>📥 Excel Toplu Yükleme:</strong> Ana liste sayfasındaki "🌐 Domain Yükle" butonunu kullanarak toplu yükleme yapabilirsiniz.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Payter Sekmesi - SEVIYE 1 FIX: Lazy Loading */}
          <TabsContent value="payter" className="mt-6">
            {activeTab === 'payter' && (
            <div className="space-y-6">
              {/* Özet İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Toplam Cihaz</p>
                        <h3 className="text-blue-600 mt-1">{matchedProducts.length}</h3>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Monitor className="text-blue-600" size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Online</p>
                        <h3 className="text-green-600 mt-1">
                          {matchedProducts.filter(p => p.onlineStatus?.toLowerCase() === 'online').length}
                        </h3>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Offline</p>
                        <h3 className="text-red-600 mt-1">
                          {matchedProducts.filter(p => p.onlineStatus?.toLowerCase() === 'offline').length}
                        </h3>
                      </div>
                      <div className="p-3 bg-red-100 rounded-lg">
                        <XCircle className="text-red-600" size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Terminal Type Dağılımı */}
              {matchedProducts.length > 0 && (() => {
                const typeDistribution = new Map<string, number>();
                matchedProducts.forEach(p => {
                  const type = p.terminalType || 'Bilinmeyen';
                  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
                });
                const sortedTypes = Array.from(typeDistribution.entries())
                  .sort((a, b) => b[1] - a[1]);
                
                return sortedTypes.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>📊 Terminal Type Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {sortedTypes.map(([type, count]) => (
                          <div key={type} className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-indigo-600">{count}</div>
                            <div className="text-xs text-gray-600 mt-1">{type}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              {/* Domain Bazlı Ürün Listesi */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>📱 Domain Bazlı Cihaz Listesi</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Domain hiyerarşisi ile eşleşen Payter cihazları
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {matchedProducts.length > 0 && (
                        <>
                          <Badge variant="outline">
                            {productsByDomain.length} domain • {matchedProducts.length} cihaz
                          </Badge>
                          
                          {/* Excel İndir */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                const excelData: any[] = [];
                                
                                productsByDomain.forEach(({ domain, domainLevel, products }) => {
                                  // Domain başlığı
                                  excelData.push({
                                    'Serial Number': '',
                                    'Name': `${domain} (${domainLevel})`,
                                    'TID': '',
                                    'Model': '',
                                    'Type': '',
                                    'Status': ''
                                  });
                                  
                                  // Cihazlar
                                  products.forEach(product => {
                                    excelData.push({
                                      'Serial Number': product.serialNumber || '-',
                                      'Name': product.name || '-',
                                      'TID': product.tid || '-',
                                      'Model': product.terminalModel || '-',
                                      'Type': product.terminalType || '-',
                                      'Status': product.onlineStatus || '-'
                                    });
                                  });
                                  
                                  // Boş satır
                                  excelData.push({
                                    'Serial Number': '',
                                    'Name': '',
                                    'TID': '',
                                    'Model': '',
                                    'Type': '',
                                    'Status': ''
                                  });
                                });
                                
                                const ws = XLSX.utils.json_to_sheet(excelData);
                                const wb = XLSX.utils.book_new();
                                
                                // Sütun genişlikleri
                                ws['!cols'] = [
                                  { wch: 20 }, // Serial Number
                                  { wch: 30 }, // Name
                                  { wch: 15 }, // TID
                                  { wch: 20 }, // Model
                                  { wch: 15 }, // Type
                                  { wch: 12 }  // Status
                                ];
                                
                                XLSX.utils.book_append_sheet(wb, ws, 'Cihaz Listesi');
                                
                                const fileName = `${formData.cariAdi.replace(/[^a-z0-9]/gi, '-')}-cihaz-listesi-${new Date().toISOString().split('T')[0]}.xlsx`;
                                XLSX.writeFile(wb, fileName);
                                
                                toast.success(`Excel başarıyla oluşturuldu!\n${fileName}`);
                              } catch (error) {
                                console.error('Excel oluşturma hatası:', error);
                                toast.error('Excel oluşturulurken hata oluştu!');
                              }
                            }}
                            className="flex items-center gap-1"
                          >
                            <Download size={14} />
                            Excel İndir
                          </Button>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => {
                              try {
                                const doc = new jsPDF({
                                  orientation: 'landscape',
                                  unit: 'mm',
                                  format: 'a4'
                                });
                                
                                doc.setFontSize(16);
                                doc.text(`${formData.cariAdi} - Cihaz Listesi`, 14, 15);
                                
                                doc.setFontSize(10);
                                doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);
                                doc.text(`Toplam Domain: ${productsByDomain.length}`, 14, 28);
                                doc.text(`Toplam Cihaz: ${matchedProducts.length}`, 14, 34);
                                
                                let currentY = 42;
                                
                                productsByDomain.forEach((item, index) => {
                                  if (index > 0 && currentY > 170) {
                                    doc.addPage();
                                    currentY = 15;
                                  }
                                  
                                  // Domain başlığı
                                  doc.setFontSize(12);
                                  doc.text(`${item.domain} (${item.domainLevel}) - ${item.count} cihaz`, 14, currentY);
                                  currentY += 5;
                                  
                                  // Tablo
                                  const headers = [['Serial Number', 'Name', 'TID', 'Model', 'Type', 'Status']];
                                  const tableData = item.products.map(p => [
                                    p.serialNumber || '-',
                                    p.name || '-',
                                    p.tid || '-',
                                    p.terminalModel || '-',
                                    p.terminalType || '-',
                                    p.onlineStatus || '-'
                                  ]);
                                  
                                  autoTable(doc, {
                                    head: headers,
                                    body: tableData,
                                    startY: currentY,
                                    styles: {
                                      fontSize: 8,
                                      cellPadding: 2,
                                      overflow: 'linebreak',
                                      halign: 'left',
                                      valign: 'middle'
                                    },
                                    headStyles: {
                                      fillColor: [59, 130, 246],
                                      textColor: [255, 255, 255],
                                      fontSize: 8,
                                      fontStyle: 'bold',
                                      halign: 'center'
                                    },
                                    columnStyles: {
                                      0: { cellWidth: 35 },
                                      1: { cellWidth: 50 },
                                      2: { cellWidth: 30 },
                                      3: { cellWidth: 40 },
                                      4: { cellWidth: 30 },
                                      5: { cellWidth: 25, halign: 'center' }
                                    },
                                    alternateRowStyles: {
                                      fillColor: [249, 250, 251]
                                    },
                                    margin: { left: 14, right: 14 },
                                    theme: 'grid'
                                  });
                                  
                                  currentY = (doc as any).lastAutoTable.finalY + 8;
                                });
                                
                                const fileName = `${formData.cariAdi.replace(/[^a-z0-9]/gi, '-')}-cihaz-listesi-${new Date().toISOString().split('T')[0]}.pdf`;
                                doc.save(fileName);
                                
                                toast.success(`PDF başarıyla oluşturuldu!\n${fileName}`);
                              } catch (error) {
                                console.error('PDF oluşturma hatası:', error);
                                toast.error('PDF oluşturulurken hata oluştu!');
                              }
                            }}
                            className="flex items-center gap-1"
                          >
                            <FileDown size={14} />
                            PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {matchedProducts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-3 opacity-30">📱</div>
                      <p className="text-gray-900 mb-2">⚠️ Henüz eşleşen cihaz bulunamadı</p>
                      <div className="text-sm text-gray-600 space-y-2 max-w-2xl mx-auto mt-4">
                        <p><strong>Olası Nedenler:</strong></p>
                        <ol className="text-left list-decimal list-inside space-y-1">
                          <li><strong>Payter Ürünleri Yok:</strong> Ürün modülündeki "Payter" sekmesinde hiç cihaz kaydı bulunmuyor</li>
                          <li><strong>Domain Uyuşmazlığı:</strong> Payter cihazlarının domain alanları, bu müşterinin domain bilgileriyle eşleşmiyor</li>
                          <li><strong>Domain Bilgisi Eksik:</strong> Bu müşterinin domain hiyerarşisi veya ana domain bilgisi girilmemiş</li>
                        </ol>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                          <p className="text-blue-900 text-xs">
                            💡 <strong>Çözüm:</strong> Önce yukarıdaki "🔍 Debug" butonuna tıklayın ve konsolda (F12) hangi verinin eksik olduğunu kontrol edin.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {productsByDomain.map(({ domain, domainLevel, products, count }) => (
                        <div key={domain} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-gray-900">{domain}</h4>
                                <Badge variant={domainLevel === 'Ana Domain' ? 'default' : 'secondary'} className="text-xs">
                                  {domainLevel}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{count} cihaz</p>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3">Serial Number</th>
                                  <th className="text-left py-2 px-3">Name</th>
                                  <th className="text-left py-2 px-3">TID</th>
                                  <th className="text-left py-2 px-3">Model</th>
                                  <th className="text-left py-2 px-3">Type</th>
                                  <th className="text-left py-2 px-3">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {products.map((product) => (
                                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3">{product.serialNumber || '-'}</td>
                                    <td className="py-2 px-3">{product.name || '-'}</td>
                                    <td className="py-2 px-3">
                                      {product.tid ? (
                                        <span className="text-green-700">{product.tid}</span>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3">{product.terminalModel || '-'}</td>
                                    <td className="py-2 px-3">{product.terminalType || '-'}</td>
                                    <td className="py-2 px-3">
                                      {product.onlineStatus?.toLowerCase() === 'online' ? (
                                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                          <CheckCircle size={12} />
                                          Online
                                        </span>
                                      ) : product.onlineStatus?.toLowerCase() === 'offline' ? (
                                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                          <XCircle size={12} />
                                          Offline
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            )}
          </TabsContent>

          {/* Banka/PF Sekmesi - SEVIYE 1 FIX: Lazy Loading */}
          <TabsContent value="bankpf" className="mt-6">
            {activeTab === 'bankpf' && (
            <div className="space-y-6">
              {/* Banka - Cihaz İlişkilendirme Yönetimi */}
              <BankDeviceManagementTab
                assignments={Array.isArray(formData.bankDeviceAssignments) ? formData.bankDeviceAssignments : []}
                onAssignmentsChange={(assignments) => {
                  // CRITICAL FIX: Functional state update kullan - stale closure'ı önle
                  setFormData(prevFormData => {
                    // ✅ ARRAY SAFETY: assignments kontrolü
                    const safeAssignments = Array.isArray(assignments) ? assignments : [];
                    
                    // bankDeviceAssignments güncellendiğinde linkedBankPFIds'i de senkronize et
                    const assignmentBasedIds = extractBankPFIdsFromAssignments(safeAssignments, bankPFRecords);
                    
                    // Otomatik eşleşen kayıtları da ekle
                    const normalizedCariAdi = prevFormData.cariAdi.trim().toLowerCase();
                    const autoMatchedIds = bankPFRecords
                      .filter((record: BankPF) => {
                        const normalizedFirmaUnvan = record.firmaUnvan?.trim().toLowerCase() || '';
                        return normalizedCariAdi === normalizedFirmaUnvan;
                      })
                      .map((record: BankPF) => record.id);
                    
                    // Manuel bağlantıları koru (linkedBankPFIds'te olan ama assignment veya auto-match'ten gelmeyen)
                    const currentManualIds = (prevFormData.linkedBankPFIds || []).filter(id => 
                      !assignmentBasedIds.includes(id) && !autoMatchedIds.includes(id)
                    );
                    
                    // Tüm ID'leri birleştir
                    const allLinkedIds = Array.from(new Set([
                      ...currentManualIds,
                      ...assignmentBasedIds,
                      ...autoMatchedIds
                    ]));
                    
                    console.log('🔄 BankDeviceAssignments güncellendi, linkedBankPFIds senkronize ediliyor:', {
                      cariAdi: prevFormData.cariAdi,
                      assignmentsCount: safeAssignments.length,
                      assignments: safeAssignments.map(a => ({ bankId: a.bankId, bankName: a.bankName, deviceCount: a.deviceIds?.length || 0 })),
                      currentManualIds,
                      assignmentBasedIds,
                      autoMatchedIds,
                      allLinkedIds,
                      bankPFRecordsCount: bankPFRecords.length,
                      bankPFRecordsSample: bankPFRecords.slice(0, 3).map(r => ({ 
                        id: r.id, 
                        firmaUnvan: r.firmaUnvan, 
                        linkedBankIds: r.linkedBankIds,
                        linkedEPKIds: r.linkedEPKIds,
                        linkedOKIds: r.linkedOKIds
                      }))
                    });
                    
                    const updatedFormData = { 
                      ...prevFormData, 
                      bankDeviceAssignments: safeAssignments,
                      linkedBankPFIds: allLinkedIds // Boş array da sakla, undefined yapma
                    };
                    
                    // 🔥 OTOMATIK KAYIT - Debounced auto-save (infinite loop'u önlemek için)
                    if (autoSaveTimeoutRef.current) {
                      clearTimeout(autoSaveTimeoutRef.current);
                    }
                    
                    // Kayıt işlemi devam ediyorsa atla
                    if (!isSavingRef.current) {
                      autoSaveTimeoutRef.current = window.setTimeout(() => {
                        isSavingRef.current = true;
                        console.log('💾 Otomatik kayıt başlatılıyor (Banka/PF değişikliği)...');
                        
                        onSave(updatedFormData, { autoSave: true });
                        setHasUnsavedChanges(false); // Kayıt sonrası flag temizle
                        toast.success('✅ Banka/PF atamaları kaydedildi', { duration: 2000 });
                        
                        // Kayıt tamamlandı flag'ini temizle
                        setTimeout(() => {
                          isSavingRef.current = false;
                        }, 1000);
                      }, 500); // 500ms debounce
                    }
                    
                    return updatedFormData;
                  });
                }}
                banks={banks}
                epkList={epkList}
                okList={okList}
                payterProducts={matchedProducts}
              />

              {/* Ayırıcı */}
              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">Banka/PF Modül Kayıtları</span>
                </div>
              </div>

              {(() => {
                // linkedBankPFIds ile eşleşen kayıtları bul
                const linkedRecords = bankPFRecords?.filter((record: BankPF) => 
                  formData.linkedBankPFIds?.includes(record.id)
                ) || [];

                return (
                  <>
                    {/* Kullanım Bilgisi */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="flex gap-3">
                          <div className="text-2xl">💡</div>
                          <div className="flex-1 space-y-2">
                            <p className="text-sm text-blue-900">
                              <strong>Banka/PF Eşleştirme:</strong>
                            </p>
                            <div className="text-xs text-blue-800 space-y-1">
                              <p>✓ <strong>Otomatik:</strong> Cari Adı ile Firma Ünvanı eşleşen kayıtlar otomatik gösterilir</p>
                              <p>✓ <strong>Manuel:</strong> Ana liste sayfasındaki <strong>"🏦 Banka/PF Yükle"</strong> butonu ile Excel'den özel eşleştirmeler yapabilirsiniz</p>
                              <p>✓ <strong>Şablon:</strong> Mevcut eşleştirmeleri görmek için <strong>"🏦 Banka/PF Şablon"</strong> butonunu kullanın</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Eşleşen Banka/PF Kayıtları Listesi */}
                    {linkedRecords.length === 0 ? (
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-6">
                          <div className="text-center text-gray-500 py-8">
                            <div className="text-4xl mb-2">📂</div>
                            <p className="text-sm">Bu müşteri ile eşleştirilmiş Banka/PF kaydı bulunamadı</p>
                            <p className="text-xs mt-1">Yukarıdaki "Banka-Cihaz İlişkilendirme" bölümünden atama yapabilirsiniz</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>🏦 Eşleştirilmiş Banka/PF Kayıtları</span>
                            <Badge variant="outline">{linkedRecords.length} kayıt</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {linkedRecords.map((record: BankPF) => {
                              // Banka isimlerini getir
                              const bankNames = record.linkedBankIds?.map(bankId => {
                                const bank = banks?.find(b => b.id === bankId);
                                return bank?.bankaAdi || bankId;
                              }) || [];

                              // EPK isimlerini getir
                              const epkNames = record.linkedEPKIds?.map(epkId => {
                                const epk = epkList?.find(e => e.id === epkId);
                                return epk?.kurumAdi || epkId;
                              }) || [];

                              // OK isimlerini getir
                              const okNames = record.linkedOKIds?.map(okId => {
                                const ok = okList?.find(o => o.id === okId);
                                return ok?.kurumAdi || okId;
                              }) || [];

                              return (
                                <div 
                                  key={record.id} 
                                  className="border rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                                  onClick={() => {
                                    if (onBankPFNavigate) {
                                      onBankPFNavigate(record.id);
                                    }
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    {/* Sol: Ana Bilgiler */}
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-900">
                                          {record.firmaUnvan || 'İsimsiz Kayıt'}
                                        </h4>
                                        {record.firmaUnvan?.trim().toLowerCase() === formData.cariAdi.trim().toLowerCase() && (
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                            Otomatik Eşleşme
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Eşleşme Bilgileri */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* Bankalar */}
                                        {bankNames.length > 0 && (
                                          <div className="flex items-start gap-2">
                                            <div className="text-xs text-gray-500 font-medium min-w-[60px]">Bankalar:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {bankNames.map((name, idx) => (
                                                <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                  {name}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* EPK */}
                                        {epkNames.length > 0 && (
                                          <div className="flex items-start gap-2">
                                            <div className="text-xs text-gray-500 font-medium min-w-[60px]">EPK:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {epkNames.map((name, idx) => (
                                                <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                                  {name}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* OK */}
                                        {okNames.length > 0 && (
                                          <div className="flex items-start gap-2">
                                            <div className="text-xs text-gray-500 font-medium min-w-[60px]">ÖK:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {okNames.map((name, idx) => (
                                                <Badge key={idx} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                                  {name}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Eğer hiç eşleşme yoksa uyarı */}
                                      {bankNames.length === 0 && epkNames.length === 0 && okNames.length === 0 && (
                                        <div className="text-xs text-amber-600 flex items-center gap-1">
                                          <AlertTriangle size={12} />
                                          <span>Bu kayıtta banka/EPK/ÖK eşleşmesi yapılmamış</span>
                                        </div>
                                      )}

                                      {/* Ek Bilgiler (varsa) */}
                                      <div className="flex gap-4 text-xs text-gray-500">
                                        {record.vergiNumarasi && (
                                          <span>VKN: {record.vergiNumarasi}</span>
                                        )}
                                        {record.ilce && (
                                          <span>📍 {record.ilce}/{record.il}</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Sağ: Detaya Git */}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onBankPFNavigate) {
                                          onBankPFNavigate(record.id);
                                        }
                                      }}
                                    >
                                      Detay
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
            </div>
            )}
          </TabsContent>
          {/* Hizmet Bedeli Sekmesi */}
          <TabsContent value="hizmetbedeli" className="mt-6">
            <div className="space-y-6">
              {/* Otomatik Kayıt Bilgilendirmesi */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <div className="text-2xl">✨</div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-green-900">
                        <strong>Otomatik Kayıt Aktif:</strong>
                      </p>
                      <div className="text-xs text-green-800 space-y-1">
                        <p>✓ Bu sekmede yaptığınız tüm değişiklikler <strong>otomatik olarak kaydedilir</strong></p>
                        <p>✓ Cihaz aktif/pasif değişiklikleri, aylık ücret güncellemeleri ve tüm ayarlar 1.5 saniye sonra otomatik kaydedilir</p>
                        <p>✓ Üstteki yeşil <CheckCircle size={12} className="inline" /> <strong>"Otomatik Kaydedildi"</strong> işaretini görebilirsiniz</p>
                        <p className="text-gray-600 italic">İsterseniz "Manuel Kaydet" butonunu da kullanabilirsiniz</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {(() => {
                // Hizmet bedeli ayarlarını al veya varsayılan oluştur
                const serviceFee = formData.serviceFeeSettings ? {
                  ...formData.serviceFeeSettings,
                  deviceSubscriptions: formData.serviceFeeSettings.deviceSubscriptions || [],
                  invoices: formData.serviceFeeSettings.invoices || [],
                  reminders: formData.serviceFeeSettings.reminders || []
                } : {
                  customerId: formData.id,
                  paymentType: 'monthly' as const,
                  standardFeePerDevice: 10,
                  contractStartDate: new Date().toISOString().split('T')[0],
                  isActive: true,
                  deviceSubscriptions: [],
                  invoices: [],
                  reminders: []
                };

                // Payter'dan otomatik gelen cihazları al
                const displayDevicesForStats = matchedProducts.map(product => {
                  const existingSubscription = serviceFee.deviceSubscriptions.find(
                    d => d.deviceId === product.id
                  );
                  
                  return existingSubscription || {
                    deviceId: product.id,
                    deviceSerialNumber: product.serialNumber || '',
                    deviceName: product.name || '',
                    monthlyFee: serviceFee.customFeePerDevice || serviceFee.standardFeePerDevice,
                    isActive: true,
                    activationDate: new Date().toISOString().split('T')[0],
                    paymentStatus: 'pending' as const
                  };
                });
                
                // Müşterinin cihazlarını al (Payter'dan otomatik)
                const activeDeviceCount = displayDevicesForStats.filter(d => d.isActive).length;
                const totalMonthlyFee = displayDevicesForStats
                  .filter(d => d.isActive)
                  .reduce((sum, d) => sum + d.monthlyFee, 0);

                // Ödeme durumu analizi
                const overdueInvoices = serviceFee.invoices.filter(inv => inv.status === 'overdue');
                const pendingInvoices = serviceFee.invoices.filter(inv => inv.status === 'pending');
                
                // Dondurma süresi hesaplama
                const suspensionDays = serviceFee.suspensionStartDate 
                  ? Math.floor((new Date().getTime() - new Date(serviceFee.suspensionStartDate).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <>
                    {/* Özet Bilgiler */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Monitor className="text-blue-600" size={24} />
                              <div className="text-3xl text-blue-600">{activeDeviceCount}</div>
                            </div>
                            <div className="text-sm text-gray-600 mt-2">Aktif Cihaz</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Euro className="text-green-600" size={24} />
                              <div className="text-3xl text-green-600">{totalMonthlyFee}</div>
                            </div>
                            <div className="text-sm text-gray-600 mt-2">
                              {serviceFee.paymentType === 'monthly' ? 'Aylık' : 'Yıllık'} Toplam
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className={overdueInvoices.length > 0 ? 'border-red-300 bg-red-50' : ''}>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <AlertTriangle className={overdueInvoices.length > 0 ? 'text-red-600' : 'text-gray-400'} size={24} />
                              <div className={`text-3xl ${overdueInvoices.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {overdueInvoices.length}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mt-2">Gecikmiş Fatura</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className={serviceFee.suspensionStartDate ? 'border-orange-300 bg-orange-50' : ''}>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {serviceFee.suspensionStartDate ? (
                                <>
                                  <Ban className="text-orange-600" size={24} />
                                  <div className="text-3xl text-orange-600">{suspensionDays}</div>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="text-green-600" size={24} />
                                  <div className="text-3xl text-green-600">✓</div>
                                </>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-2">
                              {serviceFee.suspensionStartDate ? `${suspensionDays} gün donduruldu` : 'Hizmet Aktif'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Dondurma Uyarısı */}
                    {serviceFee.suspensionStartDate && suspensionDays > 0 && (
                      <Card className="border-orange-300 bg-orange-50">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="text-orange-600 mt-0.5" size={24} />
                            <div className="flex-1">
                              <h4 className="text-orange-900">⚠️ Hizmet Donduruldu</h4>
                              <p className="text-sm text-orange-800 mt-2">
                                Bu müşterinin hizmeti {suspensionDays} gündür dondurulmuş durumda.
                                {suspensionDays >= 30 && ' Maksimum dondurma süresine ulaşıldı - hizmet kapatılacak!'}
                              </p>
                              {suspensionDays < 30 && (
                                <p className="text-sm text-orange-700 mt-1">
                                  Kalan süre: {30 - suspensionDays} gün
                                </p>
                              )}
                              <p className="text-sm text-orange-700 mt-2">
                                <strong>Sebep:</strong> {serviceFee.suspensionReason || 'Ödeme gecikmes i'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Abonelik Ayarları */}
                    <Card>
                      <CardHeader>
                        <CardTitle>⚙️ Abonelik Ayarları</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label>Ödeme Şekli</Label>
                              <FilterDropdown
                                label="Ödeme Şekli"
                                options={paymentTypeOptions}
                                value={serviceFee.paymentType}
                                onChange={(value) => {
                                  setFormData({
                                    ...formData,
                                    serviceFeeSettings: {
                                      ...serviceFee,
                                      paymentType: value as 'monthly' | 'yearly'
                                    }
                                  });
                                }}
                                allLabel="Seçiniz"
                                allValue=""
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {serviceFee.paymentType === 'monthly' 
                                  ? 'Her ay fatura kesilir, cihaz sahiplenme tarihinden bağımsız tam ay ücreti alınır'
                                  : 'İlk yıl kalan ay üzerinden, sonraki yıllarda tam yıl ücreti alınır'}
                              </p>
                            </div>

                            <div>
                              <Label>Standart Ücret (Cihaz Başına/Ay)</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={serviceFee.customFeePerDevice || serviceFee.standardFeePerDevice}
                                  onChange={(e) => {
                                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                    setFormData({
                                      ...formData,
                                      serviceFeeSettings: {
                                        ...serviceFee,
                                        customFeePerDevice: !isNaN(value as number) ? value : undefined
                                      }
                                    });
                                  }}
                                  className="flex-1"
                                />
                                <span className="text-gray-600">€</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Varsayılan: {serviceFee.standardFeePerDevice} € (Müşteriye özel ücret tanımlayabilirsiniz)
                              </p>
                            </div>

                            <div>
                              <Label>Sözleşme Başlangıç Tarihi</Label>
                              <Input
                                type="date"
                                value={serviceFee.contractStartDate}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    serviceFeeSettings: {
                                      ...serviceFee,
                                      contractStartDate: e.target.value
                                    }
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Card className="bg-blue-50 border-blue-200">
                              <CardContent className="pt-6">
                                <h4 className="text-blue-900 mb-3">💡 Faturalandırma Kuralları</h4>
                                <div className="space-y-2 text-sm text-blue-800">
                                  <p>
                                    <strong>Aylık Ödeme:</strong> Cihaz hangi gün sahiplendirilirse sahiplensin, o ay için tam ücret alınır.
                                  </p>
                                  <p>
                                    <strong>Yıllık Ödeme:</strong> İlk katılımda yıl sonuna kadar kalan aylar için fatura kesilir. Sonraki yıllarda tam yıl bedeli alınır.
                                  </p>
                                  <p>
                                    <strong>Pasif Cihazlar:</strong> Pasif olarak işaretlenen cihazlar için ücret alınmaz.
                                  </p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-purple-50 border-purple-200">
                              <CardContent className="pt-6">
                                <h4 className="text-purple-900 mb-3">⏰ Ödeme Takip Sistemi</h4>
                                <div className="space-y-2 text-sm text-purple-800">
                                  <p>• <strong>7 gün önce:</strong> İlk hatırlatma (SMS + Email)</p>
                                  <p>• <strong>3 gün önce:</strong> İkinci hatırlatma</p>
                                  <p>• <strong>Son gün:</strong> Acil hatırlatma</p>
                                  <p>• <strong>15 gün geçti:</strong> Hizmet dondurma uyarısı</p>
                                  <p>• <strong>30 gün geçti:</strong> Hizmet otomatik kapatılır</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cihaz Abonelikleri */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>📱 Cihaz Abonelikleri</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Payter sayfasından otomatik yüklenen cihazlar ve ücretlendirme durumları
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50">
                              {matchedProducts.length} Payter Cihazı
                            </Badge>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Payter'dan gelen cihazları senkronize et
                                const existingDeviceIds = new Set(serviceFee.deviceSubscriptions.map(d => d.deviceId));
                                const newDevices = matchedProducts.filter(p => !existingDeviceIds.has(p.d));
                                
                                if (newDevices.length === 0) {
                                  toast.info('Tüm Payter cihazları zaten mevcut');
                                  return;
                                }
                                
                                const newSubscriptions: DeviceSubscription[] = newDevices.map(product => ({
                                  deviceId: product.id,
                                  deviceSerialNumber: product.serialNumber || '',
                                  deviceName: product.name || '',
                                  monthlyFee: serviceFee.customFeePerDevice || serviceFee.standardFeePerDevice,
                                  isActive: true,
                                  activationDate: new Date().toISOString().split('T')[0],
                                  paymentStatus: 'pending' as const
                                }));

                                setFormData({
                                  ...formData,
                                  serviceFeeSettings: {
                                    ...serviceFee,
                                    deviceSubscriptions: [...serviceFee.deviceSubscriptions, ...newSubscriptions]
                                  }
                                });
                                
                                toast.success(`${newSubscriptions.length} yeni cihaz eklendi`);
                              }}
                            >
                              <Plus size={16} className="mr-2" />
                              Yeni Cihazları Senkronize Et
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          // Payter'dan otomatik gelen cihazları göster
                          const displayDevices: DisplayDevice[] = matchedProducts.map(product => {
                            // Mevcut abonelik ayarlarını kontrol et
                            const existingSubscription = serviceFee.deviceSubscriptions.find(
                              d => d.deviceId === product.id
                            );
                            
                            // Eğer abonelik ayarı varsa onu kullan (kaydedilmiş cihaz)
                            if (existingSubscription) {
                              return existingSubscription;
                            }
                            
                            // Yoksa varsayılan değerlerle göster (yeni cihaz)
                            return {
                              deviceId: product.id,
                              deviceSerialNumber: product.serialNumber || '',
                              deviceName: product.name || '',
                              monthlyFee: serviceFee.customFeePerDevice || serviceFee.standardFeePerDevice,
                              isActive: true,
                              activationDate: new Date().toISOString().split('T')[0],
                              paymentStatus: 'pending' as const,
                              _isNew: true // Henüz kaydedilmemiş
                            };
                          });
                          
                          return displayDevices.length === 0 ? (
                            <div className="text-center py-12">
                              <Monitor className="mx-auto text-gray-400 mb-3" size={48} />
                              <p className="text-gray-600 mb-2">Payter sayfasında cihaz bulunamadı</p>
                              <p className="text-sm text-gray-500">
                                Önce Payter sekmesinden domain eşleştirmesi yapıldığından emin olun
                              </p>
                            </div>
                          ) : (
                          <>
                            {/* Cihaz Durum Bilgisi */}
                            {!formData.id ? (
                              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                                  <div>
                                    <p className="text-red-900 mb-2">
                                      <strong>Önce Müşteriyi Kaydedin!</strong>
                                    </p>
                                    <p className="text-red-700 text-sm">
                                      Cihaz abonelik ayarlarını yapabilmek için önce bu müşteriyi kaydetmelisiniz.
                                      Lütfen <strong>"Genel Bilgiler"</strong> sekmesine dönün ve <strong>"Kaydet"</strong> butonuna tıklayın.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2 text-sm">
                                  <div className="text-lg">💡</div>
                                  <div>
                                    <p className="text-blue-900 mb-1">
                                      <strong>Cihaz Durumu Yönetimi:</strong>
                                    </p>
                                    <p className="text-blue-700 text-xs mb-2">
                                      Her cihazın <strong>"Durum"</strong> sütunundaki switch ile <strong>Aktif/Pasif</strong> durumunu değiştirebilirsiniz.
                                      Pasif cihazlar gelir raporlarına ve aidat hesaplamalarına <strong>dahil edilmez</strong>.
                                    </p>
                                    {displayDevices.some((d: DisplayDevice) => d._isNew) && (
                                      <p className="text-yellow-700 text-xs bg-yellow-100 p-2 rounded border border-yellow-300">
                                        ⚠️ <strong>"Yeni"</strong> işaretli cihazların ayarlarını değiştirmek için önce <strong>"Kaydet"</strong> butonuyla kaydedin.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Toplu İşlemler Paneli */}
                            {displayDevices.some((d: DisplayDevice) => d._isNew) && (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-blue-600" size={20} />
                                    <span className="text-sm">
                                      <strong>{displayDevices.filter((d: DisplayDevice) => d._isNew).length}</strong> yeni cihaz tespit edildi
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      
                                      // Tüm yeni cihazları toplu kaydet
                                      const newDevices = displayDevices.filter((d: DisplayDevice) => d._isNew);
                                      
                                      if (newDevices.length === 0) {
                                        toast.info('Kaydedilecek yeni cihaz bulunamadı');
                                        return;
                                      }

                                      const devicesToAdd = newDevices.map((device: DisplayDevice) => ({
                                        deviceId: device.deviceId,
                                        deviceSerialNumber: device.deviceSerialNumber,
                                        deviceName: device.deviceName,
                                        monthlyFee: device.monthlyFee,
                                        isActive: device.isActive,
                                        activationDate: device.activationDate,
                                        paymentStatus: device.paymentStatus
                                      }));

                                      setFormData({
                                        ...formData,
                                        serviceFeeSettings: {
                                          ...serviceFee,
                                          deviceSubscriptions: [...serviceFee.deviceSubscriptions, ...devicesToAdd]
                                        }
                                      });

                                      toast.success(`${newDevices.length} cihaz toplu olarak kaydedildi`);
                                    }}
                                  >
                                    <CheckCircle size={16} className="mr-2" />
                                    Tüm Yeni Cihazları Kaydet ({displayDevices.filter((d: DisplayDevice) => d._isNew).length})
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                  <th className="text-left py-3 px-3">Seri No</th>
                                  <th className="text-left py-3 px-3">Cihaz Adı</th>
                                  <th className="text-left py-3 px-3">Sahiplenme</th>
                                  <th className="text-left py-3 px-3">Aylık Ücret</th>
                                  <th className="text-left py-3 px-3">
                                    <div className="flex items-center gap-1">
                                      Durum
                                      <span className="text-xs text-gray-500">(Aktif/Pasif)</span>
                                    </div>
                                  </th>
                                  <th className="text-left py-3 px-3">Ödeme</th>
                                  <th className="text-center py-3 px-3">Kayıt</th>
                                  <th className="text-center py-3 px-3">Aksiyon</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayDevices.map((device: DisplayDevice, index: number) => {
                                  const isNew = device._isNew;
                                  const deviceIndex = serviceFee.deviceSubscriptions.findIndex(d => d.deviceId === device.deviceId);
                                  
                                  return (
                                    <tr key={device.deviceId} className={`border-b border-gray-100 hover:bg-gray-50 ${isNew ? 'bg-yellow-50' : ''}`}>
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                          {device.deviceSerialNumber || '-'}
                                          {isNew && (
                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                                              Yeni
                                            </Badge>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-3">{device.deviceName || '-'}</td>
                                      <td className="py-3 px-3">
                                        {device.activationDate ? new Date(device.activationDate).toLocaleDateString('tr-TR') : '-'}
                                      </td>
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={device.monthlyFee}
                                            onChange={(e) => {
                                              if (isNew) {
                                                // Yeni cihazı kaydetmeden önce ekleyemeyiz, uyarı verelim
                                                toast.info('Önce "Kaydet" butonuyla cihazı ekleyin');
                                                return;
                                              }
                                              if (deviceIndex === -1) {
                                                toast.error('Cihaz bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
                                                return;
                                              }
                                              const updated = [...serviceFee.deviceSubscriptions];
                                              const value = e.target.value ? parseFloat(e.target.value) : 0;
                                              updated[deviceIndex].monthlyFee = !isNaN(value) ? value : 0;
                                              setFormData({
                                                ...formData,
                                                serviceFeeSettings: {
                                                  ...serviceFee,
                                                  deviceSubscriptions: updated
                                                }
                                              });
                                            }}
                                            className="w-20"
                                            disabled={isNew}
                                          />
                                          <span className="text-gray-600">€</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-3">
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={device.isActive}
                                              onCheckedChange={(checked) => {
                                                if (isNew) {
                                                  toast.info('Önce "Kaydet" butonuyla cihazı ekleyin');
                                                  return;
                                                }
                                                if (deviceIndex === -1) {
                                                  toast.error('Cihaz bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
                                                  return;
                                                }
                                                
                                                // Eğer pasif yapılıyorsa (checked=false), dondurma sebebi sor
                                                if (!checked) {
                                                  setDeviceToSuspend({
                                                    deviceId: device.deviceId,
                                                    deviceIndex: deviceIndex
                                                  });
                                                  setSuspensionDialogOpen(true);
                                                } else {
                                                  // Aktifleştiriliyorsa direkt aktif et
                                                  handleDeviceReactivation(deviceIndex);
                                                }
                                              }}
                                              disabled={isNew}
                                            />
                                            <Badge variant={device.isActive ? 'default' : 'secondary'} className={device.isActive ? 'bg-green-600' : 'bg-orange-500 text-white'}>
                                              {device.isActive ? '✓ Aktif' : '⏸ Pasif'}
                                            </Badge>
                                          </div>
                                          {!device.isActive && (
                                            <div className="flex flex-col gap-1">
                                              <span className="text-xs text-orange-600">Gelir raporlarına dahil edilmez</span>
                                              {device.suspensionReason && (
                                                <span className="text-xs text-gray-600">
                                                  🚫 Sebep: {device.suspensionReason}
                                                </span>
                                              )}
                                              {device.suspensionDate && (
                                                <span className="text-xs text-gray-500">
                                                  📅 {new Date(device.suspensionDate).toLocaleDateString('tr-TR')}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-3">
                                        <Badge
                                          variant={
                                            device.paymentStatus === 'paid' ? 'default' :
                                            device.paymentStatus === 'overdue' ? 'destructive' :
                                            device.paymentStatus === 'suspended' ? 'secondary' :
                                            'outline'
                                          }
                                        >
                                          {device.paymentStatus === 'paid' ? 'Ödendi' :
                                           device.paymentStatus === 'pending' ? 'Bekliyor' :
                                           device.paymentStatus === 'overdue' ? 'Gecikti' :
                                           device.paymentStatus === 'suspended' ? 'Donduruldu' :
                                           'İptal'}
                                        </Badge>
                                      </td>
                                      <td className="py-3 px-3 text-center">
                                        {isNew ? (
                                          <Button
                                            type="button"
                                            variant="default"
                                            size="sm"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              
                                              // Yeni cihazı abonelik listesine ekle
                                              const newDevice = {
                                                deviceId: device.deviceId,
                                                deviceSerialNumber: device.deviceSerialNumber,
                                                deviceName: device.deviceName,
                                                monthlyFee: device.monthlyFee,
                                                isActive: device.isActive,
                                                activationDate: device.activationDate,
                                                paymentStatus: device.paymentStatus
                                              };
                                              
                                              setFormData({
                                                ...formData,
                                                serviceFeeSettings: {
                                                  ...serviceFee,
                                                  deviceSubscriptions: [...serviceFee.deviceSubscriptions, newDevice]
                                                }
                                              });
                                              toast.success('Cihaz abonelik listesine eklendi');
                                            }}
                                          >
                                            <Plus size={14} className="mr-1" />
                                            Kaydet
                                          </Button>
                                        ) : (
                                          <Badge variant="outline" className="bg-green-50 text-green-700">
                                            Kayıtlı
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-center">
                                        {!isNew && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              
                                              const updated = serviceFee.deviceSubscriptions.filter(d => d.deviceId !== device.deviceId);
                                              setFormData({
                                                ...formData,
                                                serviceFeeSettings: {
                                                  ...serviceFee,
                                                  deviceSubscriptions: updated
                                                }
                                              });
                                              toast.success('Cihaz abonelikten çıkarıldı');
                                            }}
                                          >
                                            <Trash2 size={14} />
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-gray-300 bg-gray-50">
                                  <td colSpan={3} className="py-3 px-3 text-right">
                                    <div className="flex flex-col gap-1 items-end">
                                      <strong>
                                        Toplam ({displayDevices.filter((d: DisplayDevice) => d.isActive).length} aktif / {displayDevices.filter((d: DisplayDevice) => !d.isActive).length} pasif):
                                      </strong>
                                      {displayDevices.filter((d: DisplayDevice) => !d.isActive).length > 0 && (
                                        <span className="text-xs text-orange-600">
                                          Pasif cihazlar gelir hesaplamalarına dahil edilmez
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <strong className="text-green-600">
                                      {displayDevices
                                        .filter((d: DisplayDevice) => d.isActive)
                                        .reduce((sum: number, d: DisplayDevice) => {
                                          const fee = typeof d.monthlyFee === 'number' && !isNaN(d.monthlyFee) ? d.monthlyFee : 0;
                                          return sum + fee;
                                        }, 0)
                                        .toFixed(2)} €
                                    </strong>
                                  </td>
                                  <td colSpan={4}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          </>
                        );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Fatura Geçmişi */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>📄 Fatura Geçmişi</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Kesilmiş ve bekleyen faturalar
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => {
                              // Yeni fatura oluştur
                              const newInvoice: ServiceFeeInvoice = {
                                id: `INV-${Date.now()}`,
                                invoiceNumber: `FT-${new Date().getFullYear()}-${String(serviceFee.invoices.length + 1).padStart(4, '0')}`,
                                invoiceDate: new Date().toISOString().split('T')[0],
                                period: new Date().toISOString().substring(0, 7),
                                deviceCount: activeDeviceCount,
                                totalAmount: totalMonthlyFee,
                                status: 'pending',
                                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                devices: serviceFee.deviceSubscriptions.filter(d => d.isActive)
                              };

                              setFormData({
                                ...formData,
                                serviceFeeSettings: {
                                  ...serviceFee,
                                  invoices: [newInvoice, ...serviceFee.invoices]
                                }
                              });

                              toast.success(`Fatura oluşturuldu: ${newInvoice.invoiceNumber}`);
                            }}
                          >
                            <Plus size={16} className="mr-2" />
                            Yeni Fatura Oluştur
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {serviceFee.invoices.length === 0 ? (
                          <div className="text-center py-12">
                            <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                            <p className="text-gray-600 mb-2">Henüz fatura oluşturulmamış</p>
                            <p className="text-sm text-gray-500">
                              &quot;Yeni Fatura Oluştur&quot; butonuna tıklayarak ilk faturayı kesin
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {serviceFee.invoices.map((invoice) => (
                              <div
                                key={invoice.id}
                                className={`border rounded-lg p-4 ${
                                  invoice.status === 'overdue' ? 'border-red-300 bg-red-50' :
                                  invoice.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                                  'border-green-300 bg-green-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <h4>{invoice.invoiceNumber}</h4>
                                      <Badge
                                        variant={
                                          invoice.status === 'paid' ? 'default' :
                                          invoice.status === 'overdue' ? 'destructive' :
                                          'outline'
                                        }
                                      >
                                        {invoice.status === 'paid' ? 'Ödendi' :
                                         invoice.status === 'pending' ? 'Bekliyor' :
                                         'Gecikti'}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                                      <div>
                                        <span className="text-gray-600">Fatura Tarihi:</span>
                                        <p>{new Date(invoice.invoiceDate).toLocaleDateString('tr-TR')}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Dönem:</span>
                                        <p>{invoice.period}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Cihaz Sayısı:</span>
                                        <p>{invoice.deviceCount}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Tutar:</span>
                                        <p className="text-green-600">
                                          {(typeof invoice.totalAmount === 'number' && !isNaN(invoice.totalAmount) 
                                            ? invoice.totalAmount 
                                            : 0).toFixed(2)} €
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-sm">
                                      <span className="text-gray-600">Son Ödeme:</span>{' '}
                                      <span className={new Date(invoice.dueDate) < new Date() ? 'text-red-600' : ''}>
                                        {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                                      </span>
                                      {invoice.paymentDate && (
                                        <>
                                          {' • '}
                                          <span className="text-green-600">
                                            Ödendi: {new Date(invoice.paymentDate).toLocaleDateString('tr-TR')}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {invoice.status !== 'paid' && (
                                      <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                          const updated = serviceFee.invoices.map(inv =>
                                            inv.id === invoice.id
                                              ? { ...inv, status: 'paid' as const, paymentDate: new Date().toISOString().split('T')[0] }
                                              : inv
                                          );
                                          setFormData({
                                            ...formData,
                                            serviceFeeSettings: {
                                              ...serviceFee,
                                              invoices: updated
                                            }
                                          });
                                          toast.success('Fatura ödendi olarak işaretlendi');
                                        }}
                                      >
                                        <CheckCircle size={14} className="mr-1" />
                                        Ödendi
                                      </Button>
                                    )}
                                    <Button type="button" variant="outline" size="sm">
                                      <FileDown size={14} className="mr-1" />
                                      İndir
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Hatırlatıcı Geçmişi */}
                    <Card>
                      <CardHeader>
                        <CardTitle>🔔 Hatırlatıcı Geçmişi</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Gönderilen ödeme hatırlatmaları
                        </p>
                      </CardHeader>
                      <CardContent>
                        {serviceFee.reminders.length === 0 ? (
                          <div className="text-center py-12">
                            <Bell className="mx-auto text-gray-400 mb-3" size={48} />
                            <p className="text-gray-600 mb-2">Henüz hatırlatıcı gönderilmemiş</p>
                            <p className="text-sm text-gray-500">
                              Sistem otomatik olarak ödeme tarihinden önce hatırlatıcı gönderecek
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {serviceFee.reminders.map((reminder) => (
                              <div key={reminder.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-3">
                                  <Bell size={16} className={reminder.status === 'sent' ? 'text-green-600' : 'text-red-600'} />
                                  <div>
                                    <p className="text-sm">
                                      {reminder.reminderType === '7days' ? '7 Gün Önce Hatırlatma' :
                                       reminder.reminderType === '3days' ? '3 Gün Önce Hatırlatma' :
                                       'Son Gün Hatırlatma'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(reminder.sentDate).toLocaleDateString('tr-TR')} - 
                                      {reminder.channel === 'both' ? ' SMS + Email' :
                                       reminder.channel === 'email' ? ' Email' : ' SMS'}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={reminder.status === 'sent' ? 'default' : 'destructive'}>
                                  {reminder.status === 'sent' ? 'Gönderildi' : 'Başarısız'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Hizmet Dondurma/Aktifleştirme */}
                    <Card className="border-orange-300">
                      <CardHeader>
                        <CardTitle>⚡ Hizmet Yönetimi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {serviceFee.suspensionStartDate ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <Ban className="text-orange-600" size={24} />
                                <div className="flex-1">
                                  <h4 className="text-orange-900">Hizmet Donduruldu</h4>
                                  <p className="text-sm text-orange-700 mt-1">
                                    Dondurma tarihi: {new Date(serviceFee.suspensionStartDate).toLocaleDateString('tr-TR')}
                                  </p>
                                  <p className="text-sm text-orange-700">
                                    Geçen süre: {suspensionDays} gün (Maksimum: 30 gün)
                                  </p>
                                </div>
                                <Button
                                  variant="default"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      serviceFeeSettings: {
                                        ...serviceFee,
                                        suspensionStartDate: undefined,
                                        suspensionReason: undefined,
                                        isActive: true
                                      }
                                    });
                                    toast.success('Hizmet yeniden aktifleştirildi');
                                  }}
                                >
                                  <Play size={16} className="mr-2" />
                                  Hizmeti Aktifleştir
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="text-green-600" size={24} />
                                <div className="flex-1">
                                  <h4 className="text-green-900">Hizmet Aktif</h4>
                                  <p className="text-sm text-green-700 mt-1">
                                    Tüm cihazlar normal şekilde çalışıyor
                                  </p>
                                </div>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt('Dondurma sebebini girin:');
                                    if (reason) {
                                      setFormData({
                                        ...formData,
                                        serviceFeeSettings: {
                                          ...serviceFee,
                                          suspensionStartDate: new Date().toISOString().split('T')[0],
                                          suspensionReason: reason,
                                          isActive: false
                                        }
                                      });
                                      toast.warning('Hizmet donduruldu');
                                    }
                                  }}
                                >
                                  <Ban size={16} className="mr-2" />
                                  Hizmeti Dondur
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-blue-900 mb-2">📌 Dondurma Kuralları</h4>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                              <li>İlk 15 gün: Sadece hatırlatıcılar gönderilir, hizmet devam eder</li>
                              <li>15-30 gün: Hizmet dondurulur, cihazlar pasif olur</li>
                              <li>30 gün sonra: Hizmet tamamen kapatılır, cihazlar sistemden çıkarılır</li>
                              <li>Dondurma süresi içinde ödeme yapılırsa hizmet hemen aktifleşir</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          </TabsContent>

          {/* DSYM (Dijital Sözleşme Yönetim Modülü) Sekmesi */}
          <TabsContent value="dsym" className="mt-6">
            <div className="space-y-6">
              {/* Bilgilendirme Card */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <div className="text-2xl">📝</div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-purple-900">
                        <strong>Dijital Sözleşme Yönetim Sistemi (DSYM):</strong>
                      </p>
                      <div className="text-xs text-purple-800 space-y-1">
                        <p>✓ <strong>Evraklar:</strong> Müşterinin teslim etmesi gereken zorunlu evrakları takip edin</p>
                        <p>✓ <strong>Sözleşmeler:</strong> Gönderilen sözleşmeleri ve onay durumlarını izleyin</p>
                        <p>✓ Dijital onay + SMS doğrulama + Hard copy takibi yapılır</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Nested Tabs: Evraklar ve Sözleşmeler */}
              <Tabs value={dsymActiveTab} onValueChange={(value) => setDsymActiveTab(value as 'documents' | 'contracts')} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 gap-2">
                  <TabsTrigger value="documents">📁 Evraklar</TabsTrigger>
                  <TabsTrigger value="contracts">📄 Sözleşmeler</TabsTrigger>
                </TabsList>

                {/* Evraklar Sekmesi */}
                <TabsContent value="documents" className="mt-6">
                  <div className="space-y-6">
                    {!formData.id ? (
                      <Card className="border-yellow-300 bg-yellow-50">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
                            <div>
                              <p className="text-yellow-900 mb-2">
                                <strong>Önce Müşteriyi Kaydedin!</strong>
                              </p>
                              <p className="text-yellow-700 text-sm">
                                Evrak yükleyebilmek için önce bu müşteriyi kaydetmelisiniz.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Zorunlu Evraklar */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Folder size={20} className="text-red-600" />
                              Zorunlu Evraklar
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Müşterinin teslim etmesi gereken zorunlu belgeler
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Vergi Levhası */}
                              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <FileText className="text-blue-600" size={24} />
                                    <div className="flex-1">
                                      <h4 className="text-sm">Vergi Levhası</h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Müşterinin güncel vergi levhası belgesi (PDF/JPG)
                                      </p>
                                      {getDocument('vergi_levhasi') && (
                                        <p className="text-xs text-blue-600 mt-1">
                                          📎 {getDocument('vergi_levhasi').fileName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                      Zorunlu
                                    </Badge>
                                    {getDocumentStatus('vergi_levhasi') === 'approved' && (
                                      <Badge className="bg-green-100 text-green-700 border-green-300">
                                        <CheckCircle2 size={12} className="mr-1" />
                                        Onaylandı
                                      </Badge>
                                    )}
                                    {getDocumentStatus('vergi_levhasi') === 'pending' && (
                                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                        <Clock size={12} className="mr-1" />
                                        Bekliyor
                                      </Badge>
                                    )}
                                    {!getDocumentStatus('vergi_levhasi') && (
                                      <Badge variant="outline" className="bg-gray-100">
                                        Yüklenmedi
                                      </Badge>
                                    )}
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      ref={(el) => (fileInputRefs.current['vergi_levhasi'] = el)}
                                      onChange={() => handleDocumentUpload('vergi_levhasi')}
                                      className="hidden"
                                    />
                                    {getDocument('vergi_levhasi') ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleDeleteDocument(getDocument('vergi_levhasi').id)}
                                        disabled={uploadingDocument === 'vergi_levhasi'}
                                      >
                                        <Trash size={16} className="mr-2 text-red-600" />
                                        Sil
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => fileInputRefs.current['vergi_levhasi']?.click()}
                                        disabled={uploadingDocument === 'vergi_levhasi'}
                                      >
                                        {uploadingDocument === 'vergi_levhasi' ? (
                                          <>
                                            <Clock size={16} className="mr-2 animate-spin" />
                                            Yükleniyor...
                                          </>
                                        ) : (
                                          <>
                                            <Upload size={16} className="mr-2" />
                                            Yükle
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Ticaret Sicil Gazetesi */}
                              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <FileText className="text-blue-600" size={24} />
                                    <div className="flex-1">
                                      <h4 className="text-sm">Ticaret Sicil Gazetesi</h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Şirketin resmi ticaret sicil kayıt belgesi
                                      </p>
                                      {getDocument('ticaret_sicil_gazetesi') && (
                                        <p className="text-xs text-blue-600 mt-1">
                                          📎 {getDocument('ticaret_sicil_gazetesi').fileName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                      Zorunlu
                                    </Badge>
                                    {getDocumentStatus('ticaret_sicil_gazetesi') === 'approved' && (
                                      <Badge className="bg-green-100 text-green-700 border-green-300">
                                        <CheckCircle2 size={12} className="mr-1" />
                                        Onaylandı
                                      </Badge>
                                    )}
                                    {getDocumentStatus('ticaret_sicil_gazetesi') === 'pending' && (
                                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                        <Clock size={12} className="mr-1" />
                                        Bekliyor
                                      </Badge>
                                    )}
                                    {!getDocumentStatus('ticaret_sicil_gazetesi') && (
                                      <Badge variant="outline" className="bg-gray-100">
                                        Yüklenmedi
                                      </Badge>
                                    )}
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      ref={(el) => (fileInputRefs.current['ticaret_sicil_gazetesi'] = el)}
                                      onChange={() => handleDocumentUpload('ticaret_sicil_gazetesi')}
                                      className="hidden"
                                    />
                                    {getDocument('ticaret_sicil_gazetesi') ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleDeleteDocument(getDocument('ticaret_sicil_gazetesi').id)}
                                        disabled={uploadingDocument === 'ticaret_sicil_gazetesi'}
                                      >
                                        <Trash size={16} className="mr-2 text-red-600" />
                                        Sil
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => fileInputRefs.current['ticaret_sicil_gazetesi']?.click()}
                                        disabled={uploadingDocument === 'ticaret_sicil_gazetesi'}
                                      >
                                        {uploadingDocument === 'ticaret_sicil_gazetesi' ? (
                                          <>
                                            <Clock size={16} className="mr-2 animate-spin" />
                                            Yükleniyor...
                                          </>
                                        ) : (
                                          <>
                                            <Upload size={16} className="mr-2" />
                                            Yükle
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Opsiyonel Evraklar */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Folder size={20} className="text-blue-600" />
                              Opsiyonel Evraklar
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Müşterinin durumuna göre istenebilecek belgeler
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Faaliyet Belgesi */}
                              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <FileText className="text-green-600" size={24} />
                                    <div className="flex-1">
                                      <h4 className="text-sm">Faaliyet Belgesi</h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        İşletmenin faaliyet alanını belgeleyen resmi doküman
                                      </p>
                                      {getDocument('faaliyet_belgesi') && (
                                        <p className="text-xs text-blue-600 mt-1">
                                          📎 {getDocument('faaliyet_belgesi').fileName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                      Opsiyonel
                                    </Badge>
                                    {getDocumentStatus('faaliyet_belgesi') === 'approved' && (
                                      <Badge className="bg-green-100 text-green-700 border-green-300">
                                        <CheckCircle2 size={12} className="mr-1" />
                                        Onaylandı
                                      </Badge>
                                    )}
                                    {getDocumentStatus('faaliyet_belgesi') === 'pending' && (
                                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                        <Clock size={12} className="mr-1" />
                                        Bekliyor
                                      </Badge>
                                    )}
                                    {!getDocumentStatus('faaliyet_belgesi') && (
                                      <Badge variant="outline" className="bg-gray-100">
                                        Yüklenmedi
                                      </Badge>
                                    )}
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      ref={(el) => (fileInputRefs.current['faaliyet_belgesi'] = el)}
                                      onChange={() => handleDocumentUpload('faaliyet_belgesi')}
                                      className="hidden"
                                    />
                                    {getDocument('faaliyet_belgesi') ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleDeleteDocument(getDocument('faaliyet_belgesi').id)}
                                        disabled={uploadingDocument === 'faaliyet_belgesi'}
                                      >
                                        <Trash size={16} className="mr-2 text-red-600" />
                                        Sil
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => fileInputRefs.current['faaliyet_belgesi']?.click()}
                                        disabled={uploadingDocument === 'faaliyet_belgesi'}
                                      >
                                        {uploadingDocument === 'faaliyet_belgesi' ? (
                                          <>
                                            <Clock size={16} className="mr-2 animate-spin" />
                                            Yükleniyor...
                                          </>
                                        ) : (
                                          <>
                                            <Upload size={16} className="mr-2" />
                                            Yükle
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Evrak Durumu Bilgisi */}
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="pt-6">
                            <h4 className="text-blue-900 mb-3">📋 Evrak Yükleme Kuralları</h4>
                            <div className="space-y-2 text-sm text-blue-800">
                              <p>• <strong>Desteklenen formatlar:</strong> PDF, JPG, PNG (Max 5MB)</p>
                              <p>• <strong>Zorunlu evraklar:</strong> Müşteri kaydı tamamlanması için gereklidir</p>
                              <p>• <strong>Opsiyonel evraklar:</strong> İhtiyaca göre sonradan yüklenebilir</p>
                              <p>• <strong>Güncelleme:</strong> Mevcut evrakların üzerine yeni versiyon yüklenebilir</p>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Sözleşmeler Sekmesi */}
                <TabsContent value="contracts" className="mt-6">
                  <div className="space-y-6">
                    {!formData.id ? (
                      <Card className="border-yellow-300 bg-yellow-50">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
                            <div>
                              <p className="text-yellow-900 mb-2">
                                <strong>Önce Müşteriyi Kaydedin!</strong>
                              </p>
                              <p className="text-yellow-700 text-sm">
                                Sözleşme gönderebilmek için önce bu müşteriyi kaydetmelisiniz.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Yeni Sözleşme Gönder Card */}
                        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <FileSignature className="text-green-600" size={32} />
                              <div className="flex-1">
                                <h4 className="text-green-900">Yeni Sözleşme Paketi Gönder</h4>
                                <p className="text-sm text-green-700 mt-1">
                                  Müşteriye sözleşme, protokol ve aydınlatma metinlerini gönderin
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={() => setIsDSYMDialogOpen(true)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                <Plus size={18} className="mr-2" />
                                Sözleşme Gönder
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Müşteri Bilgileri Özeti */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileSignature size={16} className="text-blue-600" />
                              Müşteri Bilgileri
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Ünvan</p>
                                <p className="text-gray-900 mt-1">{formData.cariAdi || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Vergi No</p>
                                <p className="text-gray-900 mt-1">{formData.vergiNo || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Telefon</p>
                                <p className="text-gray-900 mt-1">{formData.tel || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-gray-900 mt-1">{formData.email || '-'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Sözleşme Şablonları Önizleme */}
                        <CustomerContractPreview customer={formData} />

                        {/* Gönderilen Sözleşmeler */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileText size={20} className="text-purple-600" />
                              Sözleşme Geçmişi
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Bu müşteriye gönderilen tüm sözleşmeler
                            </p>
                          </CardHeader>
                          <CardContent>
                            {/* TODO: Supabase'den veri çekilecek */}
                            <div className="text-center py-12">
                              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                              <p className="text-gray-600 mb-2">Henüz sözleşme gönderilmemiş</p>
                              <p className="text-sm text-gray-500">
                                Yukarıdaki &quot;Sözleşme Gönder&quot; butonuna tıklayarak ilk sözleşmeyi gönderin
                              </p>
                            </div>
                            
                            {/* Örnek sözleşme listesi (veri varsa gösterilecek)
                            <div className="space-y-3">
                              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <FileText size={24} className="text-blue-600" />
                                    <div>
                                      <h4 className="text-sm">Hizmet Sözleşmesi</h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Gönderim: 15.12.2024 • İşlem No: #DSYM-2024-001
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-700 border-green-300">
                                      ✓ Onaylandı
                                    </Badge>
                                    <Button size="sm" variant="outline">
                                      Detay
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            */}
                          </CardContent>
                        </Card>

                        {/* Bilgilendirme */}
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="pt-6">
                            <h4 className="text-blue-900 mb-3">📋 Sözleşme Takibi</h4>
                            <div className="space-y-2 text-sm text-blue-800">
                              <p>• <strong>Bekliyor:</strong> Müşteri henüz sözleşmeyi açmadı</p>
                              <p>• <strong>Görüntülendi:</strong> Müşteri sözleşmeyi okudu, onay bekliyor</p>
                              <p>• <strong>Onaylandı:</strong> Dijital onay + SMS doğrulama tamamlandı</p>
                              <p>• <strong>Hard Copy Bekliyor:</strong> Islak imzalı kopya bekleniyor (5 gün)</p>
                              <p>• <strong>Tamamlandı:</strong> Tüm süreç başarıyla tamamlandı</p>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions - Alt kısımda da görünür */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {/* Otomatik kayıt aktif - Uyarı kaldırıldı */}
          </div>
          <div className="flex items-center space-x-4">
            <Button type="button" variant="outline" onClick={handleCancelWithWarning}>
              <X size={18} className="mr-2" />
              İptal
            </Button>
            <Button type="submit" className="flex items-center space-x-2">
              <Save size={18} />
              <span>{isCreating ? 'Kaydet' : 'Güncelle'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cihaz Dondurma Sebebi Dialog */}
      <Dialog open={suspensionDialogOpen} onOpenChange={setSuspensionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🚫 Cihaz Pasifleştirme Sebebi</DialogTitle>
            <DialogDescription>
              Cihazı pasif hale getirmeden önce sebebini belirtin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="suspension-reason">Dondurma Sebebi *</Label>
              <FilterDropdown
                label="Dondurma Sebebi"
                options={suspensionReasonOptions}
                value={selectedSuspensionReason}
                onChange={setSelectedSuspensionReason}
                allLabel="Sebep seçin..."
                allValue=""
                className="w-full mt-2"
              />
            </div>

            <div>
              <Label htmlFor="suspension-notes">Ek Notlar (Opsiyonel)</Label>
              <Textarea
                id="suspension-notes"
                placeholder="Ek açıklama veya notlar..."
                value={suspensionNotes}
                onChange={(e) => setSuspensionNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-900">
                💡 Bu bilgiler cihaz geçmişine kaydedilecektir
              </p>
            </div>

            {/* Sebep sayısı bilgisi */}
            {suspensionReasonOptions.length === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-sm text-orange-900 mb-2">
                  ⚠️ <strong>Aktif dondurma sebebi yok!</strong>
                </p>
                <p className="text-xs text-orange-800">
                  Lütfen <strong>Tanımlar → Dondurma Sebepleri</strong> bölümünden mevcut sebepleri aktif edin veya yeni sebep ekleyin.
                </p>
              </div>
            )}
            {suspensionReasonOptions.length > 0 && suspensionReasons && suspensionReasons.length > suspensionReasonOptions.length && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-xs text-amber-900">
                  ℹ️ <strong>{suspensionReasonOptions.length} aktif</strong> sebep gösteriliyor • <strong>{suspensionReasons.length - suspensionReasonOptions.length} pasif</strong> sebep gizli
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Pasif sebepleri aktif etmek için <strong>Tanımlar → Dondurma Sebepleri</strong> sekmesine gidin.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuspensionDialogOpen(false);
                setDeviceToSuspend(null);
                setSelectedSuspensionReason('');
                setSuspensionNotes('');
              }}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeviceSuspensionConfirm}
              disabled={!selectedSuspensionReason}
            >
              <Ban size={16} className="mr-2" />
              Pasif Yap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DSYM - Sözleşme Gönderme Dialog */}
      {formData.id && (
        <SendContractDialog
          isOpen={isDSYMDialogOpen}
          onClose={() => setIsDSYMDialogOpen(false)}
          customer={{
            id: formData.id,
            unvan: formData.cariAdi,
            vergi_no: formData.vergiNo,
            vergi_dairesi: formData.vergiDairesi,
            adres: formData.adres,
            telefon: formData.tel,
            gsm: formData.tel,
            email: formData.email,
            yetkili_adi: formData.yetkili,
          }}
          onSuccess={() => {
            toast.success('Sözleşme başarıyla gönderildi!');
            setIsDSYMDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
