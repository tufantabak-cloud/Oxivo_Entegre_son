/**
 * Case Converter - camelCase ↔ snake_case
 * Frontend (camelCase) ile Supabase (snake_case) arası dönüşüm
 * 
 * ✅ Türkçe karakter desteği
 * ✅ Special cases (TL, PFTL, OXTL vb.)
 * ✅ Deep object/array conversion
 */

/**
 * camelCase → snake_case dönüşümü
 * ✅ Türkçe karakterleri İngilizce ASCII karşılığına çevir (Database'de ASCII kullanılıyor)
 * Örnek: bankIds → bank_ids, yurtIciDisi → yurt_ici_disi
 */
export function toSnakeCase(str: string): string {
  // ✅ SPECIAL CASES: Büyük harf kısaltmaları için özel mapping (ekGelirOXTL → ek_gelir_ox_tl)
  const specialCases: { [key: string]: string } = {
    'ekGelirPFTL': 'ek_gelir_pf_tl',
    'ekGelirOXTL': 'ek_gelir_ox_tl',
    'ekKesintiPFTL': 'ek_kesinti_pf_tl',
    'ekKesintiOXTL': 'ek_kesinti_ox_tl',
  };
  
  if (specialCases[str]) {
    return specialCases[str];
  }
  
  return str
    // ✅ STEP 1: Türkçe karakterleri İngilizce ASCII karşılığına çevir (toLowerCase ÖNCE!)
    .replace(/İ/g, 'I')   // Türkçe İ → İngilizce I
    .replace(/ı/g, 'i')   // Türkçe ı → İngilizce i
    .replace(/Ö/g, 'O')   // Türkçe Ö → İngilizce O
    .replace(/ö/g, 'o')   // Türkçe ö → İngilizce o
    .replace(/Ü/g, 'U')   // Türkçe Ü → İngilizce U
    .replace(/ü/g, 'u')   // Türkçe ü → İngilizce u
    .replace(/Ş/g, 'S')   // Türkçe Ş → İngilizce S
    .replace(/ş/g, 's')   // Türkçe ş → İngilizce s
    .replace(/Ğ/g, 'G')   // Türkçe Ğ → İngilizce G
    .replace(/ğ/g, 'g')   // Türkçe ğ → İngilizce g
    .replace(/Ç/g, 'C')   // Türkçe Ç → İngilizce C
    .replace(/ç/g, 'c')   // Türkçe ç → İngilizce c
    // ✅ STEP 2: Underscore ekle (artık sadece İngilizce karakterler var)
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    // ✅ STEP 3: Tümünü küçük harfe çevir
    .toLowerCase();
}

/**
 * snake_case → camelCase dönüşümü
 * ✅ Türkçe karakter desteği: ı→I, i→I, ö→Ö, ü→Ü, ş→Ş, ğ→Ğ, ç→Ç
 * ✅ FIX: Special cases for _tl suffix (Turkish Lira)
 */
export function toCamelCase(str: string): string {
  // ✅ FIX: Handle special cases first (e.g., alis_tl → alisTL, not alisTl)
  const specialCases: { [key: string]: string } = {
    'alis_tl': 'alisTL',
    'satis_tl': 'satisTL',
    'kar_tl': 'karTL',
    'toplam_tl': 'toplamTL',
    'tutar_tl': 'tutarTL',
    'fiyat_tl': 'fiyatTL',
    'alis_fiyati': 'alisFiyati',
    'satis_fiyati': 'satisFiyati',
    'kar_fiyati': 'karFiyati',
    'komisyon_yuzdesi': 'komisyonYuzdesi',
    'komisyon_oranlari': 'komisyonOranları',
    'paylasim_oranlari': 'paylaşımOranları',
    'hazine_geliri': 'hazineGeliri',
    'ek_gelir_detay': 'ekGelirDetay',
    // ✅ NEW: Earnings special cases (ek_gelir_pf_tl → ekGelirPFTL)
    'ek_gelir_pf_tl': 'ekGelirPFTL',
    'ek_gelir_ox_tl': 'ekGelirOXTL',
    'ek_kesinti_pf_tl': 'ekKesintiPFTL',
    'ek_kesinti_ox_tl': 'ekKesintiOXTL'
  };
  
  if (specialCases[str]) {
    return specialCases[str];
  }
  
  return str.replace(/_([a-zıöüşğç])/g, (_, letter) => {
    // Türkçe ve İngilizce karakterler için doğru mapping
    const upperMap: { [key: string]: string } = {
      'ı': 'I',  // Türkçe ı → I (komisyon_oranları → komisyonOranları)
      'i': 'I',  // İngilizce i → I (record_ids → recordIds)
      'ö': 'Ö',  // Türkçe ö → Ö
      'ü': 'Ü',  // Türkçe ü → Ü
      'ş': 'Ş',  // Türkçe ş → Ş
      'ğ': 'Ğ',  // Türkçe ğ → Ğ
      'ç': 'Ç'   // Türkçe ç → Ç
    };
    return upperMap[letter] || letter.toUpperCase();
  });
}

/**
 * Object'in tüm key'lerini camelCase'den snake_case'e çevirir
 * JSONB fields: Arrays and nested objects are properly handled
 */
export function objectToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(item => objectToSnakeCase(item));
  if (typeof obj !== 'object') return obj;
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    
    // ✅ FIX: Handle arrays and nested objects recursively
    if (value && typeof value === 'object') {
      converted[snakeKey] = objectToSnakeCase(value);
    } else {
      converted[snakeKey] = value;
    }
  }
  return converted;
}

/**
 * Object'in tüm key'lerini snake_case'den camelCase'e çevirir
 * FIXED: Deep conversion for nested objects and arrays
 */
export function objectToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => objectToCamelCase(item));
  }
  if (typeof obj !== 'object') return obj;
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    converted[camelKey] = (value && typeof value === 'object') 
      ? objectToCamelCase(value) 
      : value;
  }
  return converted;
}
