/**
 * Supabase Database Type Definitions
 * Auto-generated from your SQL schema
 * 
 * Created: 2025-11-22
 * 
 * NOTE: Bu dosya Supabase'deki tablo yapılarını TypeScript'e map eder
 */

// ========================================
// DATABASE ROW TYPES (snake_case)
// ========================================

export interface CustomersRow {
  id: string;
  customer_code: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  tax_office: string | null;
  tax_number: string | null;
  customer_type: string;
  balance: number;
  credit_limit: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // ========================================
  // 🆕 COMPREHENSIVE FIELDS (JSONB)
  // ========================================
  domain_hierarchy: any | null; // JSONB - DomainNode tree structure
  bank_device_assignments: any | null; // JSONB - BankDeviceAssignment[]
  device_subscriptions: any | null; // JSONB - DeviceSubscription[]
  service_fee_invoices: any | null; // JSONB - ServiceFeeInvoice[]
  payment_reminders: any | null; // JSONB - PaymentReminder[]
  reminder_settings: any | null; // JSONB - ReminderSettings
  suspension_history: any | null; // JSONB - SuspensionHistoryRecord[]
  linked_bankpf_ids: any | null; // JSONB - string[] (BankPF IDs)
  mcc_code: string | null; // MCC kodu
  sector: string | null; // Sektör
  segment: string | null; // Müşteri segmenti
}

export interface BankAccountsRow {
  id: string;
  account_code: string;
  bank_name: string;
  branch_name: string | null;
  account_number: string;
  iban: string | null;
  currency: string;
  account_type: string;
  balance: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // ========================================
  // 🆕 BANKPF COMPREHENSIVE FIELDS
  // ========================================
  firma_unvan: string | null; // Firma ünvanı
  muhasebe_kodu: string | null; // Muhasebe kodu
  banka_or_pf: string | null; // 'Banka' veya 'PF'
  banka_pf_ad: string | null; // Banka/PF adı
  odeme_kurulusu_tipi: string | null; // 'ÖK', 'EPK' veya ''
  odeme_kurulusu_ad: string | null; // Ödeme kuruluşu adı
  vergi_dairesi: string | null; // Vergi dairesi
  vergi_no: string | null; // Vergi numarası
  adres: string | null; // Adres
  telefon: string | null; // Telefon
  email: string | null; // Email
  iletisim_matrisi: any | null; // JSONB - ContactPerson[]
  dokumanlar: any | null; // JSONB - Document[]
  isbirlikleri: any | null; // JSONB - Collaboration[]
  tabela_records: any | null; // JSONB - TabelaRecord[]
  tabela_groups: any | null; // JSONB - TabelaGroup[]
  hakedis_records: any | null; // JSONB - HakedisRecord[]
  agreement_banks: any | null; // JSONB - string[] (Bank IDs)
  agreement_epks: any | null; // JSONB - string[] (EPK IDs)
  agreement_oks: any | null; // JSONB - string[] (OK IDs)
  linked_bank_ids: any | null; // JSONB - string[] (Bağlı Banka ID'leri)
  linked_epk_ids: any | null; // JSONB - string[] (Bağlı EPK ID'leri)
  linked_ok_ids: any | null; // JSONB - string[] (Bağlı ÖK ID'leri)
  durum: string | null; // 'Aktif' veya 'Pasif'
}

