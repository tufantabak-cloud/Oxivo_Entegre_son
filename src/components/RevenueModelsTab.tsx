import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Bug, Check, X, Search } from 'lucide-react';
import { useState } from 'react';
import { RevenueModelsDiagnostic } from './RevenueModelsDiagnostic';
import { createSampleData } from '../utils/revenueModelsRecovery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { toast } from 'sonner';

export interface HesapKalemi {
  id: string;
  kod: string;
  adi: string;
  aciklama: string;
  aktif: boolean;
}

export interface SabitKomisyon {
  id: string;
  adi: string;
  oran: number;
  aciklama: string;
  aktif: boolean;
}

export interface EkGelir {
  id: string;
  adi: string;
  tutar: number;
  birim: 'TL' | 'EUR' | 'USD';
  aciklama: string;
  aktif: boolean;
  // ✅ EKSIK ALANLAR EKLENDİ - TABELA entegrasyonu için gerekli
  kodNo?: string;
  gelirTuru?: string; // 'Hazine Geliri' vb.
  kullanim?: 'Yurt İçi' | 'Yurt Dışı';
  kartTipi?: 'Credit' | 'Debit' | 'Paçal';
  pfYuzde?: string; // PF payı yüzde
  pfTL?: string; // PF payı TL
  oxYuzde?: string; // OXIVO payı yüzde
  oxTL?: string; // OXIVO payı TL
  gelirModeli?: string; // İlişkili gelir modeli adı
  urun?: string; // İlişkili ürün adı
}

interface RevenueModelsTabProps {
  hesapKalemleri: HesapKalemi[];
  onHesapKalemleriChange: (items: HesapKalemi[]) => void;
  sabitKomisyonlar: SabitKomisyon[];
  onSabitKomisyonlarChange: (items: SabitKomisyon[]) => void;
  ekGelirler: EkGelir[];
  onEkGelirlerChange: (items: EkGelir[]) => void;
}

