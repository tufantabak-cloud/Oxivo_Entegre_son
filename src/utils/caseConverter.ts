/**
 * Case Converter - camelCase ↔ snake_case
 * Frontend (camelCase) ile Supabase (snake_case) arası dönüşüm
 */

/**
 * camelCase → snake_case dönüşümü
 * Örnek: cariHesapKodu → cari_hesap_kodu
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * snake_case → camelCase dönüşümü
 * Örnek: cari_hesap_kodu → cariHesapKodu
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Object'in tüm key'lerini camelCase'den snake_case'e çevirir
 */
export function objectToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Array ise her elemanı dönüştür
  if (Array.isArray(obj)) {
    return obj.map(item => objectToSnakeCase(item));
  }
  
  // Object değilse olduğu gibi döndür
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Object ise tüm key'leri dönüştür
  const converted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    
    // Nested object/array'leri de dönüştür
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
 */
export function objectToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Array ise her elemanı dönüştür
  if (Array.isArray(obj)) {
    return obj.map(item => objectToCamelCase(item));
  }
  
  // Object değilse olduğu gibi döndür
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Object ise tüm key'leri dönüştür
  const converted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    
    // Nested object/array'leri de dönüştür
    if (value && typeof value === 'object') {
      converted[camelKey] = objectToCamelCase(value);
    } else {
      converted[camelKey] = value;
    }
  }
  
  return converted;
}