export interface PettyCashRow {
  id: string;
  cash_code: string;
  name: string;
  responsible_person: string | null;
  balance: number;
  currency: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CategoriesRow {
  id: string;
  category_code: string;
  name: string;
  category_type: string;
  parent_id: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TransactionsRow {
  id: string;
  transaction_code: string;
  transaction_date: string;
  transaction_type: string;
  customer_id: string | null;
  bank_account_id: string | null;
  petty_cash_id: string | null;
  category_id: string | null;
  amount: number;
  currency: string;
  exchange_rate: number;
  target_bank_account_id: string | null;
  target_petty_cash_id: string | null;
  description: string | null;
  notes: string | null;
  document_number: string | null;
  status: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface SignsRow {
  id: string;
  sign_code: string;
  customer_id: string | null;
  sign_name: string;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  area: number | null;
  unit: string;
  sign_type: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  monthly_rent: number | null;
  status: string;
  installation_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  notes: string | null;
  photos: any | null; // JSONB
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface IncomeRecordsRow {
  id: string;
  income_code: string;
  transaction_id: string | null;
  customer_id: string | null;
  sign_id: string | null;
  category_id: string | null;
  income_date: string;
  amount: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  period_month: number | null;
  period_year: number | null;
  payment_method: string | null;
  payment_status: string;
  description: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProductsRow {
  id: string;
  product_code: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  currency: string;
  tax_rate: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number | null;
  supplier_name: string | null;
  supplier_code: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  size: string | null;
  weight: number | null;
  image_url: string | null;
  images: any | null; // JSONB
  notes: string | null;
  is_active: boolean;
  is_for_sale: boolean;
  is_for_purchase: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // ========================================
  // 🆕 PAYTER PRODUCT SPECIFIC FIELDS
  // ========================================
  serial_number: string | null; // Serial number
  tid: string | null; // Terminal ID
  mid: string | null; // Merchant ID
  domain: string | null; // Domain/URL
  firmware: string | null; // Firmware version
  sam1: string | null; // SAM slot 1
  sam2: string | null; // SAM slot 2
  sam3: string | null; // SAM slot 3
  sim: string | null; // SIM card info
  terminal_type: string | null; // Terminal type
  online_status: string | null; // Online/Offline
  sync_status: string | null; // Sync status
  terminal_model: string | null; // Terminal model
  mac_address: string | null; // MAC address
  ptid: string | null; // PTID
}

export interface DomainMappingsRow {
  id: string;
  mapping_code: string;
  domain_name: string;
  subdomain: string | null;
  full_domain: string;
  customer_id: string | null;
  sign_id: string | null;
  ssl_enabled: boolean;
  ssl_certificate_expiry: string | null;
  dns_status: string;
  dns_records: any | null; // JSONB
  redirect_url: string | null;
  redirect_type: string | null;
  status: string;
  verified: boolean;
  verification_token: string | null;
  verified_at: string | null;
  registered_date: string | null;
  expiry_date: string | null;
  last_checked_at: string | null;
  visit_count: number;
  last_visit_at: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ========================================
// DATABASE INSERT TYPES (Omit auto-generated)
// ========================================

export type CustomersInsert = Omit<CustomersRow, 'id' | 'created_at' | 'updated_at'>;
export type BankAccountsInsert = Omit<BankAccountsRow, 'id' | 'created_at' | 'updated_at'>;
export type PettyCashInsert = Omit<PettyCashRow, 'id' | 'created_at' | 'updated_at'>;
export type CategoriesInsert = Omit<CategoriesRow, 'id' | 'created_at' | 'updated_at'>;
export type TransactionsInsert = Omit<TransactionsRow, 'id' | 'created_at' | 'updated_at'>;
export type SignsInsert = Omit<SignsRow, 'id' | 'created_at' | 'updated_at'>;
export type IncomeRecordsInsert = Omit<IncomeRecordsRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductsInsert = Omit<ProductsRow, 'id' | 'created_at' | 'updated_at'>;
export type DomainMappingsInsert = Omit<DomainMappingsRow, 'id' | 'created_at' | 'updated_at'>;

// ========================================
// DATABASE UPDATE TYPES (All optional)
// ========================================

export type CustomersUpdate = Partial<CustomersInsert>;
export type BankAccountsUpdate = Partial<BankAccountsInsert>;
export type PettyCashUpdate = Partial<PettyCashInsert>;
export type CategoriesUpdate = Partial<CategoriesInsert>;
export type TransactionsUpdate = Partial<TransactionsInsert>;
export type SignsUpdate = Partial<SignsInsert>;
export type IncomeRecordsUpdate = Partial<IncomeRecordsInsert>;
export type ProductsUpdate = Partial<ProductsInsert>;
export type DomainMappingsUpdate = Partial<DomainMappingsInsert>;

// ========================================
// DATABASE TYPE (Supabase SDK)
// ========================================

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: CustomersRow;
        Insert: CustomersInsert;
        Update: CustomersUpdate;
      };
      bank_accounts: {
        Row: BankAccountsRow;
        Insert: BankAccountsInsert;
        Update: BankAccountsUpdate;
      };
      petty_cash: {
        Row: PettyCashRow;
        Insert: PettyCashInsert;
        Update: PettyCashUpdate;
      };
      categories: {
        Row: CategoriesRow;
        Insert: CategoriesInsert;
        Update: CategoriesUpdate;
      };
      transactions: {
        Row: TransactionsRow;
        Insert: TransactionsInsert;
        Update: TransactionsUpdate;
      };
      signs: {
        Row: SignsRow;
        Insert: SignsInsert;
        Update: SignsUpdate;
      };
      income_records: {
        Row: IncomeRecordsRow;
        Insert: IncomeRecordsInsert;
        Update: IncomeRecordsUpdate;
      };
      products: {
        Row: ProductsRow;
        Insert: ProductsInsert;
        Update: ProductsUpdate;
      };
      domain_mappings: {
        Row: DomainMappingsRow;
        Insert: DomainMappingsInsert;
        Update: DomainMappingsUpdate;
      };
    };
    Views: {
      customer_balance_summary: {
        Row: {
          id: string;
          customer_code: string;
          name: string;
          balance: number;
          credit_limit: number;
          transaction_count: number;
          total_invoiced: number;
          total_paid: number;
        };
      };
      monthly_income_report: {
        Row: {
          period_year: number;
          period_month: number;
          record_count: number;
          total_income: number;
          currency: string;
        };
      };
      bank_account_summary: {
        Row: {
          id: string;
          account_code: string;
          bank_name: string;
          balance: number;
          transaction_count: number;
          total_credit: number;
          total_debit: number;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}