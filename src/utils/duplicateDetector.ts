/**
 * Duplicate Detection Utility
 * Frontend'de duplicate kayıt oluşmasını önler
 */

import { supabase } from './supabaseClient';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRecord?: any;
  message?: string;
}

/**
 * Ürün adının duplicate olup olmadığını kontrol eder
 */
export async function checkProductDuplicate(
  productName: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  if (!productName || productName.trim() === '') {
    return {
      isDuplicate: false,
      message: 'Ürün adı boş olamaz'
    };
  }

  const normalizedName = productName.trim().toLowerCase();

  try {
    let query = supabase
      .from('products')
      .select('id, urun_adi, aktif')
      .ilike('urun_adi', normalizedName);

    // Güncelleme durumunda mevcut kaydı hariç tut
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Duplicate check error:', error);
      return {
        isDuplicate: false,
        message: 'Kontrol yapılamadı'
      };
    }

    if (data && data.length > 0) {
      const existing = data[0];
      return {
        isDuplicate: true,
        existingRecord: existing,
        message: `"${existing.urun_adi}" adlı ürün zaten mevcut (${existing.aktif ? 'Aktif' : 'Pasif'})`
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('❌ Unexpected error in checkProductDuplicate:', error);
    return {
      isDuplicate: false,
      message: 'Beklenmeyen hata'
    };
  }
}

/**
 * Müşteri ünvanının duplicate olup olmadığını kontrol eder
 */
export async function checkCustomerDuplicate(
  firmUnvan: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  if (!firmUnvan || firmUnvan.trim() === '') {
    return {
      isDuplicate: false,
      message: 'Firma ünvanı boş olamaz'
    };
  }

  const normalizedName = firmUnvan.trim().toLowerCase();

  try {
    let query = supabase
      .from('customers')
      .select('id, firma_unvan, durum')
      .ilike('firma_unvan', normalizedName);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Duplicate check error:', error);
      return {
        isDuplicate: false,
        message: 'Kontrol yapılamadı'
      };
    }

    if (data && data.length > 0) {
      const existing = data[0];
      return {
        isDuplicate: true,
        existingRecord: existing,
        message: `"${existing.firma_unvan}" adlı müşteri zaten mevcut (${existing.durum})`
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('❌ Unexpected error in checkCustomerDuplicate:', error);
    return {
      isDuplicate: false,
      message: 'Beklenmeyen hata'
    };
  }
}

/**
 * Banka/PF ünvanının duplicate olup olmadığını kontrol eder
 */
export async function checkBankPFDuplicate(
  firmaUnvan: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  if (!firmaUnvan || firmaUnvan.trim() === '') {
    return {
      isDuplicate: false,
      message: 'Firma ünvanı boş olamaz'
    };
  }

  const normalizedName = firmaUnvan.trim().toLowerCase();

  try {
    let query = supabase
      .from('bank_accounts')
      .select('id, firma_unvan, durum')
      .ilike('firma_unvan', normalizedName);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Duplicate check error:', error);
      return {
        isDuplicate: false,
        message: 'Kontrol yapılamadı'
      };
    }

    if (data && data.length > 0) {
      const existing = data[0];
      return {
        isDuplicate: true,
        existingRecord: existing,
        message: `"${existing.firma_unvan}" adlı Banka/PF zaten mevcut (${existing.durum})`
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('❌ Unexpected error in checkBankPFDuplicate:', error);
    return {
      isDuplicate: false,
      message: 'Beklenmeyen hata'
    };
  }
}

/**
 * Tanımlar tablosundaki kod duplicate kontrolü
 */
export async function checkDefinitionCodeDuplicate(
  tableName: string,
  code: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  if (!code || code.trim() === '') {
    return {
      isDuplicate: false,
      message: 'Kod boş olamaz'
    };
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    let query = supabase
      .from(tableName)
      .select('id, kod, aktif')
      .ilike('kod', normalizedCode);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Duplicate check error:', error);
      return {
        isDuplicate: false,
        message: 'Kontrol yapılamadı'
      };
    }

    if (data && data.length > 0) {
      const existing = data[0];
      return {
        isDuplicate: true,
        existingRecord: existing,
        message: `"${existing.kod}" kodu zaten mevcut (${existing.aktif ? 'Aktif' : 'Pasif'})`
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('❌ Unexpected error in checkDefinitionCodeDuplicate:', error);
    return {
      isDuplicate: false,
      message: 'Beklenmeyen hata'
    };
  }
}

/**
 * Tanımlar tablosundaki ad duplicate kontrolü
 */
export async function checkDefinitionNameDuplicate(
  tableName: string,
  nameField: string,
  name: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  if (!name || name.trim() === '') {
    return {
      isDuplicate: false,
      message: 'Ad boş olamaz'
    };
  }

  const normalizedName = name.trim().toLowerCase();

  try {
    let query = supabase
      .from(tableName)
      .select(`id, ${nameField}, aktif`)
      .ilike(nameField, normalizedName);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Duplicate check error:', error);
      return {
        isDuplicate: false,
        message: 'Kontrol yapılamadı'
      };
    }

    if (data && data.length > 0) {
      const existing = data[0];
      return {
        isDuplicate: true,
        existingRecord: existing,
        message: `"${existing[nameField]}" adı zaten mevcut (${existing.aktif ? 'Aktif' : 'Pasif'})`
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('❌ Unexpected error in checkDefinitionNameDuplicate:', error);
    return {
      isDuplicate: false,
      message: 'Beklenmeyen hata'
    };
  }
}

/**
 * Batch duplicate check - Birden fazla kaydı kontrol eder
 */
export async function batchCheckDuplicates(
  tableName: string,
  field: string,
  values: string[],
  excludeIds?: string[]
): Promise<Map<string, DuplicateCheckResult>> {
  const results = new Map<string, DuplicateCheckResult>();

  if (values.length === 0) {
    return results;
  }

  try {
    const normalizedValues = values.map(v => v.trim().toLowerCase());
    
    let query = supabase
      .from(tableName)
      .select('*')
      .in(field, normalizedValues);

    if (excludeIds && excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Batch duplicate check error:', error);
      // Return all as non-duplicates on error
      values.forEach(v => {
        results.set(v, {
          isDuplicate: false,
          message: 'Kontrol yapılamadı'
        });
      });
      return results;
    }

    // Map results
    values.forEach(originalValue => {
      const normalized = originalValue.trim().toLowerCase();
      const existing = data?.find(d => 
        d[field]?.toString().trim().toLowerCase() === normalized
      );

      if (existing) {
        results.set(originalValue, {
          isDuplicate: true,
          existingRecord: existing,
          message: `"${existing[field]}" zaten mevcut`
        });
      } else {
        results.set(originalValue, {
          isDuplicate: false
        });
      }
    });

    return results;
  } catch (error) {
    console.error('❌ Unexpected error in batchCheckDuplicates:', error);
    // Return all as non-duplicates on error
    values.forEach(v => {
      results.set(v, {
        isDuplicate: false,
        message: 'Beklenmeyen hata'
      });
    });
    return results;
  }
}
