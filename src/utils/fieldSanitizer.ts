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
 * Mevcut DB kolonlar: id, kod, ad, email, telefon, aktif, created_at, updated_at
 * Eksik DB kolonlar: departman, bolge, olusturma_tarihi, notlar
 * 
 * ⚠️ CRITICAL: kod kolonu NOT NULL - ad_soyad'dan otomatik generate edilecek
 * ✅ FIXED: ID column changed from UUID to TEXT in Supabase
 */
export function sanitizeSalesRep(item: any): any {
  const { id, ad_soyad, ad, email, telefon, aktif, bolge } = item;
  
  // ✅ CRITICAL FIX: Generate 'kod' from 'ad_soyad' or 'ad' (NOT NULL constraint)
  const name = ad_soyad || ad || email || 'UNKNOWN';
  const kod = name
    .toUpperCase()
    .replace(/[ğĞ]/g, 'G')
    .replace(/[üÜ]/g, 'U')
    .replace(/[şŞ]/g, 'S')
    .replace(/[ıİ]/g, 'I')
    .replace(/[öÖ]/g, 'O')
    .replace(/[çÇ]/g, 'C')
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .substring(0, 50); // Limit to 50 chars
  
  // ✅ CRITICAL: Ensure kod is never empty (fallback to ID)
  const finalKod = kod || id?.substring(0, 50) || 'UNKNOWN';
  
  // ✅ FIX: Map to correct Supabase columns
  return { 
    id, 
    kod: finalKod, 
    ad_soyad: ad_soyad || ad, // ✅ Supabase column is 'ad_soyad', not 'ad'
    email, 
    telefon, 
    bolge,
    aktif 
  };
}

/**
 * Job Titles için sadece mevcut kolonları tut
 * Frontend: { id, unvan, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, unvan, aciklama, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, unvan, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi
 * 
 * ✅ FIXED: ID column changed from UUID to TEXT in Supabase
 */
export function sanitizeJobTitle(item: any): any {
  const { id, unvan, aktif } = item;
  
  return { id, unvan, aktif };
}

/**
 * Partnerships için sadece mevcut kolonları tut
 * Frontend: { id, kod, modelAdi, oran, aciklama, aktif, olusturmaTarihi, calculationRows }
 * Snake_case: { id, kod, model_adi, oran, aciklama, aktif, olusturma_tarihi, calculation_rows }
 * 
 * ⚠️ CRITICAL FIX: Supabase kolonları: id, partner_name, partner_type, contact_person, phone, email, notes, aktif
 * Bu tablo "İş Ortaklıkları" değil "Partnership (İşbirliği)" için - field mapping gerekli!
 */
export function sanitizePartnership(item: any): any {
  const { id, partner_name, partner_type, contact_person, phone, email, notes, aktif } = item;
  return { 
    id, 
    partner_name, 
    partner_type, 
    contact_person,
    phone,
    email,
    notes,
    aktif
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
 * ⚠️ CRITICAL FIX: Supabase kolonları: id, kod, ad, tip, sira, aktif, paydaslar
 * model_adi → ad (gerçek kolon adı)
 */
export function sanitizeSharing(item: any): any {
  const { id, kod, model_adi, ad, tip, sira, aktif, paydaslar } = item;
  return { 
    id, 
    kod, 
    ad: model_adi || ad, // ✅ Supabase column is 'ad', not 'model_adi'
    tip,
    sira,
    aktif,
    paydaslar: paydaslar || [] // JSONB field
  };
}

/**
 * Kart Program için sadece mevcut kolonları tut
 * Frontend: { id, kartAdi, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, kart_adi, aciklama, aktif, olusturma_tarihi }
 * 
 * ⚠️ CRITICAL FIX: Supabase kolonları: id, kod, ad, banka_kodu, kart_tipi, komisyon_orani, aktif
 * kart_adi → ad (gerçek kolon adı)
 */
export function sanitizeKartProgram(item: any): any {
  const { id, kod, kart_adi, ad, banka_kodu, kart_tipi, komisyon_orani, aktif } = item;
  return { 
    id,
    kod,
    ad: kart_adi || ad, // ✅ Supabase column is 'ad', not 'kart_adi'
    banka_kodu,
    kart_tipi,
    komisyon_orani,
    aktif 
  };
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
