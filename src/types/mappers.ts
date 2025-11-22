/**
 * Type Mappers - App Types ↔ Database Types (COMPREHENSIVE VERSION)
 * 
 * Created: 2025-11-22 (Updated)
 * 
 * Bu dosya, React App'teki camelCase type'ları Supabase'deki snake_case
 * row type'larına çevirir (ve tersini yapar)
 * 
 * ✅ COMPREHENSIVE: Tüm JSONB field'lar serialize/deserialize edilir
 */

import type { Customer, DomainNode, BankDeviceAssignment, DeviceSubscription, ServiceFeeInvoice, PaymentReminder, ReminderSettings, SuspensionHistoryRecord } from '../components/CustomerModule';
import type { BankPF, ContactPerson, Document, Collaboration, HakedisRecord } from '../components/BankPFModule';
import type { TabelaRecord, TabelaGroup } from '../components/TabelaTab';
import type { PayterProduct } from '../components/PayterProductTab';
import type { CustomersRow, ProductsRow, BankAccountsRow } from './database';

// ========================================
// CUSTOMER MAPPERS (COMPREHENSIVE)
// ========================================

/**
 * App Customer → Database Row (camelCase → snake_case + JSONB serialize)
 */
export function customerToRow(customer: Customer): Partial<CustomersRow> {
  return {
    id: customer.id,
    customer_code: customer.cariHesapKodu,
    name: customer.cariAdi,
    contact_person: customer.yetkiliKisi || null,
    phone: customer.telefon || null,
    email: customer.email || null,
    address: customer.adres || null,
    city: customer.il || null,
    tax_office: customer.vergiDairesi || null,
    tax_number: customer.vergiNo || null,
    customer_type: customer.segment || 'individual',
    balance: 0, // TODO: Calculate from transactions
    credit_limit: 0, // TODO: From settings
    notes: customer.notlar || null,
    is_active: customer.durum === 'Aktif',
    // ✅ COMPREHENSIVE FIELDS (JSONB)
    domain_hierarchy: customer.domainHierarchy || null,
    bank_device_assignments: customer.bankDeviceAssignments || null,
    device_subscriptions: customer.deviceSubscriptions || null,
    service_fee_invoices: customer.serviceFeeInvoices || null,
    payment_reminders: customer.paymentReminders || null,
    reminder_settings: customer.reminderSettings || null,
    suspension_history: customer.suspensionHistory || null,
    linked_bankpf_ids: customer.linkedBankPFIds || null,
    mcc_code: customer.mcc || null,
    sector: customer.sektor || null,
    segment: customer.segment || null,
  };
}

/**
 * Database Row → App Customer (camelCase schema uyumlu)
 */
export function rowToCustomer(row: CustomersRow): Partial<Customer> {
  return {
    id: row.id,
    cariHesapKodu: row.customer_code || (row as any).cariHesapKodu || '',
    cariAdi: row.name || (row as any).cariAdi || '',
    yetkiliKisi: row.contact_person || (row as any).yetkili || (row as any).sorumluKisi || undefined,
    telefon: row.phone || (row as any).telefon || (row as any).tel || undefined,
    email: row.email || (row as any).email || undefined,
    adres: row.address || (row as any).adres || undefined,
    il: row.city || (row as any).il || undefined,
    vergiDairesi: row.tax_office || (row as any).vergiDairesi || undefined,
    vergiNo: row.tax_number || (row as any).vergiNo || undefined,
    segment: (row.customer_type || (row as any).segment) as any,
    notlar: row.notes || undefined,
    durum: row.is_active ? 'Aktif' : ((row as any).durum || 'Pasif'),
    // ✅ JSONB FIELDS (camelCase schema'dan okuma)
    domainHierarchy: (row.domain_hierarchy || (row as any).domainHierarchy || (row as any).domainHiyerarsisi) as DomainNode | undefined,
    bankDeviceAssignments: (row.bank_device_assignments || (row as any).bankDeviceAssignments) as BankDeviceAssignment[] | undefined,
    deviceSubscriptions: (row.device_subscriptions || (row as any).deviceSubscriptions) as DeviceSubscription[] | undefined,
    serviceFeeInvoices: (row.service_fee_invoices || (row as any).serviceFeeInvoices) as ServiceFeeInvoice[] | undefined,
    paymentReminders: (row.payment_reminders || (row as any).paymentReminders) as PaymentReminder[] | undefined,
    reminderSettings: (row.reminder_settings || (row as any).reminderSettings) as ReminderSettings | undefined,
    suspensionHistory: (row.suspension_history || (row as any).suspensionHistory) as SuspensionHistoryRecord[] | undefined,
    linkedBankPFIds: (row.linked_bankpf_ids || (row as any).linkedBankPFIds) as string[] | undefined,
    mcc: (row.mcc_code || (row as any).mcc) || undefined,
    sektor: (row.sector || (row as any).sektor) || undefined,
  };
}

// ========================================
// PRODUCT MAPPERS (COMPREHENSIVE)
// ========================================

/**
 * App PayterProduct → Database Row (ALL FIELDS)
 */
export function productToRow(product: PayterProduct): Partial<ProductsRow> {
  return {
    id: product.id,
    product_code: product.serialNumber || product.tid || '',
    barcode: product.serialNumber || null,
    name: product.name || product.serialNumber || 'Unknown',
    description: product.terminalType || null,
    unit: 'piece',
    purchase_price: 0,
    sale_price: 0,
    currency: 'EUR',
    tax_rate: 0,
    stock_quantity: 1,
    min_stock_level: 0,
    brand: 'Payter',
    model: product.terminalModel || null,
    is_active: true,
    is_for_sale: true,
    is_for_purchase: false,
    // ✅ PAYTER SPECIFIC FIELDS (Direct mapping)
    serial_number: product.serialNumber || null,
    tid: product.tid || null,
    mid: product.mid || null,
    domain: product.domain || null,
    firmware: product.firmware || null,
    sam1: product.sam1 || null,
    sam2: product.sam2 || null,
    sam3: product.sam3 || null,
    sim: product.sim || null,
    terminal_type: product.terminalType || null,
    online_status: product.onlineStatus || null,
    sync_status: product.syncStatus || null,
    terminal_model: product.terminalModel || null,
    mac_address: product.macAddress || null,
    ptid: product.ptid || null,
  };
}

/**
 * Database Row → App PayterProduct (ALL FIELDS)
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