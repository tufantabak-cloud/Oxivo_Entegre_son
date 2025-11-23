/**
 * Supabase Data Import Script
 * 
 * Bu script Excel ve JSON dosyalarından verileri okuyup Supabase'e aktarır.
 * 
 * Kullanım:
 * 1. Node.js ortamında: npx tsx scripts/supabase-import.ts
 * 2. Tarayıcıda: ExcelImport component'i kullan
 * 
 * Created: 2025-11-23
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ========================================
// CONFIGURATION
// ========================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tveqpmzgqtoyagtpapev.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required!');
  console.error('   Set it in your .env file or pass it as an environment variable.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Read Excel file and convert to JSON
 */
function readExcelFile(filePath: string): any[] {
  console.log(`📖 Reading Excel file: ${filePath}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = XLSX.utils.sheet_to_json(worksheet, {
    raw: false, // Convert dates to strings
    defval: null, // Use null for empty cells
  });
  
  console.log(`✅ Read ${data.length} rows from ${sheetName}`);
  return data;
}

/**
 * Read JSON file
 */
function readJSONFile(filePath: string): any {
  console.log(`📖 Reading JSON file: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  const count = Array.isArray(data) ? data.length : Object.keys(data).length;
  console.log(`✅ Read ${count} items`);
  
  return data;
}

/**
 * Transform customer data from Excel/JSON to Supabase format
 */
function transformCustomerData(row: any): any {
  return {
    customer_code: row.musteriKodu || row.customerCode || row.customer_code,
    name: row.firmaUnvan || row.name || row.firma_unvan,
    tax_office: row.vergiDairesi || row.taxOffice || row.tax_office,
    tax_number: row.vergiNo || row.taxNumber || row.tax_number,
    phone: row.telefon || row.phone,
    email: row.email || row.eposta,
    address: row.adres || row.address,
    city: row.il || row.city,
    district: row.ilce || row.district,
    status: row.durum || row.status || 'Aktif',
    sales_rep: row.temsilci || row.salesRep || row.sales_rep,
    device_count: parseInt(row.cihazSayisi || row.deviceCount || row.device_count || '0'),
    monthly_revenue: parseFloat(row.aylikGelir || row.monthlyRevenue || row.monthly_revenue || '0'),
    contract_start_date: row.sozlesmeBaslangic || row.contractStartDate || row.contract_start_date,
    notes: row.notlar || row.notes,
  };
}

/**
 * Transform product data from Excel/JSON to Supabase format
 */
function transformProductData(row: any): any {
  return {
    serial_number: row.serialNumber || row.seriNo || row.serial_number,
    product_name: row.urunAdi || row.productName || row.product_name,
    model: row.model,
    brand: row.marka || row.brand,
    customer_id: row.musteriId || row.customerId || row.customer_id,
    status: row.durum || row.status || 'Aktif',
    installation_date: row.kurulumTarihi || row.installationDate || row.installation_date,
    monthly_fee: parseFloat(row.aylikUcret || row.monthlyFee || row.monthly_fee || '0'),
    notes: row.notlar || row.notes,
  };
}

/**
 * Transform bank/PF data from Excel/JSON to Supabase format
 */
function transformBankPFData(row: any): any {
  return {
    institution_name: row.firmaUnvan || row.institutionName || row.institution_name,
    institution_type: row.tip || row.type || row.institution_type || 'Banka',
    contact_person: row.yetkili || row.contactPerson || row.contact_person,
    phone: row.telefon || row.phone,
    email: row.email || row.eposta,
    address: row.adres || row.address,
    city: row.il || row.city,
    notes: row.notlar || row.notes,
  };
}

// ========================================
// IMPORT FUNCTIONS
// ========================================

/**
 * Import customers from file
 */
async function importCustomers(filePath: string): Promise<void> {
  console.log('\n🔷 IMPORTING CUSTOMERS');
  console.log('━'.repeat(60));
  
  try {
    // Read file (Excel or JSON)
    let rawData: any[];
    
    if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      rawData = readExcelFile(filePath);
    } else if (filePath.endsWith('.json')) {
      const jsonData = readJSONFile(filePath);
      rawData = Array.isArray(jsonData) ? jsonData : jsonData.customers || [];
    } else {
      throw new Error('Unsupported file format. Use .xlsx, .xls, or .json');
    }
    
    // Transform data
    console.log('🔄 Transforming data...');
    const customers = rawData.map(transformCustomerData);
    
    // Remove duplicates by customer_code
    const uniqueCustomers = Array.from(
      new Map(customers.map(c => [c.customer_code, c])).values()
    );
    
    console.log(`📊 ${customers.length} rows → ${uniqueCustomers.length} unique customers`);
    
    // Batch insert
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;
    
    for (let i = 0; i < uniqueCustomers.length; i += batchSize) {
      const batch = uniqueCustomers.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('customers')
        .upsert(batch, { onConflict: 'customer_code', ignoreDuplicates: false })
        .select();
      
      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} error:`, error.message);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(`✅ Batch ${i / batchSize + 1}: ${data?.length || 0} customers`);
      }
    }
    
    console.log('\n📈 IMPORT SUMMARY:');
    console.log(`   ✅ Successfully imported: ${inserted}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total processed: ${uniqueCustomers.length}`);
    
  } catch (error: any) {
    console.error('❌ Error importing customers:', error.message);
    throw error;
  }
}

/**
 * Import products from file
 */
async function importProducts(filePath: string): Promise<void> {
  console.log('\n🔷 IMPORTING PRODUCTS');
  console.log('━'.repeat(60));
  
  try {
    // Read file
    let rawData: any[];
    
    if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      rawData = readExcelFile(filePath);
    } else if (filePath.endsWith('.json')) {
      const jsonData = readJSONFile(filePath);
      rawData = Array.isArray(jsonData) ? jsonData : jsonData.products || [];
    } else {
      throw new Error('Unsupported file format');
    }
    
    // Transform data
    console.log('🔄 Transforming data...');
    const products = rawData.map(transformProductData);
    
    // Remove duplicates by serial_number
    const uniqueProducts = Array.from(
      new Map(products.map(p => [p.serial_number, p])).values()
    );
    
    console.log(`📊 ${products.length} rows → ${uniqueProducts.length} unique products`);
    
    // Batch insert
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;
    
    for (let i = 0; i < uniqueProducts.length; i += batchSize) {
      const batch = uniqueProducts.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('products')
        .upsert(batch, { onConflict: 'serial_number', ignoreDuplicates: false })
        .select();
      
      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} error:`, error.message);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(`✅ Batch ${i / batchSize + 1}: ${data?.length || 0} products`);
      }
    }
    
    console.log('\n📈 IMPORT SUMMARY:');
    console.log(`   ✅ Successfully imported: ${inserted}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total processed: ${uniqueProducts.length}`);
    
  } catch (error: any) {
    console.error('❌ Error importing products:', error.message);
    throw error;
  }
}

