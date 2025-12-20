import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../utils/logger';
import { Users, Building2, CheckCircle2, XCircle, Loader2, Tag, BarChart3, Euro } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';

interface Customer {
  id: string;
  cariAdi: string;
  cariHesapKodu: string;
  linkedBankPfIds?: string[];
  sektor?: string | null;
  mcc?: string | null;
  serviceFeeSettings?: any;
  bank_device_assignments?: any;
}

interface BankPF {
  id: string;
  hesap_adi?: string;
  hesap_kodu?: string;
  category?: string;
  // BankPF alanları (camelCase)
  bankaPfAd?: string;
  firmaUnvan?: string;
  muhasebeKodu?: string;
  bankaOrPf?: string;
}

interface Bank {
  id: string;
  kod?: string;
  bankaAdi?: string;
  aciklama?: string;
}

interface EPK {
  id: string;
  kod?: string;
  kurumAdi?: string;
  aciklama?: string;
}

interface OK {
  id: string;
  kod?: string;
  kurumAdi?: string;
  aciklama?: string;
}

interface MCCCode {
  id: string;
  kod: string;
  kategori: string;
  aciklama?: string;
}

// ✅ NEW: Props interface
interface BulkOperationsTabProps {
  customers?: Customer[];
  bankPFRecords?: BankPF[];
  banks?: Bank[];
  epkList?: EPK[];
  okList?: OK[];
  onCustomersUpdated?: () => void; // ✅ NEW: Callback when customers are updated
}

