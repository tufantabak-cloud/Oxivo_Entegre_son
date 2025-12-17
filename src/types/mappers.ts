/**
 * Type Mappers - App Types ↔ Database Types (COMPREHENSIVE VERSION)
 * 
 * Created: 2025-11-22 (Updated: 2025-12-12)
 * 
 * Bu dosya, React App'teki camelCase type'ları Supabase'deki snake_case
 * row type'larına çevirir (ve tersini yapar)
 * 
 * ✅ COMPREHENSIVE: Tüm JSONB field'lar serialize/deserialize edilir
 * ✅ FIELD MAPPING: Mevcut Supabase şemasına uyumlu
 */

import type { Customer, DomainNode, BankDeviceAssignment, DeviceSubscription, ServiceFeeInvoice, PaymentReminder, ReminderSettings, SuspensionHistoryRecord } from '../components/CustomerModule';
import type { BankPF, ContactPerson, Document, Collaboration, HakedisRecord } from '../components/BankPFModule';
import type { TabelaRecord, TabelaGroup } from '../components/TabelaTab';
import type { PayterProduct } from '../components/PayterProductTab';
import type { CustomersRow, ProductsRow, BankAccountsRow } from './database';

// ========================================
// CUSTOMER MAPPERS (FIELD MAPPING AWARE)
// ========================================

/**
 * App Customer → Database Row (camelCase → snake_case + JSONB serialize)
 * MEVCUT ŞEMA: cari_adi, tel, yetkili, vb.
 */
export function customerToRow(customer: Customer): Partial<CustomersRow> {
  return {
    id: customer.id,
    cari_hesap_kodu: customer.cariHesapKodu,
    cari_adi: customer.cariAdi || customer.firmaUnvani, // firma_unvani → cari_adi
    yetkili: customer.yetkiliKisi || null,
    tel: customer.telefon || null,
    email: customer.email || null,
    adres: customer.adres || null,
    ilce: customer.ilce || customer.il || null, // il → ilce
    vergi_dairesi: customer.vergiDairesi || null,
    vergi_no: customer.vergiNo || null,
    musteri_tipi: customer.segment || null,
    durum: customer.aktif ? 'Aktif' : 'Pasif', // aktif boolean → durum string
    bloke_durumu: customer.askida || false,
    mcc: customer.mccCode || customer.mcc || null, // mcc_code → mcc
    sektor: customer.sektor || null,
    sales_rep_name: customer.satisTemsilcisi || null,
    // ✅ COMPREHENSIVE FIELDS (JSONB)
    domain_hierarchy: customer.domainHierarchy || null,
    bank_device_assignments: customer.bankDeviceAssignments || null,
    device_subscriptions: customer.deviceSubscriptions || null,
    service_fee_invoices: customer.serviceFeeInvoices || null,
    payment_reminders: customer.paymentReminders || null,
    reminder_settings: customer.reminderSettings || null,
    suspension_history: customer.suspensionHistory || null,
    linked_bank_pf_ids: customer.linkedBankPFIds || null,
  };
}

/**
 * Database Row → App Customer (snake_case → camelCase)
 * MEVCUT ŞEMA: cari_adi, tel, yetkili, vb.
 */
