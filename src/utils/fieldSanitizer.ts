/**
 * Field Sanitizer - Supabase Schema Uyumluluğu
 * 
 * Her tablo için sadece Supabase'de MEVCUT olan kolonları tutar.
 * Eksik kolonları filtreler, böylece Supabase hatası almayız.
 * 
 * IMPORTANT: Frontend uses camelCase, Supabase uses snake_case
 * Conversion happens BEFORE sanitization (objectToSnakeCase)
 */

/**
 * MCC Codes için sadece mevcut kolonları tut
 * Mevcut DB kolonlar: id, kod, kategori, aciklama, aktif, created_at, updated_at
 */
export function sanitizeMCCCode(item: any): any {
  const { kod, kategori, aciklama, aktif } = item;
  return { kod, kategori, aciklama, aktif };
}

/**
 * Banks için sadece mevcut kolonları tut
 * Frontend: { id, kod, bankaAdi, aktif, olusturmaTarihi }
 * Snake_case: { id, kod, banka_adi, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, kod, ad, aktif, created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi, banka_adi
 * 
 * ⚠️ CRITICAL FIX: banka_adi → ad (gerçek kolon adı)
 */
export function sanitizeBank(item: any): any {
  const { kod, banka_adi, ad, aktif } = item;
  // banka_adi varsa ad olarak gönder, yoksa ad'ı kullan
  return { kod, ad: banka_adi || ad, aktif };
}

/**
 * EPK için sadece mevcut kolonları tut
 * Frontend: { id, kod, kurumAdi, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, kod, kurum_adi, aciklama, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, kod, ad, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi, kurum_adi
 * 
 * ⚠️ CRITICAL FIX: kurum_adi → ad (gerçek kolon adı)
 */
export function sanitizeEPK(item: any): any {
  const { kod, kurum_adi, ad, aktif } = item;
  // kurum_adi varsa ad olarak gönder, yoksa ad'ı kullan
  return { kod, ad: kurum_adi || ad, aktif };
}

/**
 * OK için sadece mevcut kolonları tut
 * Frontend: { id, kod, kurumAdi, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, kod, kurum_adi, aciklama, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, kod, ad, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi, kurum_adi
 * 
 * ⚠️ CRITICAL FIX: kurum_adi → ad (gerçek kolon adı)
 */
export function sanitizeOK(item: any): any {
  const { kod, kurum_adi, ad, aktif } = item;
  // kurum_adi varsa ad olarak gönder, yoksa ad'ı kullan
  return { kod, ad: kurum_adi || ad, aktif };
}

/**
 * Sales Representatives için sadece mevcut kolonları tut
 * Frontend: { id, adSoyad, email, telefon, departman, bolge, aktif, olusturmaTarihi, notlar }
 * Snake_case: { id, ad_soyad, email, telefon, departman, bolge, aktif, olusturma_tarihi, notlar }
 * Mevcut DB kolonlar: id, email, telefon, aktif, created_at, updated_at
 * Eksik DB kolonlar: ad_soyad, departman, bolge, olusturma_tarihi, notlar
 * 
 * ⚠️ CRITICAL: ID column in Supabase is UUID type, but frontend uses string IDs
 * 🔧 SOLUTION: Change column type in Supabase from UUID to TEXT
 *    Run in Supabase SQL Editor:
 *    ALTER TABLE sales_representatives ALTER COLUMN id TYPE TEXT;
 */
export function sanitizeSalesRep(item: any): any {
  const { id, email, telefon, aktif } = item;
  
  // ⚠️ Warning: If ID is not UUID format, Supabase will reject it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (id && !uuidRegex.test(id)) {
    console.warn(`⚠️ Sales Rep ID "${id}" is not UUID format. Change Supabase column to TEXT type.`);
  }
  
  return { id, email, telefon, aktif };
}

/**
 * Job Titles için sadece mevcut kolonları tut
 * Frontend: { id, unvan, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, unvan, aciklama, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, unvan, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi
 * 
 * ⚠️ CRITICAL: ID column in Supabase is UUID type, but frontend uses string IDs
 * 🔧 SOLUTION: Change column type in Supabase from UUID to TEXT
 *    Run in Supabase SQL Editor:
 *    ALTER TABLE job_titles ALTER COLUMN id TYPE TEXT;
 */
