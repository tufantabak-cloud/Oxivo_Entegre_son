import { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
// Tooltip removed - import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileSpreadsheet, Download, Search, Trash2, CheckCircle, XCircle, AlertCircle, Monitor, Globe } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ColumnVisibilityDropdown, ColumnConfig } from './ColumnVisibilityDropdown';
import { Customer } from './CustomerModule';
import { productApi } from '../utils/supabaseClient';

export interface PayterProduct {
  id: string;
  serialNumber: string;
  name: string;
  tid: string;
  domain?: string;
  firmware?: string;
  sam1?: string;
  sam2?: string;
  sam3?: string;
  sim?: string;
  terminalType?: string;
  onlineStatus?: string;
  syncStatus?: string;
  terminalModel?: string;
  macAddress?: string;
  ptid?: string;
}

/**
 * Product-specific duplicate checker - Inline implementation
 */
function checkProductDuplicate(
  existingProducts: PayterProduct[],
  newProduct: PayterProduct
): boolean {
  // Serial Number kontrolü (case-insensitive)
  const serialExists = existingProducts.some(
    p => p.serialNumber.toLowerCase().trim() === newProduct.serialNumber.toLowerCase().trim()
  );

  if (serialExists) {
    return true;
  }

  // TID kontrolü (case-insensitive)
  const tidExists = existingProducts.some(
    p => p.tid.toLowerCase().trim() === newProduct.tid.toLowerCase().trim()
  );

  if (tidExists) {
    return true;
  }

  // Name + TID kombinasyonu kontrolü
  const nameTidExists = existingProducts.some(
    p => 
      p.name.toLowerCase().trim() === newProduct.name.toLowerCase().trim() &&
      p.tid.toLowerCase().trim() === newProduct.tid.toLowerCase().trim()
  );

  return nameTidExists;
}

interface PayterProductTabProps {
  products: PayterProduct[];
  onProductsChange: (products: PayterProduct[]) => void;
  customers?: Customer[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Excel şablon sütun isimleri (case-insensitive matching için)
const EXCEL_COLUMNS = [
  'Serial number',
  'Name',
  'TID',
  'Domain',
  'Firmware',
  'SAM 1',
  'SAM 2',
  'SAM 3',
  'SIM',
  'Terminal type',
  'Online status',
  'Sync status',
  'Terminal model',
  'MAC address',
  'PTID'
];

// Sütun konfigürasyonu
const COLUMN_CONFIGS: ColumnConfig[] = [
  { key: 'serialNumber', label: 'Serial Number', defaultVisible: true },
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'tid', label: 'TID', defaultVisible: true },
  { key: 'domain', label: 'Domain', defaultVisible: true },
  { key: 'firmware', label: 'Firmware', defaultVisible: true },
  { key: 'sam1', label: 'SAM 1', defaultVisible: false },
  { key: 'sam2', label: 'SAM 2', defaultVisible: false },
  { key: 'sam3', label: 'SAM 3', defaultVisible: false },
  { key: 'sim', label: 'SIM', defaultVisible: false },
  { key: 'terminalType', label: 'Terminal Type', defaultVisible: true },
  { key: 'onlineStatus', label: 'Online Status', defaultVisible: true },
  { key: 'syncStatus', label: 'Sync Status', defaultVisible: true },
  { key: 'terminalModel', label: 'Model', defaultVisible: true },
  { key: 'macAddress', label: 'MAC Address', defaultVisible: false },
  { key: 'ptid', label: 'PTID', defaultVisible: false },
];

export function PayterProductTab({ products, onProductsChange, customers = [] }: PayterProductTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Sayfa başına 50 ürün (performans için)
  
  // Domain değiştirme state'leri
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isDomainChangeDialogOpen, setIsDomainChangeDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>(''); // Yeni domain (manuel input)
  const [isDomainChanging, setIsDomainChanging] = useState(false);
  const [singleProductIdForDomainChange, setSingleProductIdForDomainChange] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>(''); // Mevcut domain'i göstermek için

  // Model bazlı istatistikler
  const modelStats = useMemo(() => {
    const modelMap = new Map<string, number>();
    
    products.forEach(product => {
      const model = product.terminalModel?.trim() || 'Belirtilmemiş';
      modelMap.set(model, (modelMap.get(model) || 0) + 1);
    });

    // Model sayısına göre sırala (en çoktan en aza)
    return Array.from(modelMap.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // Terminal Type bazlı istatistikler
  const terminalTypeStats = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    products.forEach(product => {
      const type = product.terminalType?.trim() || 'Belirtilmemiş';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    return Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // TID bazlı istatistikler (Banka tanımlı/tanımsız)
  const tidStats = useMemo(() => {
    // Bankaya atanmış cihazların ID'lerini topla
    const assignedDeviceIds = new Set<string>();
    
    customers.forEach(customer => {
      if (customer.bankDeviceAssignments) {
        customer.bankDeviceAssignments.forEach(assignment => {
          assignment.deviceIds.forEach(deviceId => {
            assignedDeviceIds.add(deviceId);
          });
        });
      }
    });
    
    // Bankaya atanmış cihaz sayısı
    const withTID = products.filter(p => assignedDeviceIds.has(p.id)).length;
    const withoutTID = products.length - withTID;
    
    return {
      withTID,
      withoutTID,
      total: products.length
    };
  }, [products, customers]);

  // Excel şablon indirme
  const handleDownloadTemplate = () => {
    try {
      // Şablon verisi
      const templateData = [
        {
          'Serial number': 'SN001',
          'Name': 'Terminal 1',
          'TID': 'TID001',
          'Domain': 'domain.example.com',
          'Firmware': 'v1.0.0',
          'SAM 1': 'SAM001',
          'SAM 2': 'SAM002',
          'SAM 3': '',
          'SIM': '1234567890',
          'Terminal type': 'POS',
          'Online status': 'Online',
          'Sync status': 'Synced',
          'Terminal model': 'Model A',
          'MAC address': '00:11:22:33:44:55',
          'PTID': 'PTID001'
        },
        {
          'Serial number': 'SN002',
          'Name': 'Terminal 2',
          'TID': 'TID002',
          'Domain': 'domain2.example.com',
          'Firmware': 'v1.0.1',
          'SAM 1': 'SAM003',
          'SAM 2': '',
          'SAM 3': '',
          'SIM': '0987654321',
          'Terminal type': 'mPOS',
          'Online status': 'Offline',
          'Sync status': 'Pending',
          'Terminal model': 'Model B',
          'MAC address': 'AA:BB:CC:DD:EE:FF',
          'PTID': 'PTID002'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payter Products');

      // Sütun genişliklerini ayarla
      const colWidths = EXCEL_COLUMNS.map(col => ({ wch: Math.max(col.length, 15) }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, 'payter-products-template.xlsx');
      toast.success('Excel şablonu indirildi!');
    } catch (error) {
      console.error('Şablon indirme hatası:', error);
      toast.error('Şablon indirilirken hata oluştu!');
    }
  };

  // Excel dosyası seçimi
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      setProgress(30);

      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      setProgress(50);

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setProgress(70);

      const errors: string[] = [];
      const successProducts: PayterProduct[] = [];

      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2; // Excel satır numarası (başlık hariç)

        // Tamamen boş satırları atla
        const hasAnyData = Object.values(row).some((val: any) => val !== null && val !== undefined && String(val).trim() !== '');
        if (!hasAnyData) {
          return;
        }

        try {
          const product: PayterProduct = {
            id: crypto.randomUUID(), // ✅ UUID GENERATION for Supabase compatibility
            serialNumber: String(row['Serial number'] || '').trim(),
            name: String(row['Name'] || '').trim(),
            tid: String(row['TID'] || '').trim(),
            domain: row['Domain'] ? String(row['Domain']).trim() : undefined,
            firmware: row['Firmware'] ? String(row['Firmware']).trim() : undefined,
            sam1: row['SAM 1'] ? String(row['SAM 1']).trim() : undefined,
            sam2: row['SAM 2'] ? String(row['SAM 2']).trim() : undefined,
            sam3: row['SAM 3'] ? String(row['SAM 3']).trim() : undefined,
            sim: row['SIM'] ? String(row['SIM']).trim() : undefined,
            terminalType: row['Terminal type'] ? String(row['Terminal type']).trim() : undefined,
            onlineStatus: row['Online status'] ? String(row['Online status']).trim() : undefined,
            syncStatus: row['Sync status'] ? String(row['Sync status']).trim() : undefined,
            terminalModel: row['Terminal model'] ? String(row['Terminal model']).trim() : undefined,
            macAddress: row['MAC address'] ? String(row['MAC address']).trim() : undefined,
            ptid: row['PTID'] ? String(row['PTID']).trim() : undefined,
          };

          // ✅ DATA QUALITY WARNING: Boş name veya tid varsa uyar
          const missingFields: string[] = [];
          if (!product.name || product.name.trim() === '') {
            missingFields.push('Name');
          }
          if (!product.tid || product.tid.trim() === '') {
            missingFields.push('TID');
          }
          
          if (missingFields.length > 0) {
            errors.push(`⚠️ Satır ${rowNum}: Eksik veri (${missingFields.join(', ')}) - ${product.serialNumber || 'Seri No Yok'}`);
          }

          // Ürünün zaten var olup olmadığını kontrol et
          if (checkProductDuplicate(products, product)) {
            errors.push(`Satır ${rowNum}: Ürün zaten mevcut - ${product.serialNumber}`);
          } else {
            successProducts.push(product);
          }
        } catch (error) {
          errors.push(`Satır ${rowNum}: Veri işlenirken hata - ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        }
      });

      setProgress(90);

      // Başarılı kayıtları ekle
      if (successProducts.length > 0) {
        const updatedProducts = [...products, ...successProducts];
        
        // ✅ FIX: Önce localStorage'a kaydet (senkron), sonra state'i güncelle
        // Bu sayede sayfa yenilense bile veri kaybolmaz
        try {
          localStorage.setItem('payterProducts', JSON.stringify(updatedProducts));
          console.log(`✅ ${successProducts.length} ürün localStorage'a kaydedildi`);
        } catch (error) {
          console.error('❌ localStorage kaydetme hatası:', error);
          toast.error('Ürünler kaydedilemedi! LocalStorage dolu olabilir.');
        }
        
        // Şimdi React state'ini güncelle
        onProductsChange(updatedProducts);
      }

      setProgress(100);

      const result: ImportResult = {
        success: successProducts.length,
        failed: errors.length,
        errors: errors.slice(0, 10) // İlk 10 hatayı göster
      };

      setImportResult(result);

      if (errors.length === 0) {
        toast.success(`${successProducts.length} ürün başarıyla yüklendi ve kaydedildi!`);
        setCurrentPage(1); // Yeni ürünler eklendi, ilk sayfaya git
        setTimeout(() => {
          setIsImportDialogOpen(false);
          setImportResult(null);
        }, 2000);
      } else if (successProducts.length > 0) {
        toast.warning(`${successProducts.length} ürün yüklendi ve kaydedildi, ${errors.length} hata oluştu`);
        setCurrentPage(1); // İlk sayfaya git
      } else {
        toast.error('Hiçbir ürün yüklenemedi!');
      }
    } catch (error) {
      console.error('Import hatası:', error);
      toast.error(`Dosya okunamadı!\n${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      setImportResult({
        success: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Bilinmeyen hata']
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Domain hierarchy'den tüm domain isimlerini recursive olarak çıkar
  const getAllDomainNames = useCallback((nodes: any[]): string[] => {
    if (!nodes || nodes.length === 0) return [];
    
    const names: string[] = [];
    nodes.forEach(node => {
      if (node.name) {
        names.push(node.name.toLowerCase());
      }
      if (node.children && node.children.length > 0) {
        names.push(...getAllDomainNames(node.children));
      }
    });
    return names;
  }, []);

  // Domain normalizasyon fonksiyonu
  const normalizeDomain = useCallback((domain: string | undefined): string => {
    if (!domain) return '';
    return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  }, []);

  // Domain'e göre müşteri bilgilerini bul (useMemo ile cache) - Ana Domain görmezden gelme desteği ile
  const productCustomerMap = useMemo(() => {
    const map = new Map<string, { customer: Customer; cariAdi: string; allDomains: string[] }>();
    
    customers.forEach(customer => {
      // Ana domain
      const mainDomain = customer.domain || customer.guncelMyPayterDomain;
      if (mainDomain) {
        const normalizedMainDomain = normalizeDomain(mainDomain);
        const allDomains = [normalizedMainDomain];
        
        // Domain hierarchy'deki tüm alt domain'leri ekle
        if (customer.domainHierarchy && customer.domainHierarchy.length > 0) {
          allDomains.push(...getAllDomainNames(customer.domainHierarchy));
        }
        
        // Ana domain için map'e ekle (ignoreMainDomain false ise)
        if (!customer.ignoreMainDomain) {
          map.set(normalizedMainDomain, {
            customer,
            cariAdi: customer.cariAdi.toLowerCase(),
            allDomains
          });
        }
        
        // Alt domainler için de map'e ekle
        if (customer.domainHierarchy && customer.domainHierarchy.length > 0) {
          getAllDomainNames(customer.domainHierarchy).forEach(subDomain => {
            map.set(subDomain, {
              customer,
              cariAdi: customer.cariAdi.toLowerCase(),
              allDomains
            });
          });
        }
      }
    });
    
    return map;
  }, [customers, getAllDomainNames, normalizeDomain]);

  // Unique domain listesi (Select için)
  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>();
    customers.forEach(customer => {
      const mainDomain = customer.domain || customer.guncelMyPayterDomain;
      if (mainDomain) {
        domains.add(mainDomain);
      }
      // Alt domainleri de ekle
      if (customer.domainHierarchy && customer.domainHierarchy.length > 0) {
        getAllDomainNames(customer.domainHierarchy).forEach(d => {
          // Normalize edilmiş hallerini orjinal forma çeviremeyeceğimiz için sadece mainDomain kullanıyoruz
          // Bu yeterli çünkü domain seçimi ana domainler üzerinden yapılıyor
        });
      }
    });
    return Array.from(domains).sort();
  }, [customers, getAllDomainNames]);

  // Arama filtresi (useMemo ile optimize edilmiş)
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return products.filter(product => {
      // Temel arama alanları
      const basicMatch = 
        product.serialNumber.toLowerCase().includes(searchLower) ||
        product.name.toLowerCase().includes(searchLower) ||
        product.tid.toLowerCase().includes(searchLower) ||
        (product.terminalModel && product.terminalModel.toLowerCase().includes(searchLower));
      
      if (basicMatch) return true;
      
      // Domain ile arama
      if (product.domain) {
        const productDomain = product.domain.toLowerCase();
        
        // 1. Direkt domain eşleşmesi
        if (productDomain.includes(searchLower)) {
          return true;
        }
        
        // 2. Bu domain'e sahip müşterinin cari adı ile arama
        const customerInfo = productCustomerMap.get(productDomain);
        if (customerInfo) {
          // Cari adı ile eşleşme
          if (customerInfo.cariAdi.includes(searchLower)) {
            return true;
          }
          
          // 3. Domain hierarchy'deki alt domain isimleri ile arama
          if (customerInfo.allDomains.some(domain => domain.includes(searchLower))) {
            return true;
          }
        }
      }
      
      return false;
    });
  }, [products, searchTerm, productCustomerMap]);

  // Sayfalama
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Sayfa değişince scroll'u yukarı al
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Ürün silme
  const handleDeleteProduct = (id: string) => {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      const updatedProducts = products.filter(p => p.id !== id);
      
      // ✅ FIX: Önce localStorage'a kaydet, sonra state'i güncelle
      try {
        localStorage.setItem('payterProducts', JSON.stringify(updatedProducts));
        console.log(`✅ Ürün silindi ve localStorage güncellendi`);
      } catch (error) {
        console.error('❌ localStorage kaydetme hatası:', error);
      }
      
      onProductsChange(updatedProducts);
      toast.success('Ürün silindi');
      // Eğer son sayfadaysak ve son ürünü sildiyse bir önceki sayfaya git
      if (paginatedProducts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Tüm ürünleri temizle
  const handleClearAll = () => {
    if (confirm(`${products.length} ürünün tümünü silmek istediğinizden emin misiniz?`)) {
      // ✅ FIX: Önce localStorage'a kaydet, sonra state'i güncelle
      try {
        localStorage.setItem('payterProducts', JSON.stringify([]));
        console.log(`✅ Tüm ürünler silindi ve localStorage temizlendi`);
      } catch (error) {
        console.error('❌ localStorage kaydetme hatası:', error);
      }
      
      onProductsChange([]);
      toast.success('Tüm ürünler silindi');
      setCurrentPage(1);
    }
  };

  // Sütun görünürlüğü değişikliği
  const handleVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  }, []);

  // Checkbox seçim fonksiyonları
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedProductIds(new Set(paginatedProducts.map(p => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  }, [paginatedProducts]);

  const handleSelectProduct = useCallback((productId: string, checked: boolean) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  }, []);

  // Toplu domain değiştir
  const handleBulkDomainChange = () => {
    // Seçili ürünlerden mevcut domain'i al (hepsi aynı değilse boş)
    const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
    const domains = new Set(selectedProducts.map(p => p.domain || ''));
    const sameDomain = domains.size === 1 ? Array.from(domains)[0] : '';
    
    setCurrentDomain(sameDomain);
    setSelectedDomain('');
    setSingleProductIdForDomainChange(null);
    setIsDomainChangeDialogOpen(true);
  };

  // Tekil domain değiştir
  const handleSingleDomainChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setCurrentDomain(product?.domain || '');
    setSelectedDomain('');
    setSingleProductIdForDomainChange(productId);
    setSelectedProductIds(new Set());
    setIsDomainChangeDialogOpen(true);
  };

  // Domain değiştirme işlemleri
  const handleDomainChange = () => {
    const newDomain = selectedDomain.trim();
    if (newDomain) {
      setIsDomainChanging(true);
      const updatedProducts = products.map(product => {
        if (selectedProductIds.has(product.id) || product.id === singleProductIdForDomainChange) {
          return {
            ...product,
            domain: newDomain
          };
        }
        return product;
      });

      // ✅ FIX: Önce localStorage'a kaydet, sonra state'i güncelle
      try {
        localStorage.setItem('payterProducts', JSON.stringify(updatedProducts));
        console.log(`✅ Domain değiştirildi: "${currentDomain}" → "${newDomain}"`);
      } catch (error) {
        console.error('❌ localStorage kaydetme hatası:', error);
      }
      
      onProductsChange(updatedProducts);
      
      const count = selectedProductIds.size > 0 ? selectedProductIds.size : 1;
      toast.success(`${count} ürünün domain'i "${newDomain}" olarak değiştirildi`);
      
      setIsDomainChangeDialogOpen(false);
      setIsDomainChanging(false);
      setSelectedProductIds(new Set());
      setSingleProductIdForDomainChange(null);
      setSelectedDomain('');
      setCurrentDomain('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg">Payter Ürün Yönetimi</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Terminal ve cihaz listelerini Excel ile yükleyin ve yönetin
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="flex-1 sm:flex-initial"
              >
                <Download size={14} className="mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Excel Şablon İndir</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsImportDialogOpen(true)}
                className="flex-1 sm:flex-initial"
              >
                <Upload size={14} className="mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Excel'den Yükle</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Ürün</p>
                <h3 className="text-blue-600 mt-1">{products.length}</h3>
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
                  {products.filter(p => p.onlineStatus?.toLowerCase() === 'online').length}
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
                  {products.filter(p => p.onlineStatus?.toLowerCase() === 'offline').length}
                </h3>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sync Pending</p>
                <h3 className="text-orange-600 mt-1">
                  {products.filter(p => p.syncStatus?.toLowerCase() === 'pending').length}
                </h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TID Durumu Analizi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bankaya Tanımlı Cihaz</p>
                <h3 className="text-emerald-600 mt-1">
                  {tidStats.withTID}
                  <span className="text-sm text-gray-500 ml-2">
                    ({tidStats.total > 0 ? ((tidStats.withTID / tidStats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </h3>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Banka Tanımsız Cihaz</p>
                <h3 className="text-amber-600 mt-1">
                  {tidStats.withoutTID}
                  <span className="text-sm text-gray-500 ml-2">
                    ({tidStats.total > 0 ? ((tidStats.withoutTID / tidStats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </h3>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <AlertCircle className="text-amber-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model ve Tip Dağılımı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Terminal Type Dağılımı */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Terminal Type Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {terminalTypeStats.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Terminal type bilgisi bulunamadı</p>
            ) : (
              <div className="space-y-3">
                {terminalTypeStats.map(({ type, count }) => (
                  <div key={type} className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="min-w-[120px] justify-start">
                        {type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(count / products.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums text-blue-600 min-w-[60px] text-right">
                        {count} adet
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terminal Model Dağılımı */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Terminal Model Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {modelStats.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Model bilgisi bulunamadı</p>
            ) : (
              <div className="space-y-3">
                {modelStats.map(({ model, count }) => (
                  <div key={model} className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="min-w-[120px] justify-start">
                        {model}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${(count / products.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums text-purple-600 min-w-[60px] text-right">
                        {count} adet
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Arama ve Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="payter-product-search"
                placeholder="Serial number, name, TID, model, domain, cari adı veya alt domain ile ara..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Arama değişince ilk sayfaya dön
                }}
                className="pl-10"
              />
            </div>
            <ColumnVisibilityDropdown
              columns={COLUMN_CONFIGS}
              storageKey="payterProducts"
              onVisibilityChange={handleVisibilityChange}
            />
            {selectedProductIds.size > 0 && (
              <Button variant="default" size="sm" onClick={handleBulkDomainChange}>
                <Globe size={16} className="mr-2" />
                Domain Değiştir ({selectedProductIds.size})
              </Button>
            )}
            {products.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 size={16} className="mr-2" />
                Tümünü Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ürün Listesi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Ürün Listesi
                {filteredProducts.length !== products.length && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({filteredProducts.length} / {products.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {filteredProducts.length > 0 && (
                  <>
                    Toplam {filteredProducts.length.toLocaleString('tr-TR')} ürün
                    {filteredProducts.length > itemsPerPage && (
                      <>
                        {' • '}
                        Sayfa {currentPage} / {totalPages}
                        {' • '}
                        {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} arası gösteriliyor
                      </>
                    )}
                  </>
                )}
              </CardDescription>
            </div>
            {filteredProducts.length > itemsPerPage && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Önceki
                </Button>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                  <span className="text-sm text-gray-700 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sonraki →
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileSpreadsheet size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Henüz ürün eklenmedi</p>
              <p className="text-sm mt-2">Excel şablonunu indirin ve ürünlerinizi yükleyin</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Arama sonucu bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto mobile-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProductIds.size === paginatedProducts.length && paginatedProducts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {columnVisibility['serialNumber'] !== false && <TableHead>Serial Number</TableHead>}
                    {columnVisibility['name'] !== false && <TableHead>Name</TableHead>}
                    {columnVisibility['tid'] !== false && <TableHead>TID</TableHead>}
                    {columnVisibility['domain'] !== false && <TableHead>Domain / Cari Adı</TableHead>}
                    {columnVisibility['firmware'] !== false && <TableHead>Firmware</TableHead>}
                    {columnVisibility['sam1'] !== false && <TableHead>SAM 1</TableHead>}
                    {columnVisibility['sam2'] !== false && <TableHead>SAM 2</TableHead>}
                    {columnVisibility['sam3'] !== false && <TableHead>SAM 3</TableHead>}
                    {columnVisibility['sim'] !== false && <TableHead>SIM</TableHead>}
                    {columnVisibility['terminalType'] !== false && <TableHead>Terminal Type</TableHead>}
                    {columnVisibility['onlineStatus'] !== false && <TableHead>Online Status</TableHead>}
                    {columnVisibility['syncStatus'] !== false && <TableHead>Sync Status</TableHead>}
                    {columnVisibility['terminalModel'] !== false && <TableHead>Model</TableHead>}
                    {columnVisibility['macAddress'] !== false && <TableHead>MAC Address</TableHead>}
                    {columnVisibility['ptid'] !== false && <TableHead>PTID</TableHead>}
                    <TableHead className="text-center">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProductIds.has(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                        />
                      </TableCell>
                      {columnVisibility['serialNumber'] !== false && (
                        <TableCell>
                          <span className="font-mono text-sm">{product.serialNumber}</span>
                        </TableCell>
                      )}
                      {columnVisibility['name'] !== false && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.name || <span className="text-gray-400">-</span>}
                            {(!product.name || product.name.trim() === '') && (
                              <Badge variant="destructive" className="text-xs">
                                ! Eksik veri !
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility['tid'] !== false && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{product.tid || <span className="text-gray-400">-</span>}</span>
                            {(!product.tid || product.tid.trim() === '') && (
                              <Badge variant="destructive" className="text-xs">
                                ! Eksik veri !
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility['domain'] !== false && (
                        <TableCell>
                          {product.domain ? (
                            <div className="space-y-1">
                              <span className="text-sm block">{product.domain}</span>
                              {(() => {
                                const normalizedProductDomain = normalizeDomain(product.domain);
                                const customerInfo = productCustomerMap.get(normalizedProductDomain);
                                if (customerInfo) {
                                  return (
                                    <Badge variant="outline" className="text-xs">
                                      {customerInfo.customer.cariAdi}
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      )}
                      {columnVisibility['firmware'] !== false && (
                        <TableCell>
                          {product.firmware ? (
                            <span className="text-sm text-gray-600">{product.firmware}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      )}
                      {columnVisibility['sam1'] !== false && (
                        <TableCell>
                          <span className="text-sm">{product.sam1 || '-'}</span>
                        </TableCell>
                      )}
                      {columnVisibility['sam2'] !== false && (
                        <TableCell>
                          <span className="text-sm">{product.sam2 || '-'}</span>
                        </TableCell>
                      )}
                      {columnVisibility['sam3'] !== false && (
                        <TableCell>
                          <span className="text-sm">{product.sam3 || '-'}</span>
                        </TableCell>
                      )}
                      {columnVisibility['sim'] !== false && (
                        <TableCell>
                          <span className="text-sm">{product.sim || '-'}</span>
                        </TableCell>
                      )}
                      {columnVisibility['terminalType'] !== false && (
                        <TableCell>
                          {product.terminalType ? (
                            <Badge variant="outline">{product.terminalType}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      )}
                      {columnVisibility['onlineStatus'] !== false && (
                        <TableCell>
                          {product.onlineStatus ? (
                            <Badge
                              variant={
                                product.onlineStatus.toLowerCase() === 'online'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {product.onlineStatus}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      )}
                      {columnVisibility['syncStatus'] !== false && (
                        <TableCell>
                          {product.syncStatus ? (
                            <Badge
                              variant={
                                product.syncStatus.toLowerCase() === 'synced'
                                  ? 'default'
                                  : product.syncStatus.toLowerCase() === 'pending'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {product.syncStatus}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      )}
                      {columnVisibility['terminalModel'] !== false && (
                        <TableCell>{product.terminalModel || '-'}</TableCell>
                      )}
                      {columnVisibility['macAddress'] !== false && (
                        <TableCell>
                          <span className="font-mono text-sm">{product.macAddress || '-'}</span>
                        </TableCell>
                      )}
                      {columnVisibility['ptid'] !== false && (
                        <TableCell>
                          <span className="text-sm">{product.ptid || '-'}</span>
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSingleDomainChange(product.id)}
                            title="Domain Değiştir"
                          >
                            <Globe size={16} className="text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination - Her zaman göster (1 sayfadan fazlaysa detaylı, yoksa sadece bilgi) */}
          {filteredProducts.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {filteredProducts.length > itemsPerPage ? (
                  <>
                    Toplam <span className="font-semibold text-blue-600">{filteredProducts.length.toLocaleString('tr-TR')}</span> ürün
                    {' • '}
                    Sayfa <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
                    <span className="ml-2 text-gray-500">
                      ({(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length).toLocaleString('tr-TR')} arası gösteriliyor)
                    </span>
                  </>
                ) : (
                  <>
                    Toplam <span className="font-semibold text-blue-600">{filteredProducts.length.toLocaleString('tr-TR')}</span> ürün gösteriliyor
                  </>
                )}
              </div>
              {filteredProducts.length > itemsPerPage && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    title="İlk sayfaya git"
                  >
                    ⏮ İlk
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Önceki
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      // Akıllı sayfa numarası gösterimi (7 sayfa göster)
                      let pageNum: number;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sonraki →
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Son sayfaya git"
                  >
                    Son ⏭
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Excel'den Ürün Yükle</DialogTitle>
            <DialogDescription>
              Excel dosyanızı seçin ve ürünleri sisteme yükleyin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Dosya Seçimi */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="excel-upload"
                className={`cursor-pointer ${isProcessing ? 'opacity-50' : ''}`}
              >
                <FileSpreadsheet size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Excel dosyası seçmek için tıklayın
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  .xlsx veya .xls formatında olmalı
                </p>
              </label>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-gray-600 text-center">
                  İşleniyor... %{progress}
                </p>
              </div>
            )}

            {/* Sonuçlar */}
            {importResult && (
              <div className="space-y-3">
                {importResult.success > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ {importResult.success} ürün başarıyla yüklendi
                    </AlertDescription>
                  </Alert>
                )}

                {importResult.failed > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div>
                        <p className="mb-2">❌ {importResult.failed} satırda hata oluştu:</p>
                        <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                          {importResult.errors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Bilgilendirme */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📋 Excel Format Bilgisi:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li>• Zorunlu alanlar: Serial number, Name, TID</li>
                <li>• İsteğe bağlı alanlar: DOMAIN 1-5, Firmware, SAM 1-3, SIM, vb.</li>
                <li>• Şablon dosyasını kullanmanızı öneririz</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Değiştirme Dialog */}
      <Dialog open={isDomainChangeDialogOpen} onOpenChange={setIsDomainChangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Domain Değiştirme</DialogTitle>
            <DialogDescription>
              {singleProductIdForDomainChange 
                ? `"${products.find(p => p.id === singleProductIdForDomainChange)?.name}" ürününün domain'ini değiştirin`
                : `${selectedProductIds.size} ürünün domain'ini değiştirin`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mevcut Domain (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="current-domain">Mevcut Domain</Label>
              <Input
                id="current-domain"
                type="text"
                value={currentDomain || 'Boş'}
                disabled
                className="bg-gray-50 text-gray-600"
              />
            </div>

            {/* Yeni Domain (Manuel Input) */}
            <div className="space-y-2">
              <Label htmlFor="new-domain">Yeni Domain</Label>
              <Input
                id="new-domain"
                type="text"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                placeholder="Yeni domain girin..."
                disabled={isDomainChanging}
              />
            </div>

            {isDomainChanging && (
              <Progress value={100} className="w-full" />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDomainChangeDialogOpen(false)}
              disabled={isDomainChanging}
            >
              İptal
            </Button>
            <Button
              variant="default"
              onClick={handleDomainChange}
              disabled={isDomainChanging || !selectedDomain.trim()}
            >
              {isDomainChanging ? 'Değiştiriliyor...' : 'Değiştir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}