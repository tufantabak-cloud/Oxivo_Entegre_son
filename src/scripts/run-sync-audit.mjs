/**
 * 🔄 RUN SUPABASE-FRONTEND SYNC AUDIT
 * 
 * Bu script Supabase database ile frontend type definitions arasındaki
 * uyumluluğu kontrol eder.
 * 
 * Kullanım:
 *   node scripts/run-sync-audit.mjs
 */

import { runSyncAudit, quickTableCheck } from '../utils/syncAudit.ts';

// ========================================
// CONFIGURATION
// ========================================

// Environment variables'dan al (veya .env dosyasından)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://okgeyuhmumlkkcpoholh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2V5dWhtdW1sa2tjcG9ob2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0OTY0NzUsImV4cCI6MjA0OTA3MjQ3NX0.A4gfv4F2bN0gCxWYV1rq5JQYzDlwR7fXcB1KHGxZXpE';

// ========================================
// MAIN
// ========================================

async function main() {
  console.log('🚀 Starting Supabase-Frontend Sync Audit...\n');

  // Check if environment variables are set
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: Supabase credentials not found!');
    console.error('');
    console.error('Please set the following environment variables:');
    console.error('  - VITE_SUPABASE_URL');
    console.error('  - VITE_SUPABASE_ANON_KEY');
    console.error('');
    console.error('Or update this script to hardcode the values for testing.');
    process.exit(1);
  }

  console.log(`📡 Supabase URL: ${SUPABASE_URL.substring(0, 30)}...`);
  console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log('');

  try {
    // Option 1: Quick Check (faster, less detailed)
    console.log('═══════════════════════════════════════════════════════════');
    console.log('OPTION 1: QUICK TABLE CHECK');
    console.log('═══════════════════════════════════════════════════════════\n');

    const quickResult = await quickTableCheck(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('✅ EXISTING TABLES:');
    quickResult.exists.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });
    console.log('');

    if (quickResult.missing.length > 0) {
      console.log('❌ MISSING TABLES:');
      quickResult.missing.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table}`);
      });
      console.log('');
    }

    const totalTables = quickResult.exists.length + quickResult.missing.length;
    const coverage = ((quickResult.exists.length / totalTables) * 100).toFixed(1);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Existing: ${quickResult.exists.length}`);
    console.log(`❌ Missing: ${quickResult.missing.length}`);
    console.log(`📈 Total: ${totalTables}`);
    console.log(`📊 Coverage: ${coverage}%\n`);

    if (quickResult.missing.length === 0) {
      console.log('🎉 All tables exist in Supabase!\n');
    }

    // Option 2: Full Audit (detailed, slower)
    console.log('═══════════════════════════════════════════════════════════');
    console.log('OPTION 2: FULL AUDIT REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    const auditReport = await runSyncAudit(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log(`\n📋 Audit Status: ${auditReport.status.toUpperCase()}`);
    console.log(`📊 Tables Audited: ${auditReport.tables.length}`);
    console.log(`⏱️  Timestamp: ${auditReport.timestamp}\n`);

    // Show table details
    console.log('📊 TABLE DETAILS:\n');
    auditReport.tables.forEach((table, index) => {
      const status = table.exists ? '✅' : '❌';
      const recordCount = table.recordCount !== undefined ? ` (${table.recordCount} records)` : '';
      console.log(`${index + 1}. ${status} ${table.name}${recordCount}`);
      
      if (table.errors && table.errors.length > 0) {
        table.errors.forEach(error => {
          console.log(`   ⚠️  ${error}`);
        });
      }
    });

    // Export report to JSON
    const reportJSON = JSON.stringify(auditReport, null, 2);
    
    // Save to file
    try {
      const fs = await import('fs');
      const path = await import('path');
      const reportPath = path.join(process.cwd(), 'sync-audit-report.json');
      fs.writeFileSync(reportPath, reportJSON);
      console.log(`\n💾 Report saved to: ${reportPath}`);
    } catch (err) {
      console.log('\n⚠️  Could not save report to file');
    }

    // Exit with appropriate code
    if (auditReport.status === 'error') {
      console.log('\n❌ Audit completed with ERRORS');
      process.exit(1);
    } else if (auditReport.status === 'warning') {
      console.log('\n⚠️  Audit completed with WARNINGS');
      process.exit(0);
    } else {
      console.log('\n✅ Audit completed SUCCESSFULLY');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during audit:');
    console.error(error);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
