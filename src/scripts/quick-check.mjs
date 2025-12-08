/**
 * 🔍 QUICK TABLE CHECK (Node.js ES Module)
 * 
 * PowerShell'de çalıştırmak için:
 *   node scripts/quick-check.mjs
 */

import { createClient } from '@supabase/supabase-js';

// ========================================
// CONFIGURATION
// ========================================

// ⚠️ Geçici olarak buraya hardcode et (sadece test için!)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://okgeyuhmumlkkcpoholh.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2V5dWhtdW1sa2tjcG9ob2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDAyMjAsImV4cCI6MjA3Mzk3NjIyMH0.wICqJoMc9a2-S7OwW6VMwcs1-ApPjpnS2QMZ4BVZFpI';

const EXPECTED_TABLES = [
  // Definitions
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
  // Core
  'customers',
  'bank_accounts',
  'petty_cash',
  'categories',
  'transactions',
  'signs',
  'income_records',
  'products',
  'domain_mappings',
];

// ========================================
// MAIN
// ========================================

async function main() {
  console.log('🔍 Quick Table Check\n');

  // Validate credentials
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
    console.error('❌ Error: SUPABASE_URL not configured!');
    console.error('');
    console.error('Please edit scripts/quick-check.mjs and set:');
    console.error('  const SUPABASE_URL = "https://your-project.supabase.co";');
    console.error('  const SUPABASE_KEY = "your-anon-key";');
    process.exit(1);
  }

  console.log(`📡 Supabase URL: ${SUPABASE_URL.substring(0, 40)}...`);
  console.log(`🔑 Key: ${SUPABASE_KEY.substring(0, 20)}...`);
  console.log('');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const exists = [];
  const missing = [];

  console.log('⏳ Checking tables...\n');

  for (const tableName of EXPECTED_TABLES) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        missing.push(tableName);
        console.log(`❌ ${tableName}`);
      } else {
        exists.push(tableName);
        console.log(`✅ ${tableName}`);
      }
    } catch (err) {
      missing.push(tableName);
      console.log(`❌ ${tableName} (error: ${err.message})`);
    }
  }

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`✅ Existing: ${exists.length}`);
  console.log(`❌ Missing: ${missing.length}`);
  console.log(`📈 Total: ${EXPECTED_TABLES.length}`);
  console.log(`📊 Coverage: ${((exists.length / EXPECTED_TABLES.length) * 100).toFixed(1)}%`);
  console.log('');

  if (missing.length > 0) {
    console.log('❌ MISSING TABLES:');
    missing.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });
    console.log('');
    console.log('⚠️  These tables need to be created in Supabase.');
    process.exit(1);
  } else {
    console.log('🎉 All tables exist in Supabase!');
    process.exit(0);
  }
}

// Run
main().catch((error) => {
  console.error('❌ Fatal error:');
  console.error(error);
  process.exit(1);
});
