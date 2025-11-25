import { useState } from 'react';
import { Customer } from './CustomerModule';
import { BankPF } from './BankPFModule';
import { Bank, EPK, OK, SalesRepresentative } from './DefinitionsModule';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  ToggleLeft,
  Ban,
  Globe,
  Building2,
  User,
  Tags,
  AlertTriangle,
  FileText,
  Euro,
  Calendar,
  PlayCircle,
  PauseCircle,
  DollarSign,
  Link,
  UserPlus,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { logActivity } from '../utils/activityLog';

interface BatchOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
  onApplyBatchOperation: (
    operation: BatchOperation,
    data?: BatchOperationData
  ) => Promise<BatchOperationResult>;
  bankPFRecords?: BankPF[];
  banks?: Bank[];
  epkList?: EPK[];
  okList?: OK[];
  salesReps?: SalesRepresentative[];
}

export type BatchOperation =
  | 'delete'
  | 'activate'
  | 'deactivate'
  | 'block'
  | 'unblock'
  | 'assign-domain'
  | 'assign-bankpf'
  | 'assign-bank'
  | 'assign-epk'
  | 'assign-ok'
  | 'assign-mcc'
  | 'assign-sector'
  | 'assign-salesrep'
  | 'assign-user'
  | 'assign-group'
  | 'update-service-fee'
  | 'activate-service-fee'
  | 'deactivate-service-fee'
  | 'suspend-service-fee'
  | 'resume-service-fee';

export interface BatchOperationResult {
  success: number;
  failed: number;
  errors: Array<{ customerId: string; customerName: string; error: string }>;
}

// Batch operation data types
export type BatchOperationData = 
  | { domain?: string }
  | { bankPFId?: string }
  | { bankId?: string }
  | { epkId?: string }
  | { okId?: string }
  | { mcc?: string }
  | { sektor?: string }
  | { salesRepId?: string }
  | { userId?: string }
  | { groupName?: string }
  | { feeAmount?: number; paymentType?: string }
  | undefined;