export function BulkOperationsTab({ 
  customers: propCustomers, 
  bankPFRecords: propBankPFRecords,
  banks: propBanks,
  epkList: propEPK,
  okList: propOK,
  onCustomersUpdated // ✅ NEW: Callback prop
}: BulkOperationsTabProps = {}) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(propCustomers || []);
  const [bankPFs, setBankPFs] = useState<BankPF[]>(propBankPFRecords || []);
  const [mccCodes, setMccCodes] = useState<MCCCode[]>([]);

  // ✅ SORT: Alphabetically sorted customers
  const sortedCustomers = React.useMemo(() => {
    return [...customers].sort((a, b) => {
      const nameA = (a.cariAdi || '').toLowerCase();
      const nameB = (b.cariAdi || '').toLowerCase();
      return nameA.localeCompare(nameB, 'tr-TR');
    });
  }, [customers]);

  // ✅ COMBINE: Bank/PF + Banks + EPK + OK → Unified list
  const allBankOptions = React.useMemo(() => {
    const combinedList: Array<{value: string, label: string, source: string}> = [];
    
    // 1. Bank Accounts (bank_accounts table)
    if (propBankPFRecords) {
      propBankPFRecords.forEach(bp => {
        const name = bp.bankaPfAd || bp.firmaUnvan || bp.hesap_adi || 'İsimsiz';
        const code = bp.muhasebeKodu || bp.hesap_kodu || 'Kod Yok';
        const category = bp.bankaOrPf || bp.category || 'Hesap';
        combinedList.push({
          value: bp.id,
          label: `${name} (${code}) - ${category}`,
          source: 'bank_accounts'
        });
      });
    }
    
    // 2. Banks (banks table)
    if (propBanks) {
      propBanks.forEach(b => {
        combinedList.push({
          value: b.id,
          label: `${b.bankaAdi} (${b.kod}) - Banka`,
          source: 'banks'
        });
      });
    }
    
    // 3. EPK (epk_list table)
    if (propEPK) {
      propEPK.forEach(e => {
        combinedList.push({
          value: e.id,
          label: `${e.kurumAdi} (${e.kod}) - EPK`,
          source: 'epk'
        });
      });
    }
    
    // 4. ÖK (ok_list table)
    if (propOK) {
      propOK.forEach(o => {
        combinedList.push({
          value: o.id,
          label: `${o.kurumAdi} (${o.kod}) - ÖK`,
          source: 'ok'
        });
      });
    }
    
    logger.debug(`✅ Combined ${combinedList.length} bank options`, {
      bankAccounts: propBankPFRecords?.length || 0,
      banks: propBanks?.length || 0,
      epk: propEPK?.length || 0,
      ok: propOK?.length || 0
    });
    
    return combinedList;
  }, [propBankPFRecords, propBanks, propEPK, propOK]);

  // ❌ REMOVED: Verbose debug logs (use logger.debug if needed)

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

  // ✅ OPTIMIZE: Sync with props when they change
  useEffect(() => {
    if (propCustomers && propCustomers.length > 0) {
      setCustomers(propCustomers);
    }
  }, [propCustomers]);

  useEffect(() => {
    if (propBankPFRecords && propBankPFRecords.length > 0) {
      setBankPFs(propBankPFRecords);
    }
  }, [propBankPFRecords]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check if Supabase is available
      if (!supabase) {
        toast.error('Supabase bağlantısı mevcut değil');
        return;
      }

      // ✅ OPTIMIZE: Only fetch if not already provided via props
      if (!propCustomers || propCustomers.length === 0) {
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, cari_adi, cari_hesap_kodu, linked_bank_pf_ids, sektor, mcc, service_fee_settings, bank_device_assignments')
          .eq('is_deleted', false)
          .order('cari_adi');

        if (customersError) throw customersError;
        setCustomers(customersData || []);
      }

      // ✅ OPTIMIZE: Only fetch if not already provided via props
      if (!propBankPFRecords || propBankPFRecords.length === 0) {
        // Fetch bank/PF accounts
        const { data: bankPFData, error: bankPFError } = await supabase
          .from('bank_accounts')
          .select('id, hesap_adi, hesap_kodu, category, banka_pf_ad, firma_unvan, muhasebe_kodu, banka_or_pf')
          .eq('is_deleted', false)
          .order('hesap_adi');

        if (bankPFError) throw bankPFError;
        setBankPFs(bankPFData || []);
      }

      // Fetch MCC codes (always fetch - not passed via props)
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

    // ✅ PERFORMANCE: Show progress toast
    const toastId = toast.loading(`İşleniyor... 0/${selectedCustomers.length}`);

    try {
      // ✅ PERFORMANCE OPTIMIZATION: Batch fetch all customers first
      const { data: allCustomerData, error: batchFetchError } = await supabase
        .from('customers')
        .select('*')
        .in('id', selectedCustomers);

      if (batchFetchError) {
        logger.error('Batch fetch failed:', batchFetchError);
        toast.error('Müşteriler yüklenemedi', { id: toastId });
        return;
      }

      // ✅ Prepare all updates in memory first
      const updates = [];
      
      for (let i = 0; i < selectedCustomers.length; i++) {
        const customerId = selectedCustomers[i];
        const customerData = allCustomerData?.find(c => c.id === customerId);

        if (!customerData) {
          failCount++;
          continue;
        }

        // ✅ Update progress every 10 customers (reduce UI updates)
        if (i % 10 === 0) {
          toast.loading(`İşleniyor... ${i}/${selectedCustomers.length}`, { id: toastId });
        }

        // Get existing bank/PF IDs
        const existingBankPFIds = customerData.linked_bank_pf_ids || [];
        
        // Merge with new ones (avoid duplicates)
        const newBankPFIds = Array.from(new Set([
          ...existingBankPFIds,
          ...selectedBankPFForCustomers
        ]));

        // ✅ CRITICAL FIX: Also update bank_device_assignments (JSONB)
        let existingAssignments = [];
        if (customerData.bank_device_assignments) {
          existingAssignments = typeof customerData.bank_device_assignments === 'string'
            ? JSON.parse(customerData.bank_device_assignments)
            : customerData.bank_device_assignments;
        }

        // Create new assignments for each selected bank/PF
        const newAssignments = selectedBankPFForCustomers
          .filter(bankPFId => {
            // Don't add if already exists
            return !existingAssignments.some((a: any) => 
              a.bank_id?.includes(bankPFId)
            );
          })
          .map(bankPFId => {
            const option = allBankOptions.find(opt => opt.value === bankPFId);
            const bankPF = bankPFs.find(b => b.id === bankPFId);
            const bank = propBanks?.find(b => b.id === bankPFId);
            const epk = propEPK?.find(e => e.id === bankPFId);
            const ok = propOK?.find(o => o.id === bankPFId);

            let finalBankId = bankPFId;
            let bankName = option?.label || 'Bilinmeyen';
            let bankCode = '';

            if (bankPF) {
              finalBankId = `bank-bank-${bankPF.id}`;
              bankName = bankPF.hesap_adi || bankPF.banka_pf_ad || bankName;
              bankCode = bankPF.hesap_kodu || bankPF.muhasebe_kodu || '';
            } else if (bank) {
              finalBankId = `bank-bank-${bank.id}`;
              bankName = bank.bankaAdi || bankName;
              bankCode = bank.kod || '';
            } else if (epk) {
              finalBankId = `epk-epk-${epk.id}`;
              bankName = epk.kurumAdi || bankName;
              bankCode = epk.kod || '';
            } else if (ok) {
              finalBankId = `ok-ok-${ok.id}`;
              bankName = ok.kurumAdi || bankName;
              bankCode = ok.kod || '';
            }

            return {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              bank_id: finalBankId,
              bank_name: bankName,
              bank_code: bankCode,
              device_ids: [],
              created_at: new Date().toISOString(),
            };
          });

        const allAssignments = [...existingAssignments, ...newAssignments];
        const assignmentsJSON = JSON.stringify(allAssignments);

        // ✅ Prepare update object
        updates.push({
          id: customerId,
          linked_bank_pf_ids: newBankPFIds,
          bank_device_assignments: assignmentsJSON
        });
      }

      // ✅ PERFORMANCE: Batch update all at once (much faster!)
      toast.loading(`Kaydediliyor...`, { id: toastId });
      
      // Split into chunks of 100 for safety (Supabase limit)
      const chunkSize = 100;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        
        const { error } = await supabase
          .from('customers')
          .upsert(chunk);

        if (error) {
          logger.error(`Batch update failed for chunk ${i / chunkSize + 1}:`, error);
          failCount += chunk.length;
        } else {
          successCount += chunk.length;
        }
      }

      toast.success(`✅ ${successCount} müşteriye ${selectedBankPFForCustomers.length} Banka/PF eklendi${failCount > 0 ? `, ${failCount} hata` : ''}`, { id: toastId });
      
      // Reset selection and refresh
      setSelectedCustomers([]);
      setSelectedBankPFForCustomers([]);
      await fetchData();

      // ✅ NEW: Call callback if provided
      if (onCustomersUpdated) {
        onCustomersUpdated();
      }

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
        const existingBankPFIds = customer.linkedBankPfIds || [];
        
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

      // ✅ NEW: Call callback if provided
      if (onCustomersUpdated) {
        onCustomersUpdated();
      }

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

      // ✅ NEW: Call callback if provided
      if (onCustomersUpdated) {
        onCustomersUpdated();
      }

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

      // ✅ NEW: Call callback if provided
      if (onCustomersUpdated) {
        onCustomersUpdated();
      }

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

      // ✅ NEW: Call callback if provided
      if (onCustomersUpdated) {
        onCustomersUpdated();
      }

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
              options={allBankOptions}
              selectedValues={selectedBankPFForCustomers}
              onChangeMulti={setSelectedBankPFForCustomers}
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
              {sortedCustomers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                sortedCustomers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerSelection(customer.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.cariAdi}</div>
                      <div className="text-xs text-gray-500">
                        {customer.cariHesapKodu}
                        {customer.linkedBankPfIds && customer.linkedBankPfIds.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {customer.linkedBankPfIds.length} Banka/PF
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
              options={allBankOptions}
              selectedValues={selectedBankPF ? [selectedBankPF] : []}
              onChangeMulti={(values) => setSelectedBankPF(values[0] || '')}
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
              {sortedCustomers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                sortedCustomers.map(customer => {
                  const alreadyLinked = selectedBankPF && customer.linkedBankPfIds?.includes(selectedBankPF);
                  return (
                    <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={selectedCustomersForBankPF.includes(customer.id)}
                        onCheckedChange={() => toggleCustomerForBankPF(customer.id)}
                        disabled={alreadyLinked}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{customer.cariAdi}</div>
                        <div className="text-xs text-gray-500">
                          {customer.cariHesapKodu}
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
              onChangeMulti={(values) => setSelectedSector(values[0] || '')}
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
              {sortedCustomers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                sortedCustomers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedCustomersForSector.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerForSector(customer.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.cariAdi}</div>
                      <div className="text-xs text-gray-500">
                        {customer.cariHesapKodu}
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
              onChangeMulti={(values) => setSelectedMCC(values[0] || '')}
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
              {sortedCustomers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                sortedCustomers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedCustomersForMCC.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerForMCC(customer.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.cariAdi}</div>
                      <div className="text-xs text-gray-500">
                        {customer.cariHesapKodu}
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
              {sortedCustomers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri bulunamadı</p>
              ) : (
                sortedCustomers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedCustomersForServiceFee.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerForServiceFee(customer.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{customer.cariAdi}</div>
                      <div className="text-xs text-gray-500">
                        {customer.cariHesapKodu}
                        {customer.serviceFeeSettings && (
                          <Badge variant="secondary" className="ml-2">
                            {serviceFeePaymentType === 'monthly' ? 'Aylık' : 'Yıllık'} {customer.serviceFeeSettings.amount} TL
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