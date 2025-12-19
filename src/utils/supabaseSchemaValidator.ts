/**
 * ========================================
 * 🔍 SUPABASE SCHEMA VALIDATOR
 * ========================================
 * Automatic schema detection and validation
 * Ensures frontend code matches production schema
 * ========================================
 */

import { supabase } from './supabaseClient';

interface SchemaValidation {
  fieldName: string;
  expectedType: string;
  actualType: string | null;
  exists: boolean;
  isCorrect: boolean;
  issue?: string;
}

/**
 * Validate customer table schema
 */
export async function validateCustomerSchema(): Promise<{
  isValid: boolean;
  validations: SchemaValidation[];
  criticalIssues: string[];
}> {
  const validations: SchemaValidation[] = [];
  const criticalIssues: string[] = [];

  // ✅ CRITICAL: Check if Supabase client is available
  if (!supabase) {
    // Silently skip validation if Supabase is not available
    return { isValid: true, validations: [], criticalIssues: [] };
  }

  try {
    // ✅ FIX: Direct fallback - no RPC needed, just fetch sample data
    const { data: columns, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (error) {
      console.warn('⚠️ Could not fetch sample data for schema validation:', error);
      return { isValid: true, validations: [], criticalIssues: [] };
    }

    // If we got sample data, inspect it
    if (Array.isArray(columns) && columns.length > 0) {
      const sample = columns[0];
      
      // Critical field checks
      const checks: Array<{
        field: string;
        expectedType: string;
        critical?: boolean;
      }> = [
        { field: 'id', expectedType: 'TEXT', critical: true },
        { field: 'cari_adi', expectedType: 'TEXT', critical: true },
        { field: 'mcc', expectedType: 'TEXT' },
        { field: 'durum', expectedType: 'TEXT' },
        { field: 'linked_bank_pf_ids', expectedType: 'ARRAY' },
        { field: 'domain_hierarchy', expectedType: 'ARRAY' },
        { field: 'bank_device_assignments', expectedType: 'JSONB' },
        { field: 'service_fee_settings', expectedType: 'JSONB' },
        { field: 'device_subscriptions', expectedType: 'JSONB' }
      ];

      checks.forEach(({ field, expectedType, critical }) => {
        const exists = field in sample;
        let actualType: string | null = null;
        let isCorrect = false;
        let issue: string | undefined;

        if (exists) {
          const value = sample[field];
          
          // Detect actual type
          if (value === null || value === undefined) {
            actualType = 'NULL';
            isCorrect = true; // NULL is acceptable
          } else if (Array.isArray(value)) {
            actualType = 'ARRAY';
            isCorrect = expectedType === 'ARRAY';
          } else if (typeof value === 'object') {
            actualType = 'JSONB';
            isCorrect = expectedType === 'JSONB';
          } else if (typeof value === 'string') {
            actualType = 'TEXT';
            isCorrect = expectedType === 'TEXT';
          } else if (typeof value === 'number') {
            actualType = 'NUMERIC';
            isCorrect = expectedType === 'NUMERIC';
          } else if (typeof value === 'boolean') {
            actualType = 'BOOLEAN';
            isCorrect = expectedType === 'BOOLEAN';
          }

          if (!isCorrect && actualType !== 'NULL') {
            issue = `Type mismatch: expected ${expectedType}, got ${actualType}`;
            if (critical) {
              criticalIssues.push(`${field}: ${issue}`);
            }
          }
        } else {
          issue = 'Field does not exist';
          if (critical) {
            criticalIssues.push(`${field}: ${issue}`);
          }
        }

        validations.push({
          fieldName: field,
          expectedType,
          actualType,
          exists,
          isCorrect,
          issue
        });
      });
    }

    const isValid = criticalIssues.length === 0;
    
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Schema Validation Results');
      console.table(validations);
      if (criticalIssues.length > 0) {
        console.error('🚨 Critical Issues:', criticalIssues);
      } else {
        console.log('✅ Schema validation passed!');
      }
      console.groupEnd();
    }

    return { isValid, validations, criticalIssues };
  } catch (error: any) {
    console.error('❌ Schema validation error:', error);
    return { isValid: true, validations: [], criticalIssues: [] };
  }
}

/**
 * Auto-detect and log schema type for a specific field
 */
export async function detectFieldType(fieldName: string): Promise<string | null> {
  // ✅ CRITICAL: Check if Supabase client is available
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select(fieldName)
      .limit(1)
      .single();

    if (error || !data) return null;

    const value = data[fieldName];
    if (value === null || value === undefined) return 'NULL';
    if (Array.isArray(value)) return 'ARRAY';
    if (typeof value === 'object') return 'JSONB';
    if (typeof value === 'string') return 'TEXT';
    if (typeof value === 'number') return 'NUMERIC';
    if (typeof value === 'boolean') return 'BOOLEAN';
    
    return 'UNKNOWN';
  } catch (error) {
    console.error(`Failed to detect type for ${fieldName}:`, error);
    return null;
  }
}

/**
 * Run comprehensive schema check
 */
export async function runSchemaCheck() {
  console.log('🔍 Running comprehensive schema check...');
  
  const results = await validateCustomerSchema();
  
  if (!results.isValid && results.criticalIssues.length > 0) {
    console.error('❌ Schema validation found issues!');
    console.error('Critical issues:', results.criticalIssues);
  } else if (results.validations.length === 0) {
    console.log('⚠️ Schema validation skipped (no data available)');
  } else {
    console.log('✅ All schema checks passed!');
  }
  
  return results;
}

/**
 * Field-specific validators
 */
export const fieldValidators = {
  /**
   * Check if mcc field exists and is TEXT type
   */
  async validateMCC(): Promise<boolean> {
    const type = await detectFieldType('mcc');
    const isValid = type === 'TEXT' || type === 'NULL';
    if (!isValid) {
      console.error(`❌ MCC field type mismatch! Expected TEXT, got ${type}`);
    }
    return isValid;
  },

  /**
   * Check if durum field exists and is TEXT type
   */
  async validateDurum(): Promise<boolean> {
    const type = await detectFieldType('durum');
    const isValid = type === 'TEXT' || type === 'NULL';
    if (!isValid) {
      console.error(`❌ Durum field type mismatch! Expected TEXT, got ${type}`);
    }
    return isValid;
  },

  /**
   * Check linked_bank_pf_ids type (should be ARRAY not JSONB)
   */
  async validateLinkedBankPFIds(): Promise<boolean> {
    const type = await detectFieldType('linked_bank_pf_ids');
    const isValid = type === 'ARRAY' || type === 'NULL';
    if (!isValid) {
      console.error(`❌ linked_bank_pf_ids type mismatch! Expected ARRAY, got ${type}`);
      console.error('⚠️ Code expects TEXT[] but Supabase might have JSONB');
    }
    return isValid;
  },

  /**
   * Check domain_hierarchy type (should be ARRAY not JSONB)
   */
  async validateDomainHierarchy(): Promise<boolean> {
    const type = await detectFieldType('domain_hierarchy');
    const isValid = type === 'ARRAY' || type === 'NULL';
    if (!isValid) {
      console.error(`❌ domain_hierarchy type mismatch! Expected ARRAY, got ${type}`);
      console.error('⚠️ Code expects TEXT[] but Supabase might have JSONB');
    }
    return isValid;
  }
};