export function BatchOperationsDialog({
  isOpen,
  onClose,
  selectedCustomers,
  onApplyBatchOperation,
  bankPFRecords = [],
  banks = [],
  epkList = [],
  okList = [],
  salesReps = [],
}: BatchOperationsDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('status');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<BatchOperationResult | null>(null);

  // Form state'leri
  const [domainValue, setDomainValue] = useState('');
  const [selectedBankPFIds, setSelectedBankPFIds] = useState<string[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [selectedEPKIds, setSelectedEPKIds] = useState<string[]>([]);
  const [selectedOKIds, setSelectedOKIds] = useState<string[]>([]);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<string>('');
  const [mccValue, setMccValue] = useState('');
  const [sectorValue, setSectorValue] = useState('');
  const [assignedUser, setAssignedUser] = useState('');
  const [groupName, setGroupName] = useState('');
  
  // Dropdown states for controlled components
  const [isSalesRepDropdownOpen, setIsSalesRepDropdownOpen] = useState(false);
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] = useState(false);
  
  // Hizmet Bedeli state'leri
  const [paymentType, setPaymentType] = useState<'monthly' | 'yearly'>('monthly');
  const [standardFee, setStandardFee] = useState<number>(10);
  const [customFee, setCustomFee] = useState<string>('');
  const [contractStartDate, setContractStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [suspensionReason, setSuspensionReason] = useState<string>('');

  const handleClose = () => {
    if (!isProcessing) {
      setShowResult(false);
      setResult(null);
      setDomainValue('');
      setSelectedBankPFIds([]);
      setSelectedBankIds([]);
      setSelectedEPKIds([]);
      setSelectedOKIds([]);
      setSelectedSalesRepId('');
      setMccValue('');
      setSectorValue('');
      setAssignedUser('');
      setGroupName('');
      setPaymentType('monthly');
      setStandardFee(10);
      setCustomFee('');
      setContractStartDate(new Date().toISOString().split('T')[0]);
      setSuspensionReason('');
      setActiveTab('status');
      onClose();
    }
  };

  const executeOperation = async (operation: BatchOperation, data?: BatchOperationData) => {
    setIsProcessing(true);
    try {
      const result = await onApplyBatchOperation(operation, data);
      setResult(result);
      setShowResult(true);
      
      // Log activity
      const operationLabels: Record<BatchOperation, string> = {
        'delete': 'Toplu Silme',
        'activate': 'Toplu Aktifleştirme',
        'deactivate': 'Toplu Pasifleştirme',
        'block': 'Toplu Blokaj',
        'unblock': 'Toplu Blokaj Kaldırma',
        'assign-domain': 'Toplu Domain Atama',
        'assign-bankpf': 'Toplu Banka/PF Atama',
        'assign-bank': 'Toplu Banka Atama',
        'assign-epk': 'Toplu EPK Atama',
        'assign-ok': 'Toplu ÖK Atama',
        'assign-mcc': 'Toplu MCC Atama',
        'assign-sector': 'Toplu Sektör Atama',
        'assign-salesrep': 'Toplu Satış Temsilcisi Atama',
        'assign-user': 'Toplu Kullanıcı Atama',
        'assign-group': 'Toplu Grup Atama',
        'update-service-fee': 'Toplu Hizmet Bedeli Güncelleme',
        'activate-service-fee': 'Toplu Hizmet Bedeli Aktifleştirme',
        'deactivate-service-fee': 'Toplu Hizmet Bedeli Durdurma',
        'suspend-service-fee': 'Toplu Hizmet Bedeli Dondurma',
        'resume-service-fee': 'Toplu Hizmet Bedeli Devam Ettirme',
      };

      logActivity('UPDATE', 'Müşteri', operationLabels[operation], {
        details: `${selectedCustomers.length} müşteri üzerinde toplu işlem yapıldı`,
        metadata: {
          operation,
          customerCount: selectedCustomers.length,
          successCount: result.success,
          failedCount: result.failed,
          ...data,
        },
      });
      
      if (result.success > 0) {
        toast.success(
          `✅ ${result.success} kayıt başarıyla işlendi${
            result.failed > 0 ? `, ${result.failed} kayıt başarısız` : ''
          }`
        );
      } else {
        toast.error(`❌ Tüm kayıtlar başarısız oldu`);
      }
    } catch (error) {
      toast.error('İşlem sırasında bir hata oluştu');
      console.error('Batch operation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`⚠️ ${selectedCustomers.length} cari kaydı SİLİNECEK! Emin misiniz?`)) {
      executeOperation('delete');
    }
  };

  const handleActivate = () => {
    executeOperation('activate');
  };

  const handleDeactivate = () => {
    executeOperation('deactivate');
  };

  const handleBlock = () => {
    if (confirm(`⚠️ ${selectedCustomers.length} cari kaydı BLOKE EDİLECEK! Emin misiniz?`)) {
      executeOperation('block');
    }
  };

  const handleUnblock = () => {
    executeOperation('unblock');
  };

  const handleAssignDomain = () => {
    if (!domainValue.trim()) {
      toast.error('Lütfen domain değeri girin!');
      return;
    }
    executeOperation('assign-domain', { domain: domainValue.trim() });
  };

  const handleAssignBankPF = () => {
    if (selectedBankPFIds.length === 0) {
      toast.error('Lütfen en az bir Banka/PF seçin!');
      return;
    }
    executeOperation('assign-bankpf', { bankPFIds: selectedBankPFIds });
  };

  const handleAssignBank = () => {
    if (selectedBankIds.length === 0) {
      toast.error('Lütfen en az bir Banka seçin!');
      return;
    }
    executeOperation('assign-bank', { bankIds: selectedBankIds });
  };

  const handleAssignEPK = () => {
    if (selectedEPKIds.length === 0) {
      toast.error('Lütfen en az bir EPK seçin!');
      return;
    }
    executeOperation('assign-epk', { epkIds: selectedEPKIds });
  };

  const handleAssignOK = () => {
    if (selectedOKIds.length === 0) {
      toast.error('Lütfen en az bir ÖK seçin!');
      return;
    }
    executeOperation('assign-ok', { okIds: selectedOKIds });
  };

  const handleAssignSalesRep = () => {
    if (!selectedSalesRepId) {
      toast.error('Lütfen bir Satış Temsilcisi seçin!');
      return;
    }
    executeOperation('assign-salesrep', { salesRepId: selectedSalesRepId });
  };

  const handleAssignMCC = () => {
    if (!mccValue.trim()) {
      toast.error('Lütfen MCC kodu girin!');
      return;
    }
    executeOperation('assign-mcc', { mcc: mccValue.trim() });
  };

  const handleAssignSector = () => {
    if (!sectorValue.trim()) {
      toast.error('Lütfen sektör adı girin!');
      return;
    }
    executeOperation('assign-sector', { sector: sectorValue.trim() });
  };

  const handleAssignUser = () => {
    if (!assignedUser.trim()) {
      toast.error('Lütfen kullanıcı adı girin!');
      return;
    }
    executeOperation('assign-user', { user: assignedUser.trim() });
  };

  const handleAssignGroup = () => {
    if (!groupName.trim()) {
      toast.error('Lütfen grup adı girin!');
      return;
    }
    executeOperation('assign-group', { group: groupName.trim() });
  };

  // Hizmet Bedeli Handler'ları
  const handleUpdateServiceFee = () => {
    const serviceFeeData = {
      paymentType,
      standardFeePerDevice: standardFee,
      customFeePerDevice: customFee ? Number(customFee) : undefined,
      contractStartDate,
      isActive: true,
    };
    executeOperation('update-service-fee', serviceFeeData);
  };

  const handleActivateServiceFee = () => {
    executeOperation('activate-service-fee');
  };

  const handleDeactivateServiceFee = () => {
    if (confirm(`⚠️ ${selectedCustomers.length} cari kaydının hizmet bedeli DURDURULACAK! Emin misiniz?`)) {
      executeOperation('deactivate-service-fee');
    }
  };

  const handleSuspendServiceFee = () => {
    if (!suspensionReason.trim()) {
      toast.error('Lütfen dondurma sebebini girin!');
      return;
    }
    executeOperation('suspend-service-fee', {
      suspensionStartDate: new Date().toISOString().split('T')[0],
      suspensionReason: suspensionReason.trim(),
    });
  };

  const handleResumeServiceFee = () => {
    executeOperation('resume-service-fee');
  };

  // Multi-select toggle helper
  const toggleSelection = (id: string, selected: string[], setSelected: (ids: string[]) => void) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  if (showResult && result) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result.success > 0 && result.failed === 0 && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  İşlem Başarılı
                </>
              )}
              {result.success > 0 && result.failed > 0 && (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Kısmi Başarı
                </>
              )}
              {result.success === 0 && (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  İşlem Başarısız
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Toplu işlem tamamlandı
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {result.success}
                    </div>
                    <div className="text-sm text-green-700 mt-1">Başarılı</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {result.failed}
                    </div>
                    <div className="text-sm text-red-700 mt-1">Başarısız</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-sm text-red-900">Hatalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {result.errors.map((error, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 bg-red-50 rounded border border-red-200"
                        >
                          <div className="font-medium text-red-900">
                            {error.customerName}
                          </div>
                          <div className="text-red-700 text-xs mt-1">{error.error}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Aktif Banka/PF listesi
  const activeBankPFs = bankPFRecords.filter(bp => !bp.isDeleted);
  const activeBanks = banks.filter(b => b.aktif);
  const activeEPKs = epkList.filter(e => e.aktif);
  const activeOKs = okList.filter(o => o.aktif);
  const activeSalesReps = salesReps.filter(s => s.aktif);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-blue-600" />
            Toplu İşlemler
          </DialogTitle>
          <DialogDescription>
            {selectedCustomers.length} cari kayda toplu işlem uygula
          </DialogDescription>
        </DialogHeader>

        {/* Selected Customers Preview */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Seçili Cari Kartlar ({selectedCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-20">
              <div className="flex flex-wrap gap-2">
                {selectedCustomers.slice(0, 10).map(customer => (
                  <Badge key={customer.id} variant="secondary" className="text-xs">
                    {customer.cariAdi}
                  </Badge>
                ))}
                {selectedCustomers.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedCustomers.length - 10} daha...
                  </Badge>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Durum Yönetimi</TabsTrigger>
            <TabsTrigger value="assignment">Veri Atama</TabsTrigger>
            <TabsTrigger value="bankpf">Banka/PF Atama</TabsTrigger>
            <TabsTrigger value="service-fee">Hizmet Bedeli</TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4 mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {/* Activate/Deactivate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4 text-blue-600" />
                      Durum Değiştirme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleActivate}
                        disabled={isProcessing}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aktif Yap
                      </Button>
                      <Button
                        onClick={handleDeactivate}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <Ban className="h-4 w-4" />
                        Pasif Yap
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Block/Unblock */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Blokaj İşlemleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleBlock}
                        disabled={isProcessing}
                        variant="destructive"
                        className="w-full gap-2"
                      >
                        <Ban className="h-4 w-4" />
                        Bloke Et
                      </Button>
                      <Button
                        onClick={handleUnblock}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Blokeyi Kaldır
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Delete */}
                <Card className="border-red-300 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-red-900">
                      <AlertTriangle className="h-4 w-4" />
                      Tehlikeli Bölge
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleDelete}
                      disabled={isProcessing}
                      variant="destructive"
                      className="w-full gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Seçili Kayıtları Sil
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Assignment Tab */}
          <TabsContent value="assignment" className="space-y-4 mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {/* Domain Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      Domain Atama
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain</Label>
                      <Input
                        id="domain"
                        placeholder="örn: example.payter.com"
                        value={domainValue}
                        onChange={e => setDomainValue(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    <Button
                      onClick={handleAssignDomain}
                      disabled={isProcessing || !domainValue.trim()}
                      className="w-full"
                    >
                      Domain Ata
                    </Button>
                  </CardContent>
                </Card>

                {/* MCC Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Tags className="h-4 w-4 text-purple-600" />
                      MCC Kodu Atama
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="mcc">MCC Kodu</Label>
                      <Input
                        id="mcc"
                        placeholder="örn: 5411"
                        value={mccValue}
                        onChange={e => setMccValue(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    <Button
                      onClick={handleAssignMCC}
                      disabled={isProcessing || !mccValue.trim()}
                      className="w-full"
                    >
                      MCC Ata
                    </Button>
                  </CardContent>
                </Card>

                {/* Sector Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4 text-indigo-600" />
                      Sektör Atama
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sektör</Label>
                      <Input
                        id="sector"
                        placeholder="örn: Perakende"
                        value={sectorValue}
                        onChange={e => setSectorValue(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    <Button
                      onClick={handleAssignSector}
                      disabled={isProcessing || !sectorValue.trim()}
                      className="w-full"
                    >
                      Sektör Ata
                    </Button>
                  </CardContent>
                </Card>

                {/* Sales Rep Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-pink-600" />
                      Satış Temsilcisi Atama
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="salesrep">Satış Temsilcisi</Label>
                      <div className="relative">
                        <Input
                          id="salesrep"
                          list="salesrep-list"
                          value={activeSalesReps.find(rep => rep.id === selectedSalesRepId)?.adSoyad || ''}
                          onChange={(e) => {
                            const selectedRep = activeSalesReps.find(rep => rep.adSoyad === e.target.value);
                            if (selectedRep) {
                              setSelectedSalesRepId(selectedRep.id);
                            } else if (!e.target.value) {
                              setSelectedSalesRepId('');
                            }
                          }}
                          placeholder="Satış temsilcisi seçin veya yazın"
                          disabled={isProcessing}
                          className="bg-white"
                        />
                        <datalist id="salesrep-list">
                          {activeSalesReps.map(rep => (
                            <option key={rep.id} value={rep.adSoyad} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <Button
                      onClick={handleAssignSalesRep}
                      disabled={isProcessing || !selectedSalesRepId}
                      className="w-full"
                    >
                      Temsilci Ata
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Bank/PF Assignment Tab */}
          <TabsContent value="bankpf" className="space-y-4 mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {/* Banka/PF Atama */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-600" />
                      Banka/PF Atama (Çoklu)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Seçili cari kartlara toplu olarak Banka/Ödeme Planı atayın
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Banka/PF Seçin (Çoklu):
                    </p>
                    <ScrollArea className="h-48 border rounded-lg p-3">
                      <div className="space-y-2">
                        {activeBankPFs.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Aktif Banka/PF kaydı bulunamadı
                          </p>
                        )}
                        {activeBankPFs.map(bp => (
                          <div
                            key={bp.id}
                            className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded"
                          >
                            <Checkbox
                              id={`bp-${bp.id}`}
                              checked={selectedBankPFIds.includes(bp.id)}
                              onCheckedChange={() =>
                                toggleSelection(bp.id, selectedBankPFIds, setSelectedBankPFIds)
                              }
                              disabled={isProcessing}
                            />
                            <Label
                              htmlFor={`bp-${bp.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              <div className="font-medium">{bp.firmaUnvan}</div>
                              <div className="text-xs text-gray-500">
                                {bp.bankaOrPF === 'PF'
                                  ? `PF - ${bp.odemeKurulusuTipi || 'Belirtilmemiş'}`
                                  : `Banka - ${bp.selectedBanka || 'Belirtilmemiş'}`}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    {selectedBankPFIds.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-900">
                          <strong>{selectedBankPFIds.length}</strong> Banka/PF seçildi
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={handleAssignBankPF}
                      disabled={isProcessing || selectedBankPFIds.length === 0}
                      className="w-full gap-2"
                    >
                      <Link className="h-4 w-4" />
                      Banka/PF Ata ({selectedBankPFIds.length})
                    </Button>
                  </CardContent>
                </Card>

                {/* Banka Atama */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Banka Atama (Çoklu)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScrollArea className="h-32 border rounded-lg p-3">
                      <div className="space-y-2">
                        {activeBanks.map(bank => (
                          <div key={bank.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`bank-${bank.id}`}
                              checked={selectedBankIds.includes(bank.id)}
                              onCheckedChange={() =>
                                toggleSelection(bank.id, selectedBankIds, setSelectedBankIds)
                              }
                              disabled={isProcessing}
                            />
                            <Label
                              htmlFor={`bank-${bank.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {bank.ad}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Button
                      onClick={handleAssignBank}
                      disabled={isProcessing || selectedBankIds.length === 0}
                      className="w-full"
                    >
                      Banka Ata ({selectedBankIds.length})
                    </Button>
                  </CardContent>
                </Card>

                {/* EPK Atama */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-600" />
                      EPK Atama (Çoklu)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScrollArea className="h-32 border rounded-lg p-3">
                      <div className="space-y-2">
                        {activeEPKs.map(epk => (
                          <div key={epk.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`epk-${epk.id}`}
                              checked={selectedEPKIds.includes(epk.id)}
                              onCheckedChange={() =>
                                toggleSelection(epk.id, selectedEPKIds, setSelectedEPKIds)
                              }
                              disabled={isProcessing}
                            />
                            <Label
                              htmlFor={`epk-${epk.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {epk.kod} - {epk.kurumAdi}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Button
                      onClick={handleAssignEPK}
                      disabled={isProcessing || selectedEPKIds.length === 0}
                      className="w-full"
                    >
                      EPK Ata ({selectedEPKIds.length})
                    </Button>
                  </CardContent>
                </Card>

                {/* ÖK Atama */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4 text-orange-600" />
                      ÖK Atama (Çoklu)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScrollArea className="h-32 border rounded-lg p-3">
                      <div className="space-y-2">
                        {activeOKs.map(ok => (
                          <div key={ok.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`ok-${ok.id}`}
                              checked={selectedOKIds.includes(ok.id)}
                              onCheckedChange={() =>
                                toggleSelection(ok.id, selectedOKIds, setSelectedOKIds)
                              }
                              disabled={isProcessing}
                            />
                            <Label
                              htmlFor={`ok-${ok.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {ok.kod} - {ok.kurumAdi}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Button
                      onClick={handleAssignOK}
                      disabled={isProcessing || selectedOKIds.length === 0}
                      className="w-full"
                    >
                      ÖK Ata ({selectedOKIds.length})
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Service Fee Tab */}
          <TabsContent value="service-fee" className="space-y-4 mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {/* Activate/Deactivate Service Fee */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4 text-blue-600" />
                      Hizmet Bedeli Durumu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleActivateServiceFee}
                        disabled={isProcessing}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Aktif Yap
                      </Button>
                      <Button
                        onClick={handleDeactivateServiceFee}
                        disabled={isProcessing}
                        variant="destructive"
                        className="w-full gap-2"
                      >
                        <PauseCircle className="h-4 w-4" />
                        Durdur
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Update Service Fee */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Euro className="h-4 w-4 text-green-600" />
                      Hizmet Bedeli Güncelleme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="paymentType">Ödeme Tipi</Label>
                      <Select
                        value={paymentType}
                        onValueChange={(v: 'monthly' | 'yearly') => {
                          setPaymentType(v);
                          setIsPaymentTypeDropdownOpen(false);
                        }}
                        disabled={isProcessing}
                        open={isPaymentTypeDropdownOpen}
                        onOpenChange={setIsPaymentTypeDropdownOpen}
                      >
                        <SelectTrigger
                          onClick={() => !isProcessing && setIsPaymentTypeDropdownOpen(!isPaymentTypeDropdownOpen)}
                          className={`bg-white transition-all ${
                            !isProcessing && isPaymentTypeDropdownOpen 
                              ? 'ring-2 ring-blue-500 border-blue-500' 
                              : 'hover:border-gray-400'
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Aylık</SelectItem>
                          <SelectItem value="yearly">Yıllık</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="standardFee">Standart Ücret (€)</Label>
                        <Input
                          id="standardFee"
                          type="number"
                          value={standardFee}
                          onChange={e => setStandardFee(Number(e.target.value))}
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customFee">Özel Ücret (€)</Label>
                        <Input
                          id="customFee"
                          type="number"
                          placeholder="Opsiyonel"
                          value={customFee}
                          onChange={e => setCustomFee(e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contractStartDate">Sözleşme Başlangıç</Label>
                      <Input
                        id="contractStartDate"
                        type="date"
                        value={contractStartDate}
                        onChange={e => setContractStartDate(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>

                    <Button
                      onClick={handleUpdateServiceFee}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      Hizmet Bedeli Güncelle
                    </Button>
                  </CardContent>
                </Card>

                {/* Suspend/Resume Service Fee */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Hizmet Bedeli Dondurma
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="suspensionReason">Dondurma Sebebi</Label>
                      <Textarea
                        id="suspensionReason"
                        placeholder="Neden donduruldu?"
                        value={suspensionReason}
                        onChange={e => setSuspensionReason(e.target.value)}
                        disabled={isProcessing}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleSuspendServiceFee}
                        disabled={isProcessing || !suspensionReason.trim()}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <PauseCircle className="h-4 w-4" />
                        Dondur
                      </Button>
                      <Button
                        onClick={handleResumeServiceFee}
                        disabled={isProcessing}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Devam Ettir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            İptal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}