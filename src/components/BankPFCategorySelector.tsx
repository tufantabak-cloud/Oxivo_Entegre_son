import { useState, useEffect } from 'react';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { Label } from './ui/label';

export interface Bank {
  id: string;
  kod: string;
  bankaAdi: string;
  aktif: boolean;
}

export interface EPK {
  id: string;
  kod: string;
  kurumAdi: string;
  aktif: boolean;
}

export interface OK {
  id: string;
  kod: string;
  kurumAdi: string;
  aktif: boolean;
}

interface BankPFCategorySelectorProps {
  banks: Bank[];
  epkList: EPK[];
  okList: OK[];
  selectedBankIds?: string[];
  selectedEPKIds?: string[];
  selectedOKIds?: string[];
  onSelectionChange?: (data: {
    banks: string[];
    epks: string[];
    oks: string[];
  }) => void;
}

export function BankPFCategorySelector({
  banks = [],
  epkList = [],
  okList = [],
  selectedBankIds = [],
  selectedEPKIds = [],
  selectedOKIds = [],
  onSelectionChange,
}: BankPFCategorySelectorProps) {
  // Debug log
  console.log('🏦 BankPFCategorySelector yüklendi:', {
    bankaSayısı: banks.length,
    epkSayısı: epkList.length,
    okSayısı: okList.length,
    seçiliBankalar: selectedBankIds.length,
    seçiliEPKler: selectedEPKIds.length,
    seçiliÖKler: selectedOKIds.length,
  });
  
  const [selectedBanks, setSelectedBanks] = useState<string[]>(selectedBankIds);
  const [selectedEPKs, setSelectedEPKs] = useState<string[]>(selectedEPKIds);
  const [selectedOKs, setSelectedOKs] = useState<string[]>(selectedOKIds);
  
  const [searchBanks, setSearchBanks] = useState('');
  const [searchEPK, setSearchEPK] = useState('');
  const [searchOK, setSearchOK] = useState('');

  // Prop'lar değiştiğinde local state'i güncelle (kaybolma sorununu çözer)
  useEffect(() => {
    setSelectedBanks(selectedBankIds);
  }, [JSON.stringify(selectedBankIds)]);

  useEffect(() => {
    setSelectedEPKs(selectedEPKIds);
  }, [JSON.stringify(selectedEPKIds)]);

  useEffect(() => {
    setSelectedOKs(selectedOKIds);
  }, [JSON.stringify(selectedOKIds)]);

  // Sadece aktif kayıtları filtrele
  const activeBanks = banks.filter(b => b.aktif);
  const activeEPKs = epkList.filter(e => e.aktif);
  const activeOKs = okList.filter(o => o.aktif);

  // Arama filtreleri
  const filteredBanks = activeBanks.filter(bank =>
    bank.bankaAdi.toLowerCase().includes(searchBanks.toLowerCase()) ||
    bank.kod.toLowerCase().includes(searchBanks.toLowerCase())
  );

  const filteredEPKs = activeEPKs.filter(epk =>
    epk.kurumAdi.toLowerCase().includes(searchEPK.toLowerCase()) ||
    epk.kod.toLowerCase().includes(searchEPK.toLowerCase())
  );

  const filteredOKs = activeOKs.filter(ok =>
    ok.kurumAdi.toLowerCase().includes(searchOK.toLowerCase()) ||
    ok.kod.toLowerCase().includes(searchOK.toLowerCase())
  );

  const handleBankToggle = (bankId: string) => {
    const newSelection = selectedBanks.includes(bankId)
      ? selectedBanks.filter(id => id !== bankId)
      : [...selectedBanks, bankId];
    
    setSelectedBanks(newSelection);
    onSelectionChange?.({
      banks: newSelection,
      epks: selectedEPKs,
      oks: selectedOKs,
    });
  };

  const handleEPKToggle = (epkId: string) => {
    const newSelection = selectedEPKs.includes(epkId)
      ? selectedEPKs.filter(id => id !== epkId)
      : [...selectedEPKs, epkId];
    
    setSelectedEPKs(newSelection);
    onSelectionChange?.({
      banks: selectedBanks,
      epks: newSelection,
      oks: selectedOKs,
    });
  };

  const handleOKToggle = (okId: string) => {
    const newSelection = selectedOKs.includes(okId)
      ? selectedOKs.filter(id => id !== okId)
      : [...selectedOKs, okId];
    
    setSelectedOKs(newSelection);
    onSelectionChange?.({
      banks: selectedBanks,
      epks: selectedEPKs,
      oks: newSelection,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Bankalar Kolonu */}
        <div className="space-y-3">
          <div className="bg-gray-100 border border-gray-300 px-3 py-2 rounded-t">
            <h3 className="text-sm font-medium text-gray-900">Bankalar</h3>
          </div>
          
          {/* Arama */}
          <div className="relative px-2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Banka ara..."
              value={searchBanks}
              onChange={(e) => setSearchBanks(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Liste */}
          <div className="border border-gray-300 rounded h-80 overflow-y-auto bg-white">
            {filteredBanks.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Aktif banka bulunamadı
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleBankToggle(bank.id)}
                  >
                    <Checkbox
                      checked={selectedBanks.includes(bank.id)}
                      onCheckedChange={() => handleBankToggle(bank.id)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm text-gray-600 tabular-nums shrink-0">
                        {bank.kod}
                      </span>
                      <span className="text-sm text-gray-900 truncate" title={bank.bankaAdi}>
                        {bank.bankaAdi}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-2 text-xs text-gray-500">
            {selectedBanks.length} seçili
          </div>
        </div>

        {/* EPK Kolonu */}
        <div className="space-y-3">
          <div className="bg-gray-100 border border-gray-300 px-3 py-2 rounded-t">
            <h3 className="text-sm font-medium text-gray-900">EPK</h3>
          </div>
          
          {/* Arama */}
          <div className="relative px-2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="EPK ara..."
              value={searchEPK}
              onChange={(e) => setSearchEPK(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Liste */}
          <div className="border border-gray-300 rounded h-80 overflow-y-auto bg-white">
            {filteredEPKs.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Aktif EPK bulunamadı
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredEPKs.map((epk) => (
                  <div
                    key={epk.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEPKToggle(epk.id)}
                  >
                    <Checkbox
                      checked={selectedEPKs.includes(epk.id)}
                      onCheckedChange={() => handleEPKToggle(epk.id)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm text-gray-600 tabular-nums shrink-0">
                        {epk.kod}
                      </span>
                      <span className="text-sm text-gray-900 truncate" title={epk.kurumAdi}>
                        {epk.kurumAdi}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-2 text-xs text-gray-500">
            {selectedEPKs.length} seçili
          </div>
        </div>

        {/* ÖK Kolonu */}
        <div className="space-y-3">
          <div className="bg-gray-100 border border-gray-300 px-3 py-2 rounded-t">
            <h3 className="text-sm font-medium text-gray-900">ÖK</h3>
          </div>
          
          {/* Arama */}
          <div className="relative px-2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="ÖK ara..."
              value={searchOK}
              onChange={(e) => setSearchOK(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Liste */}
          <div className="border border-gray-300 rounded h-80 overflow-y-auto bg-white">
            {filteredOKs.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Aktif ÖK bulunamadı
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredOKs.map((ok) => (
                  <div
                    key={ok.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOKToggle(ok.id)}
                  >
                    <Checkbox
                      checked={selectedOKs.includes(ok.id)}
                      onCheckedChange={() => handleOKToggle(ok.id)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm text-gray-600 tabular-nums shrink-0">
                        {ok.kod}
                      </span>
                      <span className="text-sm text-gray-900 truncate" title={ok.kurumAdi}>
                        {ok.kurumAdi}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-2 text-xs text-gray-500">
            {selectedOKs.length} seçili
          </div>
        </div>
      </div>

      {/* Seçim Özeti */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div className="text-sm">
              <span className="text-gray-600">Toplam Seçili:</span>{' '}
              <span className="font-medium text-gray-900">
                {selectedBanks.length + selectedEPKs.length + selectedOKs.length}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Banka:</span>{' '}
              <span className="font-medium text-blue-600">{selectedBanks.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">EPK:</span>{' '}
              <span className="font-medium text-green-600">{selectedEPKs.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">ÖK:</span>{' '}
              <span className="font-medium text-purple-600">{selectedOKs.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
