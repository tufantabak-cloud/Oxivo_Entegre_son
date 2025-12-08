/**
 * 🔄 RUN SUPABASE-FRONTEND SYNC AUDIT
 * 
 * Bu script Supabase database ile frontend type definitions arasındaki
 * uyumluluğu kontrol eder.
 * 
 * Kullanım:
 *   tsx scripts/run-sync-audit.ts
 */

import { runSyncAudit, quickTableCheck } from '../utils/syncAudit';

// ========================================
// CONFIGURATION
// ========================================

// Environment variables'dan al (veya .env dosyasından)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

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
    quickResult.exists.forEach(table => {
      console.log(`   ✓ ${table}`);
    });
    console.log('');

    if (quickResult.missing.length > 0) {
      console.log('❌ MISSING TABLES:');
      quickResult.missing.forEach(table => {
        console.log(`   ✗ ${table}`);
      });
      console.log('');
    }

    console.log(`📊 Summary: ${quickResult.exists.length}/${quickResult.exists.length + quickResult.missing.length} tables exist\n`);

    // Option 2: Full Audit (detailed, slower)
    console.log('═══════════════════════════════════════════════════════════');
    console.log('OPTION 2: FULL AUDIT REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    const auditReport = await runSyncAudit(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Export report to JSON
    const reportJSON = JSON.stringify(auditReport, null, 2);
    
    // Save to file (optional - only works in Node environment)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const reportPath = path.join(process.cwd(), 'sync-audit-report.json');
      fs.writeFileSync(reportPath, reportJSON);
      console.log(`\n💾 Report saved to: ${reportPath}`);
    } catch (err) {
      console.log('\n⚠️  Could not save report to file (Node.js environment required)');
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
