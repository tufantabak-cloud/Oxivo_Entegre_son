/**
 * Test Suspension Reasons Field Mapping
 * Browser console'dan çalıştırılabilir test fonksiyonu
 */

import { suspensionReasonApi } from './supabaseClient';

export async function testSuspensionReasonsMapping() {
  console.log('🧪 ═══════════════════════════════════════════════');
  console.log('🧪 SUSPENSION REASONS FIELD MAPPING TEST');
  console.log('🧪 ═══════════════════════════════════════════════\n');

  try {
    // Step 1: Fetch all suspension reasons
    console.log('📥 Step 1: Fetching all suspension reasons from Supabase...');
    const result = await suspensionReasonApi.getAll();

    if (!result.success) {
      console.error('❌ FAILED: Could not fetch suspension reasons');
      console.error('   Error:', result.error);
      return { success: false, error: result.error };
    }

    console.log(`✅ SUCCESS: Fetched ${result.data.length} records\n`);

    // Step 2: Analyze field mapping
    console.log('🔍 Step 2: Analyzing field mapping...\n');
    
    if (result.data.length === 0) {
      console.warn('⚠️  WARNING: No data found in suspension_reasons table');
      console.log('   This could mean:');
      console.log('   1. Table is empty (new installation)');
      console.log('   2. Database connection issue');
      console.log('   3. Permission problem\n');
      return { success: true, data: [], isEmpty: true };
    }

    // Show first record in detail
    const firstRecord = result.data[0];
    console.log('📊 First Record Details:');
    console.log('─────────────────────────────────────────────────');
    console.log('   ID:', firstRecord.id);
    console.log('   Reason (Frontend field):', firstRecord.reason);
    console.log('   Neden (Supabase field):', (firstRecord as any).neden);
    console.log('   Açıklama:', firstRecord.aciklama);
    console.log('   Aktif:', firstRecord.aktif);
    console.log('   Oluşturma Tarihi:', firstRecord.olusturmaTarihi);
    console.log('─────────────────────────────────────────────────\n');

    // Check field mapping
    const hasReasonField = result.data.every(r => r.reason !== undefined);
    const hasNedenField = result.data.every(r => (r as any).neden !== undefined);
    const hasEmptyReason = result.data.some(r => !r.reason || r.reason.trim() === '');

    console.log('🔍 Field Mapping Analysis:');
    console.log('─────────────────────────────────────────────────');
    console.log(`   ✓ All records have "reason" field: ${hasReasonField ? '✅ YES' : '❌ NO'}`);
    console.log(`   ✓ All records have "neden" field: ${hasNedenField ? '⚠️  YES (should be hidden)' : '✅ NO (correct)'}`);
    console.log(`   ✓ Any empty "reason" values: ${hasEmptyReason ? '❌ YES (PROBLEM!)' : '✅ NO'}`);
    console.log('─────────────────────────────────────────────────\n');

    // Show all records in table format
    console.log('📋 All Records (Table View):');
    console.table(
      result.data.map(r => ({
        ID: r.id.substring(0, 8) + '...',
        Reason: r.reason || '⚠️ EMPTY',
        Açıklama: r.aciklama || '-',
        Aktif: r.aktif ? '✓' : '○',
        Tarih: r.olusturmaTarihi
      }))
    );

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('─────────────────────────────────────────────────');
    console.log(`   Total Records: ${result.data.length}`);
    console.log(`   Active: ${result.data.filter(r => r.aktif).length}`);
    console.log(`   Inactive: ${result.data.filter(r => !r.aktif).length}`);
    
    if (hasEmptyReason) {
      console.log('\n⚠️  WARNING: Some records have empty "reason" field!');
      console.log('   Possible causes:');
      console.log('   1. Field mapping issue (neden → reason)');
      console.log('   2. NULL values in database');
      console.log('   3. Data corruption');
      
      const emptyRecords = result.data.filter(r => !r.reason || r.reason.trim() === '');
      console.log(`\n   Empty records (${emptyRecords.length}):`);
      console.table(
        emptyRecords.map(r => ({
          ID: r.id,
          Reason: r.reason,
          Neden: (r as any).neden,
          RawData: JSON.stringify(r)
        }))
      );
    } else {
      console.log('\n✅ ALL TESTS PASSED!');
      console.log('   Field mapping is working correctly.');
    }

    console.log('─────────────────────────────────────────────────');
    console.log('🧪 Test completed!\n');

    return { 
      success: true, 
      data: result.data,
      analysis: {
        total: result.data.length,
        hasReasonField,
        hasEmptyReason,
        activeCount: result.data.filter(r => r.aktif).length
      }
    };

  } catch (error: any) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Quick manual test for browser console
 */
export async function quickTestSuspensionReasons() {
  console.clear();
  const result = await testSuspensionReasonsMapping();
  
  if (result.success && !result.isEmpty) {
    console.log('\n🎯 NEXT STEPS:');
    if (result.analysis?.hasEmptyReason) {
      console.log('   1. Check Supabase database: Does "neden" column exist?');
      console.log('   2. Run SQL: SELECT id, neden, aciklama FROM suspension_reasons;');
      console.log('   3. Verify field sanitizer: sanitizeSuspensionReason()');
    } else {
      console.log('   ✅ Everything looks good!');
      console.log('   ✅ UI should display suspension reasons correctly now.');
    }
  } else if (result.isEmpty) {
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Add test data via UI');
    console.log('   2. Re-run test: quickTestSuspensionReasons()');
  }
  
  return result;
}
