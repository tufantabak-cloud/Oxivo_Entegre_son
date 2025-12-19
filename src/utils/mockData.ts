/**
 * Mock Data for Figma Make Environment
 * 
 * Purpose: Provide sample data when Supabase is not available
 * Used ONLY in Figma Make development environment
 * 
 * ✅ All mock objects EXACTLY match TypeScript interfaces
 */

import type { Customer } from '../components/CustomerModule';
import type { BankPF } from '../components/BankPFModule';
import type { 
  MCC, 
  Bank, 
  EPK, 
  OK, 
  SalesRepresentative, 
  JobTitle,
  Partnership,
  Sharing,
  KartProgram,
  SuspensionReason
} from '../components/DefinitionsModule';
import type { TabelaRecord } from '../components/TabelaTab';
import type { PayterProduct } from '../components/PayterProductTab';

// ========================================
// MOCK MCC LIST
// ========================================
export const mockMCCList: MCC[] = [
  { id: '1', kod: '5812', kategori: 'Yiyecek & İçecek', aciklama: 'Restoran', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '2', kod: '5411', kategori: 'Perakende', aciklama: 'Market', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '3', kod: '5999', kategori: 'Perakende', aciklama: 'Diğer Perakende', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '4', kod: '5814', kategori: 'Yiyecek & İçecek', aciklama: 'Fast Food', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '5', kod: '5813', kategori: 'Yiyecek & İçecek', aciklama: 'Bar & Gece Kulübü', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '6', kod: '5912', kategori: 'Sağlık', aciklama: 'Eczane', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '7', kod: '5541', kategori: 'Yakıt', aciklama: 'Akaryakıt İstasyonu', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '8', kod: '5311', kategori: 'Perakende', aciklama: 'Büyük Mağazalar', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '9', kod: '5661', kategori: 'Giyim & Aksesuar', aciklama: 'Ayakkabı Mağazası', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '10', kod: '5651', kategori: 'Giyim & Aksesuar', aciklama: 'Giyim Mağazası', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '11', kod: '5732', kategori: 'Elektronik', aciklama: 'Elektronik Mağazası', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '12', kod: '5734', kategori: 'Elektronik', aciklama: 'Bilgisayar Yazılım', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '13', kod: '5942', kategori: 'Kültür & Eğlence', aciklama: 'Kitapçı', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '14', kod: '5735', kategori: 'Kültür & Eğlence', aciklama: 'Müzik Mağazası', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '15', kod: '7832', kategori: 'Kültür & Eğlence', aciklama: 'Sinema', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '16', kod: '7991', kategori: 'Turizm', aciklama: 'Turistik Yerler', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '17', kod: '4411', kategori: 'Turizm', aciklama: 'Kruvaziyer', aktif: true, olusturmaTarihi: '2024-01-01' }
];

