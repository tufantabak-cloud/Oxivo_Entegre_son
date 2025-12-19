/**
 * Product-specific duplicate checker
 * PayterProduct için duplicate kontrolü
 */

import { PayterProduct } from '../components/PayterProductTab';

/**
 * Ürünün duplicate olup olmadığını kontrol eder
 * Serial Number, TID ve Name alanlarını kontrol eder
 */
export function checkProductDuplicate(
  existingProducts: PayterProduct[],
  newProduct: PayterProduct
): boolean {
  // Serial Number kontrolü (case-insensitive)
  const serialExists = existingProducts.some(
    p => p.serialNumber.toLowerCase().trim() === newProduct.serialNumber.toLowerCase().trim()
  );

  if (serialExists) {
    return true;
  }

  // TID kontrolü (case-insensitive)
  const tidExists = existingProducts.some(
    p => p.tid.toLowerCase().trim() === newProduct.tid.toLowerCase().trim()
  );

  if (tidExists) {
    return true;
  }

  // Name + TID kombinasyonu kontrolü
  const nameTidExists = existingProducts.some(
    p => 
      p.name.toLowerCase().trim() === newProduct.name.toLowerCase().trim() &&
      p.tid.toLowerCase().trim() === newProduct.tid.toLowerCase().trim()
  );

  return nameTidExists;
}

/**
 * Ürün listesindeki iç duplicate'leri bulur
 */
export function findInternalDuplicates(products: PayterProduct[]): Map<string, PayterProduct[]> {
  const duplicateGroups = new Map<string, PayterProduct[]>();
  
  // Serial Number bazlı grupla
  const serialGroups = new Map<string, PayterProduct[]>();
  products.forEach(product => {
    const key = product.serialNumber.toLowerCase().trim();
    if (!serialGroups.has(key)) {
      serialGroups.set(key, []);
    }
    serialGroups.get(key)!.push(product);
  });

  // TID bazlı grupla
  const tidGroups = new Map<string, PayterProduct[]>();
  products.forEach(product => {
    const key = product.tid.toLowerCase().trim();
    if (!tidGroups.has(key)) {
      tidGroups.set(key, []);
    }
    tidGroups.get(key)!.push(product);
  });

  // Duplicate grupları topla
  serialGroups.forEach((group, key) => {
    if (group.length > 1) {
      duplicateGroups.set(`serial:${key}`, group);
    }
  });

  tidGroups.forEach((group, key) => {
    if (group.length > 1) {
      duplicateGroups.set(`tid:${key}`, group);
    }
  });

  return duplicateGroups;
}

/**
 * Duplicate kayıtları temizler (en eskisini saklar)
 */
export function deduplicateProducts(products: PayterProduct[]): {
  deduplicated: PayterProduct[];
  removed: PayterProduct[];
} {
  const seen = new Map<string, PayterProduct>();
  const removed: PayterProduct[] = [];

  products.forEach(product => {
    // Serial Number bazlı unique key
    const key = `${product.serialNumber.toLowerCase().trim()}|${product.tid.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.set(key, product);
    } else {
      // Duplicate bulundu, kaldır
      removed.push(product);
    }
  });

  return {
    deduplicated: Array.from(seen.values()),
    removed
  };
}
