import React, { useState, useMemo } from 'react';
import { Customer, ServiceFeeSettings, PriceChangeHistory } from './CustomerModule';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  History, 
  DollarSign, 
  Calendar, 
  Percent, 
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';

interface PriceListTabProps {
  customers: Customer[];
  onUpdateCustomer: (customer: Customer) => void;
}

interface PriceUpdateForm {
  customerId: string;
  newPrice: number;
  changeReason: string;
  effectiveDate: string;
  notes: string;
  updatePaymentType: boolean;
  newPaymentType?: 'monthly' | 'yearly';
}

interface BulkPriceUpdate {
  updateType: 'percentage' | 'fixed';
  percentage?: number;
  fixedAmount?: number;
  changeReason: string;
  effectiveDate: string;
  notes: string;
  applyToAll: boolean;
  selectedCustomerIds: string[];
}

export const PriceListTab = React.memo(function PriceListTab({ 
  customers, 
  onUpdateCustomer 
}: PriceListTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPriceUpdateDialog, setShowPriceUpdateDialog] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  
  const [priceUpdateForm, setPriceUpdateForm] = useState<PriceUpdateForm>({
    customerId: '',
    newPrice: 0,
    changeReason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: '',
    updatePaymentType: false,
    newPaymentType: undefined
  });

  const [bulkUpdateForm, setBulkUpdateForm] = useState<BulkPriceUpdate>({
    updateType: 'percentage',
    percentage: 0,
    fixedAmount: 0,
    changeReason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: '',
    applyToAll: false,
    selectedCustomerIds: []
  });
  
  // Dropdown states for controlled components
  const [isChangeReasonDropdownOpen, setIsChangeReasonDropdownOpen] = useState(false);
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] = useState(false);
  const [isBulkUpdateTypeDropdownOpen, setIsBulkUpdateTypeDropdownOpen] = useState(false);

  // Müşteri fiyat verilerini hazırla
  const customerPriceData = useMemo(() => {
    return customers
      .filter(customer => customer.serviceFeeSettings)
      .map(customer => {
        const settings = customer.serviceFeeSettings!;
        const currentPrice = settings.customFeePerDevice ?? settings.standardFeePerDevice;
        const lastChange = settings.priceHistory && settings.priceHistory.length > 0
          ? settings.priceHistory[settings.priceHistory.length - 1]
          : null;

        return {
          customer,
          settings,
          currentPrice,
          lastChange,
          changeCount: settings.priceHistory?.length ?? 0
        };
      })
      .filter(data => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          data.customer.cariAdi.toLowerCase().includes(term) ||
          data.customer.cariHesapKodu.toLowerCase().includes(term)
        );
      });
  }, [customers, searchTerm]);

  // İstatistikler
  const stats = useMemo(() => {
    const totalCustomers = customerPriceData.length;
    const avgPrice = totalCustomers > 0
      ? customerPriceData.reduce((sum, d) => sum + d.currentPrice, 0) / totalCustomers
      : 0;
    
    const monthlyCustomers = customerPriceData.filter(d => d.settings.paymentType === 'monthly').length;
    const yearlyCustomers = customerPriceData.filter(d => d.settings.paymentType === 'yearly').length;
    
    const customPriceCustomers = customerPriceData.filter(d => d.settings.customFeePerDevice !== undefined).length;
    const standardPriceCustomers = totalCustomers - customPriceCustomers;

    const recentChanges = customerPriceData.filter(d => {
      if (!d.lastChange) return false;
      const changeDate = new Date(d.lastChange.changeDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return changeDate >= thirtyDaysAgo;
    }).length;

    return {
      totalCustomers,
      avgPrice,
      monthlyCustomers,
      yearlyCustomers,
      customPriceCustomers,
      standardPriceCustomers,
      recentChanges
    };
  }, [customerPriceData]);

  // Tekil fiyat güncelleme
  const handleOpenPriceUpdate = (customer: Customer) => {
    const settings = customer.serviceFeeSettings!;
    const currentPrice = settings.customFeePerDevice ?? settings.standardFeePerDevice;
    
    setSelectedCustomer(customer);
    setPriceUpdateForm({
      customerId: customer.id,
      newPrice: currentPrice,
      changeReason: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: '',
      updatePaymentType: false,
      newPaymentType: settings.paymentType
    });
    setShowPriceUpdateDialog(true);
  };

  // Fiyat güncellemeyi kaydet
  const handleSavePriceUpdate = () => {
    if (!selectedCustomer || !priceUpdateForm.changeReason) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    const settings = selectedCustomer.serviceFeeSettings!;
    const oldPrice = settings.customFeePerDevice ?? settings.standardFeePerDevice;
    const oldPaymentType = settings.paymentType;

    // Fiyat değişikliği kaydı oluştur
    const changeRecord: PriceChangeHistory = {
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      changeDate: new Date().toISOString(),
      oldPrice,
      newPrice: priceUpdateForm.newPrice,
      changeType: 'manual',
      changeReason: priceUpdateForm.changeReason,
      effectiveDate: priceUpdateForm.effectiveDate,
      notes: priceUpdateForm.notes,
      increasePercentage: ((priceUpdateForm.newPrice - oldPrice) / oldPrice) * 100,
      oldPaymentType,
      newPaymentType: priceUpdateForm.updatePaymentType ? priceUpdateForm.newPaymentType : oldPaymentType
    };

    // Güncelleme
    const updatedSettings: ServiceFeeSettings = {
      ...settings,
      customFeePerDevice: priceUpdateForm.newPrice,
      paymentType: priceUpdateForm.updatePaymentType && priceUpdateForm.newPaymentType 
        ? priceUpdateForm.newPaymentType 
        : settings.paymentType,
      priceHistory: [...(settings.priceHistory || []), changeRecord]
    };

    const updatedCustomer: Customer = {
      ...selectedCustomer,
      serviceFeeSettings: updatedSettings
    };

    onUpdateCustomer(updatedCustomer);
    toast.success(`${selectedCustomer.cariAdi} için fiyat güncellendi`);
    setShowPriceUpdateDialog(false);
    setSelectedCustomer(null);
  };

  // Toplu fiyat güncelleme
  const handleOpenBulkUpdate = () => {
    setBulkUpdateForm({
      updateType: 'percentage',
      percentage: 0,
      fixedAmount: 0,
      changeReason: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: '',
      applyToAll: selectedCustomerIds.size === 0,
      selectedCustomerIds: Array.from(selectedCustomerIds)
    });
    setShowBulkUpdateDialog(true);
  };

  // Toplu güncellemeyi uygula
  const handleApplyBulkUpdate = () => {
    if (!bulkUpdateForm.changeReason) {
      toast.error('Lütfen değişiklik sebebini girin');
      return;
    }

    const targetCustomers = bulkUpdateForm.applyToAll
      ? customerPriceData
      : customerPriceData.filter(d => selectedCustomerIds.has(d.customer.id));

    if (targetCustomers.length === 0) {
      toast.error('Lütfen en az bir müşteri seçin');
      return;
    }

    let updatedCount = 0;

    targetCustomers.forEach(data => {
      const settings = data.settings;
      const oldPrice = settings.customFeePerDevice ?? settings.standardFeePerDevice;
      
      let newPrice: number;
      if (bulkUpdateForm.updateType === 'percentage') {
        newPrice = oldPrice * (1 + (bulkUpdateForm.percentage || 0) / 100);
      } else {
        newPrice = oldPrice + (bulkUpdateForm.fixedAmount || 0);
      }

      newPrice = Math.round(newPrice * 100) / 100; // 2 ondalık basamak

      const changeRecord: PriceChangeHistory = {
        id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        changeDate: new Date().toISOString(),
        oldPrice,
        newPrice,
        changeType: 'bulk',
        changeReason: bulkUpdateForm.changeReason,
        effectiveDate: bulkUpdateForm.effectiveDate,
        notes: bulkUpdateForm.notes,
        increasePercentage: ((newPrice - oldPrice) / oldPrice) * 100
      };

      const updatedSettings: ServiceFeeSettings = {
        ...settings,
        customFeePerDevice: newPrice,
        priceHistory: [...(settings.priceHistory || []), changeRecord]
      };

      const updatedCustomer: Customer = {
        ...data.customer,
        serviceFeeSettings: updatedSettings
      };

      onUpdateCustomer(updatedCustomer);
      updatedCount++;
    });

    toast.success(`${updatedCount} müşteri için fiyat güncellendi`);
    setShowBulkUpdateDialog(false);
    setSelectedCustomerIds(new Set());
  };

  // Geçmiş göster
  const handleShowHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryDialog(true);
  };

  // Checkbox toggle
  const handleToggleCustomer = (customerId: string) => {
    const newSet = new Set(selectedCustomerIds);
    if (newSet.has(customerId)) {
      newSet.delete(customerId);
    } else {
      newSet.add(customerId);
    }
    setSelectedCustomerIds(newSet);
  };

  // Tümünü seç/kaldır
  const handleToggleAll = () => {
    if (selectedCustomerIds.size === customerPriceData.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(customerPriceData.map(d => d.customer.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Toplam Müşteri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              <span className="text-2xl">{stats.totalCustomers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Ortalama Fiyat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="text-green-600" size={20} />
              <span className="text-2xl">€{stats.avgPrice.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Ödeme Tipleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Aylık:</span>
                <Badge variant="outline">{stats.monthlyCustomers}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Yıllık:</span>
                <Badge variant="outline">{stats.yearlyCustomers}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Son 30 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-orange-600" size={20} />
              <span className="text-2xl">{stats.recentChanges}</span>
              <span className="text-sm text-gray-600">değişiklik</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Araç Çubuğu */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Müşteri ara (ad, kod)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {selectedCustomerIds.size > 0 && (
                <Badge variant="secondary">
                  {selectedCustomerIds.size} müşteri seçili
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenBulkUpdate}
                disabled={!bulkUpdateForm.applyToAll && selectedCustomerIds.size === 0}
              >
                <Percent size={16} className="mr-2" />
                Toplu Güncelle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiyat Listesi Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.size === customerPriceData.length && customerPriceData.length > 0}
                      onChange={handleToggleAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Müşteri Kodu</TableHead>
                  <TableHead>Müşteri Adı</TableHead>
                  <TableHead>Ödeme Tipi</TableHead>
                  <TableHead>Güncel Fiyat</TableHead>
                  <TableHead>Fiyat Tipi</TableHead>
                  <TableHead>Son Değişiklik</TableHead>
                  <TableHead>Değişim</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPriceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      Hizmet bedeli tanımlı müşteri bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  customerPriceData.map((data) => {
                    const priceChange = data.lastChange
                      ? data.lastChange.newPrice - data.lastChange.oldPrice
                      : 0;
                    const priceChangePercent = data.lastChange && data.lastChange.increasePercentage
                      ? data.lastChange.increasePercentage
                      : 0;

                    return (
                      <TableRow key={data.customer.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCustomerIds.has(data.customer.id)}
                            onChange={() => handleToggleCustomer(data.customer.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <span className={data.customer.durum === 'Pasif' ? 'line-through text-gray-500' : ''}>
                            {data.customer.cariHesapKodu}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={data.customer.durum === 'Pasif' ? 'line-through text-gray-500' : ''}>
                            {data.customer.cariAdi}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={data.settings.paymentType === 'monthly' ? 'default' : 'secondary'}>
                            {data.settings.paymentType === 'monthly' ? 'Aylık' : 'Yıllık'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">€{data.currentPrice.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          {data.settings.customFeePerDevice !== undefined ? (
                            <Badge variant="outline">Özel</Badge>
                          ) : (
                            <Badge variant="secondary">Standart</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {data.lastChange ? (
                            <span className="text-sm text-gray-600">
                              {new Date(data.lastChange.changeDate).toLocaleDateString('tr-TR')}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {data.lastChange ? (
                            <div className="flex items-center gap-1">
                              {priceChange > 0 ? (
                                <ArrowUpCircle size={16} className="text-green-600" />
                              ) : priceChange < 0 ? (
                                <ArrowDownCircle size={16} className="text-red-600" />
                              ) : null}
                              <span className={`text-sm ${priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPriceUpdate(data.customer)}
                            >
                              <Edit size={14} className="mr-1" />
                              Düzenle
                            </Button>
                            {data.changeCount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowHistory(data.customer)}
                              >
                                <History size={14} className="mr-1" />
                                Geçmiş ({data.changeCount})
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tekil Fiyat Güncelleme Dialog */}
      <Dialog open={showPriceUpdateDialog} onOpenChange={setShowPriceUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fiyat Güncelle</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.cariAdi} için fiyat güncelleme
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mevcut Fiyat</Label>
                <Input
                  value={`€${(selectedCustomer?.serviceFeeSettings?.customFeePerDevice ?? selectedCustomer?.serviceFeeSettings?.standardFeePerDevice ?? 0).toFixed(2)}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Yeni Fiyat *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceUpdateForm.newPrice}
                  onChange={(e) => setPriceUpdateForm({ ...priceUpdateForm, newPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Değişiklik Sebebi *</Label>
              <Select
                value={priceUpdateForm.changeReason}
                onValueChange={(value) => {
                  setPriceUpdateForm({ ...priceUpdateForm, changeReason: value });
                  setIsChangeReasonDropdownOpen(false);
                }}
                open={isChangeReasonDropdownOpen}
                onOpenChange={setIsChangeReasonDropdownOpen}
              >
                <SelectTrigger
                  onClick={() => setIsChangeReasonDropdownOpen(!isChangeReasonDropdownOpen)}
                  className={`bg-white transition-all ${
                    isChangeReasonDropdownOpen 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : 'hover:border-gray-400'
                  }`}
                >
                  <SelectValue placeholder="Sebep seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-increase">Fiyat Artışı</SelectItem>
                  <SelectItem value="contract-renewal">Sözleşme Yenileme</SelectItem>
                  <SelectItem value="service-upgrade">Hizmet Yükseltme</SelectItem>
                  <SelectItem value="market-adjustment">Piyasa Uyumu</SelectItem>
                  <SelectItem value="special-discount">Özel İndirim</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Geçerlilik Tarihi</Label>
              <Input
                type="date"
                value={priceUpdateForm.effectiveDate}
                onChange={(e) => setPriceUpdateForm({ ...priceUpdateForm, effectiveDate: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={priceUpdateForm.updatePaymentType}
                onCheckedChange={(checked) => setPriceUpdateForm({ ...priceUpdateForm, updatePaymentType: checked })}
              />
              <Label>Ödeme tipini de güncelle</Label>
            </div>

            {priceUpdateForm.updatePaymentType && (
              <div>
                <Label>Yeni Ödeme Tipi</Label>
                <Select
                  value={priceUpdateForm.newPaymentType}
                  onValueChange={(value: 'monthly' | 'yearly') => {
                    setPriceUpdateForm({ ...priceUpdateForm, newPaymentType: value });
                    setIsPaymentTypeDropdownOpen(false);
                  }}
                  open={isPaymentTypeDropdownOpen}
                  onOpenChange={setIsPaymentTypeDropdownOpen}
                >
                  <SelectTrigger
                    onClick={() => setIsPaymentTypeDropdownOpen(!isPaymentTypeDropdownOpen)}
                    className={`bg-white transition-all ${
                      isPaymentTypeDropdownOpen 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <SelectValue placeholder="Ödeme tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Aylık</SelectItem>
                    <SelectItem value="yearly">Yıllık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Notlar</Label>
              <Textarea
                value={priceUpdateForm.notes}
                onChange={(e) => setPriceUpdateForm({ ...priceUpdateForm, notes: e.target.value })}
                placeholder="Ek açıklamalar..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceUpdateDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSavePriceUpdate}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toplu Fiyat Güncelleme Dialog */}
      <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Toplu Fiyat Güncelleme</DialogTitle>
            <DialogDescription>
              {bulkUpdateForm.applyToAll 
                ? `Tüm müşteriler (${customerPriceData.length})` 
                : `Seçili müşteriler (${selectedCustomerIds.size})`
              } için fiyat güncelleme
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={bulkUpdateForm.applyToAll}
                onCheckedChange={(checked) => setBulkUpdateForm({ ...bulkUpdateForm, applyToAll: checked })}
              />
              <Label>Tüm müşterilere uygula</Label>
            </div>

            <div>
              <Label>Güncelleme Tipi</Label>
              <Select
                value={bulkUpdateForm.updateType}
                onValueChange={(value: 'percentage' | 'fixed') => {
                  setBulkUpdateForm({ ...bulkUpdateForm, updateType: value });
                  setIsBulkUpdateTypeDropdownOpen(false);
                }}
                open={isBulkUpdateTypeDropdownOpen}
                onOpenChange={setIsBulkUpdateTypeDropdownOpen}
              >
                <SelectTrigger
                  onClick={() => setIsBulkUpdateTypeDropdownOpen(!isBulkUpdateTypeDropdownOpen)}
                  className={`bg-white transition-all ${
                    isBulkUpdateTypeDropdownOpen 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : 'hover:border-gray-400'
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yüzde Artışı</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar Artışı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkUpdateForm.updateType === 'percentage' ? (
              <div>
                <Label>Artış Yüzdesi (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={bulkUpdateForm.percentage}
                  onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="Örn: 10 (€10 → €11)"
                />
              </div>
            ) : (
              <div>
                <Label>Artış Tutarı (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={bulkUpdateForm.fixedAmount}
                  onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, fixedAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="Örn: 2.50"
                />
              </div>
            )}

            <div>
              <Label>Değişiklik Sebebi *</Label>
              <Input
                value={bulkUpdateForm.changeReason}
                onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, changeReason: e.target.value })}
                placeholder="Örn: Yıllık fiyat artışı"
              />
            </div>

            <div>
              <Label>Geçerlilik Tarihi</Label>
              <Input
                type="date"
                value={bulkUpdateForm.effectiveDate}
                onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, effectiveDate: e.target.value })}
              />
            </div>

            <div>
              <Label>Notlar</Label>
              <Textarea
                value={bulkUpdateForm.notes}
                onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, notes: e.target.value })}
                placeholder="Ek açıklamalar..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpdateDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleApplyBulkUpdate}>
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fiyat Geçmişi Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiyat Değişiklik Geçmişi</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.cariAdi} - {selectedCustomer?.cariHesapKodu}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedCustomer?.serviceFeeSettings?.priceHistory && selectedCustomer.serviceFeeSettings.priceHistory.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Eski Fiyat</TableHead>
                      <TableHead>Yeni Fiyat</TableHead>
                      <TableHead>Değişim</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Sebep</TableHead>
                      <TableHead>Geçerlilik</TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...selectedCustomer.serviceFeeSettings.priceHistory]
                      .reverse()
                      .map((change) => {
                        const priceChange = change.newPrice - change.oldPrice;
                        const percentChange = change.increasePercentage || 0;

                        return (
                          <TableRow key={change.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {new Date(change.changeDate).toLocaleDateString('tr-TR')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(change.changeDate).toLocaleTimeString('tr-TR')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>€{change.oldPrice.toFixed(2)}</TableCell>
                            <TableCell>€{change.newPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {priceChange > 0 ? (
                                  <ArrowUpCircle size={16} className="text-green-600" />
                                ) : priceChange < 0 ? (
                                  <ArrowDownCircle size={16} className="text-red-600" />
                                ) : null}
                                <span className={`text-sm ${priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}€
                                  <br />
                                  ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {change.changeType === 'manual' ? 'Manuel' : 
                                 change.changeType === 'bulk' ? 'Toplu' : 'Otomatik'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{change.changeReason}</span>
                            </TableCell>
                            <TableCell>
                              {change.effectiveDate ? (
                                <span className="text-sm">
                                  {new Date(change.effectiveDate).toLocaleDateString('tr-TR')}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {change.notes ? (
                                <span className="text-sm text-gray-600">{change.notes}</span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Henüz fiyat değişikliği kaydı bulunmuyor
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});