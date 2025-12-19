/**
 * 🔍 CHECK MISSING TABLES
 * 
 * Eksik 5 tablonun durumunu kontrol et
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://okgeyuhmumlkkcpoholh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2V5dWhtdW1sa2tjcG9ob2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0OTY0NzUsImV4cCI6MjA0OTA3MjQ3NX0.A4gfv4F2bN0gCxWYV1rq5JQYzDlwR7fXcB1KHGxZXpE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMissingTables() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 CHECKING MISSING TABLES');
  console.log('═══════════════════════════════════════════════════════════\n');

  const missingTables = [
    'petty_cash',
    'categories', 
    'transactions',
    'income_records'
  ];

  const results = [];

  for (const table of missingTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      const status = count > 0 ? '✅' : '⚪';
      console.log(`${status} ${table.padEnd(20)} → ${count} kayıt`);
      results.push({ table, count, exists: true });
    } catch (err) {
      console.log(`❌ ${table.padEnd(20)} → HATA: ${err.message}`);
      results.push({ table, error: err.message, exists: false });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const existing = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);
  const totalRecords = results.reduce((sum, r) => sum + (r.count || 0), 0);

  console.log(`✅ Mevcut: ${existing.length}/${missingTables.length}`);
  console.log(`❌ Eksik: ${missing.length}`);
  console.log(`📊 Toplam Kayıt: ${totalRecords}`);

  if (missing.length > 0) {
    console.log('\n❌ EKSİK TABLOLAR:');
    missing.forEach(m => console.log(`   - ${m.table}`));
  }

  console.log('\n✅ Check completed!');
}

checkMissingTables();
