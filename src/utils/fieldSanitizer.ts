/**
 * MCC Codes için sadece mevcut kolonları tut
 * Frontend: { id, kod, kategori, aciklama, aktif, olusturmaTarihi }
 * Mevcut DB kolonlar: id, kod, kategori, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi
 * 
 * ⚠️ CRITICAL FIX: ID'yi kaldır - Supabase UUID generate etsin
 */
export function sanitizeMCCCode(item: any): any {
  const { kod, kategori, aktif } = item;
  return { kod, kategori, aktif };
}

/**
 * Banks için sadece mevcut kolonları tut
 * Frontend: { id, kod, bankaAdi, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, kod, banka_adi, aciklama, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, kod, ad, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi, banka_adi
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
 */
export function sanitizeSalesRep(item: any): any {
  const { id, email, telefon, aktif } = item;
  return { id, email, telefon, aktif };
}

/**
 * Job Titles için sadece mevcut kolonları tut
 * Frontend: { id, unvan, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, unvan, aciklama, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, unvan, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi
 */
export function sanitizeJobTitle(item: any): any {
  const { id, unvan, aktif } = item;
  return { id, unvan, aktif };
}

/**
 * Partnerships için sadece mevcut kolonları tut
 * Frontend: { id, firmaAdi, anlasmaTarihi, anlasmaTuru, aciklama, aktif, olusturmaTarihi }
 * Snake_case: { id, firma_adi, anlasma_tarihi, anlasma_turu, aciklama, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, firma_adi, anlasma_tarihi, anlasma_turu, aktif, created_at, updated_at
 * Eksik DB kolonlar: aciklama, olusturma_tarihi
 */
export function sanitizePartnership(item: any): any {
  const { id, firma_adi, anlasma_tarihi, anlasma_turu, aktif } = item;
  return { id, firma_adi, anlasma_tarihi, anlasma_turu, aktif };
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
 * Frontend: { id, firmaAdi, paylasimOrani, aktif, olusturmaTarihi }
 * Snake_case: { id, firma_adi, paylasim_orani, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, firma_adi, paylasim_orani, aktif, created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi
 */
export function sanitizeSharing(item: any): any {
  const { id, firma_adi, paylasim_orani, aktif } = item;
  return { id, firma_adi, paylasim_orani, aktif };
}

/**
 * Kart Program için sadece mevcut kolonları tut
 * Frontend: { id, programAdi, programKodu, aktif, olusturmaTarihi }
 * Snake_case: { id, program_adi, program_kodu, aktif, olusturma_tarihi }
 * Mevcut DB kolonlar: id, program_adi, program_kodu, aktif, created_at, updated_at
 * Eksik DB kolonlar: olusturma_tarihi
 */
export function sanitizeKartProgram(item: any): any {
  const { id, program_adi, program_kodu, aktif } = item;
  return { id, program_adi, program_kodu, aktif };
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
