import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient'; // Oluşturduğumuz istemciyi import et
import { Customer } from './types'; // (Varsayılan tip dosyanız)
import { CustomerList } from './CustomerList';
import { CustomerDetail } from './CustomerDetail';
import { toast } from 'sonner';
import { mockCustomers } from './mockData'; // Artık bunu kullanmayacağız ama referans olarak kalsın

// Diğer importlarınız...
// import { PayterProduct } from './PayterProductTab';
// ...

// Props tanımınız (mevcut yapınıza göre güncelleyin)
interface CustomerModuleProps {
  mccList?: Array<{ kod: string; kategori: string }>;
  payterProducts?: any[]; // PayterProduct[]
  bankPFRecords?: any[]; // BankPF[]
  onBankPFNavigate?: (id: string) => void;
  banks?: any[];
  epkList?: any[];
  okList?: any[];
  salesReps?: any[];
  suspensionReasons?: any[];
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({
  mccList = [],
  payterProducts = [],
  bankPFRecords = [],
  onBankPFNavigate,
  banks = [],
  epkList = [],
  okList = [],
  salesReps = [],
  suspensionReasons = [],
}) => {
  
  // --- YENİ BÖLÜM: SUPABASE STATE ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Yükleme state'i eklendi
  const [error, setError] = useState<string | null>(null); // Hata state'i eklendi

  // --- YENİ BÖLÜM: VERİ ÇEKME (SELECT) ---
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // 'customers' sizin Supabase'deki tablo adınız olmalı
    const { data, error: fetchError } = await supabase
      .from('customers') // TABLO ADI
      .select('*');     // Tüm sütunları seç

    if (fetchError) {
      console.error('Supabase veri çekme hatası:', fetchError);
      setError('Müşteriler yüklenirken bir hata oluştu: ' + fetchError.message);
      toast.error('Müşteriler yüklenemedi.');
    } else if (data) {
      setCustomers(data);
    }
    
    setIsLoading(false);
  }, []);

  // Sayfa ilk yüklendiğinde verileri çek
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  
  // --- GÜNCELLENECEK FONKSİYONLAR ---

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCreating(false);
  };

  const handleCreateNewCustomer = () => {
    setSelectedCustomer(null);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setSelectedCustomer(null);
    setIsCreating(false);
  };

  // ----------------------------------------------------
  // VERİ EKLEME (INSERT) - (Rehbere göre güncelleyin)
  // ----------------------------------------------------
  const handleSaveCustomer = async (customer: Customer, options?: { autoSave?: boolean }) => {
    // Burası Supabase INSERT ile güncellenmeli
    // Rehber: src/supabase_kullanim_rehberi.md
    
    // Şimdilik sadece lokal state'i güncelliyoruz (Test için)
    // BU KISMI SUPABASE'E GÖRE GÜNCELLEMENİZ GEREKİYOR
    if (isCreating) {
      const newCustomer = { ...customer, id: Date.now().toString() }; // Supabase ID'yi otomatik atar
      setCustomers(prev => [...prev, newCustomer]);
      toast.success('Müşteri (lokal) eklendi');
      setIsCreating(false);
      setSelectedCustomer(newCustomer);
    } else {
      setCustomers(prev => prev.map(c => (c.id === customer.id ? customer : c)));
      if (!options?.autoSave) {
        toast.success('Müşteri (lokal) güncellendi');
      }
      setSelectedCustomer(customer);
    }
  };

  // ----------------------------------------------------
  // VERİ SİLME (DELETE) - (Rehbere göre güncelleyin)
  // ----------------------------------------------------
  const handleDeleteCustomer = async (id: string) => {
    // Burası Supabase DELETE ile güncellenmeli
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSelectedCustomer(null);
    toast.success('Müşteri (lokal) silindi');
  };

  // ----------------------------------------------------
  // RENDER BÖLÜMÜ
  // ----------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Veritabanından yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-red-50 text-red-700 border border-red-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Bağlantı Hatası</h3>
        <p className="mb-4">Müşteri verileri yüklenemedi.</p>
        <code className="text-sm bg-red-100 p-2 rounded">{error}</code>
        <Button onClick={fetchCustomers} className="mt-6">
          Tekrar Dene
        </Button>
      </div>
    );
  }

  // Veri yüklendi, detay veya liste göster
  if (selectedCustomer || isCreating) {
    return (
      <CustomerDetail
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
        onCancel={handleCancel}
        onDelete={handleDeleteCustomer}
        isCreating={isCreating}
        mccList={mccList}
        payterProducts={payterProducts}
        bankPFRecords={bankPFRecords}
        onBankPFNavigate={onBankPFNavigate}
        banks={banks}
        epkList={epkList}
        okList={okList}
        salesReps={salesReps}
        suspensionReasons={suspensionReasons}
        allCustomers={customers}
        onNavigateToCustomer={handleSelectCustomer}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Müşteri Cari Kart Listesi</h2>
          <p className="text-sm font-medium text-gray-600">
            Tüm cari bilgilerini görüntüleyin ve yönetin
          </p>
        </div>
        <Button onClick={handleCreateNewCustomer} className="flex items-center gap-2">
          {/* <Plus size={18} /> */}
          <span>Yeni Cari Kart</span>
        </Button>
      </div>
      <CustomerList
        customers={customers}
        onSelectCustomer={handleSelectCustomer}
        onUpdateCustomer={handleSaveCustomer} // Toplu durum güncellemesi için
        onUpdateCustomers={setCustomers} // Toplu işlem için
        payterProducts={payterProducts}
        bankPFRecords={bankPFRecords}
        salesReps={salesReps}
        banks={banks}
        epkList={epkList}
        okList={okList}
      />
    </div>
  );
};