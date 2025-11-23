/**
 * Auto Sync to Supabase
 * Müşteri verilerini otomatik olarak Supabase'e senkronize eder
 */

import { customerApi } from './supabaseClient';

export function startAutoSync(customers: any[]) {
  if (!customers || customers.length === 0) return;
  
  console.log(`☁️ Auto-syncing ${customers.length} customers to Supabase...`);
  
  customerApi.create(customers)
    .then(result => {
      if (result.success) {
        console.log(`✅ Auto-sync successful: ${result.count} customers`);
      } else {
        console.error(`❌ Auto-sync failed:`, result.error);
      }
    })
    .catch(err => {
      console.error(`❌ Auto-sync error:`, err);
    });
}
