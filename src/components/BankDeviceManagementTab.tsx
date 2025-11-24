import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Monitor, 
  Search, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Banknote,
  CreditCard,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { BankDeviceAssignment } from './CustomerModule';
import { PayterProduct } from './PayterProductTab';

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

interface BankOrOK {
  id: string;
  kod: string;
  name: string;
  type: 'Banka' | 'PF';
  originalType?: string; // EPK/ÖK için orijinal tip bilgisi
  aciklama: string;
}

interface BankDeviceManagementTabProps {
  assignments: BankDeviceAssignment[];
  onAssignmentsChange: (assignments: BankDeviceAssignment[]) => void;
  banks: Bank[];
  epkList: EPK[];
  okList: OK[];
  payterProducts: PayterProduct[];
}

export function BankDeviceManagementTab({
  assignments = [],
  onAssignmentsChange,
  banks = [],
  epkList = [],
  okList = [],
  payterProducts = [],
}: BankDeviceManagementTabProps) {
  
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string>('');
  
  // 3 Kolonlu Seçim için state'ler
  const [bankSearch, setBankSearch] = useState('');
  const [epkSearch, setEpkSearch] = useState('');
  const [okSearch, setOkSearch] = useState('');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [selectedEPKs, setSelectedEPKs] = useState<string[]>([]);
  const [selectedOKs, setSelectedOKs] = useState<string[]>([]);

  // Bankaları, EPK ve Ödeme Kuruluşlarını birleştir (unique key için prefix ekle)
  const combinedList: BankOrOK[] = [
    ...banks.filter(b => b.aktif).map(b => ({
      id: `bank-${b.id}`,
      kod: b.kod || '',
      name: b.bankaAdi || 'İsimsiz Banka',
      type: 'Banka' as const,
      aciklama: b.aciklama || ''
    })),
    ...epkList.filter(epk => epk.aktif).map(epk => ({
      id: `ok-epk-${epk.id}`,
      kod: epk.kod || '',
      name: epk.kurumAdi || 'İsimsiz EPK',
      type: 'PF' as const,
      originalType: 'EPK',
      aciklama: epk.aciklama || ''
    })),
    ...okList.filter(ok => ok.aktif).map(ok => ({
      id: `ok-ok-${ok.id}`,
      kod: ok.kod || '',
      name: ok.kurumAdi || 'İsimsiz ÖK',
      type: 'PF' as const,
      originalType: 'ÖK',
      aciklama: ok.aciklama || ''
    }))
  ];

  // Alfabetik sırala (güvenli)
  const sortedList = combinedList.sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'tr');
  });

  // Zaten eklenmiş bankaları/PF'leri filtrele
  const availableBanks = sortedList.filter(
    item => !assignments.some(a => a.bankId === item.id)
  );

  // 3 Kolonlu seçim için filtreleme
  const aktivBankalar = banks.filter(b => b.aktif && !assignments.some(a => a.bankId === `bank-${b.id}`));
  const aktivEPKler = epkList.filter(e => e.aktif && !assignments.some(a => a.bankId === `ok-epk-${e.id}`));
  const aktivOKler = okList.filter(o => o.aktif && !assignments.some(a => a.bankId === `ok-ok-${o.id}`));

  const filteredBanks = aktivBankalar.filter(bank =>
    bank.bankaAdi?.toLowerCase().includes(bankSearch.toLowerCase()) ||
    bank.kod?.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const filteredEPKs = aktivEPKler.filter(epk =>
    epk.kurumAdi?.toLowerCase().includes(epkSearch.toLowerCase()) ||
    epk.kod?.toLowerCase().includes(epkSearch.toLowerCase())
  );

  const filteredOKs = aktivOKler.filter(ok =>
    ok.kurumAdi?.toLowerCase().includes(okSearch.toLowerCase()) ||
    ok.kod?.toLowerCase().includes(okSearch.toLowerCase())
  );

  // 3 Kolonlu seçimden kategorileri ekle
  const handleAddSelectedCategories = () => {
    const totalSelected = selectedBanks.length + selectedEPKs.length + selectedOKs.length;
    
    if (totalSelected === 0) {
      toast.error('Lütfen en az bir kategori seçin!');
      return;
    }

    const newAssignments: BankDeviceAssignment[] = [];

    // Seçili bankaları ekle
    selectedBanks.forEach(bankId => {
      const bank = banks.find(b => b.id === bankId);
      if (bank) {
        newAssignments.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          bankId: `bank-${bank.id}`,
          bankName: bank.bankaAdi,
          bankCode: bank.kod,
          deviceIds: [],
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Seçili EPK'ları ekle
    selectedEPKs.forEach(epkId => {
      const epk = epkList.find(e => e.id === epkId);
      if (epk) {
        newAssignments.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          bankId: `ok-epk-${epk.id}`,
          bankName: epk.kurumAdi,
          bankCode: epk.kod,
          deviceIds: [],
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Seçili ÖK'ları ekle
    selectedOKs.forEach(okId => {
      const ok = okList.find(o => o.id === okId);
      if (ok) {
        newAssignments.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          bankId: `ok-ok-${ok.id}`,
          bankName: ok.kurumAdi,
          bankCode: ok.kod,
          deviceIds: [],
          createdAt: new Date().toISOString(),
        });
      }
    });

    onAssignmentsChange([...assignments, ...newAssignments]);
    
    // Seçimleri sıfırla
    setSelectedBanks([]);
    setSelectedEPKs([]);
    setSelectedOKs([]);
    setBankSearch('');
    setEpkSearch('');
    setOkSearch('');
  };

  // Banka kategorisini silme
  const handleDeleteBank = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
    onAssignmentsChange(updatedAssignments);
    setDeleteConfirmId('');
    // Otomatik kayıt aktif - uyarı kaldırıldı
    // toast.success(`${assignment.bankName} kategorisi silindi!`);
  };

  // Cihaz ekleme dialog'unu aç
  const handleOpenAddDeviceDialog = (assignmentId: string) => {
    setCurrentAssignmentId(assignmentId);
    setSelectedDeviceIds([]);
    setSearchTerm('');
    setIsAddDialogOpen(true);
  };

  // Cihazları atama
  const handleAssignDevices = () => {
    if (selectedDeviceIds.length === 0) {
      toast.error('Lütfen en az bir cihaz seçin!');
      return;
    }

    const currentAssignment = assignments.find(a => a.id === currentAssignmentId);
    if (!currentAssignment) return;

    // Çakışma kontrolü - Başka banka/PF'ye atanmış cihazları bul
    const conflictingDevices: string[] = [];
    selectedDeviceIds.forEach(deviceId => {
      const existingAssignment = assignments.find(
        a => a.id !== currentAssignmentId && a.deviceIds.includes(deviceId)
      );
      if (existingAssignment) {
        conflictingDevices.push(deviceId);
      }
    });

    if (conflictingDevices.length > 0) {
      toast.error(`${conflictingDevices.length} cihaz başka bir banka/PF'ye atanmış! Önce o kategoriden kaldırmalısınız.`);
      return;
    }

    // Cihazları ekle
    const updatedAssignments = assignments.map(a => {
      if (a.id === currentAssignmentId) {
        // Duplicate kontrolü
        const newDeviceIds = selectedDeviceIds.filter(id => !a.deviceIds.includes(id));
        return {
          ...a,
          deviceIds: [...a.deviceIds, ...newDeviceIds],
        };
      }
      return a;
    });

    onAssignmentsChange(updatedAssignments);
    setIsAddDialogOpen(false);
    setCurrentAssignmentId('');
    setSelectedDeviceIds([]);
  };

  // Tek cihazı kaldırma
  const handleRemoveDevice = (assignmentId: string, deviceId: string) => {
    const updatedAssignments = assignments.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          deviceIds: a.deviceIds.filter(id => id !== deviceId),
        };
      }
      return a;
    });

    onAssignmentsChange(updatedAssignments);
    // Otomatik kayıt aktif - uyarı kaldırıldı
    toast.success('Cihaz kaldırıldı');
  };

  // Tüm cihazları kaldırma
  const handleRemoveAllDevices = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    if (assignment.deviceIds.length === 0) {
      toast.info('Kaldırılacak cihaz yok');
      return;
    }

    if (confirm(`${assignment.deviceIds.length} cihazın tümünü kaldırmak istediğinizden emin misiniz?`)) {
      const updatedAssignments = assignments.map(a => {
        if (a.id === assignmentId) {
          return { ...a, deviceIds: [] };
        }
        return a;
      });

      onAssignmentsChange(updatedAssignments);
      // Otomatik kayıt aktif - uyarı kaldırıldı
      toast.success('Tüm cihazlar kaldırıldı');
    }
  };

  // Dialog'da gösterilecek cihazları filtrele
  const getAvailableDevices = () => {
    const currentAssignment = assignments.find(a => a.id === currentAssignmentId);
    const currentDeviceIds = currentAssignment?.deviceIds || [];

    const filtered = payterProducts.filter(product => {
      if (currentDeviceIds.includes(product.id)) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.serialNumber?.toLowerCase().includes(searchLower) ||
        product.name?.toLowerCase().includes(searchLower) ||
        product.tid?.toLowerCase().includes(searchLower) ||
        (product.terminalModel && product.terminalModel.toLowerCase().includes(searchLower));

      return matchesSearch;
    });
    
    return filtered;
  };

  // Cihaz bilgisini getir
  const getDeviceInfo = (deviceId: string) => {
    return payterProducts.find(p => p.id === deviceId);
  };

  // Cihazın hangi bankaya atandığını kontrol et
  const getDeviceAssignment = (deviceId: string) => {
    return assignments.find(a => a.deviceIds.includes(deviceId));
  };

  // İstatistikler
  const totalAssignedDevices = assignments.reduce((sum, a) => sum + a.deviceIds.length, 0);
  const totalUnassignedDevices = payterProducts.length - totalAssignedDevices;

  // Checkbox değişikliği
  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  // Tümünü seç/kaldır
  const handleToggleAll = () => {
    const availableDevices = getAvailableDevices();
    if (selectedDeviceIds.length === availableDevices.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(availableDevices.map(d => d.id));
    }
  };

  // SİPAY Otomatik Eşleştirme
  const handleSipayAutoMatch = () => {
    console.log('🚀 SİPAY otomatik eşleştirme başlatılıyor...');
    
    // 70+ SİPAY domain listesi
    const sipayDomains = [
      'AKANMAR', 'ALIARI', 'ALKANN', 'ANKROTMT', 'ARESOTM', 'ARTVINOTMT',
      'ASPOWER', 'AYSGDA', 'BACKTOFIT', 'BILVEND', 'BOSOTOMATSIPAY', 'CANTINA',
      'CASTRUM', 'CDAGOTMT', 'CEMALOGLU', 'CYBORG', 'EATBOX', 'EFEVENDING',
      'ENSOTOMAT', 'FELECE', 'GENCAY', 'GITESMAK', 'GLOBALTRUST', 'GNCAIRPORTHOTEL',
      'GYMFIT', 'H2OGYM', 'HAPPYSCOFFEE', 'HKABAL', 'HUVEN', 'INTEGRAL',
      'KARADAGOTEL', 'KASREVIMARKET', 'KAYAT', 'KAYAYEMEKCILIK', 'KESKINOGLU',
      'KIRTURTRZM', 'KOCAK', 'MEGWASH', 'MEHMETETEMGURBUZ', 'METEDOGER',
      'MGMVEND', 'MIMARSINANUNI', 'MOODY', 'MQHOTELS', 'MYMADEN', 'OKYANUSFLYSPM',
      'ONGUN', 'ORERIS', 'ORSAYPTR', 'ORVEND', 'OTMEXPRESS', 'OTMT360',
      'OZDEMIR', 'OZGUOTMT', 'OZTURK', 'RIZEOTMT', 'ROBOWASH', 'SIPAYAKTIFTECH',
      'SIPAYTEST', 'SUPEROTOMAT', 'TAFEKS', 'TINTCAFE', 'TRABZONORMN', 'TURKUAZ',
      'UNIVEND', 'VENTEK', 'VITAVIEN', 'YUCELM', 'ZEUSGYM'
    ];

    // EPK004 SİPAY'ı bul
    const sipayEPK = epkList.find(epk => epk.kod === 'EPK004');
    
    if (!sipayEPK) {
      toast.error('EPK004 SİPAY tanımı bulunamadı! Lütfen önce Tanımlar > EPK listesinden EPK004 kaydını ekleyin.');
      return;
    }

    if (!sipayEPK.aktif) {
      toast.warning('EPK004 SİPAY pasif durumda! Lütfen önce Tanımlar > EPK listesinden aktif yapın.');
      return;
    }

    const sipayAssignmentId = `ok-epk-${sipayEPK.id}`;
    
    console.log('📋 SİPAY EPK bilgisi:', {
      id: sipayEPK.id,
      kod: sipayEPK.kod,
      ad: sipayEPK.kurumAdi,
      assignmentId: sipayAssignmentId
    });

    // SİPAY domain'lerine ait cihazları bul
    const matchedDevices: string[] = [];
    const matchedDomains = new Set<string>();
    const alreadyAssignedDevices: string[] = [];
    const assignedToOther: string[] = [];

    // ✅ NULL SAFETY: payterProducts boş olabilir
    (payterProducts || []).forEach(device => {
      if (!device.domain) return;

      const deviceDomain = device.domain.toUpperCase();
      
      // Domain içinde SİPAY domainlerinden biri var mı kontrol et
      const matchedSipayDomain = sipayDomains.find(sd => 
        deviceDomain.includes(sd.toUpperCase())
      );

      if (matchedSipayDomain) {
        matchedDomains.add(matchedSipayDomain);
        
        // Cihaz başka bir kategoriye atanmış mı kontrol et
        const existingAssignment = assignments.find(a => a.deviceIds.includes(device.id));
        
        if (existingAssignment) {
          if (existingAssignment.bankId === sipayAssignmentId) {
            // Zaten SİPAY kategorisinde
            alreadyAssignedDevices.push(device.id);
          } else {
            // Başka bir kategoride
            assignedToOther.push(device.serialNumber);
            console.log(`  ⚠️ ${device.serialNumber} zaten ${existingAssignment.bankName} kategorisinde`);
          }
        } else {
          // Atanmamış, eklenebilir
          matchedDevices.push(device.id);
        }
      }
    });

    console.log('📊 Eşleştirme sonuçları:', {
      toplamSipayDomain: sipayDomains.length,
      eslesen: matchedDomains.size,
      yeniCihaz: matchedDevices.length,
      zatenAtanmis: alreadyAssignedDevices.length,
      baskaBankada: assignedToOther.length
    });

    if (matchedDevices.length === 0 && alreadyAssignedDevices.length === 0) {
      toast.info('SİPAY domain\'ine ait cihaz bulunamadı! Cihazların domain bilgilerini kontrol edin.');
      return;
    }

    // EPK004 SİPAY kategorisi var mı kontrol et
    let sipayAssignment = assignments.find(a => a.bankId === sipayAssignmentId);

    if (!sipayAssignment) {
      // Kategori yoksa oluştur
      sipayAssignment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        bankId: sipayAssignmentId,
        bankName: sipayEPK.kurumAdi,
        bankCode: sipayEPK.kod,
        deviceIds: [],
        createdAt: new Date().toISOString(),
      };
      
      console.log('✅ Yeni EPK004 SİPAY kategorisi oluşturuldu');
    }

    // Yeni cihazları ekle
    if (matchedDevices.length > 0) {
      const updatedAssignments = assignments
        .filter(a => a.id !== sipayAssignment!.id)
        .concat({
          ...sipayAssignment,
          deviceIds: [...sipayAssignment.deviceIds, ...matchedDevices]
        });
      
      onAssignmentsChange(updatedAssignments);
      
      console.log(`✅ ${matchedDevices.length} cihaz EPK004 SİPAY kategorisine eklendi`);
    }

    // Sonuç mesajı
    const messageParts: string[] = [];
    messageParts.push('✅ SİPAY Otomatik Eşleştirme Tamamlandı!\n');
    messageParts.push(`📊 Sonuçlar:`);
    messageParts.push(`• ${matchedDomains.size} farklı SİPAY domain eşleşti`);
    messageParts.push(`• ${matchedDevices.length} yeni cihaz eklendi`);
    
    if (alreadyAssignedDevices.length > 0) {
      messageParts.push(`• ${alreadyAssignedDevices.length} cihaz zaten EPK004'te kayıtlı`);
    }
    
    if (assignedToOther.length > 0) {
      messageParts.push(`\n⚠️ ${assignedToOther.length} SİPAY cihazı başka kategorilerde:`);
      assignedToOther.slice(0, 3).forEach(sn => {
        messageParts.push(`  • ${sn}`);
      });
      if (assignedToOther.length > 3) {
        messageParts.push(`  ... ve ${assignedToOther.length - 3} cihaz daha`);
      }
    }

    if (matchedDomains.size > 0) {
      console.log('\n📋 Eşleşen SİPAY Domainleri:', Array.from(matchedDomains).sort().join(', '));
    }

    toast.success(messageParts.join('\n'), { duration: 8000 });
  };

  if (sortedList.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-gray-600 mb-2">Banka/PF Tanımlanmamış</h3>
          <p className="text-sm text-gray-500">
            Lütfen önce Tanımlar modülünden aktif Banka, EPK veya ÖK ekleyiniz.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (payterProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Monitor className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-gray-600 mb-2">Payter Ürünü Bulunamadı</h3>
          <p className="text-sm text-gray-500">
            Lütfen önce "Payter" sekmesinden ürün ekleyiniz veya Excel'den yükleyiniz.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header ve İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Banka/PF Kategorisi</p>
                <h3 className="text-blue-600 mt-1">{assignments.length}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Banka/PF'ye Atanmış Cihaz</p>
                <h3 className="text-green-600 mt-1">{totalAssignedDevices}</h3>
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
                <p className="text-sm text-gray-600">Atanmamış Cihaz</p>
                <h3 className="text-orange-600 mt-1">{totalUnassignedDevices}</h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <XCircle className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banka Ekleme */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>Banka/PF Kategorisi Ekle</CardTitle>
              <CardDescription>
                Firmaya ait cihazların ilişkilendirileceği Banka, EPK veya ÖK seçin
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {(selectedBanks.length > 0 || selectedEPKs.length > 0 || selectedOKs.length > 0) && (
                <>
                  <div className="flex gap-2">
                    {selectedBanks.length > 0 && (
                      <Badge variant="default" className="bg-blue-600">
                        🏦 {selectedBanks.length}
                      </Badge>
                    )}
                    {selectedEPKs.length > 0 && (
                      <Badge variant="default" className="bg-green-600">
                        EPK {selectedEPKs.length}
                      </Badge>
                    )}
                    {selectedOKs.length > 0 && (
                      <Badge variant="default" className="bg-purple-600">
                        ÖK {selectedOKs.length}
                      </Badge>
                    )}
                  </div>
                  <Button type="button" onClick={handleAddSelectedCategories}>
                    <Plus size={18} className="mr-2" />
                    Kategorileri Ekle
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 3 Kolonlu Grid */}
          <div className="grid grid-cols-3 gap-4">
            
            {/* BANKALAR */}
            <div className="space-y-3">
              <div className="pb-2 border-b-2 border-blue-500">
                <h3 className="font-semibold text-blue-900">Bankalar</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="bank-device-bank-search"
                  type="text"
                  placeholder="Banka ara..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <div className="border rounded-lg divide-y" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {filteredBanks.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    {aktivBankalar.length === 0 ? 'Tüm bankalar eklenmiş' : 'Sonuç bulunamadı'}
                  </div>
                ) : (
                  filteredBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className={`p-3 hover:bg-blue-50 transition-colors cursor-pointer ${
                        selectedBanks.includes(bank.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedBanks(prev => 
                          prev.includes(bank.id) 
                            ? prev.filter(id => id !== bank.id)
                            : [...prev, bank.id]
                        );
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`bank-${bank.id}`}
                          checked={selectedBanks.includes(bank.id)}
                          onCheckedChange={() => {
                            setSelectedBanks(prev => 
                              prev.includes(bank.id) 
                                ? prev.filter(id => id !== bank.id)
                                : [...prev, bank.id]
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm" title={bank.bankaAdi}>
                            <span className="text-xs text-gray-500">{bank.kod}</span>
                            <span className="ml-1">{bank.bankaAdi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500 text-center">
                {selectedBanks.length} seçili
              </div>
            </div>

            {/* EPK */}
            <div className="space-y-3">
              <div className="pb-2 border-b-2 border-green-500">
                <h3 className="font-semibold text-green-900">EPK</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="bank-device-epk-search"
                  type="text"
                  placeholder="EPK ara..."
                  value={epkSearch}
                  onChange={(e) => setEpkSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <div className="border rounded-lg divide-y" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {filteredEPKs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    {aktivEPKler.length === 0 ? 'Tüm EPK\'lar eklenmiş' : 'Sonuç bulunamadı'}
                  </div>
                ) : (
                  filteredEPKs.map((epk) => (
                    <div
                      key={epk.id}
                      className={`p-3 hover:bg-green-50 transition-colors cursor-pointer ${
                        selectedEPKs.includes(epk.id) ? 'bg-green-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedEPKs(prev => 
                          prev.includes(epk.id) 
                            ? prev.filter(id => id !== epk.id)
                            : [...prev, epk.id]
                        );
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`epk-${epk.id}`}
                          checked={selectedEPKs.includes(epk.id)}
                          onCheckedChange={() => {
                            setSelectedEPKs(prev => 
                              prev.includes(epk.id) 
                                ? prev.filter(id => id !== epk.id)
                                : [...prev, epk.id]
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm" title={epk.kurumAdi}>
                            <span className="text-xs text-gray-500">{epk.kod}</span>
                            <span className="ml-1">{epk.kurumAdi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500 text-center">
                {selectedEPKs.length} seçili
              </div>
            </div>

            {/* ÖK */}
            <div className="space-y-3">
              <div className="pb-2 border-b-2 border-purple-500">
                <h3 className="font-semibold text-purple-900">ÖK</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="bank-device-ok-search"
                  type="text"
                  placeholder="ÖK ara..."
                  value={okSearch}
                  onChange={(e) => setOkSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <div className="border rounded-lg divide-y" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {filteredOKs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    {aktivOKler.length === 0 ? 'Tüm ÖK\'ler eklenmiş' : 'Sonuç bulunamadı'}
                  </div>
                ) : (
                  filteredOKs.map((ok) => (
                    <div
                      key={ok.id}
                      className={`p-3 hover:bg-purple-50 transition-colors cursor-pointer ${
                        selectedOKs.includes(ok.id) ? 'bg-purple-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedOKs(prev => 
                          prev.includes(ok.id) 
                            ? prev.filter(id => id !== ok.id)
                            : [...prev, ok.id]
                        );
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`ok-${ok.id}`}
                          checked={selectedOKs.includes(ok.id)}
                          onCheckedChange={() => {
                            setSelectedOKs(prev => 
                              prev.includes(ok.id) 
                                ? prev.filter(id => id !== ok.id)
                                : [...prev, ok.id]
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm" title={ok.kurumAdi}>
                            <span className="text-xs text-gray-500">{ok.kod}</span>
                            <span className="ml-1">{ok.kurumAdi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500 text-center">
                {selectedOKs.length} seçili
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Bilgilendirme */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">💡 Nasıl Çalışır?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Yukarıdaki <strong>3 kolonlu listeden</strong> istediğiniz <strong>Banka, EPK veya ÖK</strong> kategorilerini seçin</li>
                <li>Birden fazla kategori seçebilir ve <strong>"Kategorileri Ekle"</strong> butonuna tek tıklayarak tümünü ekleyebilirsiniz</li>
                <li>Oluşturulan kategoriye <strong>"+ Cihaz Ekle"</strong> butonuyla Payter ürünlerini atayın</li>
                <li>Her cihaz <strong>sadece 1 banka/PF'ye</strong> atanabilir</li>
                <li>Cihazları istediğiniz zaman kaldırabilir veya kategoriyi silebilirsiniz</li>
                <li className="text-green-700 font-medium mt-2">
                  ✅ Bu kategoriye cihaz eklediğinizde müşteri otomatik olarak <strong>ÜİY Listesinde</strong> görünür hale gelir!
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banka Kategorileri */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Henüz banka/PF kategorisi eklenmedi</p>
            <p className="text-sm mt-2">Yukarıdaki listelerden Banka, EPK veya ÖK seçip kategori oluşturun</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const deviceCount = assignment.deviceIds.length;
            
            return (
              <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {assignment.bankName}
                          <Badge variant="outline">{assignment.bankCode}</Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Toplam {deviceCount} cihaz atanmış
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Cihaz Ekle butonuna tıklandı - Assignment ID:', assignment.id);
                          handleOpenAddDeviceDialog(assignment.id);
                        }}
                      >
                        <Plus size={16} className="mr-2" />
                        Cihaz Ekle
                      </Button>
                      {deviceCount > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAllDevices(assignment.id)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Tümünü Kaldır
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBank(assignment.id)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {deviceCount === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <Monitor className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm">Bu bankaya henüz cihaz atanmamış</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('İlk cihazı ekle butonuna tıklandı - Assignment ID:', assignment.id);
                          handleOpenAddDeviceDialog(assignment.id);
                        }}
                        className="mt-2"
                      >
                        <Plus size={14} className="mr-1" />
                        İlk cihazı ekle
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignment.deviceIds.map(deviceId => {
                        const device = getDeviceInfo(deviceId);
                        if (!device) {
                          return (
                            <div
                              key={deviceId}
                              className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <XCircle className="text-red-600" size={20} />
                                <div>
                                  <p className="text-sm text-red-600">Cihaz bulunamadı (ID: {deviceId})</p>
                                  <p className="text-xs text-red-500">Bu cihaz Payter sekmesinden silinmiş olabilir</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDevice(assignment.id, deviceId)}
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={deviceId}
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 bg-white rounded border">
                                <Monitor className="text-gray-600" size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-sm bg-white px-2 py-0.5 rounded border">
                                    {device.serialNumber}
                                  </code>
                                  <span className="text-sm truncate">{device.name}</span>
                                  {device.tid && (
                                    <Badge variant="secondary" className="text-xs" title="Terminal ID (Banka tarafından atanan)">
                                      TID: {device.tid}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                  {device.terminalModel && (
                                    <span>Model: {device.terminalModel}</span>
                                  )}
                                  {device.terminalType && (
                                    <>
                                      <span>•</span>
                                      <span>Tip: {device.terminalType}</span>
                                    </>
                                  )}
                                  {device.onlineStatus && (
                                    <>
                                      <span>•</span>
                                      <Badge
                                        variant={device.onlineStatus.toLowerCase() === 'online' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {device.onlineStatus}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDevice(assignment.id, deviceId)}
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cihaz Ekleme Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          console.log('🔔 Dialog onOpenChange:', open);
          setIsAddDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Cihaz Ekle</DialogTitle>
            <DialogDescription>
              {currentAssignmentId ? (
                <>
                  <strong>
                    {assignments.find(a => a.id === currentAssignmentId)?.bankName}
                  </strong>{' '}
                  kategorisine eklenecek cihazları seçin
                </>
              ) : (
                <span className="text-red-600">⚠️ Kategori seçilmedi</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 flex flex-col">
            {/* Arama ve Seçim */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="bank-device-product-search"
                  placeholder="Serial number, name, TID veya model ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleAll}
              >
                {selectedDeviceIds.length === getAvailableDevices().length && getAvailableDevices().length > 0
                  ? 'Tümünü Kaldır'
                  : 'Tümünü Seç'}
              </Button>
            </div>

            {/* Seçim Özeti ve Kayıt Et Butonu */}
            {selectedDeviceIds.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-green-900">
                    ✓ <strong>{selectedDeviceIds.length}</strong> cihaz seçildi
                  </p>
                  <Button type="button" onClick={handleAssignDevices}>
                    Kayıt Et
                  </Button>
                </div>
              </div>
            )}

            {/* Cihaz Listesi */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {(() => {
                const availableDevices = getAvailableDevices();
                console.log('📋 Dialog içinde gösterilecek cihaz sayısı:', availableDevices.length);
                
                if (availableDevices.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Monitor className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm">
                        {searchTerm ? 'Arama kriterine uygun cihaz bulunamadı' : 'Eklenebilecek cihaz bulunamadı'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Toplam Payter ürünü: {payterProducts?.length || 0}
                      </p>
                    </div>
                  );
                }
                
                const isAllSelected = selectedDeviceIds.length === availableDevices.length && availableDevices.length > 0;
                
                return (
                <div className="divide-y">
                  {/* Tümünü Seç - Özel satır */}
                  <div
                    className="p-4 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer border-b-2 border-blue-200 sticky top-0 z-10"
                    onClick={handleToggleAll}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleToggleAll}
                        onClick={(e) => e.stopPropagation()}
                        className="border-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-900">
                            {isAllSelected ? '✓ Tümünü Kaldr' : '☐ Tümünü Seç'}
                          </span>
                          <Badge variant="secondary" className="bg-blue-200 text-blue-900">
                            {availableDevices.length} cihaz
                          </Badge>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          {isAllSelected 
                            ? 'Tüm cihazların seçimini kaldırmak için tıklayın'
                            : 'Payter sekmesindeki tüm cihazları seçmek için tıklayın'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cihaz listesi */}
                  {availableDevices.map(device => {
                    const isSelected = selectedDeviceIds.includes(device.id);
                    const otherAssignment = getDeviceAssignment(device.id);
                    const isAssignedToOther = otherAssignment && otherAssignment.id !== currentAssignmentId;

                    return (
                      <div
                        key={device.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50' : ''
                        } ${isAssignedToOther ? 'opacity-60' : ''}`}
                        onClick={() => !isAssignedToOther && handleDeviceToggle(device.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            disabled={isAssignedToOther}
                            onCheckedChange={() => !isAssignedToOther && handleDeviceToggle(device.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                                {device.serialNumber}
                              </code>
                              <span className="text-sm truncate">{device.name}</span>
                              {device.tid && (
                                <Badge variant="secondary" className="text-xs">
                                  TID: {device.tid}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                              {device.terminalModel && <span>Model: {device.terminalModel}</span>}
                              {device.terminalType && (
                                <>
                                  <span>•</span>
                                  <span>Tip: {device.terminalType}</span>
                                </>
                              )}
                            </div>
                            {isAssignedToOther && otherAssignment && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                  ⚠️ {otherAssignment.bankName} kategorisinde kayıtlı
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId('')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Banka Kategorisini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmId && (
                <>
                  <strong>{assignments.find(a => a.id === deleteConfirmId)?.bankName}</strong> kategorisini
                  silmek istediğinizden emin misiniz?
                  {assignments.find(a => a.id === deleteConfirmId)?.deviceIds.length ? (
                    <>
                      <br />
                      <br />
                      <span className="text-orange-600">
                        ⚠️ Bu kategoride{' '}
                        <strong>{assignments.find(a => a.id === deleteConfirmId)?.deviceIds.length} cihaz</strong>{' '}
                        atanmış. Kategori silindiğinde cihaz atamaları da kaldırılacak.
                      </span>
                    </>
                  ) : null}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteBank(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
  );
}