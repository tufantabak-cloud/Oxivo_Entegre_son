/**
 * Data Migration Utility Functions
 * Handles version migrations and data validation for import/export
 */

import { logger } from './logger';
import type { BankPF } from '../components/BankPFModule';

/**
 * Migrate imported data from old version to current version
 * @param importedData - Data to migrate
 * @param fromVersion - Source version
 * @param currentVersion - Target version
 * @returns Migrated data
 */
export const migrateData = (
  importedData: any, 
  fromVersion: string,
  currentVersion: string
): any => {
  logger.info('Migration başlatılıyor', { fromVersion, toVersion: currentVersion });
  
  let migratedData = { ...importedData };
  let migrationApplied = false;
  
  // v1.0.x serisi - Aynı veri yapısı (sadece UI/özellik değişiklikleri)
  // Minor version güncellemeleri genellikle sadece veri uyumluluğu kontrolü gerektirir
  if (fromVersion === '1.0' || fromVersion === '1.0.1' || fromVersion === '1.0.2' || 
      fromVersion === '1.0.3' || fromVersion === '1.0.4' || fromVersion === '1.0.5' || 
      fromVersion === '1.0.6' || fromVersion === '1.0.7' || fromVersion === '1.0.8' || 
      fromVersion === '1.0.9' || fromVersion === '1.0.10' || fromVersion === '1.0.11' || 
      fromVersion === '1.0.12') {
    // TABELA kayıtlarını kontrol et ve eksik alanları ekle
    if (migratedData.data?.bankPFRecords) {
      migratedData.data.bankPFRecords = migratedData.data.bankPFRecords.map((record: BankPF) => ({
        ...record,
        tabelaRecords: (record.tabelaRecords || []).map((tr: any) => ({
          ...tr,
          // v1.0.1'de eklenen alanlar
          urun: tr.urun || undefined,
          kartProgramIds: tr.kartProgramIds || tr.bankIds || [], // Eski bankIds'den geçiş
          // v1.0.2'de eklenen alanlar (hakediş için gerekli değil ama uyumluluk için)
          aciklama: tr.aciklama || undefined,
          fotograf: tr.fotograf || undefined,
          kapanmaTarihi: tr.kapanmaTarihi || undefined
        })),
        agreementBanks: record.agreementBanks || [],
        // TABELA gruplarına aktif alanı ekle (varsayılan true)
        tabelaGroups:  (record.tabelaGroups || []).map((g: any) => ({
          ...g,
          aktif: g.aktif !== undefined ? g.aktif : true
        })),
        // v1.0.3'de eklenen hakediş kayıtları
        // v1.0.4'de hakediş kayıtlarına tabelaGroupId eklendi - eski kayıtları temizle
        // v1.0.6'da hakediş kayıtlarına pfIslemHacmi ve oxivoIslemHacmi eklendi (opsiyonel)
        hakedisRecords: (record.hakedisRecords || []).filter((h: any) => h.tabelaGroupId).map((h: any) => ({
          ...h,
          tabelaGroupId: h.tabelaGroupId,
          tabelaGroupAd: h.tabelaGroupAd || 'Bilinmeyen Grup',
          pfIslemHacmi: h.pfIslemHacmi || undefined,
          oxivoIslemHacmi: h.oxivoIslemHacmi || undefined
        }))
      }));
      migrationApplied = true;
    }
  }
  
  // Gelecekteki major version güncellemeleri için örnek:
  // if (parseFloat(fromVersion) < 1.1) {
  //   // v1.0.x → v1.1.x migration
  //   if (migratedData.data.bankPFRecords) {
  //     migratedData.data.bankPFRecords = migratedData.data.bankPFRecords.map((record: any) => ({
  //       ...record,
  //       yeniAlan: 'defaultDeger'
  //     }));
  //   }
  //   migrationApplied = true;
  // }
  
  if (migrationApplied) {
    logger.info('Migration başarıyla tamamlandı');
  } else {
    logger.debug('Migration gerektiren değişiklik bulunamadı');
  }
  
  return migratedData;
};

/**
 * Validate imported data structure
 * @param data - Data to validate
 * @returns Validation result with errors if any
 */
export const validateImportData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Temel yapı kontrolü
  if (!data || typeof data !== 'object') {
    errors.push('❌ Geçersiz dosya formatı - JSON dosyası bekleniyor');
    errors.push('');
    errors.push('💡 Dosya seçimi kontrol:');
    errors.push('   • Sadece "Export" butonu ile indirilen .json dosyalarını import edebilirsiniz');
    errors.push('   • Excel (.xlsx) dosyaları için "Excel\'den Yükle" butonunu kullanın');
    errors.push('   • Dosya adı "yonetim-sistemi-v*.json" formatında olmalı');
    return { valid: false, errors };
  }
  
  if (!data.data) {
    errors.push('❌ Veri objesi bulunamadı - Bu dosya Entegre Yönetim Sistemi export dosyası değil');
    errors.push('');
    errors.push('💡 Dosya formatı kontrol:');
    errors.push(`   • Seçilen dosya: ${data.appName || '(Bilinmeyen)'}`);
    errors.push(`   • Beklenen format: "appName: Entegre Yönetim Sistemi"`);
    errors.push('');
    errors.push('📋 Dosyada bulunan alanlar:');
    Object.keys(data).forEach(key => {
      errors.push(`   • ${key}: ${typeof data[key]}`);
    });
    errors.push('');
    errors.push('🔧 Çözüm:');
    errors.push('   1. Ana sayfadaki "Export" butonuyla yeni bir yedek oluşturun');
    errors.push('   2. O dosyayı import edin');
    errors.push('   3. Excel dosyalarını import etmek için "Excel\'den Yükle" kullanın');
    return { valid: false, errors };
  }
  
  // Versiyon kontrolü (opsiyonel)
  if (!data.version) {
    console.warn('⚠️ Versiyon bilgisi bulunamadı - v1.0 varsayılıyor');
  }
  
  // Array kontrolü
  const expectedArrays = [
    { key: 'customers', label: 'Müşteriler' },
    { key: 'payterProducts', label: 'Payter Ürünleri' },
    { key: 'bankPFRecords', label: 'Banka/PF Kayıtları' },
    { key: 'hesapKalemleri', label: 'Hesap Kalemleri' },
    { key: 'sabitKomisyonlar', label: 'Sabit Komisyonlar' },
    { key: 'ekGelirler', label: 'Ek Gelirler' },
    { key: 'jobTitles', label: 'Görevler' },
    { key: 'mccList', label: 'MCC Listesi' },
    { key: 'banks', label: 'Bankalar' },
    { key: 'epkList', label: 'EPK Listesi' },
    { key: 'okList', label: 'ÖK Listesi' },
    { key: 'partnerships', label: 'İşbirlikleri' },
    { key: 'sharings', label: 'Gelir Modelleri' },
    { key: 'kartProgramlar', label: 'Kart Programları' },
    { key: 'salesReps', label: 'Satış Temsilcileri' },
    { key: 'suspensionReasons', label: 'Pasifleştirme Sebepleri' }
  ];
  
  expectedArrays.forEach(({ key, label }) => {
    if (data.data[key] !== undefined && !Array.isArray(data.data[key])) {
      errors.push(`❌ ${label} (${key}) bir dizi (array) olmalı`);
    }
  });
  
  // Başarılı validasyon log
  if (errors.length === 0) {
    logger.debug('Veri validasyonu başarılı');
  }
  
  return { 
    valid: errors.length === 0, 
    errors 
  };
};