export function RevenueModelsTab({
  hesapKalemleri,
  onHesapKalemleriChange,
  sabitKomisyonlar,
  onSabitKomisyonlarChange,
  ekGelirler,
  onEkGelirlerChange
}: RevenueModelsTabProps) {
  const [activeSection, setActiveSection] = useState<'hesap' | 'komisyon' | 'gelir' | 'diagnostic'>('hesap');
  
  // Hesap Kalemi State
  const [hesapDialogOpen, setHesapDialogOpen] = useState(false);
  const [editingHesap, setEditingHesap] = useState<HesapKalemi | null>(null);
  const [hesapSearch, setHesapSearch] = useState('');
  const [hesapForm, setHesapForm] = useState<Partial<HesapKalemi>>({
    kod: '',
    adi: '',
    aciklama: '',
    aktif: true,
  });

  // Sabit Komisyon State
  const [komisyonDialogOpen, setKomisyonDialogOpen] = useState(false);
  const [editingKomisyon, setEditingKomisyon] = useState<SabitKomisyon | null>(null);
  const [komisyonSearch, setKomisyonSearch] = useState('');
  const [komisyonForm, setKomisyonForm] = useState<Partial<SabitKomisyon>>({
    adi: '',
    oran: 0,
    aciklama: '',
    aktif: true,
  });

  // Ek Gelir State
  const [gelirDialogOpen, setGelirDialogOpen] = useState(false);
  const [editingGelir, setEditingGelir] = useState<EkGelir | null>(null);
  const [gelirSearch, setGelirSearch] = useState('');
  const [gelirForm, setGelirForm] = useState<Partial<EkGelir>>({
    adi: '',
    tutar: 0,
    birim: 'TL',
    aciklama: '',
    aktif: true,
  });

  const handleLoadSampleData = () => {
    const sampleData = createSampleData();
    onHesapKalemleriChange(sampleData.hesapKalemleri);
    onSabitKomisyonlarChange(sampleData.sabitKomisyonlar);
    onEkGelirlerChange(sampleData.ekGelirler);
    toast.success('Örnek veriler yüklendi');
    console.log('✅ Örnek veriler yüklendi');
  };

  const handleRecoveryData = (recovered: {
    hesapKalemleri: HesapKalemi[];
    sabitKomisyonlar: SabitKomisyon[];
    ekGelirler: EkGelir[];
  }) => {
    onHesapKalemleriChange(recovered.hesapKalemleri);
    onSabitKomisyonlarChange(recovered.sabitKomisyonlar);
    onEkGelirlerChange(recovered.ekGelirler);
    toast.success('Legacy veriler geri yüklendi');
    console.log('✅ Legacy veriler geri yüklendi ve state güncellendi');
  };

  // ==================== HESAP KALEMLERİ FONKSİYONLARI ====================

  const handleAddHesap = () => {
    setEditingHesap(null);
    setHesapForm({
      kod: '',
      adi: '',
      aciklama: '',
      aktif: true,
    });
    setHesapDialogOpen(true);
  };

  const handleEditHesap = (item: HesapKalemi) => {
    setEditingHesap(item);
    setHesapForm(item);
    setHesapDialogOpen(true);
  };

  const handleSaveHesap = () => {
    if (!hesapForm.kod || !hesapForm.adi) {
      toast.error('Kod ve Ad alanları zorunludur');
      return;
    }

    if (editingHesap) {
      // Güncelleme
      const updated = hesapKalemleri.map(item =>
        item.id === editingHesap.id ? { ...item, ...hesapForm } : item
      );
      onHesapKalemleriChange(updated);
      toast.success('Hesap kalemi güncellendi');
    } else {
      // Yeni ekleme
      const newItem: HesapKalemi = {
        id: crypto.randomUUID(), // ✅ UUID GENERATION for Supabase compatibility
        kod: hesapForm.kod!,
        adi: hesapForm.adi!,
        aciklama: hesapForm.aciklama || '',
        aktif: hesapForm.aktif ?? true,
      };
      onHesapKalemleriChange([...hesapKalemleri, newItem]);
      toast.success('Hesap kalemi eklendi');
    }

    setHesapDialogOpen(false);
    setEditingHesap(null);
  };

  const handleDeleteHesap = (id: string) => {
    if (confirm('Bu hesap kalemini silmek istediğinizden emin misiniz?')) {
      onHesapKalemleriChange(hesapKalemleri.filter(item => item.id !== id));
      toast.success('Hesap kalemi silindi');
    }
  };

  const handleToggleHesapAktif = (id: string) => {
    const updated = hesapKalemleri.map(item =>
      item.id === id ? { ...item, aktif: !item.aktif } : item
    );
    onHesapKalemleriChange(updated);
    toast.success('Durum güncellendi');
  };

  const filteredHesapKalemleri = hesapKalemleri.filter(item => {
    const searchLower = hesapSearch.toLowerCase();
    return (
      item.kod.toLowerCase().includes(searchLower) ||
      item.adi.toLowerCase().includes(searchLower) ||
      item.aciklama.toLowerCase().includes(searchLower)
    );
  });

  // ==================== SABİT KOMİSYONLAR FONKSİYONLARI ====================

  const handleAddKomisyon = () => {
    setEditingKomisyon(null);
    setKomisyonForm({
      adi: '',
      oran: 0,
      aciklama: '',
      aktif: true,
    });
    setKomisyonDialogOpen(true);
  };

  const handleEditKomisyon = (item: SabitKomisyon) => {
    setEditingKomisyon(item);
    setKomisyonForm(item);
    setKomisyonDialogOpen(true);
  };

  const handleSaveKomisyon = () => {
    if (!komisyonForm.adi) {
      toast.error('Ad alanı zorunludur');
      return;
    }

    if (editingKomisyon) {
      // Güncelleme
      const updated = sabitKomisyonlar.map(item =>
        item.id === editingKomisyon.id ? { ...item, ...komisyonForm } : item
      );
      onSabitKomisyonlarChange(updated);
      toast.success('Sabit komisyon güncellendi');
    } else {
      // Yeni ekleme
      const newItem: SabitKomisyon = {
        id: crypto.randomUUID(), // ✅ UUID GENERATION for Supabase compatibility
        adi: komisyonForm.adi!,
        oran: komisyonForm.oran || 0,
        aciklama: komisyonForm.aciklama || '',
        aktif: komisyonForm.aktif ?? true,
      };
      onSabitKomisyonlarChange([...sabitKomisyonlar, newItem]);
      toast.success('Sabit komisyon eklendi');
    }

    setKomisyonDialogOpen(false);
    setEditingKomisyon(null);
  };

  const handleDeleteKomisyon = (id: string) => {
    if (confirm('Bu sabit komisyonu silmek istediğinizden emin misiniz?')) {
      onSabitKomisyonlarChange(sabitKomisyonlar.filter(item => item.id !== id));
      toast.success('Sabit komisyon silindi');
    }
  };

  const handleToggleKomisyonAktif = (id: string) => {
    const updated = sabitKomisyonlar.map(item =>
      item.id === id ? { ...item, aktif: !item.aktif } : item
    );
    onSabitKomisyonlarChange(updated);
    toast.success('Durum güncellendi');
  };

  const filteredSabitKomisyonlar = sabitKomisyonlar.filter(item => {
    const searchLower = komisyonSearch.toLowerCase();
    return (
      item.adi.toLowerCase().includes(searchLower) ||
      item.aciklama.toLowerCase().includes(searchLower)
    );
  });

  // ==================== EK GELİRLER FONKSİYONLARI ====================

  const handleAddGelir = () => {
    setEditingGelir(null);
    setGelirForm({
      adi: '',
      tutar: 0,
      birim: 'TL',
      aciklama: '',
      aktif: true,
    });
    setGelirDialogOpen(true);
  };

  const handleEditGelir = (item: EkGelir) => {
    setEditingGelir(item);
    setGelirForm(item);
    setGelirDialogOpen(true);
  };

  const handleSaveGelir = () => {
    if (!gelirForm.adi) {
      toast.error('Ad alanı zorunludur');
      return;
    }

    if (editingGelir) {
      // Güncelleme
      const updated = ekGelirler.map(item =>
        item.id === editingGelir.id ? { ...item, ...gelirForm } : item
      );
      onEkGelirlerChange(updated);
      toast.success('Ek gelir güncellendi');
    } else {
      // Yeni ekleme
      const newItem: EkGelir = {
        id: crypto.randomUUID(), // ✅ UUID GENERATION for Supabase compatibility
        adi: gelirForm.adi!,
        tutar: gelirForm.tutar || 0,
        birim: gelirForm.birim || 'TL',
        aciklama: gelirForm.aciklama || '',
        aktif: gelirForm.aktif ?? true,
      };
      onEkGelirlerChange([...ekGelirler, newItem]);
      toast.success('Ek gelir eklendi');
    }

    setGelirDialogOpen(false);
    setEditingGelir(null);
  };

  const handleDeleteGelir = (id: string) => {
    if (confirm('Bu ek geliri silmek istediğinizden emin misiniz?')) {
      onEkGelirlerChange(ekGelirler.filter(item => item.id !== id));
      toast.success('Ek gelir silindi');
    }
  };

  const handleToggleGelirAktif = (id: string) => {
    const updated = ekGelirler.map(item =>
      item.id === id ? { ...item, aktif: !item.aktif } : item
    );
    onEkGelirlerChange(updated);
    toast.success('Durum güncellendi');
  };

  const filteredEkGelirler = ekGelirler.filter(item => {
    const searchLower = gelirSearch.toLowerCase();
    return (
      item.adi.toLowerCase().includes(searchLower) ||
      item.aciklama.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sekme Seçici */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <Button
          variant={activeSection === 'hesap' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('hesap')}
        >
          📊 Hesap Kalemleri
        </Button>
        <Button
          variant={activeSection === 'komisyon' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('komisyon')}
        >
          💰 Sabit Komisyonlar
        </Button>
        <Button
          variant={activeSection === 'gelir' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('gelir')}
        >
          💵 Ek Gelirler
        </Button>
        <Button
          variant={activeSection === 'diagnostic' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('diagnostic')}
        >
          <Bug size={16} className="mr-1" />
          Teşhis & Analiz
        </Button>
      </div>

      {/* ==================== HESAP KALEMLERİ ==================== */}
      {activeSection === 'hesap' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hesap Kalemleri</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Gelir hesaplama modellerinde kullanılacak hesap kalemlerini tanımlayın
                </p>
              </div>
              <Button size="sm" onClick={handleAddHesap}>
                <Plus size={16} className="mr-1" />
                Yeni Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Arama */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Hesap kalemi ara..."
                  value={hesapSearch}
                  onChange={(e) => setHesapSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Liste */}
            {filteredHesapKalemleri.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {hesapSearch ? (
                  <p>Arama sonucu bulunamadı</p>
                ) : (
                  <div>
                    <p>Henüz hesap kalemi tanımlanmamış</p>
                    <Button size="sm" variant="outline" onClick={handleAddHesap} className="mt-4">
                      <Plus size={16} className="mr-1" />
                      İlk Hesap Kalemini Ekle
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHesapKalemleri.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="shrink-0">{item.kod}</Badge>
                        <span className="truncate">{item.adi}</span>
                        {!item.aktif && (
                          <Badge variant="secondary" className="text-xs">Pasif</Badge>
                        )}
                      </div>
                      {item.aciklama && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{item.aciklama}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleHesapAktif(item.id)}
                        title={item.aktif ? 'Pasif yap' : 'Aktif yap'}
                      >
                        {item.aktif ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <X size={16} className="text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditHesap(item)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteHesap(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== SABİT KOMİSYONLAR ==================== */}
      {activeSection === 'komisyon' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sabit Komisyonlar</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Müşterilere uygulanacak sabit komisyon oranlarını tanımlayın
                </p>
              </div>
              <Button size="sm" onClick={handleAddKomisyon}>
                <Plus size={16} className="mr-1" />
                Yeni Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Arama */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Komisyon ara..."
                  value={komisyonSearch}
                  onChange={(e) => setKomisyonSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Liste */}
            {filteredSabitKomisyonlar.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {komisyonSearch ? (
                  <p>Arama sonucu bulunamadı</p>
                ) : (
                  <div>
                    <p>Henüz sabit komisyon tanımlanmamış</p>
                    <Button size="sm" variant="outline" onClick={handleAddKomisyon} className="mt-4">
                      <Plus size={16} className="mr-1" />
                      İlk Komisyonu Ekle
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSabitKomisyonlar.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{item.adi}</span>
                        <Badge variant="outline" className="shrink-0">
                          %{item.oran.toFixed(2)}
                        </Badge>
                        {!item.aktif && (
                          <Badge variant="secondary" className="text-xs">Pasif</Badge>
                        )}
                      </div>
                      {item.aciklama && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{item.aciklama}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleKomisyonAktif(item.id)}
                        title={item.aktif ? 'Pasif yap' : 'Aktif yap'}
                      >
                        {item.aktif ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <X size={16} className="text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditKomisyon(item)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteKomisyon(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== EK GELİRLER ==================== */}
      {activeSection === 'gelir' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ek Gelirler</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Müşterilere uygulanacak ek gelir kalemlerini tanımlayın
                </p>
              </div>
              <Button size="sm" onClick={handleAddGelir}>
                <Plus size={16} className="mr-1" />
                Yeni Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Arama */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Ek gelir ara..."
                  value={gelirSearch}
                  onChange={(e) => setGelirSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Liste */}
            {filteredEkGelirler.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {gelirSearch ? (
                  <p>Arama sonucu bulunamadı</p>
                ) : (
                  <div>
                    <p>Henüz ek gelir tanımlanmamış</p>
                    <Button size="sm" variant="outline" onClick={handleAddGelir} className="mt-4">
                      <Plus size={16} className="mr-1" />
                      İlk Ek Geliri Ekle
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEkGelirler.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{item.adi}</span>
                        <Badge variant="outline" className="shrink-0">
                          {item.tutar.toFixed(2)} {item.birim}
                        </Badge>
                        {!item.aktif && (
                          <Badge variant="secondary" className="text-xs">Pasif</Badge>
                        )}
                      </div>
                      {item.aciklama && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{item.aciklama}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleGelirAktif(item.id)}
                        title={item.aktif ? 'Pasif yap' : 'Aktif yap'}
                      >
                        {item.aktif ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <X size={16} className="text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditGelir(item)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteGelir(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== TEŞHİS & ANALİZ ==================== */}
      {activeSection === 'diagnostic' && (
        <RevenueModelsDiagnostic
          hesapKalemleri={hesapKalemleri}
          sabitKomisyonlar={sabitKomisyonlar}
          ekGelirler={ekGelirler}
          onLoadSampleData={handleLoadSampleData}
          onRecoveryData={handleRecoveryData}
        />
      )}

      {/* ==================== HESAP KALEMİ DIALOG ==================== */}
      <Dialog open={hesapDialogOpen} onOpenChange={setHesapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHesap ? 'Hesap Kalemini Düzenle' : 'Yeni Hesap Kalemi'}
            </DialogTitle>
            <DialogDescription>
              Hesap kalemi bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hesap-kod">Kod *</Label>
              <Input
                id="hesap-kod"
                placeholder="örn: 100, 600, vb."
                value={hesapForm.kod}
                onChange={(e) => setHesapForm({ ...hesapForm, kod: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hesap-adi">Ad *</Label>
              <Input
                id="hesap-adi"
                placeholder="Hesap kalemi adı"
                value={hesapForm.adi}
                onChange={(e) => setHesapForm({ ...hesapForm, adi: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hesap-aciklama">Açıklama</Label>
              <Textarea
                id="hesap-aciklama"
                placeholder="Opsiyonel açıklama"
                value={hesapForm.aciklama}
                onChange={(e) => setHesapForm({ ...hesapForm, aciklama: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hesap-aktif"
                checked={hesapForm.aktif}
                onChange={(e) => setHesapForm({ ...hesapForm, aktif: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="hesap-aktif" className="cursor-pointer">Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHesapDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveHesap}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== SABİT KOMİSYON DIALOG ==================== */}
      <Dialog open={komisyonDialogOpen} onOpenChange={setKomisyonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKomisyon ? 'Sabit Komisyonu Düzenle' : 'Yeni Sabit Komisyon'}
            </DialogTitle>
            <DialogDescription>
              Sabit komisyon bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="komisyon-adi">Ad *</Label>
              <Input
                id="komisyon-adi"
                placeholder="Komisyon adı"
                value={komisyonForm.adi}
                onChange={(e) => setKomisyonForm({ ...komisyonForm, adi: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="komisyon-oran">Oran (%) *</Label>
              <Input
                id="komisyon-oran"
                type="number"
                step="0.01"
                placeholder="örn: 2.50"
                value={komisyonForm.oran}
                onChange={(e) => setKomisyonForm({ ...komisyonForm, oran: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="komisyon-aciklama">Açıklama</Label>
              <Textarea
                id="komisyon-aciklama"
                placeholder="Opsiyonel açıklama"
                value={komisyonForm.aciklama}
                onChange={(e) => setKomisyonForm({ ...komisyonForm, aciklama: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="komisyon-aktif"
                checked={komisyonForm.aktif}
                onChange={(e) => setKomisyonForm({ ...komisyonForm, aktif: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="komisyon-aktif" className="cursor-pointer">Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setKomisyonDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveKomisyon}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== EK GELİR DIALOG ==================== */}
      <Dialog open={gelirDialogOpen} onOpenChange={setGelirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGelir ? 'Ek Geliri Düzenle' : 'Yeni Ek Gelir'}
            </DialogTitle>
            <DialogDescription>
              Ek gelir bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gelir-adi">Ad *</Label>
              <Input
                id="gelir-adi"
                placeholder="Ek gelir adı"
                value={gelirForm.adi}
                onChange={(e) => setGelirForm({ ...gelirForm, adi: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gelir-tutar">Tutar *</Label>
                <Input
                  id="gelir-tutar"
                  type="number"
                  step="0.01"
                  placeholder="örn: 150.00"
                  value={gelirForm.tutar}
                  onChange={(e) => setGelirForm({ ...gelirForm, tutar: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gelir-birim">Birim *</Label>
                <select
                  id="gelir-birim"
                  value={gelirForm.birim}
                  onChange={(e) => setGelirForm({ ...gelirForm, birim: e.target.value as 'TL' | 'EUR' | 'USD' })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  <option value="TL">TL</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gelir-aciklama">Açıklama</Label>
              <Textarea
                id="gelir-aciklama"
                placeholder="Opsiyonel açıklama"
                value={gelirForm.aciklama}
                onChange={(e) => setGelirForm({ ...gelirForm, aciklama: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="gelir-aktif"
                checked={gelirForm.aktif}
                onChange={(e) => setGelirForm({ ...gelirForm, aktif: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="gelir-aktif" className="cursor-pointer">Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGelirDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveGelir}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}