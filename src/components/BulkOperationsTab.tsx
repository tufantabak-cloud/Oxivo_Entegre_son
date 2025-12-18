import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { supabase, SUPABASE_ENABLED } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { Users, Building2, CheckCircle2, XCircle, Loader2, Tag, BarChart3, Euro } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';

interface Customer {
  id: string;
  cari_adi: string;
  cari_hesap_kodu: string;
  linked_bank_pf_ids?: string[];
  sektor?: string | null;
  mcc?: string | null;
  service_fee_settings?: any;
}

interface BankPF {
  id: string;
  hesap_adi: string;
  hesap_kodu: string;
  category?: string;
}

interface MCCCode {
  id: string;
  kod: string;
  kategori: string;
  aciklama?: string;
}

export function BulkOperationsTab() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankPFs, setBankPFs] = useState<BankPF[]>([]);
  const [mccCodes, setMccCodes] = useState<MCCCode[]>([]);
  
  // Operation 1: Toplu Cari'ye Banka/PF Ekleme
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedBankPFForCustomers, setSelectedBankPFForCustomers] = useState<string[]>([]);
  
  // Operation 2: Toplu Banka/PF'ye Cari Ekleme
  const [selectedBankPF, setSelectedBankPF] = useState<string>('');
  const [selectedCustomersForBankPF, setSelectedCustomersForBankPF] = useState<string[]>([]);

  // Operation 3: Toplu Sektör Atama
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedCustomersForSector, setSelectedCustomersForSector] = useState<string[]>([]);

  // Operation 4: Toplu MCC Atama
  const [selectedMCC, setSelectedMCC] = useState<string>('');
  const [selectedCustomersForMCC, setSelectedCustomersForMCC] = useState<string[]>([]);

  // Operation 5: Toplu Hizmet Bedeli Atama
  const [serviceFeePaymentType, setServiceFeePaymentType] = useState<'monthly' | 'yearly'>('monthly');
  const [serviceFeeAmount, setServiceFeeAmount] = useState<string>('10');
  const [selectedCustomersForServiceFee, setSelectedCustomersForServiceFee] = useState<string[]>([]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check if Supabase is available
      if (!SUPABASE_ENABLED || !supabase) {
        toast.error('Supabase bağlantısı mevcut değil');
        return;
      }

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, cari_adi, cari_hesap_kodu, linked_bank_pf_ids, sektor, mcc, service_fee_settings')
        .eq('is_deleted', false)
        .order('cari_adi');

      if (customersError) throw customersError;
      setCustomers(customersData || []);

      // Fetch bank/PF accounts
      const { data: bankPFData, error: bankPFError } = await supabase
        .from('bank_accounts')
        .select('id, hesap_adi, hesap_kodu, category')
        .eq('is_deleted', false)
        .order('hesap_adi');

      if (bankPFError) throw bankPFError;
      setBankPFs(bankPFData || []);

      // Fetch MCC codes
      const { data: mccCodesData, error: mccCodesError } = await supabase
        .from('mcc_codes')
        .select('id, kod, kategori, aciklama')
        .order('kod');

      if (mccCodesError) throw mccCodesError;
      setMccCodes(mccCodesData || []);

    } catch (error: any) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Operation 1: Add Bank/PF to multiple customers
  const handleAddBankPFToCustomers = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Lütfen en az bir müşteri seçin');
      return;
    }
    if (selectedBankPFForCustomers.length === 0) {
      toast.error('Lütfen en az bir Banka/PF seçin');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const customerId of selectedCustomers) {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) continue;

        // Get existing bank/PF IDs
        const existingBankPFIds = customer.linked_bank_pf_ids || [];
        
        // Merge with new ones (avoid duplicates)
        const newBankPFIds = Array.from(new Set([
          ...existingBankPFIds,
          ...selectedBankPFForCustomers
        ]));

        // Update customer
        const { error } = await supabase
          .from('customers')
          .update({ linked_bank_pf_ids: newBankPFIds })
          .eq('id', customerId);

        if (error) {
          console.error(`Müşteri ${customer.cari_adi} güncellenemedi:`, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      toast.success(`✅ ${successCount} müşteriye Banka/PF eklendi${failCount > 0 ? `, ${failCount} hata` : ''}`);
      
      // Reset selection and refresh
      setSelectedCustomers([]);
      setSelectedBankPFForCustomers([]);
      await fetchData();

    } catch (error: any) {
      console.error('Toplu işlem hatası:', error);
      toast.error('İşlem sırasında hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Operation 2: Add multiple customers to a Bank/PF
  const handleAddCustomersToBankPF = async () => {
    if (!selectedBankPF) {
      toast.error('Lütfen bir Banka/PF seçin');
      return;
    }
    if (selectedCustomersForBankPF.length === 0) {
      toast.error('Lütfen en az bir müşteri seçin');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const customerId of selectedCustomersForBankPF) {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) continue;

        // Get existing bank/PF IDs
        const existingBankPFIds = customer.linked_bank_pf_ids || [];
        
        // Add new bank/PF if not already present
        if (!existingBankPFIds.includes(selectedBankPF)) {
          const newBankPFIds = [...existingBankPFIds, selectedBankPF];

          const { error } = await supabase
            .from('customers')
            .update({ linked_bank_pf_ids: newBankPFIds })
            .eq('id', customerId);

          if (error) {
            console.error(`Müşteri ${customer.cari_adi} güncellenemedi:`, error);
            failCount++;
          } else {
            successCount++;
          }
        }
      }

      toast.success(`✅ ${successCount} müşteri Banka/PF'ye eklendi${failCount > 0 ? `, ${failCount} hata` : ''}`);
      
      // Reset selection and refresh
      setSelectedBankPF('');
      setSelectedCustomersForBankPF([]);
      await fetchData();

    } catch (error: any) {
      console.error('Toplu işlem hatası:', error);
      toast.error('İşlem sırasında hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Operation 3: Assign sector to multiple customers
  const handleAssignSectorToCustomers = async () => {
    if (selectedCustomersForSector.length === 0) {
      toast.error('Lütfen en az bir müşteri seçin');
      return;
    }
    if (!selectedSector) {
      toast.error('Lütfen bir sektör seçin');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const customerId of selectedCustomersForSector) {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) continue;

        // Update customer
        const { error } = await supabase
          .from('customers')
          .update({ sektor: selectedSector })
          .eq('id', customerId);

        if (error) {
          console.error(`Müşteri ${customer.cari_adi} güncellenemedi:`, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      toast.success(`✅ ${successCount} müşteriye sektör atandı${failCount > 0 ? `, ${failCount} hata` : ''}`);
      
      // Reset selection and refresh
      setSelectedCustomersForSector([]);
      await fetchData();

    } catch (error: any) {
      console.error('Toplu işlem hatası:', error);
      toast.error('İşlem sırasında hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Operation 4: Assign MCC to multiple customers
  const handleAssignMCCToCustomers = async () => {
    if (selectedCustomersForMCC.length === 0) {
      toast.error('Lütfen en az bir müşteri seçin');
      return;
    }
    if (!selectedMCC) {
      toast.error('Lütfen bir MCC kodu seçin');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const customerId of selectedCustomersForMCC) {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) continue;

        // Update customer
        const { error } = await supabase
          .from('customers')
          .update({ mcc: selectedMCC })
          .eq('id', customerId);

        if (error) {
          console.error(`Müşteri ${customer.cari_adi} güncellenemedi:`, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      toast.success(`✅ ${successCount} müşteriye MCC kodu atandı${failCount > 0 ? `, ${failCount} hata` : ''}`);
      
      // Reset selection and refresh
      setSelectedCustomersForMCC([]);
      await fetchData();

    } catch (error: any) {
      console.error('Toplu işlem hatası:', error);
      toast.error('İşlem sırasında hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Operation 5: Assign service fee to multiple customers
  const handleAssignServiceFeeToCustomers = async () => {
    if (selectedCustomersForServiceFee.length === 0) {
      toast.error('Lütfen en az bir müşteri seçin');
      return;
    }
    if (!serviceFeeAmount) {
      toast.error('Lütfen bir hizmet bedeli tutarı girin');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const customerId of selectedCustomersForServiceFee) {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) continue;

        // Update customer
        const { error } = await supabase
          .from('customers')
          .update({ service_fee_settings: { payment_type: serviceFeePaymentType, amount: parseFloat(serviceFeeAmount) } })
          .eq('id', customerId);

        if (error) {
          console.error(`Müşteri ${customer.cari_adi} güncellenemedi:`, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      toast.success(`✅ ${successCount} müşteriye hizmet bedeli atandı${failCount > 0 ? `, ${failCount} hata` : ''}`);
      
      // Reset selection and refresh
      setSelectedCustomersForServiceFee([]);
      await fetchData();

    } catch (error: any) {
      console.error('Toplu işlem hatası:', error);
      toast.error('İşlem sırasında hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle customer selection for Operation 1
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Toggle all customers for Operation 1
  const toggleAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  // Toggle customer selection for Operation 2
  const toggleCustomerForBankPF = (customerId: string) => {
    setSelectedCustomersForBankPF(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Toggle all customers for Operation 2
  const toggleAllCustomersForBankPF = () => {
    if (selectedCustomersForBankPF.length === customers.length) {
      setSelectedCustomersForBankPF([]);
    } else {
      setSelectedCustomersForBankPF(customers.map(c => c.id));
    }
  };

  // Toggle customer selection for Operation 3
  const toggleCustomerForSector = (customerId: string) => {
    setSelectedCustomersForSector(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Toggle all customers for Operation 3
  const toggleAllCustomersForSector = () => {
    if (selectedCustomersForSector.length === customers.length) {
      setSelectedCustomersForSector([]);
    } else {
      setSelectedCustomersForSector(customers.map(c => c.id));
    }
  };

  // Toggle customer selection for Operation 4
  const toggleCustomerForMCC = (customerId: string) => {
    setSelectedCustomersForMCC(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Toggle all customers for Operation 4
  const toggleAllCustomersForMCC = () => {
    if (selectedCustomersForMCC.length === customers.length) {
      setSelectedCustomersForMCC([]);
    } else {
      setSelectedCustomersForMCC(customers.map(c => c.id));
    }
  };

  // Toggle customer selection for Operation 5
  const toggleCustomerForServiceFee = (customerId: string) => {
    setSelectedCustomersForServiceFee(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Toggle all customers for Operation 5
  const toggleAllCustomersForServiceFee = () => {
    if (selectedCustomersForServiceFee.length === customers.length) {
      setSelectedCustomersForServiceFee([]);
    } else {
      setSelectedCustomersForServiceFee(customers.map(c => c.id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Toplu İşlemler</h3>
        <p className="text-sm text-gray-600">Müşteriler ve Banka/PF hesapları arasında toplu ilişkilendirme yapın</p>
      </div>

      {/* Operation 1: Add Bank/PF to multiple customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            1. Toplu Müşterilere Banka/PF Ekleme
          </CardTitle>
          <CardDescription>
            Seçili müşterilere toplu olarak Banka/PF kategorisi ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select Bank/PF */}
          <div className="space-y-2">
            <Label>Eklenecek Banka/PF Hesapları ({selectedBankPFForCustomers.length} seçili)</Label>
            <FilterDropdown
              label="Banka/PF Seç"
              options={bankPFs.map(bp => ({
                value: bp.id,
                label: `${bp.hesap_adi} (${bp.hesap_kodu})${bp.category ? ` - ${bp.category}` : ''}`
              }))}
              selectedValues={selectedBankPFForCustomers}
              onChange={setSelectedBankPFForCustomers}
              multiSelect
              clearable
            />
          </div>

          {/* Select Customers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Müşteri Seçimi ({selectedCustomers.length}/{customers.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCustomers}
              >
                {selectedCustomers.length === customers.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {customers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                customers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerSelection(customer.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.cari_adi}</div>
                      <div className="text-xs text-gray-500">
                        {customer.cari_hesap_kodu}
                        {customer.linked_bank_pf_ids && customer.linked_bank_pf_ids.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {customer.linked_bank_pf_ids.length} Banka/PF
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAddBankPFToCustomers}
            disabled={loading || selectedCustomers.length === 0 || selectedBankPFForCustomers.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {selectedCustomers.length} Müşteriye {selectedBankPFForCustomers.length} Banka/PF Ekle
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Operation 2: Add multiple customers to a Bank/PF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            2. Banka/PF'ye Toplu Müşteri Ekleme
          </CardTitle>
          <CardDescription>
            Bir Banka/PF hesabına toplu olarak müşteri ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select Bank/PF */}
          <div className="space-y-2">
            <Label>Banka/PF Hesabı Seçin</Label>
            <FilterDropdown
              label="Banka/PF Seç"
              options={bankPFs.map(bp => ({
                value: bp.id,
                label: `${bp.hesap_adi} (${bp.hesap_kodu})${bp.category ? ` - ${bp.category}` : ''}`
              }))}
              selectedValues={selectedBankPF ? [selectedBankPF] : []}
              onChange={(values) => setSelectedBankPF(values[0] || '')}
              clearable
            />
          </div>

          {/* Select Customers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Eklenecek Müşteriler ({selectedCustomersForBankPF.length}/{customers.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCustomersForBankPF}
              >
                {selectedCustomersForBankPF.length === customers.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {customers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                customers.map(customer => {
                  const alreadyLinked = selectedBankPF && customer.linked_bank_pf_ids?.includes(selectedBankPF);
                  return (
                    <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={selectedCustomersForBankPF.includes(customer.id)}
                        onCheckedChange={() => toggleCustomerForBankPF(customer.id)}
                        disabled={alreadyLinked}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{customer.cari_adi}</div>
                        <div className="text-xs text-gray-500">
                          {customer.cari_hesap_kodu}
                          {alreadyLinked && (
                            <Badge variant="secondary" className="ml-2">
                              Zaten Ekli
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAddCustomersToBankPF}
            disabled={loading || !selectedBankPF || selectedCustomersForBankPF.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {selectedCustomersForBankPF.length} Müşteriyi Ekle
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Operation 3: Assign sector to multiple customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            3. Toplu Sektör Atama
          </CardTitle>
          <CardDescription>
            Seçili müşterilere toplu olarak sektör atayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select Sector */}
          <div className="space-y-2">
            <Label>Sektör Seçin</Label>
            <FilterDropdown
              label="Sektör Seç"
              options={[
                { value: 'Retail', label: 'Retail' },
                { value: 'Wholesale', label: 'Wholesale' },
                { value: 'E-commerce', label: 'E-commerce' },
                { value: 'Healthcare', label: 'Healthcare' },
                { value: 'Education', label: 'Education' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Technology', label: 'Technology' },
                { value: 'Manufacturing', label: 'Manufacturing' },
                { value: 'Transportation', label: 'Transportation' },
                { value: 'Logistics', label: 'Logistics' },
                { value: 'Energy', label: 'Energy' },
                { value: 'Telecommunications', label: 'Telecommunications' },
                { value: 'Real Estate', label: 'Real Estate' },
                { value: 'Agriculture', label: 'Agriculture' },
                { value: 'Construction', label: 'Construction' },
                { value: 'Retail', label: 'Retail' },
                { value: 'Other', label: 'Diğer' }
              ]}
              selectedValues={selectedSector ? [selectedSector] : []}
              onChange={(values) => setSelectedSector(values[0] || '')}
              clearable
            />
          </div>

          {/* Select Customers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Eklenecek Müşteriler ({selectedCustomersForSector.length}/{customers.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCustomersForSector}
              >
                {selectedCustomersForSector.length === customers.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {customers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                customers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedCustomersForSector.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerForSector(customer.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.cari_adi}</div>
                      <div className="text-xs text-gray-500">
                        {customer.cari_hesap_kodu}
                        {customer.sektor && (
                          <Badge variant="secondary" className="ml-2">
                            {customer.sektor}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAssignSectorToCustomers}
            disabled={loading || selectedCustomersForSector.length === 0 || !selectedSector}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {selectedCustomersForSector.length} Müşteriye Sektör Ata
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Operation 4: Assign MCC to multiple customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            4. Toplu MCC Atama
          </CardTitle>
          <CardDescription>
            Seçili müşterilere toplu olarak MCC kodu atayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select MCC */}
          <div className="space-y-2">
            <Label>MCC Kodu Seçin</Label>
            <FilterDropdown
              label="MCC Kodu Seç"
              options={mccCodes.map(mcc => ({
                value: mcc.id,
                label: `${mcc.kod} - ${mcc.kategori}${mcc.aciklama ? ` (${mcc.aciklama})` : ''}`
              }))}
              selectedValues={selectedMCC ? [selectedMCC] : []}
              onChange={(values) => setSelectedMCC(values[0] || '')}
              clearable
            />
          </div>

          {/* Select Customers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Eklenecek Müşteriler ({selectedCustomersForMCC.length}/{customers.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCustomersForMCC}
              >
                {selectedCustomersForMCC.length === customers.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {customers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                customers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedCustomersForMCC.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerForMCC(customer.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.cari_adi}</div>
                      <div className="text-xs text-gray-500">
                        {customer.cari_hesap_kodu}
                        {customer.mcc && (
                          <Badge variant="secondary" className="ml-2">
                            {customer.mcc}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAssignMCCToCustomers}
            disabled={loading || selectedCustomersForMCC.length === 0 || !selectedMCC}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {selectedCustomersForMCC.length} Müşteriye MCC Kodu Ata
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Operation 5: Assign service fee to multiple customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            5. Toplu Hizmet Bedeli Atama
          </CardTitle>
          <CardDescription>
            Seçili müşterilere toplu olarak hizmet bedeli atayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select Service Fee Payment Type */}
          <div className="space-y-2">
            <Label>Hizmet Bedeli Ödeme Türü</Label>
            <FilterDropdown
              label="Ödeme Türü Seç"
              options={[
                { value: 'monthly', label: 'Aylık' },
                { value: 'yearly', label: 'Yıllık' }
              ]}
              selectedValues={[serviceFeePaymentType]}
              onChange={(values) => setServiceFeePaymentType((values[0] || 'monthly') as 'monthly' | 'yearly')}
            />
          </div>

          {/* Select Service Fee Amount */}
          <div className="space-y-2">
            <Label>Hizmet Bedeli Tutarı</Label>
            <Input
              type="number"
              value={serviceFeeAmount}
              onChange={(e) => setServiceFeeAmount(e.target.value)}
              placeholder="Tutar"
            />
          </div>

          {/* Select Customers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Eklenecek Müşteriler ({selectedCustomersForServiceFee.length}/{customers.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCustomersForServiceFee}
              >
                {selectedCustomersForServiceFee.length === customers.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {customers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                customers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedCustomersForServiceFee.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerForServiceFee(customer.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.cari_adi}</div>
                      <div className="text-xs text-gray-500">
                        {customer.cari_hesap_kodu}
                        {customer.service_fee_settings && (
                          <Badge variant="secondary" className="ml-2">
                            {serviceFeePaymentType === 'monthly' ? 'Aylık' : 'Yıllık'} {customer.service_fee_settings.amount} TL
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAssignServiceFeeToCustomers}
            disabled={loading || selectedCustomersForServiceFee.length === 0 || !serviceFeeAmount}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {selectedCustomersForServiceFee.length} Müşteriye Hizmet Bedeli Ata
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}