/**
 * Import bank/PF records from file
 */
async function importBankPF(filePath: string): Promise<void> {
  console.log('\n🔷 IMPORTING BANK/PF RECORDS');
  console.log('━'.repeat(60));
  
  try {
    // Read file
    let rawData: any[];
    
    if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      rawData = readExcelFile(filePath);
    } else if (filePath.endsWith('.json')) {
      const jsonData = readJSONFile(filePath);
      rawData = Array.isArray(jsonData) ? jsonData : jsonData.bankPF || [];
    } else {
      throw new Error('Unsupported file format');
    }
    
    // Transform data
    console.log('🔄 Transforming data...');
    const bankPFRecords = rawData.map(transformBankPFData);
    
    // Remove duplicates by institution_name
    const uniqueRecords = Array.from(
      new Map(bankPFRecords.map(b => [b.institution_name, b])).values()
    );
    
    console.log(`📊 ${bankPFRecords.length} rows → ${uniqueRecords.length} unique records`);
    
    // Batch insert
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;
    
    for (let i = 0; i < uniqueRecords.length; i += batchSize) {
      const batch = uniqueRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} error:`, error.message);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(`✅ Batch ${i / batchSize + 1}: ${data?.length || 0} records`);
      }
    }
    
    console.log('\n📈 IMPORT SUMMARY:');
    console.log(`   ✅ Successfully imported: ${inserted}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total processed: ${uniqueRecords.length}`);
    
  } catch (error: any) {
    console.error('❌ Error importing bank/PF:', error.message);
    throw error;
  }
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log('🚀 SUPABASE DATA IMPORT TOOL');
  console.log('━'.repeat(60));
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log('━'.repeat(60));
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 USAGE:');
    console.log('   npx tsx scripts/supabase-import.ts <command> <file>');
    console.log('');
    console.log('📋 COMMANDS:');
    console.log('   customers <file>  - Import customers from Excel/JSON');
    console.log('   products <file>   - Import products from Excel/JSON');
    console.log('   bankpf <file>     - Import bank/PF from Excel/JSON');
    console.log('   all <directory>   - Import all files from directory');
    console.log('');
    console.log('📄 EXAMPLES:');
    console.log('   npx tsx scripts/supabase-import.ts customers data/customers.xlsx');
    console.log('   npx tsx scripts/supabase-import.ts products data/products.json');
    console.log('   npx tsx scripts/supabase-import.ts all data/');
    console.log('');
    return;
  }
  
  const command = args[0];
  const filePath = args[1];
  
  try {
    switch (command) {
      case 'customers':
        if (!filePath) throw new Error('File path required');
        await importCustomers(filePath);
        break;
      
      case 'products':
        if (!filePath) throw new Error('File path required');
        await importProducts(filePath);
        break;
      
      case 'bankpf':
        if (!filePath) throw new Error('File path required');
        await importBankPF(filePath);
        break;
      
      case 'all':
        console.log('❌ "all" command not implemented yet');
        console.log('   Please import files individually');
        break;
      
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('   Use: customers, products, or bankpf');
    }
    
    console.log('\n✅ IMPORT COMPLETED SUCCESSFULLY!');
    
  } catch (error: any) {
    console.error('\n❌ IMPORT FAILED:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { importCustomers, importProducts, importBankPF };
