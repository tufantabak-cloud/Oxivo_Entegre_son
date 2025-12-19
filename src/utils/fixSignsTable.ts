// ⚡ ONE-TIME MIGRATION SCRIPT
// Run this in browser console ONCE to fix signs table schema

export async function fixSignsTable() {
  const SUPABASE_URL = 'https://okgeyuhmumlkkcpoholh.supabase.co';
  const SUPABASE_SERVICE_KEY = prompt('Enter SUPABASE_SERVICE_ROLE_KEY:');
  
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Service key required!');
    return;
  }

  console.log('🔧 Starting signs table migration...');

  const queries = [
    `ALTER TABLE signs ADD COLUMN IF NOT EXISTS aciklama TEXT DEFAULT ''`,
    `ALTER TABLE signs ADD COLUMN IF NOT EXISTS fotograf TEXT DEFAULT ''`,
    `ALTER TABLE signs ADD COLUMN IF NOT EXISTS olusturma_tarihi TEXT`,
    `ALTER TABLE signs ADD COLUMN IF NOT EXISTS guncelleme_tarihi TIMESTAMPTZ DEFAULT NOW()`,
  ];

  try {
    for (const query of queries) {
      console.log(`Executing: ${query}`);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error: ${error}`);
      } else {
        console.log(`✅ Success`);
      }
    }

    console.log('✅ Migration completed!');
    return { success: true };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error };
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).fixSignsTable = fixSignsTable;
}
