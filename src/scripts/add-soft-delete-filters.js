/**
 * Script to add .eq('is_deleted', false) to all getAll() queries
 * Run this script manually if needed
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../utils/supabaseClient.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Pattern 1: .select('*').order(...) → .select('*').eq('is_deleted', false).order(...)
content = content.replace(
  /\.select\('?\*'?\)\s*\.order\(/g,
  ".select('*').eq('is_deleted', false).order("
);

// Pattern 2: .select('*', { count: 'exact' }).order(...) → add eq before order
content = content.replace(
  /\.select\('?\*'?,\s*\{\s*count:\s*'exact'\s*\}\)\s*\.order\(/g,
  ".select('*', { count: 'exact' }).eq('is_deleted', false).order("
);

// Write back
fs.writeFileSync(filePath, content, 'utf-8');

console.log('✅ Added is_deleted filters to all queries in supabaseClient.ts');