// ========================================
// MOCK BANKS
// ========================================
export const mockBanks: Bank[] = [
  { id: 'bank-1', kod: 'AKB', bankaAdi: 'Akbank', aciklama: 'Akbank T.A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-2', kod: 'GAR', bankaAdi: 'Garanti BBVA', aciklama: 'Türkiye Garanti Bankası A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-3', kod: 'ISB', bankaAdi: 'İş Bankası', aciklama: 'Türkiye İş Bankası A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-4', kod: 'YKB', bankaAdi: 'Yapı Kredi', aciklama: 'Yapı ve Kredi Bankası A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-5', kod: 'ZRT', bankaAdi: 'Ziraat Bankası', aciklama: 'T.C. Ziraat Bankası A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-6', kod: 'HLK', bankaAdi: 'Halkbank', aciklama: 'Türkiye Halk Bankası A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-7', kod: 'VKF', bankaAdi: 'Vakıfbank', aciklama: 'Türkiye Vakıflar Bankası T.A.O.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-8', kod: 'QNB', bankaAdi: 'QNB Finansbank', aciklama: 'QNB Finansbank A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-9', kod: 'TEB', bankaAdi: 'TEB', aciklama: 'Türk Ekonomi Bankası A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: 'bank-10', kod: 'ING', bankaAdi: 'ING', aciklama: 'ING Bank A.Ş.', aktif: true, olusturmaTarihi: '2024-01-01' }
];

// ========================================
// MOCK EPK LIST
// ========================================
export const mockEPKList: EPK[] = [
  { id: '1', kod: 'EPK001', kurumAdi: 'Standart EPK', aciklama: 'Elektronik Para Kuruluşu - Standart', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '2', kod: 'EPK002', kurumAdi: 'Premium EPK', aciklama: 'Elektronik Para Kuruluşu - Premium', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '3', kod: 'EPK003', kurumAdi: 'Corporate EPK', aciklama: 'Elektronik Para Kuruluşu - Kurumsal', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '4', kod: 'EPK004', kurumAdi: 'SME EPK', aciklama: 'Elektronik Para Kuruluşu - KOBİ', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '5', kod: 'EPK005', kurumAdi: 'Retail EPK', aciklama: 'Elektronik Para Kuruluşu - Perakende', aktif: true, olusturmaTarihi: '2024-01-01' }
];

// ========================================
// MOCK OK LIST (Ödeme Kuruluşları)
// ========================================
export const mockOKList: OK[] = [
  { id: '1', kod: 'OK001', kurumAdi: 'Standart OK', aciklama: 'Ödeme Kuruluşu - Standart', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '2', kod: 'OK002', kurumAdi: 'Premium OK', aciklama: 'Ödeme Kuruluşu - Premium', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '3', kod: 'OK003', kurumAdi: 'Corporate OK', aciklama: 'Ödeme Kuruluşu - Kurumsal', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '4', kod: 'OK004', kurumAdi: 'SME OK', aciklama: 'Ödeme Kuruluşu - KOBİ', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '5', kod: 'OK005', kurumAdi: 'Retail OK', aciklama: 'Ödeme Kuruluşu - Perakende', aktif: true, olusturmaTarihi: '2024-01-01' }
];

// ========================================
// MOCK SALES REPRESENTATIVES
// ========================================
export const mockSalesReps: SalesRepresentative[] = [
  { id: '1', adSoyad: 'Mehmet Demir', email: 'mehmet@oxivo.com', telefon: '0532 111 11 11', departman: 'Satış', bolge: 'İstanbul', aktif: true, olusturmaTarihi: '2024-01-01', notlar: '' },
  { id: '2', adSoyad: 'Zeynep Arslan', email: 'zeynep@oxivo.com', telefon: '0533 222 22 22', departman: 'Satış', bolge: 'Ankara', aktif: true, olusturmaTarihi: '2024-01-01', notlar: '' },
  { id: '3', adSoyad: 'Can Öztürk', email: 'can@oxivo.com', telefon: '0534 333 33 33', departman: 'Satış', bolge: 'İzmir', aktif: true, olusturmaTarihi: '2024-01-01', notlar: '' }
];

// ========================================
// MOCK JOB TITLES
// ========================================
export const mockJobTitles: JobTitle[] = [
  { id: '1', unvan: 'Genel Müdür', aciklama: 'Şirket genel müdürü', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '2', unvan: 'İşletme Müdürü', aciklama: 'İşletme operasyonları müdürü', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '3', unvan: 'Mali İşler Müdürü', aciklama: 'Finans ve muhasebe müdürü', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '4', unvan: 'Satın Alma Müdürü', aciklama: 'Satın alma departmanı müdürü', aktif: true, olusturmaTarihi: '2024-01-01' }
];

// ========================================
// MOCK PARTNERSHIPS (Gelir Ortaklığı Modelleri)
// ========================================
export const mockPartnerships: Partnership[] = [
  { 
    id: '1', 
    kod: 'PART001', 
    modelAdi: 'Payter Partnership', 
    oran: '50', 
    aciklama: 'Standart 50-50 ortaklık modeli', 
    aktif: true, 
    olusturmaTarihi: '2024-01-01',
    calculationRows: [],
    partnerName: 'Payter Tech'
  },
  { 
    id: '2', 
    kod: 'PART002', 
    modelAdi: 'Premium Partnership', 
    oran: '60', 
    aciklama: 'Premium 60-40 ortaklık modeli', 
    aktif: true, 
    olusturmaTarihi: '2024-01-01',
    calculationRows: [],
    partnerName: 'Premium Partner'
  }
];

// ========================================
// MOCK SHARINGS (Paylaşım Modelleri)
// ========================================
export const mockSharings: Sharing[] = [
  { 
    id: '1', 
    kod: 'SHARE001', 
    modelAdi: 'Standart Paylaşım', 
    oran: '50', 
    aciklama: '50-50 paylaşım modeli', 
    aktif: true, 
    olusturmaTarihi: '2024-01-01',
    ad: 'Standart',
    tip: 'Eşit Paylaşım'
  },
  { 
    id: '2', 
    kod: 'SHARE002', 
    modelAdi: 'Premium Paylaşım', 
    oran: '60', 
    aciklama: '60-40 paylaşım modeli', 
    aktif: true, 
    olusturmaTarihi: '2024-01-01',
    ad: 'Premium',
    tip: 'Ağırlıklı Paylaşım'
  }
];

// ========================================
// MOCK KART PROGRAMLAR
// ========================================
export const mockKartProgramlar: KartProgram[] = [
  { 
    id: '1', 
    kartAdi: 'Maximum', 
    aciklama: 'İş Bankası Maximum kart programı', 
    aktif: true, 
    olusturmaTarihi: '2024-01-01',
    kod: 'MAX',
    ad: 'Maximum',
    bankaKodu: 'ISB',
    kartTipi: 'Credit'
  },
  { 
    id: '2', 
    kartAdi: 'Bonus', 
    aciklama: 'Garanti BBVA Bonus kart programı', 
    aktif: true, 
    olusturmaTarihi: '2024-01-01',
    kod: 'BON',
    ad: 'Bonus',
    bankaKodu: 'GAR',
    kartTipi: 'Credit'
  },
  { 
    id: '3', 
    kartAdi: 'Axess', 
    aciklama: 'Akbank Axess kart programı', 
    aktif: true, 
    olusturmaTarihi: '2024-01-01',
    kod: 'AXS',
    ad: 'Axess',
    bankaKodu: 'AKB',
    kartTipi: 'Credit'
  }
];

// ========================================
// MOCK SUSPENSION REASONS
// ========================================
export const mockSuspensionReasons: SuspensionReason[] = [
  { id: '1', reason: 'Ödeme yapılmadı', aciklama: 'Müşteri ödeme yapmadı', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '2', reason: 'Sözleşme ihlali', aciklama: 'Sözleşme şartları ihlal edildi', aktif: true, olusturmaTarihi: '2024-01-01' },
  { id: '3', reason: 'Müşteri talebi', aciklama: 'Müşteri kendi isteğiyle durdurma talep etti', aktif: true, olusturmaTarihi: '2024-01-01' }
];

// ========================================
// MOCK CATEGORIES
// ========================================
export const mockCategories = [
  // Gelir Kategorileri (Income)
  {
    id: 'cat-income-1',
    categoryCode: 'INC001',
    name: 'Satış Geliri',
    categoryType: 'income',
    parentId: null,
    description: 'Ürün ve hizmet satışından elde edilen gelirler',
    color: '#4CAF50',
    icon: 'dollar-sign',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-income-2',
    categoryCode: 'INC002',
    name: 'Kredi Kartı Geliri',
    categoryType: 'income',
    parentId: 'cat-income-1',
    description: 'Kredi kartı işlemlerinden elde edilen gelirler',
    color: '#66BB6A',
    icon: 'credit-card',
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-income-3',
    categoryCode: 'INC003',
    name: 'Faiz Geliri',
    categoryType: 'income',
    parentId: null,
    description: 'Banka mevduatı ve yatırımlardan faiz gelirleri',
    color: '#81C784',
    icon: 'percent',
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-income-4',
    categoryCode: 'INC004',
    name: 'Kira Geliri',
    categoryType: 'income',
    parentId: null,
    description: 'Gayrimenkul kira gelirleri',
    color: '#A5D6A7',
    icon: 'home',
    sortOrder: 4,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-income-5',
    categoryCode: 'INC005',
    name: 'Diğer Gelirler',
    categoryType: 'income',
    parentId: null,
    description: 'Sınıflandırılmamış diğer gelirler',
    color: '#C8E6C9',
    icon: 'trending-up',
    sortOrder: 5,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Gider Kategorileri (Expense)
  {
    id: 'cat-expense-1',
    categoryCode: 'EXP001',
    name: 'Personel Giderleri',
    categoryType: 'expense',
    parentId: null,
    description: 'Çalışan maaş ve yan hakları',
    color: '#F44336',
    icon: 'users',
    sortOrder: 10,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-2',
    categoryCode: 'EXP002',
    name: 'Maaş',
    categoryType: 'expense',
    parentId: 'cat-expense-1',
    description: 'Personel maaş ödemeleri',
    color: '#EF5350',
    icon: 'wallet',
    sortOrder: 11,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-3',
    categoryCode: 'EXP003',
    name: 'SGK Primleri',
    categoryType: 'expense',
    parentId: 'cat-expense-1',
    description: 'Sosyal güvenlik primleri',
    color: '#E57373',
    icon: 'shield',
    sortOrder: 12,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-4',
    categoryCode: 'EXP004',
    name: 'Ofis Giderleri',
    categoryType: 'expense',
    parentId: null,
    description: 'Ofis ve işyeri giderleri',
    color: '#FF9800',
    icon: 'building',
    sortOrder: 20,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-5',
    categoryCode: 'EXP005',
    name: 'Kira',
    categoryType: 'expense',
    parentId: 'cat-expense-4',
    description: 'Ofis kira ödemeleri',
    color: '#FFB74D',
    icon: 'home',
    sortOrder: 21,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-6',
    categoryCode: 'EXP006',
    name: 'Elektrik',
    categoryType: 'expense',
    parentId: 'cat-expense-4',
    description: 'Elektrik faturaları',
    color: '#FFCC80',
    icon: 'zap',
    sortOrder: 22,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-7',
    categoryCode: 'EXP007',
    name: 'Su',
    categoryType: 'expense',
    parentId: 'cat-expense-4',
    description: 'Su faturaları',
    color: '#2196F3',
    icon: 'droplet',
    sortOrder: 23,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-8',
    categoryCode: 'EXP008',
    name: 'İnternet & Telefon',
    categoryType: 'expense',
    parentId: 'cat-expense-4',
    description: 'İletişim giderleri',
    color: '#03A9F4',
    icon: 'phone',
    sortOrder: 24,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-9',
    categoryCode: 'EXP009',
    name: 'Ofis Malzemeleri',
    categoryType: 'expense',
    parentId: 'cat-expense-4',
    description: 'Kırtasiye ve ofis malzemeleri',
    color: '#FF5722',
    icon: 'package',
    sortOrder: 25,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-10',
    categoryCode: 'EXP010',
    name: 'Pazarlama Giderleri',
    categoryType: 'expense',
    parentId: null,
    description: 'Reklam ve pazarlama harcamaları',
    color: '#9C27B0',
    icon: 'megaphone',
    sortOrder: 30,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-11',
    categoryCode: 'EXP011',
    name: 'Ulaşım Giderleri',
    categoryType: 'expense',
    parentId: null,
    description: 'Taşıt, yakıt ve ulaşım giderleri',
    color: '#795548',
    icon: 'truck',
    sortOrder: 40,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-expense-12',
    categoryCode: 'EXP012',
    name: 'Vergi & Harçlar',
    categoryType: 'expense',
    parentId: null,
    description: 'Yasal vergi ve harç ödemeleri',
    color: '#607D8B',
    icon: 'file-text',
    sortOrder: 50,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ========================================
// MOCK CUSTOMERS
// ========================================
export const mockCustomers: Customer[] = [
  {
    id: 'mock-cust-1',
    cariHesapKodu: 'CRI001',
    sektor: 'Teknoloji',
    mcc: '5734',
    cariAdi: 'ABC Teknoloji A.Ş.',
    guncelMyPayterDomain: 'abcteknoloji.com',
    vergiDairesi: 'Maslak',
    vergiNo: '1234567890',
    adres: 'Maslak Mahallesi, Bilim Sokak No:1',
    ilce: 'Sarıyer',
    postaKodu: '34398',
    email: 'info@abcteknoloji.com',
    yetkili: 'Ahmet Yılmaz',
    tel: '0532 111 22 33',
    durum: 'Aktif',
    salesRepId: '1',
    salesRepName: 'Mehmet Demir',
    kayitTarihi: '2024-01-15T10:00:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['DGPAYS', 'PARAM'],
    // ✅ MOCK: Banka-Cihaz İlişkilendirmesi Örneği
    bankDeviceAssignments: [
      {
        id: 'assignment-1',
        bankId: 'bank-bank-2',
        bankName: 'Garanti BBVA',
        bankCode: 'GAR',
        deviceIds: ['prod-1', 'prod-2'],
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'assignment-2',
        bankId: 'ok-epk-4',
        bankName: 'SME EPK',
        bankCode: 'EPK004',
        deviceIds: ['prod-3'],
        createdAt: '2024-01-16T11:00:00Z'
      }
    ]
  },
  {
    id: 'mock-cust-2',
    cariHesapKodu: 'CRI002',
    sektor: 'Restoran & Kafe',
    mcc: '5812',
    cariAdi: 'Ege Cafe Zinciri',
    guncelMyPayterDomain: 'egecafe.com',
    vergiDairesi: 'Kadıköy',
    vergiNo: '9876543210',
    adres: 'Kadıköy Mahallesi, Lezzet Sokak No:5',
    ilce: 'Kadıköy',
    postaKodu: '34710',
    email: 'info@egecafe.com',
    yetkili: 'Ayşe Kaya',
    tel: '0533 222 33 44',
    durum: 'Aktif',
    salesRepId: '2',
    salesRepName: 'Zeynep Arslan',
    kayitTarihi: '2024-02-20T11:30:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['MOKA'],
    // ✅ MOCK: Tek banka ataması örneği
    bankDeviceAssignments: [
      {
        id: 'assignment-3',
        bankId: 'bank-bank-1',
        bankName: 'Akbank',
        bankCode: 'AKB',
        deviceIds: ['prod-4', 'prod-5', 'prod-6'],
        createdAt: '2024-02-20T12:00:00Z'
      }
    ]
  },
  {
    id: 'mock-cust-3',
    cariHesapKodu: 'CRI003',
    sektor: 'Perakende',
    mcc: '5411',
    cariAdi: 'Yılmaz Market Mağazacılık',
    guncelMyPayterDomain: 'yilmazmarket.com',
    vergiDairesi: 'Çankaya',
    vergiNo: '5555555555',
    adres: 'Çankaya Mahallesi, Ticaret Caddesi No:10',
    ilce: 'Çankaya',
    postaKodu: '06680',
    email: 'info@yilmazmarket.com',
    yetkili: 'Can Öztürk',
    tel: '0534 333 44 55',
    durum: 'Aktif',
    salesRepId: '1',
    salesRepName: 'Mehmet Demir',
    kayitTarihi: '2024-03-10T14:00:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['SIPAY', 'VAKIF', 'NKOLAY'],
    // ✅ MOCK: Çoklu banka ataması örneği
    bankDeviceAssignments: [
      {
        id: 'assignment-4',
        bankId: 'bank-bank-7',
        bankName: 'Vakıfbank',
        bankCode: 'VKF',
        deviceIds: ['prod-7', 'prod-8'],
        createdAt: '2024-03-10T14:30:00Z'
      },
      {
        id: 'assignment-5',
        bankId: 'ok-ok-1',
        bankName: 'Standart OK',
        bankCode: 'OK001',
        deviceIds: ['prod-9'],
        createdAt: '2024-03-11T09:00:00Z'
      }
    ]
  },
  {
    id: 'mock-cust-4',
    cariHesapKodu: 'CRI004',
    sektor: 'Sağlık',
    mcc: '5912',
    cariAdi: 'Sağlık Eczanesi',
    guncelMyPayterDomain: 'saglikeczane.com',
    vergiDairesi: 'Konak',
    vergiNo: '3333333333',
    adres: 'Konak Meydanı No:15',
    ilce: 'Konak',
    postaKodu: '35250',
    email: 'info@saglikeczane.com',
    yetkili: 'Zeynep Demir',
    tel: '0232 444 55 66',
    durum: 'Aktif',
    salesRepId: '3',
    salesRepName: 'Can Öztürk',
    kayitTarihi: '2024-01-05T09:00:00Z',
    musteriTipi: 'Bireysel',
    linkedBankPFIds: ['ELEKSE']
  },
  {
    id: 'mock-cust-5',
    cariHesapKodu: 'CRI005',
    sektor: 'Turizm',
    mcc: '7991',
    cariAdi: 'Antalya Otel İşletmeleri A.Ş.',
    guncelMyPayterDomain: 'antalyaotel.com',
    vergiDairesi: 'Muratpaşa',
    vergiNo: '7777777777',
    adres: 'Lara Yolu, Muratpaşa',
    ilce: 'Muratpaşa',
    postaKodu: '07100',
    email: 'rezervasyon@antalyaotel.com',
    yetkili: 'Mehmet Arslan',
    tel: '0242 555 66 77',
    durum: 'Aktif',
    salesRepId: '2',
    salesRepName: 'Zeynep Arslan',
    kayitTarihi: '2024-02-14T11:00:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['PAPARA', 'RUBIK']
  },
  {
    id: 'mock-cust-6',
    cariHesapKodu: 'CRI006',
    sektor: 'Yakıt',
    mcc: '5541',
    cariAdi: 'Demir Petrol A.Ş.',
    guncelMyPayterDomain: 'demirpetrol.com',
    vergiDairesi: 'Osmangazi',
    vergiNo: '8888888888',
    adres: 'Ankara Yolu No:45',
    ilce: 'Osmangazi',
    postaKodu: '16200',
    email: 'info@demirpetrol.com',
    yetkili: 'Ali Yıldız',
    tel: '0224 666 77 88',
    durum: 'Aktif',
    salesRepId: '1',
    salesRepName: 'Mehmet Demir',
    kayitTarihi: '2024-03-01T08:30:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['ELOVON', 'DGPAYS']
  },
  {
    id: 'mock-cust-7',
    cariHesapKodu: 'CRI007',
    sektor: 'Giyim',
    mcc: '5651',
    cariAdi: 'Moda Butik Ltd. Şti.',
    guncelMyPayterDomain: 'modabutik.com',
    vergiDairesi: 'Beyoğlu',
    vergiNo: '4444444444',
    adres: 'İstiklal Caddesi No:120',
    ilce: 'Beyoğlu',
    postaKodu: '34433',
    email: 'info@modabutik.com',
    yetkili: 'Elif Şahin',
    tel: '0212 777 88 99',
    durum: 'Pasif',
    salesRepId: '2',
    salesRepName: 'Zeynep Arslan',
    kayitTarihi: '2023-12-10T15:00:00Z',
    musteriTipi: 'Bireysel',
    linkedBankPFIds: ['VAKIF']
  },
  {
    id: 'mock-cust-8',
    cariHesapKodu: 'CRI008',
    sektor: 'Elektronik',
    mcc: '5732',
    cariAdi: 'Tekno Elektronik San. Tic. A.Ş.',
    guncelMyPayterDomain: 'teknoelektronik.com',
    vergiDairesi: 'Ümraniye',
    vergiNo: '6666666666',
    adres: 'Dudullu OSB, 3. Cadde No:28',
    ilce: 'Ümraniye',
    postaKodu: '34775',
    email: 'satis@teknoelektronik.com',
    yetkili: 'Burak Kaya',
    tel: '0216 888 99 00',
    durum: 'Aktif',
    salesRepId: '3',
    salesRepName: 'Can Öztürk',
    kayitTarihi: '2024-01-20T10:15:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['SIPAY', 'MOKA']
  },
  {
    id: 'mock-cust-9',
    cariHesapKodu: 'CRI009',
    sektor: 'Restoran & Kafe',
    mcc: '5814',
    cariAdi: 'Burger House Fast Food',
    guncelMyPayterDomain: 'burgerhouse.com',
    vergiDairesi: 'Bornova',
    vergiNo: '9999999999',
    adres: 'Bornova Meydanı No:7',
    ilce: 'Bornova',
    postaKodu: '35040',
    email: 'siparis@burgerhouse.com',
    yetkili: 'Emre Yılmaz',
    tel: '0232 111 22 33',
    durum: 'Aktif',
    salesRepId: '1',
    salesRepName: 'Mehmet Demir',
    kayitTarihi: '2024-02-28T12:00:00Z',
    musteriTipi: 'Bireysel',
    linkedBankPFIds: ['PARAM', 'NKOLAY']
  },
  {
    id: 'mock-cust-10',
    cariHesapKodu: 'CRI010',
    sektor: 'Kültür & Eğlence',
    mcc: '7832',
    cariAdi: 'Sinema Park İşletmeleri',
    guncelMyPayterDomain: 'sinemapark.com',
    vergiDairesi: 'Yıldırım',
    vergiNo: '1010101010',
    adres: 'AVM Katı 3',
    ilce: 'Yıldırım',
    postaKodu: '16350',
    email: 'info@sinemapark.com',
    yetkili: 'Selin Aydın',
    tel: '0224 222 33 44',
    durum: 'Aktif',
    salesRepId: '2',
    salesRepName: 'Zeynep Arslan',
    kayitTarihi: '2024-03-15T14:30:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['ELEKSE']
  },
  {
    id: 'mock-cust-11',
    cariHesapKodu: 'CRI011',
    sektor: 'Perakende',
    mcc: '5661',
    cariAdi: 'Ayakkabı Dünyası Mağazacılık',
    guncelMyPayterDomain: 'ayakkabidunya.com',
    vergiDairesi: 'Nilüfer',
    vergiNo: '2020202020',
    adres: 'Nilüfer Caddesi No:55',
    ilce: 'Nilüfer',
    postaKodu: '16140',
    email: 'musteri@ayakkabidunya.com',
    yetkili: 'Fatma Koç',
    tel: '0224 333 44 55',
    durum: 'Beklemede',
    salesRepId: '3',
    salesRepName: 'Can Öztürk',
    kayitTarihi: '2024-01-25T09:45:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['RUBIK', 'PAPARA']
  },
  {
    id: 'mock-cust-12',
    cariHesapKodu: 'CRI012',
    sektor: 'Gıda',
    mcc: '5411',
    cariAdi: 'Taze Gıda Pazarı Ltd.',
    guncelMyPayterDomain: 'tazegida.com',
    vergiDairesi: 'Karşıyaka',
    vergiNo: '3030303030',
    adres: 'Karşıyaka Çarşı No:12',
    ilce: 'Karşıyaka',
    postaKodu: '35530',
    email: 'info@tazegida.com',
    yetkili: 'Mustafa Şen',
    tel: '0232 444 55 66',
    durum: 'Aktif',
    salesRepId: '1',
    salesRepName: 'Mehmet Demir',
    kayitTarihi: '2024-02-05T11:20:00Z',
    musteriTipi: 'Bireysel',
    linkedBankPFIds: ['ELOVON']
  },
  {
    id: 'mock-cust-13',
    cariHesapKodu: 'CRI013',
    sektor: 'Lojistik',
    mcc: '4411',
    cariAdi: 'Hızlı Kargo Lojistik A.Ş.',
    guncelMyPayterDomain: 'hizlikargo.com',
    vergiDairesi: 'Keçiören',
    vergiNo: '4040404040',
    adres: 'Organize Sanayi Bölgesi 5. Cadde',
    ilce: 'Keçiören',
    postaKodu: '06380',
    email: 'musteri@hizlikargo.com',
    yetkili: 'Serkan Bulut',
    tel: '0312 555 66 77',
    durum: 'Aktif',
    salesRepId: '2',
    salesRepName: 'Zeynep Arslan',
    kayitTarihi: '2024-03-05T08:00:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['DGPAYS', 'SIPAY', 'VAKIF']
  },
  {
    id: 'mock-cust-14',
    cariHesapKodu: 'CRI014',
    sektor: 'Kültür & Eğlence',
    mcc: '5942',
    cariAdi: 'Kitap Evi Yayınları',
    guncelMyPayterDomain: 'kitapevi.com',
    vergiDairesi: 'Bahçelievler',
    vergiNo: '5050505050',
    adres: 'Bahçelievler Merkez Sokak No:33',
    ilce: 'Bahçelievler',
    postaKodu: '34180',
    email: 'satis@kitapevi.com',
    yetkili: 'Deniz Çelik',
    tel: '0212 666 77 88',
    durum: 'Pasif',
    salesRepId: '1',
    salesRepName: 'Mehmet Demir',
    kayitTarihi: '2023-11-15T16:00:00Z',
    musteriTipi: 'Bireysel',
    linkedBankPFIds: ['PARAM']
  },
  {
    id: 'mock-cust-15',
    cariHesapKodu: 'CRI015',
    sektor: 'Turizm',
    mcc: '7991',
    cariAdi: 'Bodrum Tatil Köyü İşletmeleri',
    guncelMyPayterDomain: 'bodrumtatil.com',
    vergiDairesi: 'Bodrum',
    vergiNo: '6060606060',
    adres: 'Gümbet Sahil Yolu No:88',
    ilce: 'Bodrum',
    postaKodu: '48400',
    email: 'rezervasyon@bodrumtatil.com',
    yetkili: 'Hakan Özkan',
    tel: '0252 777 88 99',
    durum: 'Aktif',
    salesRepId: '3',
    salesRepName: 'Can Öztürk',
    kayitTarihi: '2024-01-30T13:00:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['MOKA', 'NKOLAY']
  },
  {
    id: 'mock-cust-16',
    cariHesapKodu: 'CRI016',
    sektor: 'Sağlık',
    mcc: '5912',
    cariAdi: 'Şifa Medikal Ürünler',
    guncelMyPayterDomain: 'sifamedikal.com',
    vergiDairesi: 'Etimesgut',
    vergiNo: '7070707070',
    adres: 'Etimesgut Sanayi Sitesi B Blok',
    ilce: 'Etimesgut',
    postaKodu: '06790',
    email: 'satis@sifamedikal.com',
    yetkili: 'Aylin Kara',
    tel: '0312 888 99 00',
    durum: 'Aktif',
    salesRepId: '2',
    salesRepName: 'Zeynep Arslan',
    kayitTarihi: '2024-02-18T10:30:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['PAPARA', 'ELEKSE']
  },
  {
    id: 'mock-cust-17',
    cariHesapKodu: 'CRI017',
    sektor: 'Teknoloji',
    mcc: '5734',
    cariAdi: 'Yazılım Geliştirme A.Ş.',
    guncelMyPayterDomain: 'yazilimgelisim.com',
    vergiDairesi: 'Çankaya',
    vergiNo: '8080808080',
    adres: 'Bilkent Plaza Kat 12',
    ilce: 'Çankaya',
    postaKodu: '06800',
    email: 'info@yazilimgelisim.com',
    yetkili: 'Cem Yurt',
    tel: '0312 111 22 33',
    durum: 'Beklemede',
    salesRepId: '1',
    salesRepName: 'Mehmet Demir',
    kayitTarihi: '2024-03-12T15:45:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['RUBIK']
  },
  {
    id: 'mock-cust-18',
    cariHesapKodu: 'CRI018',
    sektor: 'Restoran & Kafe',
    mcc: '5813',
    cariAdi: 'Gece Kulübü Eğlence Merkezi',
    guncelMyPayterDomain: 'gecekulubu.com',
    vergiDairesi: 'Beşiktaş',
    vergiNo: '9090909090',
    adres: 'Ortaköy Sahil No:25',
    ilce: 'Beşiktaş',
    postaKodu: '34347',
    email: 'info@gecekulubu.com',
    yetkili: 'Murat Tekin',
    tel: '0212 222 33 44',
    durum: 'Aktif',
    salesRepId: '3',
    salesRepName: 'Can Öztürk',
    kayitTarihi: '2024-01-08T20:00:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['VAKIF', 'SIPAY']
  },
  {
    id: 'mock-cust-19',
    cariHesapKodu: 'CRI019',
    sektor: 'Perakende',
    mcc: '5311',
    cariAdi: 'Mega Alışveriş Merkezi',
    guncelMyPayterDomain: 'megaavm.com',
    vergiDairesi: 'Buca',
    vergiNo: '1212121212',
    adres: 'Buca Şehir İçi No:100',
    ilce: 'Buca',
    postaKodu: '35390',
    email: 'bilgi@megaavm.com',
    yetkili: 'Gökhan Polat',
    tel: '0232 333 44 55',
    durum: 'Aktif',
    salesRepId: '2',
    salesRepName: 'Zeynep Arslan',
    kayitTarihi: '2024-02-22T09:15:00Z',
    musteriTipi: 'Kurumsal',
    linkedBankPFIds: ['ELOVON', 'DGPAYS', 'PARAM']
  },
  {
    id: 'mock-cust-20',
    cariHesapKodu: 'CRI020',
    sektor: 'Kültür & Eğlence',
    mcc: '5735',
    cariAdi: 'Müzik Dünyası Ltd. Şti.',
    guncelMyPayterDomain: 'muzikdunya.com',
    vergiDairesi: 'Kızılay',
    vergiNo: '1313131313',
    adres: 'Kızılay Meydanı Cadde No:18',
    ilce: 'Çankaya',
    postaKodu: '06420',
    email: 'satis@muzikdunya.com',
    yetkili: 'Esra Tunç',
    tel: '0312 444 55 66',
    durum: 'Pasif',
    salesRepId: '1',
    salesRepName: 'Mehmet Demir',
    kayitTarihi: '2023-10-20T11:00:00Z',
    musteriTipi: 'Bireysel',
    linkedBankPFIds: ['NKOLAY', 'MOKA']
  }
];

// ========================================
// MOCK PRODUCTS (Payter Devices)
// ========================================
export const mockProducts: PayterProduct[] = [
  {
    id: 'prod-1',
    serialNumber: 'MOVE5000-001',
    name: 'Payter Move/5000',
    tid: 'TID001122',
    domain: 'abcteknoloji.com',
    firmware: 'v2.5.1',
    sam1: 'SAM1-001',
    sam2: 'SAM2-001',
    sam3: 'SAM3-001',
    sim: 'SIM-123456',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Move/5000',
    macAddress: 'AA:BB:CC:DD:EE:01'
  },
  {
    id: 'prod-2',
    serialNumber: 'DESK3200-002',
    name: 'Payter Desk/3200',
    tid: 'TID002233',
    domain: 'egecafe.com',
    firmware: 'v2.4.8',
    sam1: 'SAM1-002',
    sam2: 'SAM2-002',
    sam3: 'SAM3-002',
    sim: 'SIM-789012',
    terminalType: 'UnattendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Desk/3200',
    macAddress: 'AA:BB:CC:DD:EE:02'
  },
  {
    id: 'prod-3',
    serialNumber: 'LANE3000-003',
    name: 'Payter Lane/3000',
    tid: 'TID003344',
    domain: 'yilmazmarket.com',
    firmware: 'v2.5.0',
    sam1: 'SAM1-003',
    sam2: 'SAM2-003',
    sam3: 'SAM3-003',
    sim: 'SIM-345678',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Offline',
    syncStatus: 'Pending',
    terminalModel: 'Lane/3000',
    macAddress: 'AA:BB:CC:DD:EE:03'
  },
  {
    id: 'prod-4',
    serialNumber: 'MOVE5000-004',
    name: 'Payter Move/5000',
    tid: 'TID004455',
    domain: 'saglikeczane.com',
    firmware: 'v2.5.1',
    sam1: 'SAM1-004',
    sam2: 'SAM2-004',
    sam3: 'SAM3-004',
    sim: 'SIM-456789',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Move/5000',
    macAddress: 'AA:BB:CC:DD:EE:04'
  },
  {
    id: 'prod-5',
    serialNumber: 'DESK3200-005',
    name: 'Payter Desk/3200',
    tid: 'TID005566',
    domain: 'antalyaotel.com',
    firmware: 'v2.4.9',
    sam1: 'SAM1-005',
    sam2: 'SAM2-005',
    sam3: 'SAM3-005',
    sim: 'SIM-567890',
    terminalType: 'UnattendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Desk/3200',
    macAddress: 'AA:BB:CC:DD:EE:05'
  },
  {
    id: 'prod-6',
    serialNumber: 'MOVE5000-006',
    name: 'Payter Move/5000',
    tid: 'TID006677',
    domain: 'demirpetrol.com',
    firmware: 'v2.5.1',
    sam1: 'SAM1-006',
    sam2: 'SAM2-006',
    sam3: 'SAM3-006',
    sim: 'SIM-678901',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Offline',
    syncStatus: 'Error',
    terminalModel: 'Move/5000',
    macAddress: 'AA:BB:CC:DD:EE:06'
  },
  {
    id: 'prod-7',
    serialNumber: 'LANE3000-007',
    name: 'Payter Lane/3000',
    tid: 'TID007788',
    domain: 'modabutik.com',
    firmware: 'v2.4.7',
    sam1: 'SAM1-007',
    sam2: 'SAM2-007',
    sam3: 'SAM3-007',
    sim: 'SIM-789123',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Lane/3000',
    macAddress: 'AA:BB:CC:DD:EE:07'
  },
  {
    id: 'prod-8',
    serialNumber: 'DESK3200-008',
    name: 'Payter Desk/3200',
    tid: 'TID008899',
    domain: 'teknoelektronik.com',
    firmware: 'v2.4.8',
    sam1: 'SAM1-008',
    sam2: 'SAM2-008',
    sam3: 'SAM3-008',
    sim: 'SIM-891234',
    terminalType: 'UnattendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Desk/3200',
    macAddress: 'AA:BB:CC:DD:EE:08'
  },
  {
    id: 'prod-9',
    serialNumber: 'MOVE5000-009',
    name: 'Payter Move/5000',
    tid: 'TID009900',
    domain: 'burgerhouse.com',
    firmware: 'v2.5.1',
    sam1: 'SAM1-009',
    sam2: 'SAM2-009',
    sam3: 'SAM3-009',
    sim: 'SIM-912345',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Offline',
    syncStatus: 'Pending',
    terminalModel: 'Move/5000',
    macAddress: 'AA:BB:CC:DD:EE:09'
  },
  {
    id: 'prod-10',
    serialNumber: 'LANE3000-010',
    name: 'Payter Lane/3000',
    tid: 'TID010011',
    domain: 'sinemapark.com',
    firmware: 'v2.5.0',
    sam1: 'SAM1-010',
    sam2: 'SAM2-010',
    sam3: 'SAM3-010',
    sim: 'SIM-101112',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Lane/3000',
    macAddress: 'AA:BB:CC:DD:EE:10'
  },
  {
    id: 'prod-11',
    serialNumber: 'DESK3200-011',
    name: 'Payter Desk/3200',
    tid: 'TID011122',
    domain: 'ayakkabidunya.com',
    firmware: 'v2.4.8',
    sam1: 'SAM1-011',
    sam2: 'SAM2-011',
    sam3: 'SAM3-011',
    sim: 'SIM-111213',
    terminalType: 'UnattendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Desk/3200',
    macAddress: 'AA:BB:CC:DD:EE:11'
  },
  {
    id: 'prod-12',
    serialNumber: 'MOVE5000-012',
    name: 'Payter Move/5000',
    tid: 'TID012233',
    domain: 'tazegida.com',
    firmware: 'v2.5.1',
    sam1: 'SAM1-012',
    sam2: 'SAM2-012',
    sam3: 'SAM3-012',
    sim: 'SIM-121314',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Offline',
    syncStatus: 'Error',
    terminalModel: 'Move/5000',
    macAddress: 'AA:BB:CC:DD:EE:12'
  },
  {
    id: 'prod-13',
    serialNumber: 'LANE3000-013',
    name: 'Payter Lane/3000',
    tid: 'TID013344',
    domain: 'hizlikargo.com',
    firmware: 'v2.5.0',
    sam1: 'SAM1-013',
    sam2: 'SAM2-013',
    sam3: 'SAM3-013',
    sim: 'SIM-131415',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Lane/3000',
    macAddress: 'AA:BB:CC:DD:EE:13'
  },
  {
    id: 'prod-14',
    serialNumber: 'DESK3200-014',
    name: 'Payter Desk/3200',
    tid: 'TID014455',
    domain: 'bodrumtatil.com',
    firmware: 'v2.4.9',
    sam1: 'SAM1-014',
    sam2: 'SAM2-014',
    sam3: 'SAM3-014',
    sim: 'SIM-141516',
    terminalType: 'UnattendedPOS',
    onlineStatus: 'Online',
    syncStatus: 'Synced',
    terminalModel: 'Desk/3200',
    macAddress: 'AA:BB:CC:DD:EE:14'
  },
  {
    id: 'prod-15',
    serialNumber: 'MOVE5000-015',
    name: 'Payter Move/5000',
    tid: 'TID015566',
    domain: 'megaavm.com',
    firmware: 'v2.5.1',
    sam1: 'SAM1-015',
    sam2: 'SAM2-015',
    sam3: 'SAM3-015',
    sim: 'SIM-151617',
    terminalType: 'AttendedPOS',
    onlineStatus: 'Offline',
    syncStatus: 'Pending',
    terminalModel: 'Move/5000',
    macAddress: 'AA:BB:CC:DD:EE:15'
  }
];

// ========================================
// MOCK BANK/PF - GERÇEK SUPABASE VERİLERİ (PROD ile Senkronize)
// ========================================
export const mockBankPF: BankPF[] = [
  {
    id: 'DGPAYS',
    firmaUnvan: 'DGPAYS Ödeme Hizmetleri A.Ş.',
    muhasebeKodu: 'DGPAYS',
    bankaOrPF: 'PF',
    bankaPFAd: 'DGPAYS',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'DGPAYS Ödeme Hizmetleri',
    vergiDairesi: 'Kadıköy',
    vergiNo: '1234567890',
    adres: 'İstanbul',
    telefon: '0216 XXX XX XX',
    email: 'info@dgpays.com',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedOKIds: ['ok-1']
  },
  {
    id: 'ELEKSE',
    firmaUnvan: 'Elekse Ödeme Kuruluşu A.Ş.',
    muhasebeKodu: 'ELEKSE',
    bankaOrPF: 'PF',
    bankaPFAd: 'ELEKSE',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'Elekse Ödeme Kuruluşu',
    vergiDairesi: 'Şişli',
    vergiNo: '2234567890',
    adres: 'İstanbul',
    telefon: '0212 XXX XX XX',
    email: 'info@elekse.com',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedOKIds: ['ok-2']
  },
  {
    id: 'ELOVON',
    firmaUnvan: 'Elovon Teknoloji A.Ş.',
    muhasebeKodu: 'ELOVON',
    bankaOrPF: 'PF',
    bankaPFAd: 'ELOVON',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'Elovon Teknoloji',
    vergiDairesi: 'Beşiktaş',
    vergiNo: '3234567890',
    adres: 'İstanbul',
    telefon: '0212 XXX XX XX',
    email: 'info@elovon.com',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedOKIds: ['ok-3']
  },
  {
    id: 'MOKA',
    firmaUnvan: 'Moka Ödeme Kuruluşu A.Ş.',
    muhasebeKodu: 'MOKA',
    bankaOrPF: 'PF',
    bankaPFAd: 'Moka United',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'Moka Ödeme Kuruluşu',
    vergiDairesi: 'Maslak',
    vergiNo: '4234567890',
    adres: 'İstanbul',
    telefon: '0212 XXX XX XX',
    email: 'info@moka.com',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedOKIds: ['ok-4']
  },
  {
    id: 'NKOLAY',
    firmaUnvan: 'N Kolay Ödeme Kuruluşu A.Ş.',
    muhasebeKodu: 'NKOLAY',
    bankaOrPF: 'PF',
    bankaPFAd: 'NKOLAY',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'N Kolay Ödeme Kuruluşu',
    vergiDairesi: 'Levent',
    vergiNo: '5234567890',
    adres: 'İstanbul',
    telefon: '0212 XXX XX XX',
    email: 'info@nkolay.com',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedOKIds: ['ok-5']
  },
  {
    id: 'PAPARA',
    firmaUnvan: 'Papara Elektronik Para A.Ş.',
    muhasebeKodu: 'PAPARA',
    bankaOrPF: 'PF',
    bankaPFAd: 'Papara',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'Papara Elektronik Para',
    vergiDairesi: 'Beşiktaş',
    vergiNo: '6234567890',
    adres: 'İstanbul',
    telefon: '0212 XXX XX XX',
    email: 'info@papara.com',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedOKIds: ['ok-6']
  },
  {
    id: 'PARAM',
    firmaUnvan: 'Turk Elektronik Para A.Ş.',
    muhasebeKodu: 'PARAM',
    bankaOrPF: 'PF',
    bankaPFAd: 'PARAM',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'Turk Elektronik Para',
    vergiDairesi: 'Kadıköy',
    vergiNo: '7234567890',
    adres: 'İstanbul',
    telefon: '0216 XXX XX XX',
    email: 'info@param.com.tr',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedOKIds: ['ok-7']
  },
  {
    id: 'RUBIK',
    firmaUnvan: 'Rubik Para',
    muhasebeKodu: 'RUBIK',
    bankaOrPF: 'PF',
    bankaPFAd: 'RUBİKPARA',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'Rubik Para',
    vergiDairesi: 'Şişli',
    vergiNo: '8234567890',
    adres: 'İstanbul',
    telefon: '0212 XXX XX XX',
    email: 'info@rubikpara.com',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedOKIds: ['ok-8']
  },
  {
    id: 'SIPAY',
    firmaUnvan: 'Sipay Elektronik Para ve Ödeme Hiz. A.Ş.',
    muhasebeKodu: 'SIPAY',
    bankaOrPF: 'PF',
    bankaPFAd: 'SİPAY',
    odemeKurulusuTipi: 'EPK',
    odemeKurulusuAd: 'Sipay Elektronik Para ve Ödeme Hizmetleri',
    epkNo: 'EPK004',
    vergiDairesi: 'Beşiktaş',
    vergiNo: '9234567890',
    adres: 'İstanbul',
    telefon: '0212 XXX XX XX',
    email: 'info@sipay.com.tr',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedEPKIds: ['epk-4']
  },
  {
    id: 'VAKIF',
    firmaUnvan: 'Türkiye Vakıflar Bankası T.A.O.',
    muhasebeKodu: 'VAKIF',
    bankaOrPF: 'Banka',
    bankaPFAd: 'Vakıfbank',
    odemeKurulusuTipi: 'ÖK',
    odemeKurulusuAd: 'Vakıfbank Ödeme Hizmetleri',
    vergiDairesi: 'Ulus',
    vergiNo: '0123456789',
    adres: 'Ankara',
    telefon: '0312 XXX XX XX',
    email: 'info@vakifbank.com.tr',
    iletisimMatrisi: [],
    dokumanlar: [],
    isbirlikleri: [],
    durum: 'Aktif',
    linkedBankIds: ['bank-1']
  }
];

// ========================================
// MOCK TABELA (SIGNS/DOMAINS)
// ========================================
export const mockTabela: TabelaRecord[] = [
  {
    id: 'sign-1',
    firmaId: 'DGPAYS',
    kurulus: { tip: 'EPK', id: '1', ad: 'Standart EPK' },
    musteri: 'ABC Teknoloji A.Ş.',
    urun: 'AttendedPOS',
    kartTipi: 'Credit',
    gelirModeli: { id: '1', ad: 'Payter Partnership' },
    kartProgramIds: ['1', '3'],
    yurtIciDisi: 'Yurt İçi',
    komisyonOranları: { vade: 'D+1', oran: '1.8' }
  },
  {
    id: 'sign-2',
    firmaId: 'SIPAY',
    kurulus: { tip: 'OK', id: '1', ad: 'Standart OK' },
    musteri: 'XYZ Restoran Zinciri',
    urun: 'UnattendedPOS',
    kartTipi: 'Debit',
    gelirModeli: { id: '2', ad: 'Premium Partnership' },
    kartProgramIds: ['2'],
    yurtIciDisi: 'Yurt İçi',
    komisyonOranları: { vade: 'D+7', oran: '2.2' }
  }
];

/**
 * Get all mock data for a specific entity type
 */
export function getMockData(entityType: string): any[] {
  const mockDataMap: { [key: string]: any[] } = {
    'customers': mockCustomers,
    'bankpf': mockBankPF,
    'mcc': mockMCCList,
    'banks': mockBanks,
    'epk': mockEPKList,
    'ok': mockOKList,
    'salesReps': mockSalesReps,
    'jobTitles': mockJobTitles,
    'partnerships': mockPartnerships,
    'sharings': mockSharings,
    'kartProgram': mockKartProgramlar,
    'suspensionReasons': mockSuspensionReasons,
    'categories': mockCategories,
    'products': mockProducts,
    'tabela': mockTabela
  };

  return mockDataMap[entityType] || [];
}

/**
 * Initialize mock data in localStorage (Figma Make only)
 */
export function initializeMockData(): void {
  console.log('🎨 Initializing mock data for Figma Make environment...');
  
  // Only in Figma Make environment
  if (typeof window === 'undefined') return;
  
  try {
    // Store mock data
    localStorage.setItem('customers', JSON.stringify(mockCustomers));
    localStorage.setItem('bankPF', JSON.stringify(mockBankPF));
    localStorage.setItem('mccList', JSON.stringify(mockMCCList));
    localStorage.setItem('banks', JSON.stringify(mockBanks));
    localStorage.setItem('epkList', JSON.stringify(mockEPKList));
    localStorage.setItem('okList', JSON.stringify(mockOKList));
    localStorage.setItem('salesRepresentatives', JSON.stringify(mockSalesReps));
    localStorage.setItem('jobTitles', JSON.stringify(mockJobTitles));
    localStorage.setItem('partnerships', JSON.stringify(mockPartnerships));
    localStorage.setItem('sharings', JSON.stringify(mockSharings));
    localStorage.setItem('kartProgramlar', JSON.stringify(mockKartProgramlar));
    localStorage.setItem('suspensionReasons', JSON.stringify(mockSuspensionReasons));
    localStorage.setItem('products', JSON.stringify(mockProducts));
    localStorage.setItem('tabelaRecords', JSON.stringify(mockTabela));
    
    console.log('✅ Mock data initialized successfully');
    
    // ✅ Log Customer-BankPF relationships
    const totalLinkedCustomers = mockCustomers.filter(c => c.linkedBankPFIds && c.linkedBankPFIds.length > 0).length;
    const totalRelationships = mockCustomers.reduce((sum, c) => sum + (c.linkedBankPFIds?.length || 0), 0);
    console.log(`📊 Customer-BankPF Relationships: ${totalLinkedCustomers} customers → ${totalRelationships} total links`);
    console.table(
      mockCustomers
        .filter(c => c.linkedBankPFIds && c.linkedBankPFIds.length > 0)
        .map(c => ({
          Customer: c.cariAdi,
          'Bank Count': c.linkedBankPFIds?.length || 0,
          Banks: c.linkedBankPFIds?.map(id => mockBankPF.find(b => b.id === id)?.bankaPFAd || id).join(', ')
        }))
    );
  } catch (error) {
    console.error('❌ Failed to initialize mock data:', error);
  }
}