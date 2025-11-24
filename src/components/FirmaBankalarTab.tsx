import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, Building2, AlertCircle, Save, Banknote, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';

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
  aktif: boolean;
}

interface OK {
  id: string;
  kod: string;
  kurumAdi: string;
  aktif: boolean;
}

interface FirmaBankalarTabProps {
  banks: Bank[];
  epkList?: EPK[];
  okList?: OK[];
  selectedBankIds: string[];
  selectedEPKIds?: string[];
  selectedOKIds?: string[];
  onSelectedBanksChange: (bankIds: string[]) => void;
  onSelectedEPKsChange?: (epkIds: string[]) => void;
  onSelectedOKsChange?: (okIds: string[]) => void;
  onSave?: () => void;
}

export function FirmaBankalarTab({
  banks,
  epkList = [],
  okList = [],
  selectedBankIds,
  selectedEPKIds = [],
  selectedOKIds = [],
  onSelectedBanksChange,
  onSelectedEPKsChange,
  onSelectedOKsChange,
  onSave,
}: FirmaBankalarTabProps) {
  const [bankSearch, setBankSearch] = useState('');
  const [epkSearch, setEpkSearch] = useState('');
  const [okSearch, setOkSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Sadece aktif kayıtları göster
  const aktivBankalar = banks.filter(b => b.aktif);
  const aktivEPKler = epkList.filter(e => e.aktif);
  const aktivOKler = okList.filter(o => o.aktif);

  // Arama filtreleri
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

  const handleToggleBank = (bankId: string) => {
    const newSelectedIds = selectedBankIds.includes(bankId)
      ? selectedBankIds.filter(id => id !== bankId)
      : [...selectedBankIds, bankId];
    
    onSelectedBanksChange(newSelectedIds);
    
    if (!hasChanges) {
      toast.info('Değişikliklerinizi kaydetmeyi unutmayın!', { duration: 3000 });
    }
    setHasChanges(true);
  };

  const handleToggleEPK = (epkId: string) => {
    if (!onSelectedEPKsChange) return;
    
    const newSelectedIds = selectedEPKIds.includes(epkId)
      ? selectedEPKIds.filter(id => id !== epkId)
      : [...selectedEPKIds, epkId];
    
    onSelectedEPKsChange(newSelectedIds);
    
    if (!hasChanges) {
      toast.info('Değişikliklerinizi kaydetmeyi unutmayın!', { duration: 3000 });
    }
    setHasChanges(true);
  };

  const handleToggleOK = (okId: string) => {
    if (!onSelectedOKsChange) return;
    
    const newSelectedIds = selectedOKIds.includes(okId)
      ? selectedOKIds.filter(id => id !== okId)
      : [...selectedOKIds, okId];
    
    onSelectedOKsChange(newSelectedIds);
    
    if (!hasChanges) {
      toast.info('Değişikliklerinizi kaydetmeyi unutmayın!', { duration: 3000 });
    }
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      setHasChanges(false);
      toast.success('Kategoriler kaydedildi');
    }
  };

  const totalSelected = selectedBankIds.length + selectedEPKIds.length + selectedOKIds.length;

  if (aktivBankalar.length === 0 && aktivEPKler.length === 0 && aktivOKler.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-gray-600 mb-2">Kategori Tanımlanmamış</h3>
          <p className="text-sm text-gray-500">
            Lütfen önce Tanımlar modülünden Banka, EPK veya ÖK ekleyiniz.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>Anlaşmalı Bankalar & Ödeme Kuruluşları</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Firma ile anlaşmalı olan Banka, EPK ve ÖK kategorilerini seçiniz
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {selectedBankIds.length > 0 && (
                  <Badge variant="default" className="bg-blue-600">
                    🏦 {selectedBankIds.length}
                  </Badge>
                )}
                {selectedEPKIds.length > 0 && (
                  <Badge variant="default" className="bg-green-600">
                    EPK {selectedEPKIds.length}
                  </Badge>
                )}
                {selectedOKIds.length > 0 && (
                  <Badge variant="default" className="bg-purple-600">
                    ÖK {selectedOKIds.length}
                  </Badge>
                )}
                {totalSelected === 0 && (
                  <Badge variant="secondary">Seçim yapılmadı</Badge>
                )}
              </div>
              {hasChanges && (
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save size={18} />
                  <span>Kaydet</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 3 Kolonlu Grid */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* BANKALAR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
                <div className="flex items-center gap-2">
                  <Banknote className="text-blue-600" size={20} />
                  <h3 className="font-semibold text-blue-900">Bankalar</h3>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {selectedBankIds.length} seçili
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="firma-bankalar-bank-search"
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
                    {aktivBankalar.length === 0 ? 'Tanımlı banka yok' : 'Sonuç bulunamadı'}
                  </div>
                ) : (
                  filteredBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className={`p-3 hover:bg-blue-50 transition-colors cursor-pointer ${
                        selectedBankIds.includes(bank.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleToggleBank(bank.id)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`bank-${bank.id}`}
                          checked={selectedBankIds.includes(bank.id)}
                          onCheckedChange={() => handleToggleBank(bank.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" title={bank.bankaAdi}>
                            <span className="text-xs text-gray-500">{bank.kod}</span>
                            <span className="ml-1">{bank.bankaAdi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* EPK */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b-2 border-green-500">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-green-600" size={20} />
                  <h3 className="font-semibold text-green-900">EPK</h3>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {selectedEPKIds.length} seçili
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="firma-bankalar-epk-search"
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
                    {aktivEPKler.length === 0 ? 'Tanımlı EPK yok' : 'Sonuç bulunamadı'}
                  </div>
                ) : (
                  filteredEPKs.map((epk) => (
                    <div
                      key={epk.id}
                      className={`p-3 hover:bg-green-50 transition-colors cursor-pointer ${
                        selectedEPKIds.includes(epk.id) ? 'bg-green-50' : ''
                      }`}
                      onClick={() => handleToggleEPK(epk.id)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`epk-${epk.id}`}
                          checked={selectedEPKIds.includes(epk.id)}
                          onCheckedChange={() => handleToggleEPK(epk.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" title={epk.kurumAdi}>
                            <span className="text-xs text-gray-500">{epk.kod}</span>
                            <span className="ml-1">{epk.kurumAdi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ÖK */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b-2 border-purple-500">
                <div className="flex items-center gap-2">
                  <Wallet className="text-purple-600" size={20} />
                  <h3 className="font-semibold text-purple-900">ÖK</h3>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {selectedOKIds.length} seçili
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="firma-bankalar-ok-search"
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
                    {aktivOKler.length === 0 ? 'Tanımlı ÖK yok' : 'Sonuç bulunamadı'}
                  </div>
                ) : (
                  filteredOKs.map((ok) => (
                    <div
                      key={ok.id}
                      className={`p-3 hover:bg-purple-50 transition-colors cursor-pointer ${
                        selectedOKIds.includes(ok.id) ? 'bg-purple-50' : ''
                      }`}
                      onClick={() => handleToggleOK(ok.id)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`ok-${ok.id}`}
                          checked={selectedOKIds.includes(ok.id)}
                          onCheckedChange={() => handleToggleOK(ok.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" title={ok.kurumAdi}>
                            <span className="text-xs text-gray-500">{ok.kod}</span>
                            <span className="ml-1">{ok.kurumAdi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Otomatik Kayıt Aktif - Değişiklik Uyarısı Kaldırıldı */}

      {/* Bilgilendirme */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 mt-1" size={20} />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Bilgilendirme:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Seçtiğiniz bankalar, bu firma için TABELA kayıtlarının geçerli olacağı bankaları belirtir.</li>
                <li>Sadece Tanımlar modülünde aktif olarak tanımlanmış bankalar listelenir.</li>
                <li>Birden fazla banka seçebilirsiniz.</li>
                <li>Değişikliklerinizi kaydetmek için yukarıdaki <strong>"Kaydet"</strong> butonuna tıklayın.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}