export function rowToCustomer(row: CustomersRow): Partial<Customer> {
  return {
    id: row.id,
    cariHesapKodu: row.cari_hesap_kodu || '',
    cariAdi: row.cari_adi || '',
    firmaUnvani: row.cari_adi || '', // cari_adi → firma_unvani
    yetkiliKisi: row.yetkili || undefined,
    telefon: row.tel || undefined,
    email: row.email || undefined,
    adres: row.adres || undefined,
    ilce: row.ilce || undefined,
    il: row.ilce || undefined, // ilce → il
    vergiDairesi: row.vergi_dairesi || undefined,
    vergiNo: row.vergi_no || undefined,
    segment: row.musteri_tipi as any || undefined,
    durum: row.durum || 'Aktif',
    aktif: row.durum === 'Aktif', // durum string → aktif boolean
    askida: row.bloke_durumu || false,
    mccCode: row.mcc || undefined, // mcc → mcc_code
    mcc: row.mcc || undefined,
    sektor: row.sektor || undefined,
    satisTemsilcisi: row.sales_rep_name || undefined,
    // ✅ JSONB FIELDS
    domainHierarchy: row.domain_hierarchy as DomainNode | undefined,
    bankDeviceAssignments: row.bank_device_assignments as BankDeviceAssignment[] | undefined,
    deviceSubscriptions: row.device_subscriptions as DeviceSubscription[] | undefined,
    serviceFeeInvoices: row.service_fee_invoices as ServiceFeeInvoice[] | undefined,
    paymentReminders: row.payment_reminders as PaymentReminder[] | undefined,
    reminderSettings: row.reminder_settings as ReminderSettings | undefined,
    suspensionHistory: row.suspension_history as SuspensionHistoryRecord[] | undefined,
    linkedBankPFIds: row.linked_bank_pf_ids as string[] | undefined,
  };
}

// ========================================
// PRODUCT MAPPERS (TERMINAL/POS AWARE)
// ========================================

/**
 * App PayterProduct → Database Row (Terminal/POS fields)
 * MEVCUT ŞEMA: serial_number, tid, terminal_type, name
 */
export function productToRow(product: PayterProduct): Partial<ProductsRow> {
  return {
    id: product.id,
    serial_number: product.serialNumber || product.urunKodu || null, // urun_kodu → serial_number
    tid: product.tid || product.seriNo || null, // seri_no → tid
    name: product.name || product.urunAdi || 'Unknown', // urun_adi → name
    terminal_type: product.terminalType || product.kategori || null, // kategori → terminal_type
    terminal_model: product.terminalModel || product.model || null,
    domain: product.musteriId || null, // musteri_id → domain (relation)
    online_status: product.aktif || 'offline',
    sync_status: product.syncStatus || null,
    mac_address: product.macAddress || null,
    ptid: product.ptid || null,
  };
}

/**
 * Database Row → App PayterProduct (Terminal/POS fields)
 * MEVCUT ŞEMA: serial_number, tid, terminal_type, name
 */
export function rowToProduct(row: ProductsRow): Partial<PayterProduct> {
  return {
    id: row.id,
    serialNumber: row.serial_number || row.barcode || row.product_code,
    name: row.name,
    tid: row.tid || undefined,
    mid: row.mid || undefined,
    domain: row.domain || undefined,
    firmware: row.firmware || undefined,
    sam1: row.sam1 || undefined,
    sam2: row.sam2 || undefined,
    sam3: row.sam3 || undefined,
    sim: row.sim || undefined,
    terminalType: row.terminal_type || undefined,
    onlineStatus: row.online_status || undefined,
    syncStatus: row.sync_status || undefined,
    terminalModel: row.terminal_model || row.model || undefined,
    macAddress: row.mac_address || undefined,
    ptid: row.ptid || undefined,
  };
}

// ========================================
// BANKPF MAPPERS (COMPREHENSIVE)
// ========================================

/**
 * App BankPF → Database Row (JSONB serialize)
 */
