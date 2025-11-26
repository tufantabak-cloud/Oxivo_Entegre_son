import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BankPF, bankaPFListesi, okListesi, epkListesi } from './BankPFModule';
import { BankPFCategorySelector } from './BankPFCategorySelector';
import { ContactMatrix } from './ContactMatrix';
import { DocumentManagement } from './DocumentManagement';
import { FirmaTabelaTab } from './FirmaTabelaTab';
import { FirmaBankalarTab } from './FirmaBankalarTab';
import { HakedisTab } from './HakedisTab';
import { ArrowLeft, Save, Trash2, X, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface BankPFDetailProps {
  record: BankPF | null;
  onSave: (record: BankPF) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  isCreating?: boolean;
  gorevListesi?: string[];
  gelirModelleri?: Array<{ id: string; ad: string; aktif: boolean }>;
  ekGelirler?: Array<{ id: string; gelirTuru: string; aktif: boolean }>;
  hesapKalemleri?: Array<{ 
    id: string; 
    kod: string; 
    adi: string; 
    aciklama: string;
    aktif: boolean;
  }>;
  banks?: Array<{ id: string; kod: string; bankaAdi: string; aciklama: string; aktif: boolean }>;
  epkList?: Array<{ id: string; kod: string; kurumAdi: string; aktif: boolean }>;
  okList?: Array<{ id: string; kod: string; kurumAdi: string; aktif: boolean }>;
  kartProgramlar?: Array<{ id: string; kartAdi: string; aktif: boolean }>;
}

export function BankPFDetail({
  record,
  onSave,
  onCancel,
  onDelete,
  isCreating = false,
  gorevListesi = [],
  banks = [],
  epkList = [],
  okList = [],
  kartProgramlar = [],
  gelirModelleri = [],
  ekGelirler = [],
  hesapKalemleri = [],
}: BankPFDetailProps) {
  const [formData, setFormData] = useState<BankPF>(
    record || {
      id: '',
      firmaUnvan: '',
      muhasebeKodu: '',
      bankaOrPF: 'Banka',
      bankaPFAd: '',
      odemeKurulusuTipi: '',
      odemeKurulusuAd: '',
      vergiDairesi: '',
      vergiNo: '',
      adres: '',
      telefon: '',
      email: '',
      iletisimMatrisi: [],
      dokumanlar: [],
      isbirlikleri: [],
      tabelaRecords: [],
      agreementBanks: [],
      tabelaGroups: [],
      linkedBankIds: [],
      linkedEPKIds: [],
      linkedOKIds: [],
      // ✅ EPK ve ÖK No alanları
      epkNo: '',
      okNo: '',
      durum: 'Aktif',
    }
  );
  
  // Otomatik kayıt için state ve ref'ler
  const [originalData, setOriginalData] = useState<BankPF | null>(record);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  
  // Dropdown states for controlled components
  const [isDurumDropdownOpen, setIsDurumDropdownOpen] = useState(false);
  const [isBankaOrPFDropdownOpen, setIsBankaOrPFDropdownOpen] = useState(false);
  const [isBankaPFAdDropdownOpen, setIsBankaPFAdDropdownOpen] = useState(false);
  const [isOdemeKurulusuTipiDropdownOpen, setIsOdemeKurulusuTipiDropdownOpen] = useState(false);
  const [isOdemeKurulusuAdDropdownOpen, setIsOdemeKurulusuAdDropdownOpen] = useState(false);
  
  // Düzenleme modu state'i
  const [isEditing, setIsEditing] = useState(isCreating);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  
  // FormData değişikliklerini izle ve otomatik kaydet
  useEffect(() => {
    if (!originalData || isCreating || !formData.id) {
      return; // İlk yükleme veya yeni kayıt oluşturma modunda otomatik kayıt yapma
    }

    // FormData ile orijinal data'yı karşılaştır
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

    // Eğer değişiklik varsa ve kayıt işlemi devam etmiyorsa, otomatik kaydet
    if (hasChanges) {
      // Önceki timeout varsa iptal et
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // 1.5 saniye sonra otomatik kaydet (debounce)
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        onSave(formData);
        setOriginalData(formData);
        console.log('✅ BankPF otomatik kayıt yapıldı:', new Date().toLocaleTimeString('tr-TR'));
      }, 1500);
    }

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, originalData, isCreating, onSave]);
  
  // Record değiştiğinde originalData'yı güncelle
  useEffect(() => {
    if (record) {
      setFormData(record);
      setOriginalData(record);
    }
  }, [record?.id]);
  


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = () => {
    onSave(formData);
    setIsEditing(false);
    setShowSaveConfirm(false);
  };

  const handleChange = <K extends keyof BankPF>(field: K, value: BankPF[K]) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCancelEdit = () => {
    if (isCreating) {
      onCancel();
    } else {
      setFormData(record!);
      setIsEditing(false);
    }
  };

  // Get appropriate list based on ÖK/EPK selection
  const getOdemeKurulusuListesi = () => {
    if (formData.odemeKurulusuTipi === 'ÖK') return okListesi;
    if (formData.odemeKurulusuTipi === 'EPK') return epkListesi;
    return [];
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <Button variant="outline" onClick={onCancel} size="icon" className="flex-shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg truncate">
              {isCreating ? 'Yeni Banka/PF' : `${formData.muhasebeKodu}`}
            </h2>
            {!isCreating && (
              <p className="text-xs sm:text-sm text-gray-600 truncate">{formData.firmaUnvan}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {!isCreating && !isEditing && (
            <Button 
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1 sm:space-x-2 flex-1 sm:flex-none text-sm"
            >
              <span className="hidden sm:inline">Güncelleme</span>
              <span className="sm:hidden">Güncelle</span>
            </Button>
          )}
          {!isCreating && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex-1 sm:flex-none">
                  <Trash2 size={16} />
                  <span>Sil</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kaydı Sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

      {/* Otomatik Kayıt Bilgilendirmesi */}
      {!isCreating && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <div className="text-2xl">✨</div>
              <div className="flex-1">
                <p className="text-sm text-green-900">
                  <strong>Otomatik Kayıt Aktif:</strong> Bu sayfada yaptığınız tüm değişiklikler otomatik olarak kaydedilir (1.5 saniye sonra).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="onizleme" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="onizleme" className="text-xs sm:text-sm">🔍 <span className="hidden sm:inline">Ön İzleme</span><span className="sm:hidden">Özet</span></TabsTrigger>
          <TabsTrigger value="kategoriler" className="text-xs sm:text-sm">🏦 <span className="hidden sm:inline">Kategoriler</span><span className="sm:hidden">Kat.</span></TabsTrigger>
          <TabsTrigger value="isbirligi" className="text-xs sm:text-sm"><span className="hidden sm:inline">İş Birliği</span><span className="sm:hidden">İşbir.</span></TabsTrigger>
          <TabsTrigger value="hakedis" className="text-xs sm:text-sm">Hakediş</TabsTrigger>
          <TabsTrigger value="tabela" className="text-xs sm:text-sm">TABELA</TabsTrigger>
          <TabsTrigger value="bankalar" className="text-xs sm:text-sm">Bankalar</TabsTrigger>
          <TabsTrigger value="bilgiler" className="text-xs sm:text-sm"><span className="hidden sm:inline">Cari Bilgileri</span><span className="sm:hidden">Bilgiler</span></TabsTrigger>
          <TabsTrigger value="iletisim" className="text-xs sm:text-sm"><span className="hidden sm:inline">İletişim Matrisi</span><span className="sm:hidden">İletişim</span></TabsTrigger>
          <TabsTrigger value="dokumanlar" className="text-xs sm:text-sm"><span className="hidden sm:inline">Doküman Yönetimi</span><span className="sm:hidden">Döküman</span></TabsTrigger>
          <TabsTrigger value="uiy" className="text-xs sm:text-sm">ÜİY</TabsTrigger>
        </TabsList>

        {/* Ön İzleme Tab */}
        <TabsContent value="onizleme">
          <div className="space-y-6">
            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">
                      {(formData.isbirlikleri || []).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">İşbirliği</div>
                    <Badge variant={(formData.isbirlikleri || []).length > 0 ? "default" : "secondary"} className="mt-1 sm:mt-2 text-xs">
                      {(formData.isbirlikleri || []).length > 0 ? 'Var' : 'Yok'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">
                      {(formData.tabelaRecords || []).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">TABELA</div>
                    <Badge variant={(formData.tabelaRecords || []).length > 0 ? "default" : "secondary"} className="mt-1 sm:mt-2 text-xs">
                      {(formData.tabelaRecords || []).length > 0 ? 'Var' : 'Yok'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">
                      {(formData.agreementBanks || []).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Anlaşmalı Banka</div>
                    <Badge variant={(formData.agreementBanks || []).length > 0 ? "default" : "secondary"} className="mt-1 sm:mt-2 text-xs">
                      {(formData.agreementBanks || []).length > 0 ? 'Var' : 'Yok'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">
                      {(formData.iletisimMatrisi || []).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">İletişim</div>
                    <Badge variant={(formData.iletisimMatrisi || []).length > 0 ? "default" : "secondary"} className="mt-1 sm:mt-2 text-xs">
                      {(formData.iletisimMatrisi || []).length > 0 ? 'Var' : 'Yok'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Temel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Temel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Firma Ünvanı</p>
                      <p className="text-lg">{formData.firmaUnvan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Muhasebe Kodu</p>
                      <p>{formData.muhasebeKodu || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tip</p>
                      <Badge>{formData.bankaOrPF}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Durum</p>
                      <Badge variant={formData.durum === 'Aktif' ? 'default' : 'secondary'}>
                        {formData.durum}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Vergi Dairesi</p>
                      <p>{formData.vergiDairesi || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vergi No</p>
                      <p>{formData.vergiNo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefon</p>
                      <p>{formData.telefon || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">E-posta</p>
                      <p>{formData.email || '-'}</p>
                    </div>
                  </div>
                </div>
                {formData.adres && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">Adres</p>
                    <p className="text-sm">{formData.adres}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* İşbirliği Özeti */}
            <Card>
              <CardHeader>
                <CardTitle>🤝 İşbirliği Kartları</CardTitle>
              </CardHeader>
              <CardContent>
                {!formData.isbirlikleri || formData.isbirlikleri.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>Henüz işbirliği kaydı bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.isbirlikleri.map((isbirligi) => (
                      <div 
                        key={isbirligi.id} 
                        className="border border-gray-200 rounded-lg p-4 bg-blue-50/30 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                #{isbirligi.siraNo}
                              </Badge>
                              <span className="text-sm">
                                {new Date(isbirligi.baslangicTarihi).toLocaleDateString('tr-TR')}
                                {isbirligi.bitisTarihi && ` - ${new Date(isbirligi.bitisTarihi).toLocaleDateString('tr-TR')}`}
                              </span>
                              <Badge variant={isbirligi.durum === 'Aktif' ? 'default' : 'secondary'}>
                                {isbirligi.durum}
                              </Badge>
                            </div>
                            {(isbirligi.gelirModeli || isbirligi.hesapKalemiKod) && (
                              <div className="flex gap-4 text-sm text-gray-600">
                                {isbirligi.gelirModeli && (
                                  <span>📊 {isbirligi.gelirModeli}</span>
                                )}
                                {isbirligi.hesapKalemiKod && (
                                  <span>💼 Kod: {isbirligi.hesapKalemiKod}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TABELA Özeti */}
            <Card>
              <CardHeader>
                <CardTitle>📊 TABELA Kayıtları</CardTitle>
              </CardHeader>
              <CardContent>
                {!formData.tabelaRecords || formData.tabelaRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>Henüz TABELA kaydı bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.tabelaRecords.map((tabela) => (
                      <div 
                        key={tabela.id} 
                        className={`border rounded-lg p-4 transition-colors ${
                          tabela.kapanmaTarihi 
                            ? 'border-gray-300 bg-gray-50/50' 
                            : 'border-orange-200 bg-orange-50/30 hover:bg-orange-50'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant={tabela.kapanmaTarihi ? 'secondary' : 'default'}>
                                {tabela.kapanmaTarihi ? 'Kapalı' : 'Aktif'}
                              </Badge>
                              <span className={tabela.kapanmaTarihi ? 'text-gray-500 line-through' : ''}>
                                {tabela.gelirModeli.ad}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {new Date(tabela.olusturmaTarihi).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <p className="text-gray-600">Kart Tipi</p>
                              <p>{tabela.kartTipi}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Yurt İçi/Dışı</p>
                              <p>{tabela.yurtIciDisi}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Kart Program</p>
                              <p className="text-xs">
                                {tabela.kartProgramIds?.includes('ALL') 
                                  ? 'Tümü' 
                                  : `${(tabela.kartProgramIds || []).length} program`}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Paylaşım</p>
                              <p className="text-xs">
                                {tabela.kurulusOrani ? `${tabela.kurulusOrani}% / ${tabela.oxivoOrani}%` : '-'}
                              </p>
                            </div>
                          </div>
                          {tabela.kapanmaTarihi && (
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs text-red-600">
                                ⚠️ Kapatıldı: {new Date(tabela.kapanmaTarihi).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anlaşmalı Bankalar */}
            <Card>
              <CardHeader>
                <CardTitle>🏦 Anlaşmalı Bankalar</CardTitle>
              </CardHeader>
              <CardContent>
                {!formData.agreementBanks || formData.agreementBanks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>Henüz anlaşmalı banka kaydı bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {formData.agreementBanks.map((bankId) => {
                      const bank = banks.find(b => b.id === bankId);
                      return bank ? (
                        <div 
                          key={bankId} 
                          className="border border-green-200 bg-green-50/30 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-green-100 border-green-300">
                              {bank.kod}
                            </Badge>
                            <span className="text-sm">{bank.bankaAdi}</span>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kategoriler */}
            <Card>
              <CardHeader>
                <CardTitle>🏷️ Banka/PF Kategorileri</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const totalCategories = (formData.linkedBankIds?.length || 0) + 
                                         (formData.linkedEPKIds?.length || 0) + 
                                         (formData.linkedOKIds?.length || 0);
                  
                  if (totalCategories === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <p>Henüz kategori ilişkilendirmesi yapılmamış.</p>
                        <p className="text-xs mt-2">Kategori eklemek için "Kategoriler" sekmesini kullanın.</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-4">
                      {/* Bankalar */}
                      {formData.linkedBankIds && formData.linkedBankIds.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Bankalar ({formData.linkedBankIds.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {formData.linkedBankIds.map((bankId) => {
                              const bank = banks.find(b => b.id === bankId);
                              return bank ? (
                                <div key={bankId} className="flex items-center gap-2 text-sm border border-blue-200 bg-blue-50/30 rounded px-2 py-1">
                                  <Badge variant="outline" className="text-xs bg-blue-100 border-blue-300">{bank.kod}</Badge>
                                  <span className="truncate">{bank.bankaAdi}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* EPK */}
                      {formData.linkedEPKIds && formData.linkedEPKIds.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">EPK ({formData.linkedEPKIds.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {formData.linkedEPKIds.map((epkId) => {
                              const epk = epkList.find(e => e.id === epkId);
                              return epk ? (
                                <div key={epkId} className="flex items-center gap-2 text-sm border border-green-200 bg-green-50/30 rounded px-2 py-1">
                                  <Badge variant="outline" className="text-xs bg-green-100 border-green-300">{epk.kod}</Badge>
                                  <span className="truncate">{epk.kurumAdi}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* ÖK */}
                      {formData.linkedOKIds && formData.linkedOKIds.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">ÖK ({formData.linkedOKIds.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {formData.linkedOKIds.map((okId) => {
                              const ok = okList.find(o => o.id === okId);
                              return ok ? (
                                <div key={okId} className="flex items-center gap-2 text-sm border border-purple-200 bg-purple-50/30 rounded px-2 py-1">
                                  <Badge variant="outline" className="text-xs bg-purple-100 border-purple-300">{ok.kod}</Badge>
                                  <span className="truncate">{ok.kurumAdi}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* İletişim Matrisi */}
            <Card>
              <CardHeader>
                <CardTitle>👥 İletişim Matrisi</CardTitle>
              </CardHeader>
              <CardContent>
                {!formData.iletisimMatrisi || formData.iletisimMatrisi.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>Henüz iletişim kaydı bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.iletisimMatrisi.map((contact) => (
                      <div 
                        key={contact.id} 
                        className="border border-purple-200 bg-purple-50/30 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <p>{contact.ad} {contact.soyad}</p>
                              <Badge variant="outline" className="text-xs">
                                {contact.gorev}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-600">
                              {contact.telefon && <span>📞 {contact.telefon}</span>}
                              {contact.email && <span>📧 {contact.email}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dokümanlar */}
            <Card>
              <CardHeader>
                <CardTitle>📁 Dokümanlar</CardTitle>
              </CardHeader>
              <CardContent>
                {!formData.dokumanlar || formData.dokumanlar.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>Henüz doküman bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.dokumanlar.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="border border-indigo-200 bg-indigo-50/30 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs bg-indigo-100 border-indigo-300">
                            {doc.kategori}
                          </Badge>
                          <span className="text-sm">{doc.dosyaAdi}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.yuklemeTarihi).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Kategoriler Tab */}
        <TabsContent value="kategoriler">
          <Card>
            <CardHeader>
              <CardTitle>Banka/PF Kategori İlişkilendirmesi</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Bu Banka/PF kaydının hangi Banka, EPK ve ÖK kategorileriyle ilişkili olduğunu seçin.
                Seçtiğiniz kategoriler, Müşteri Cari Kart listesinde "Banka/PF" sütununda görüntülenecektir.
              </p>
            </CardHeader>
            <CardContent>
              <BankPFCategorySelector
                banks={banks}
                epkList={epkList}
                okList={okList}
                selectedBankIds={formData.linkedBankIds || []}
                selectedEPKIds={formData.linkedEPKIds || []}
                selectedOKIds={formData.linkedOKIds || []}
                onSelectionChange={(data) => {
                  // ✅ Kategori seçimlerini formData'ya kaydet
                  const updatedFormData = {
                    ...formData,
                    linkedBankIds: data.banks,
                    linkedEPKIds: data.epks,
                    linkedOKIds: data.oks,
                  };
                  setFormData(updatedFormData);
                  // ✅ Otomatik kaydet
                  onSave(updatedFormData);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* İş Birliği Tab */}
        <TabsContent value="isbirligi">
          <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-gray-500 mb-2">İş Birliği Yönetimi</h3>
            <p className="text-sm text-gray-400">Bu alan şu anda boş</p>
          </div>
        </TabsContent>

        {/* Hakediş Tab */}
        <TabsContent value="hakedis">
          <HakedisTab
            tabelaRecords={formData.tabelaRecords || []}
            tabelaGroups={formData.tabelaGroups || []}
            kurumAdi={formData.firmaUnvan}
            hakedisRecords={formData.hakedisRecords || []}
            onHakedisRecordsChange={(records) => {
              setFormData(prev => ({ ...prev, hakedisRecords: records }));
              // Hakediş kayıtlarını otomatik kaydet
              const updatedFormData = { ...formData, hakedisRecords: records };
              onSave(updatedFormData);
            }}
          />
        </TabsContent>

        {/* Cari Bilgileri Tab */}
        <TabsContent value="bilgiler">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sol Kolon */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Firma Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firmaUnvan" className="text-xs sm:text-sm">Firma Ünvanı *</Label>
                    <Input
                      id="firmaUnvan"
                      value={formData.firmaUnvan}
                      onChange={(e) => handleChange('firmaUnvan', e.target.value)}
                      required
                      placeholder="Örn: Türkiye İş Bankası A.Ş."
                      disabled={!isEditing}
                      className={`text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="muhasebeKodu" className="text-xs sm:text-sm">Muhasebe Kodu *</Label>
                    <Input
                      id="muhasebeKodu"
                      value={formData.muhasebeKodu}
                      onChange={(e) => handleChange('muhasebeKodu', e.target.value)}
                      required
                      placeholder="Örn: 320.01.001"
                      disabled={!isEditing}
                      className={`text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vergiDairesi" className="text-xs sm:text-sm">Vergi Dairesi</Label>
                      <Input
                        id="vergiDairesi"
                        value={formData.vergiDairesi}
                        onChange={(e) => handleChange('vergiDairesi', e.target.value)}
                        placeholder="Vergi dairesi"
                        disabled={!isEditing}
                        className={`text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vergiNo" className="text-xs sm:text-sm">Vergi No</Label>
                      <Input
                        id="vergiNo"
                        value={formData.vergiNo}
                        onChange={(e) => handleChange('vergiNo', e.target.value)}
                        placeholder="1234567890"
                        disabled={!isEditing}
                        className={`text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adres" className="text-xs sm:text-sm">Adres</Label>
                    <Textarea
                      id="adres"
                      value={formData.adres}
                      onChange={(e) => handleChange('adres', e.target.value)}
                      placeholder="Tam adres"
                      rows={3}
                      disabled={!isEditing}
                      className={`text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefon" className="text-xs sm:text-sm">Telefon</Label>
                      <Input
                        id="telefon"
                        value={formData.telefon}
                        onChange={(e) => handleChange('telefon', e.target.value)}
                        placeholder="0212 123 4567"
                        disabled={!isEditing}
                        className={`text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="info@ornek.com"
                        disabled={!isEditing}
                        className={`text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="durum" className="text-xs sm:text-sm">Durum</Label>
                    <Select
                      value={formData.durum}
                      onValueChange={(value) => {
                        handleChange('durum', value);
                        setIsDurumDropdownOpen(false);
                      }}
                      disabled={!isEditing}
                      open={isDurumDropdownOpen}
                      onOpenChange={setIsDurumDropdownOpen}
                    >
                      <SelectTrigger 
                        id="durum" 
                        onClick={() => isEditing && setIsDurumDropdownOpen(!isDurumDropdownOpen)}
                        className={`${!isEditing ? 'bg-gray-100' : ''} ${
                          isEditing && isDurumDropdownOpen 
                            ? 'ring-2 ring-blue-500 border-blue-500' 
                            : ''
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Pasif">Pasif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Sağ Kolon */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Banka / ÖK Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankaOrPF" className="text-xs sm:text-sm">Banka / PF *</Label>
                    <Select
                      value={formData.bankaOrPF}
                      onValueChange={(value: 'Banka' | 'PF') => {
                        handleChange('bankaOrPF', value);
                        setIsBankaOrPFDropdownOpen(false);
                        // Reset related fields when changing type
                        if (value === 'Banka') {
                          handleChange('odemeKurulusuTipi', '');
                          handleChange('odemeKurulusuAd', '');
                        }
                      }}
                      disabled={!isEditing}
                      open={isBankaOrPFDropdownOpen}
                      onOpenChange={setIsBankaOrPFDropdownOpen}
                    >
                      <SelectTrigger 
                        id="bankaOrPF" 
                        onClick={() => isEditing && setIsBankaOrPFDropdownOpen(!isBankaOrPFDropdownOpen)}
                        className={`${!isEditing ? 'bg-gray-100' : ''} ${
                          isEditing && isBankaOrPFDropdownOpen 
                            ? 'ring-2 ring-blue-500 border-blue-500' 
                            : ''
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Banka">Banka</SelectItem>
                        <SelectItem value="PF">PF (Ödeme Platformu)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankaPFAd" className="text-xs sm:text-sm">Banka / PF Adı *</Label>
                    <Select
                      value={formData.bankaPFAd}
                      onValueChange={(value) => {
                        handleChange('bankaPFAd', value);
                        setIsBankaPFAdDropdownOpen(false);
                      }}
                      disabled={!isEditing}
                      open={isBankaPFAdDropdownOpen}
                      onOpenChange={setIsBankaPFAdDropdownOpen}
                    >
                      <SelectTrigger 
                        id="bankaPFAd" 
                        onClick={() => isEditing && setIsBankaPFAdDropdownOpen(!isBankaPFAdDropdownOpen)}
                        className={`${!isEditing ? 'bg-gray-100' : ''} ${
                          isEditing && isBankaPFAdDropdownOpen 
                            ? 'ring-2 ring-blue-500 border-blue-500' 
                            : ''
                        }`}
                      >
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        {bankaPFListesi.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.bankaOrPF === 'PF' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="odemeKurulusuTipi" className="text-xs sm:text-sm">ÖK / EPK Seçimi</Label>
                        <Select
                          value={formData.odemeKurulusuTipi}
                          onValueChange={(value) => {
                            handleChange('odemeKurulusuTipi', value);
                            handleChange('odemeKurulusuAd', '');
                            setIsOdemeKurulusuTipiDropdownOpen(false);
                          }}
                          disabled={!isEditing}
                          open={isOdemeKurulusuTipiDropdownOpen}
                          onOpenChange={setIsOdemeKurulusuTipiDropdownOpen}
                        >
                          <SelectTrigger 
                            id="odemeKurulusuTipi" 
                            onClick={() => isEditing && setIsOdemeKurulusuTipiDropdownOpen(!isOdemeKurulusuTipiDropdownOpen)}
                            className={`${!isEditing ? 'bg-gray-100' : ''} ${
                              isEditing && isOdemeKurulusuTipiDropdownOpen 
                                ? 'ring-2 ring-blue-500 border-blue-500' 
                                : ''
                            }`}
                          >
                            <SelectValue placeholder="Seçiniz..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ÖK">ÖK (Ödeme Kuruluşları)</SelectItem>
                            <SelectItem value="EPK">EPK (Elektronik Para Kuruluşları)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.odemeKurulusuTipi && (
                        <div className="space-y-2">
                          <Label htmlFor="odemeKurulusuAd" className="text-xs sm:text-sm">
                            {formData.odemeKurulusuTipi} Adı
                          </Label>
                          <Select
                            value={formData.odemeKurulusuAd}
                            onValueChange={(value) => {
                              handleChange('odemeKurulusuAd', value);
                              setIsOdemeKurulusuAdDropdownOpen(false);
                            }}
                            disabled={!isEditing}
                            open={isOdemeKurulusuAdDropdownOpen}
                            onOpenChange={setIsOdemeKurulusuAdDropdownOpen}
                          >
                            <SelectTrigger 
                              id="odemeKurulusuAd" 
                              onClick={() => isEditing && setIsOdemeKurulusuAdDropdownOpen(!isOdemeKurulusuAdDropdownOpen)}
                              className={`${!isEditing ? 'bg-gray-100' : ''} ${
                                isEditing && isOdemeKurulusuAdDropdownOpen 
                                  ? 'ring-2 ring-blue-500 border-blue-500' 
                                  : ''
                              }`}
                            >
                              <SelectValue placeholder="Seçiniz..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getOdemeKurulusuListesi().map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">
                        <strong>Bilgi:</strong> Banka seçildiğinde sadece banka bilgileri,
                        PF seçildiğinde ise ödeme kuruluşu bilgileri de girilecektir.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            {isEditing && (
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  <X size={18} className="mr-2" />
                  İptal
              </Button>
                <Button type="submit" className="flex items-center space-x-2">
                  <Save size={18} />
                  <span>{isCreating ? 'Kaydet' : 'Güncelle'}</span>
                </Button>
              </div>
            )}
          </form>
        </TabsContent>

        {/* TABELA Tab */}
        <TabsContent value="tabela">
          <FirmaTabelaTab
            firmaId={formData.id}
            firmaAdi={formData.firmaUnvan}
            firmaTipi={formData.bankaOrPF}
            odemeKurulusuTipi={formData.odemeKurulusuTipi}
            gelirModelleri={gelirModelleri}
            ekGelirler={ekGelirler}
            banks={banks}
            kartProgramlar={kartProgramlar}
            tabelaRecords={formData.tabelaRecords || []}
            tabelaGroups={formData.tabelaGroups || []}
            onTabelaRecordsChange={(records) => {
              setFormData(prev => ({ ...prev, tabelaRecords: records }));
              // TABELA değişikliklerini otomatik kaydet (ama sayfadan atma!)
              const updatedFormData = { ...formData, tabelaRecords: records };
              onSave(updatedFormData);
            }}
            onTabelaGroupsChange={(groups) => {
              setFormData(prev => ({ ...prev, tabelaGroups: groups }));
              // TABELA grup değişikliklerini otomatik kaydet (ama sayfadan atma!)
              const updatedFormData = { ...formData, tabelaGroups: groups };
              onSave(updatedFormData);
            }}
          />
        </TabsContent>

        {/* Bankalar Tab */}
        <TabsContent value="bankalar">
          <FirmaBankalarTab
            banks={banks}
            epkList={epkList}
            okList={okList}
            selectedBankIds={formData.agreementBanks || []}
            selectedEPKIds={formData.agreementEPKs || []}
            selectedOKIds={formData.agreementOKs || []}
            onSelectedBanksChange={(bankIds) => {
              setFormData(prev => ({ ...prev, agreementBanks: bankIds }));
              const updatedFormData = { ...formData, agreementBanks: bankIds };
              onSave(updatedFormData);
            }}
            onSelectedEPKsChange={(epkIds) => {
              setFormData(prev => ({ ...prev, agreementEPKs: epkIds }));
              const updatedFormData = { ...formData, agreementEPKs: epkIds };
              onSave(updatedFormData);
            }}
            onSelectedOKsChange={(okIds) => {
              setFormData(prev => ({ ...prev, agreementOKs: okIds }));
              const updatedFormData = { ...formData, agreementOKs: okIds };
              onSave(updatedFormData);
            }}
            onSave={() => {
              onSave(formData);
              setIsEditing(false);
            }}
          />
        </TabsContent>

        {/* İletişim Matrisi Tab */}
        <TabsContent value="iletisim">
          <ContactMatrix
            contacts={formData.iletisimMatrisi}
            onContactsChange={(contacts) => {
              setFormData(prev => ({ ...prev, iletisimMatrisi: contacts }));
              // İletişim matrisi değişikliklerini otomatik kaydet
              const updatedFormData = { ...formData, iletisimMatrisi: contacts };
              onSave(updatedFormData);
              toast.success('İletişim matrisi kaydedildi');
            }}
            gorevListesi={gorevListesi}
          />
        </TabsContent>

        {/* Doküman Yönetimi Tab */}
        <TabsContent value="dokumanlar">
          <DocumentManagement
            documents={formData.dokumanlar}
            onDocumentsChange={(documents) => {
              setFormData(prev => ({ ...prev, dokumanlar: documents }));
              // Doküman değişikliklerini otomatik kaydet
              const updatedFormData = { ...formData, dokumanlar: documents };
              onSave(updatedFormData);
              toast.success('Doküman kaydedildi');
            }}
          />
        </TabsContent>

        {/* ÜİY Tab */}
        <TabsContent value="uiy">
          <Card>
            <CardContent className="py-12">
              {/* Boş içerik */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Kaydet Onay Dialog */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Değişiklikleri Kaydet</AlertDialogTitle>
            <AlertDialogDescription>
              Yaptığınız değişiklikleri kaydetmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}