/**
 * 🔄 SUPABASE-FRONTEND SYNC & AUDIT MODULE
 * 
 * Bu modül Supabase veritabanı ile frontend TypeScript type'ları arasındaki
 * uyumluluğu kontrol eder ve rapor eder.
 * 
 * Created: 2024-12-08
 * Version: 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// ========================================
// CONFIGURATION
// ========================================

const EXPECTED_TABLES = [
  // Definitions Tables
  'mcc_codes',
  'banks',
  'epk_institutions',
  'ok_institutions',
  'sales_representatives',
  'job_titles',
  'partnerships',
  'sharings',
  'card_programs',
  'suspension_reasons',
  'earnings',
  // Core Tables
  'customers',
  'bank_accounts',
  'petty_cash',
  'categories',
  'transactions',
  'signs',
  'income_records',
  'products',
  'domain_mappings',
] as const;

type ExpectedTable = typeof EXPECTED_TABLES[number];

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface SyncAuditReport {
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  summary: {
    totalTables: number;
    existingTables: number;
    missingTables: number;
    extraTables: number;
  };
  tables: TableAuditResult[];
  recommendations: string[];
}

export interface TableAuditResult {
  tableName: string;
  status: 'exists' | 'missing' | 'extra';
  columnCount?: number;
  columns?: ColumnInfo[];
  issues?: string[];
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  ordinalPosition: number;
}

// ========================================
// MAIN AUDIT FUNCTION
// ========================================

/**
 * Supabase database ile frontend type definitions arasındaki
 * uyumluluğu kontrol eder
 */
export async function runSyncAudit(
  supabaseUrl: string,
  supabaseKey: string
): Promise<SyncAuditReport> {
  console.log('🔄 Starting Supabase-Frontend Sync Audit...\n');

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  try {
    // 1. Get all tables from Supabase
    const { data: tables, error } = await supabase.rpc('get_table_list');

    if (error) {
      console.error('❌ Error fetching table list:', error);
      
      // Fallback: Query information_schema directly
      return await runAuditWithInformationSchema(supabase);
    }

    // 2. Compare with expected tables
    const report = await generateAuditReport(supabase, tables || []);

    // 3. Print report
    printAuditReport(report);

    return report;
  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  }
}

// ========================================
// AUDIT WITH INFORMATION_SCHEMA
// ========================================

async function runAuditWithInformationSchema(
  supabase: ReturnType<typeof createClient>
): Promise<SyncAuditReport> {
  console.log('📊 Using information_schema for audit...\n');

  const timestamp = new Date().toISOString();
  const tableResults: TableAuditResult[] = [];
  const recommendations: string[] = [];

  // Query for all public tables
  const { data: schemaData, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        t.table_name,
        COUNT(c.column_name) as column_count
      FROM 
        information_schema.tables t
      LEFT JOIN 
        information_schema.columns c 
        ON t.table_name = c.table_name
      WHERE 
        t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      GROUP BY 
        t.table_name
      ORDER BY 
        t.table_name;
    `
  });

  if (error) {
    console.error('❌ Error querying information_schema:', error);
    
    // Manual fallback - check each table individually
    return await manualTableCheck(supabase);
  }

  const existingTables = (schemaData || []).map((row: any) => row.table_name);

  // Check each expected table
  for (const tableName of EXPECTED_TABLES) {
    if (existingTables.includes(tableName)) {
      const columns = await getTableColumns(supabase, tableName);
      
      tableResults.push({
        tableName,
        status: 'exists',
        columnCount: columns.length,
        columns,
        issues: []
      });
    } else {
      tableResults.push({
        tableName,
        status: 'missing',
        issues: [`Table '${tableName}' does not exist in database`]
      });
      
      recommendations.push(`✅ Create table: ${tableName}`);
    }
  }

  // Check for extra tables
  for (const existingTable of existingTables) {
    if (!EXPECTED_TABLES.includes(existingTable as ExpectedTable)) {
      tableResults.push({
        tableName: existingTable,
        status: 'extra',
        issues: [`Table '${existingTable}' exists but is not in type definitions`]
      });
      
      recommendations.push(`⚠️ Consider adding '${existingTable}' to types/database.ts`);
    }
  }

  const summary = {
    totalTables: EXPECTED_TABLES.length,
    existingTables: tableResults.filter(t => t.status === 'exists').length,
    missingTables: tableResults.filter(t => t.status === 'missing').length,
    extraTables: tableResults.filter(t => t.status === 'extra').length
  };

  const status = summary.missingTables > 0 ? 'error' : 
                 summary.extraTables > 0 ? 'warning' : 'success';

  return {
    timestamp,
    status,
    summary,
    tables: tableResults,
    recommendations
  };
}

// ========================================
// MANUAL TABLE CHECK (Last Resort)
// ========================================

async function manualTableCheck(
  supabase: ReturnType<typeof createClient>
): Promise<SyncAuditReport> {
  console.log('🔍 Performing manual table check...\n');

  const timestamp = new Date().toISOString();
  const tableResults: TableAuditResult[] = [];
  const recommendations: string[] = [];

  for (const tableName of EXPECTED_TABLES) {
    try {
      // Try to SELECT 1 row to test table existence
      const { error } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist')) {
          tableResults.push({
            tableName,
            status: 'missing',
            issues: [`Table '${tableName}' does not exist`]
          });
          recommendations.push(`✅ Create table: ${tableName}`);
        } else {
          tableResults.push({
            tableName,
            status: 'exists',
            issues: [`Warning: ${error.message}`]
          });
        }
      } else {
        tableResults.push({
          tableName,
          status: 'exists',
          issues: []
        });
      }
    } catch (err) {
      console.error(`Error checking table ${tableName}:`, err);
      tableResults.push({
        tableName,
        status: 'missing',
        issues: [`Could not verify table existence: ${err}`]
      });
    }
  }

  const summary = {
    totalTables: EXPECTED_TABLES.length,
    existingTables: tableResults.filter(t => t.status === 'exists').length,
    missingTables: tableResults.filter(t => t.status === 'missing').length,
    extraTables: 0
  };

  const status = summary.missingTables > 0 ? 'error' : 'success';

  return {
    timestamp,
    status,
    summary,
    tables: tableResults,
    recommendations
  };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function getTableColumns(
  supabase: ReturnType<typeof createClient>,
  tableName: string
): Promise<ColumnInfo[]> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name as name,
          data_type as "dataType",
          is_nullable = 'YES' as "isNullable",
          column_default as "defaultValue",
          ordinal_position as "ordinalPosition"
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
          AND table_name = '${tableName}'
        ORDER BY 
          ordinal_position;
      `
    });

    if (error) {
      console.warn(`⚠️ Could not fetch columns for ${tableName}:`, error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn(`⚠️ Error fetching columns for ${tableName}:`, err);
    return [];
  }
}