export function bankPFToRow(bankPF: BankPF): Partial<BankAccountsRow> {
  return {
    id: bankPF.id,
    account_code: bankPF.muhasebeKodu,
    bank_name: bankPF.bankaPFAd,
    account_number: '', // Not used in BankPF
    iban: null,
    currency: 'TRY',
    account_type: bankPF.bankaOrPF || 'Banka',
    balance: 0,
    is_active: bankPF.durum === 'Aktif',
    notes: null,
    // ✅ BANKPF SPECIFIC FIELDS
    firma_unvan: bankPF.firmaUnvan,
    muhasebe_kodu: bankPF.muhasebeKodu,
    banka_or_pf: bankPF.bankaOrPF,
    banka_pf_ad: bankPF.bankaPFAd,
    odeme_kurulusu_tipi: bankPF.odemeKurulusuTipi || null,
    odeme_kurulusu_ad: bankPF.odemeKurulusuAd || null,
    vergi_dairesi: bankPF.vergiDairesi || null,
    vergi_no: bankPF.vergiNo || null,
    adres: bankPF.adres || null,
    telefon: bankPF.telefon || null,
    email: bankPF.email || null,
    // ✅ JSONB FIELDS
    iletisim_matrisi: bankPF.iletisimMatrisi || null,
    dokumanlar: bankPF.dokumanlar || null,
    isbirlikleri: bankPF.isbirlikleri || null,
    tabela_records: bankPF.tabelaRecords || null,
    tabela_groups: bankPF.tabelaGroups || null,
    hakedis_records: bankPF.hakedisRecords || null,
    agreement_banks: bankPF.agreementBanks || null,
    agreement_epks: bankPF.agreementEPKs || null,
    agreement_oks: bankPF.agreementOKs || null,
    linked_bank_ids: bankPF.linkedBankIds || null,
    linked_epk_ids: bankPF.linkedEPKIds || null,
    linked_ok_ids: bankPF.linkedOKIds || null,
    durum: bankPF.durum,
  };
}

/**
 * Database Row → App BankPF (JSONB deserialize)
 */
export function rowToBankPF(row: BankAccountsRow): Partial<BankPF> {
  return {
    id: row.id,
    firmaUnvan: row.firma_unvan || '',
    muhasebeKodu: row.muhasebe_kodu || row.account_code,
    bankaOrPF: (row.banka_or_pf as 'Banka' | 'PF') || 'Banka',
    bankaPFAd: row.banka_pf_ad || row.bank_name,
    odemeKurulusuTipi: (row.odeme_kurulusu_tipi as 'ÖK' | 'EPK' | '') || '',
    odemeKurulusuAd: row.odeme_kurulusu_ad || '',
    vergiDairesi: row.vergi_dairesi || '',
    vergiNo: row.vergi_no || '',
    adres: row.adres || '',
    telefon: row.telefon || '',
    email: row.email || '',
    // ✅ JSONB DESERIALIZE
    iletisimMatrisi: row.iletisim_matrisi as ContactPerson[] || [],
    dokumanlar: row.dokumanlar as Document[] || [],
    isbirlikleri: row.isbirlikleri as Collaboration[] || [],
    tabelaRecords: row.tabela_records as TabelaRecord[] || [],
    tabelaGroups: row.tabela_groups as TabelaGroup[] || [],
    hakedisRecords: row.hakedis_records as HakedisRecord[] || [],
    agreementBanks: row.agreement_banks as string[] || [],
    agreementEPKs: row.agreement_epks as string[] || [],
    agreementOKs: row.agreement_oks as string[] || [],
    linkedBankIds: row.linked_bank_ids as string[] || [],
    linkedEPKIds: row.linked_epk_ids as string[] || [],
    linkedOKIds: row.linked_ok_ids as string[] || [],
    durum: (row.durum as 'Aktif' | 'Pasif') || 'Aktif',
  };
}

// ========================================
// HELPER: Bulk Conversion
// ========================================

export function customersToRows(customers: Customer[]): Partial<CustomersRow>[] {
  return customers.map(customerToRow);
}

export function rowsToCustomers(rows: CustomersRow[]): Partial<Customer>[] {
  return rows.map(rowToCustomer);
}

export function productsToRows(products: PayterProduct[]): Partial<ProductsRow>[] {
  return products.map(productToRow);
}

export function rowsToProducts(rows: ProductsRow[]): Partial<PayterProduct>[] {
  return rows.map(rowToProduct);
}

export function bankPFsToRows(bankPFs: BankPF[]): Partial<BankAccountsRow>[] {
  return bankPFs.map(bankPFToRow);
}

export function rowsToBankPFs(rows: BankAccountsRow[]): Partial<BankPF>[] {
  return rows.map(rowToBankPF);
}