export function sanitizeJobTitle(item: any): any {
  const { id, unvan, aktif } = item;
  
  // ⚠️ Warning: If ID is not UUID format, Supabase will reject it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (id && !uuidRegex.test(id)) {
    console.warn(`⚠️ Job Title ID "${id}" is not UUID format. Change Supabase column to TEXT type.`);
  }
  
  return { id, unvan, aktif };
}

/**
 * Partnerships için sadece mevcut kolonları tut
 * Frontend: { id, kod, modelAdi, oran, aciklama, aktif, olusturmaTarihi, calculationRows }
 * Snake_case: { id, kod, model_adi, oran, aciklama, aktif, olusturma_tarihi, calculation_rows }
 * 
 * ⚠️ CRITICAL FIX: Gerçek field'lar kod, model_adi, oran (firma_adi, anlasma_tarihi değil!)
 * Mevcut DB kolonlar: id, kod, model_adi, oran, aciklama, aktif, calculation_rows (JSONB), created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi
 */
export function sanitizePartnership(item: any): any {
  const { id, kod, model_adi, oran, aciklama, aktif, calculation_rows } = item;
  return { 
    id, 
    kod, 
    model_adi, 
    oran, 
    aciklama, 
    aktif,
    // ✅ JSONB field: calculation_rows (Array of calculation rows)
    // Keep the array as-is, Supabase will handle JSONB conversion
    calculation_rows: calculation_rows || []
  };
}

/**
 * Account Items için sadece mevcut kolonları tut
 * Frontend: { id, hesapKodu, hesapAdi, hesapTuru, aktif, olusturmaTarihi }
 * Snake_case: { id, hesap_kodu, hesap_adi, hesap_turu, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, hesap_kodu, hesap_adi, hesap_turu, aktif, created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi
 */
export function sanitizeAccountItem(item: any): any {
  const { id, hesap_kodu, hesap_adi, hesap_turu, aktif } = item;
  return { id, hesap_kodu, hesap_adi, hesap_turu, aktif };
}

/**
 * Fixed Commissions için sadece mevcut kolonları tut
 * Frontend: { id, urunKodu, komisyonTipi, komisyonOrani, aktif, olusturmaTarihi }
 * Snake_case: { id, urun_kodu, komisyon_tipi, komisyon_orani, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, urun_kodu, komisyon_tipi, komisyon_orani, aktif, created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi
 */
export function sanitizeFixedCommission(item: any): any {
  const { id, urun_kodu, komisyon_tipi, komisyon_orani, aktif } = item;
  return { id, urun_kodu, komisyon_tipi, komisyon_orani, aktif };
}

/**
 * Additional Revenues için sadece mevcut kolonları tut
 * Frontend: { id, gelirTuru, tutarTipi, tutar, aktif, olusturmaTarihi }
 * Snake_case: { id, gelir_turu, tutar_tipi, tutar, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, gelir_turu, tutar_tipi, tutar, aktif, created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi
 */
export function sanitizeAdditionalRevenue(item: any): any {
  const { id, gelir_turu, tutar_tipi, tutar, aktif } = item;
  return { id, gelir_turu, tutar_tipi, tutar, aktif };
}

/**
 * Sharing için sadece mevcut kolonları tut
 * Frontend: { id, kod, modelAdi, oran, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, kod, model_adi, oran, aciklama, aktif, olusturma_tarihi }
 * 
 * ⚠️ CRITICAL FIX: Gerçek field'lar kod, model_adi, oran (firma_adi, paylasim_orani değil!)
 * Mevcut DB kolonlar: id, kod, model_adi, oran, aciklama, aktif, created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi
 */
export function sanitizeSharing(item: any): any {
  const { id, kod, model_adi, oran, aciklama, aktif } = item;
  return { id, kod, model_adi, oran, aciklama, aktif };
}

/**
 * Kart Program için sadece mevcut kolonları tut
 * Frontend: { id, kartAdi, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, kart_adi, aciklama, aktif, olusturma_tarihi }
 * 
 * ⚠️ CRITICAL FIX: Gerçek field kart_adi (program_adi, program_kodu değil!)
 * Mevcut DB kolonlar: id, kart_adi, aciklama, aktif, created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi
 */
export function sanitizeKartProgram(item: any): any {
  const { id, kart_adi, aciklama, aktif } = item;
  return { id, kart_adi, aciklama, aktif };
}

/**
 * Suspension Reason için sadece mevcut kolonları tut
 * Frontend: { id, neden, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, neden, aciklama, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, neden, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi
 */
export function sanitizeSuspensionReason(item: any): any {
  const { id, neden, aktif } = item;
  return { id, neden, aktif };
}