async function generateAuditReport(
  supabase: ReturnType<typeof createClient>,
  actualTables: string[]
): Promise<SyncAuditReport> {
  const timestamp = new Date().toISOString();
  const tableResults: TableAuditResult[] = [];
  const recommendations: string[] = [];

  // Check expected tables
  for (const tableName of EXPECTED_TABLES) {
    if (actualTables.includes(tableName)) {
      const columns = await getTableColumns(supabase, tableName);
      
      tableResults.push({
        tableName,
        status: 'exists',
        columnCount: columns.length,
        columns,
        issues: []
      });
    } else {
      tableResults.push({
        tableName,
        status: 'missing',
        issues: [`Table does not exist in database`]
      });
      
      recommendations.push(`Create table: ${tableName}`);
    }
  }

  // Check for extra tables
  for (const actualTable of actualTables) {
    if (!EXPECTED_TABLES.includes(actualTable as ExpectedTable)) {
      tableResults.push({
        tableName: actualTable,
        status: 'extra',
        issues: [`Table exists but not in type definitions`]
      });
      
      recommendations.push(`Add '${actualTable}' to types/database.ts`);
    }
  }

  const summary = {
    totalTables: EXPECTED_TABLES.length,
    existingTables: tableResults.filter(t => t.status === 'exists').length,
    missingTables: tableResults.filter(t => t.status === 'missing').length,
    extraTables: tableResults.filter(t => t.status === 'extra').length
  };

  const status = summary.missingTables > 0 ? 'error' : 
                 summary.extraTables > 0 ? 'warning' : 'success';

  return {
    timestamp,
    status,
    summary,
    tables: tableResults,
    recommendations
  };
}

function printAuditReport(report: SyncAuditReport): void {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║       🔄 SUPABASE-FRONTEND SYNC AUDIT REPORT             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`📅 Timestamp: ${report.timestamp}`);
  console.log(`📊 Status: ${getStatusEmoji(report.status)} ${report.status.toUpperCase()}\n`);

  console.log('📈 SUMMARY:');
  console.log(`   Total Expected Tables: ${report.summary.totalTables}`);
  console.log(`   ✅ Existing: ${report.summary.existingTables}`);
  console.log(`   ❌ Missing: ${report.summary.missingTables}`);
  console.log(`   ⚠️  Extra: ${report.summary.extraTables}\n`);

  // Missing Tables
  const missingTables = report.tables.filter(t => t.status === 'missing');
  if (missingTables.length > 0) {
    console.log('❌ MISSING TABLES (need to be created in Supabase):');
    missingTables.forEach(table => {
      console.log(`   - ${table.tableName}`);
      if (table.issues) {
        table.issues.forEach(issue => console.log(`      ${issue}`));
      }
    });
    console.log('');
  }

  // Extra Tables
  const extraTables = report.tables.filter(t => t.status === 'extra');
  if (extraTables.length > 0) {
    console.log('⚠️  EXTRA TABLES (exist in Supabase but not in types):');
    extraTables.forEach(table => {
      console.log(`   - ${table.tableName}`);
    });
    console.log('');
  }

  // Existing Tables
  const existingTables = report.tables.filter(t => t.status === 'exists');
  if (existingTables.length > 0) {
    console.log('✅ EXISTING TABLES:');
    existingTables.forEach(table => {
      console.log(`   ✓ ${table.tableName} (${table.columnCount} columns)`);
    });
    console.log('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '❓';
  }
}

// ========================================
// QUICK CHECK FUNCTION
// ========================================

/**
 * Quick check - sadece tablo varlığını kontrol eder (detaylı değil)
 */
export async function quickTableCheck(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ exists: string[]; missing: string[] }> {
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  
  const exists: string[] = [];
  const missing: string[] = [];

  for (const tableName of EXPECTED_TABLES) {
    try {
      const { error } = await supabase
        .from(tableName as any)
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        missing.push(tableName);
      } else {
        exists.push(tableName);
      }
    } catch (err) {
      missing.push(tableName);
    }
  }

  return { exists, missing };
}

// ========================================
// EXPORT
// ========================================

export default {
  runSyncAudit,
  quickTableCheck,
  EXPECTED_TABLES
};
