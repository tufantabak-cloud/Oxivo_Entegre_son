/**
 * 🧪 SYNC AUDIT TEST UTILITY
 * 
 * Browser veya Node ortamında sync audit'i test etmek için basit araç
 */

import { quickTableCheck } from './syncAudit';

// ========================================
// BROWSER-FRIENDLY TEST
// ========================================

export async function testSyncAuditInBrowser() {
  console.log('🔍 Testing Sync Audit in Browser...\n');

  // Get credentials from environment or window
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in environment!');
    console.error('Please check your .env file.');
    return;
  }

  console.log(`📡 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...\n`);

  try {
    console.log('⏳ Running quick table check...\n');
    
    const result = await quickTableCheck(supabaseUrl, supabaseKey);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 QUICK CHECK RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`✅ EXISTING TABLES (${result.exists.length}):`);
    result.exists.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });
    console.log('');
    
    if (result.missing.length > 0) {
      console.log(`❌ MISSING TABLES (${result.missing.length}):`);
      result.missing.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table}`);
      });
      console.log('');
    }
    
    const totalTables = result.exists.length + result.missing.length;
    const percentage = ((result.exists.length / totalTables) * 100).toFixed(1);
    
    console.log(`📈 SUMMARY: ${result.exists.length}/${totalTables} tables exist (${percentage}%)`);
    
    if (result.missing.length === 0) {
      console.log('🎉 All tables are present in Supabase!\n');
    } else {
      console.log('⚠️  Some tables are missing. Check Supabase setup.\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error);
    throw error;
  }
}

// ========================================
// EXPORT FOR CONSOLE USAGE
// ========================================

// Browser console'dan çağrılabilir:
// import('./utils/testSyncAudit').then(m => m.testSyncAuditInBrowser())
export default testSyncAuditInBrowser;
