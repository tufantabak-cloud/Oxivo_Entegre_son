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