/**
 * Supabase Data Importer Component
 * 
 * Excel ve JSON dosyalarından Supabase'e veri aktarımı yapar.
 * Tarayıcıda çalışır, backend'e ihtiyaç duymaz.
 * 
 * Created: 2025-11-23
 */

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, FileJson, CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase/client';

interface ImportStats {
  total: number;
  success: number;
  errors: number;
  skipped: number;
}

interface ImportResult {
  success: boolean;
  stats: ImportStats;
  errors: string[];
}

export function SupabaseDataImporter() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);

  // ========================================
  // DATA TRANSFORMATION
  // ========================================

  const transformCustomerData = (row: any): any => {
    return {
      customer_code: row.musteriKodu || row.customerCode || row.customer_code || `C${Date.now()}`,
      name: row.firmaUnvan || row.name || row.firma_unvan || 'İsimsiz Firma',
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
  };

  const transformProductData = (row: any): any => {
    return {
      serial_number: row.serialNumber || row.seriNo || row.serial_number || `SN${Date.now()}${Math.random()}`,
      product_name: row.urunAdi || row.productName || row.product_name || 'Bilinmeyen Ürün',
      model: row.model,
      brand: row.marka || row.brand,
      customer_id: row.musteriId || row.customerId || row.customer_id,
      status: row.durum || row.status || 'Aktif',
      installation_date: row.kurulumTarihi || row.installationDate || row.installation_date,
      monthly_fee: parseFloat(row.aylikUcret || row.monthlyFee || row.monthly_fee || '0'),
      notes: row.notlar || row.notes,
    };
  };

  const transformBankPFData = (row: any): any => {
    return {
      institution_name: row.firmaUnvan || row.institutionName || row.institution_name || 'İsimsiz Kurum',
      institution_type: row.tip || row.type || row.institution_type || 'Banka',
      contact_person: row.yetkili || row.contactPerson || row.contact_person,
      phone: row.telefon || row.phone,
      email: row.email || row.eposta,
      address: row.adres || row.address,
      city: row.il || row.city,
      notes: row.notlar || row.notes,
    };
  };

  // ========================================
  // FILE READING
  // ========================================

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: null,
          });
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const readJSONFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  // ========================================
  // IMPORT FUNCTIONS
  // ========================================

  const importToSupabase = async (
    tableName: string,
    data: any[],
    transformFn: (row: any) => any,
    conflictColumn?: string
  ): Promise<ImportResult> => {
    const stats: ImportStats = {
      total: data.length,
      success: 0,
      errors: 0,
      skipped: 0,
    };
    const errors: string[] = [];

    try {
      // Transform data
      const transformedData = data.map(transformFn);

      // Remove duplicates if conflict column specified
      const uniqueData = conflictColumn
        ? Array.from(new Map(transformedData.map(item => [item[conflictColumn], item])).values())
        : transformedData;

      stats.skipped = transformedData.length - uniqueData.length;

      // Batch insert
      const batchSize = 50; // Reduced for better error handling
      
      for (let i = 0; i < uniqueData.length; i += batchSize) {
        const batch = uniqueData.slice(i, i + batchSize);
        const progressPercent = ((i + batch.length) / uniqueData.length) * 100;
        setProgress(progressPercent);

        try {
          const upsertOptions = conflictColumn 
            ? { onConflict: conflictColumn, ignoreDuplicates: false }
            : undefined;

          const { data: insertedData, error } = await supabase
            .from(tableName)
            .upsert(batch, upsertOptions)
            .select();

          if (error) {
            console.error(`Batch error:`, error);
            errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
            stats.errors += batch.length;
          } else {
            stats.success += insertedData?.length || 0;
          }
        } catch (batchError: any) {
          console.error(`Batch exception:`, batchError);
          errors.push(`Batch ${i / batchSize + 1}: ${batchError.message}`);
          stats.errors += batch.length;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: stats.errors === 0,
        stats,
        errors,
      };

    } catch (error: any) {
      console.error('Import error:', error);
      return {
        success: false,
        stats,
        errors: [error.message],
      };
    }
  };

  // ========================================
  // FILE UPLOAD HANDLERS
  // ========================================

  const handleFileUpload = async (file: File, dataType: 'customers' | 'products' | 'bankpf') => {
    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // Read file
      let rawData: any[];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        toast.info('Excel dosyası okunuyor...');
        rawData = await readExcelFile(file);
      } else if (file.name.endsWith('.json')) {
        toast.info('JSON dosyası okunuyor...');
        const jsonData = await readJSONFile(file);
        rawData = Array.isArray(jsonData) ? jsonData : jsonData[dataType] || [];
      } else {
        throw new Error('Desteklenmeyen dosya formatı. Lütfen .xlsx, .xls veya .json kullanın.');
      }

      if (rawData.length === 0) {
        throw new Error('Dosya boş veya veri bulunamadı.');
      }

      toast.info(`${rawData.length} kayıt bulundu, aktarılıyor...`);

      // Import based on data type
      let importResult: ImportResult;

      switch (dataType) {
        case 'customers':
          setCurrentTable('Müşteriler');
          importResult = await importToSupabase(
            'customers',
            rawData,
            transformCustomerData,
            'customer_code'
          );
          break;

        case 'products':
          setCurrentTable('Ürünler');
          importResult = await importToSupabase(
            'products',
            rawData,
            transformProductData,
            'serial_number'
          );
          break;

        case 'bankpf':
          setCurrentTable('Banka/PF');
          importResult = await importToSupabase(
            'bank_accounts',
            rawData,
            transformBankPFData,
            undefined
          );
          break;

        default:
          throw new Error('Bilinmeyen veri tipi');
      }

      setResult(importResult);

      if (importResult.success) {
        toast.success(`✅ ${importResult.stats.success} kayıt başarıyla aktarıldı!`);
      } else {
        toast.error(`⚠️ ${importResult.stats.success} başarılı, ${importResult.stats.errors} hatalı`);
      }

    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error(error.message);
      setResult({
        success: false,
        stats: { total: 0, success: 0, errors: 0, skipped: 0 },
        errors: [error.message],
      });
    } finally {
      setImporting(false);
      setProgress(0);
      setCurrentTable('');
    }
  };

  const triggerFileInput = (dataType: 'customers' | 'products' | 'bankpf') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file, dataType);
      }
    };
    
    input.click();
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📥 Supabase Veri Aktarma</CardTitle>
          <CardDescription>
            Excel veya JSON dosyalarından Supabase'e toplu veri aktarımı yapın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Desteklenen Formatlar</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Excel (.xlsx, .xls) - İlk sayfa kullanılır</li>
                <li>JSON (.json) - Array veya object formatı</li>
                <li>Duplicate kayıtlar otomatik olarak güncellenir (upsert)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Import Buttons */}
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              onClick={() => triggerFileInput('customers')}
              disabled={importing}
              variant="outline"
              className="h-24 flex-col gap-2"
            >
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <span>Müşteriler İçe Aktar</span>
            </Button>

            <Button
              onClick={() => triggerFileInput('products')}
              disabled={importing}
              variant="outline"
              className="h-24 flex-col gap-2"
            >
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <span>Ürünler İçe Aktar</span>
            </Button>

            <Button
              onClick={() => triggerFileInput('bankpf')}
              disabled={importing}
              variant="outline"
              className="h-24 flex-col gap-2"
            >
              <FileSpreadsheet className="h-8 w-8 text-purple-600" />
              <span>Banka/PF İçe Aktar</span>
            </Button>
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {currentTable} aktarılıyor...
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Result */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.success ? 'İçe Aktarma Başarılı' : 'İçe Aktarma Tamamlandı (Hatalarla)'}
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Toplam:</span>
                    <span className="font-medium">{result.stats.total}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Başarılı:</span>
                    <span className="font-medium">{result.stats.success}</span>
                  </div>
                  {result.stats.skipped > 0 && (
                    <div className="flex justify-between text-yellow-600">
                      <span>Atlanan (Duplicate):</span>
                      <span className="font-medium">{result.stats.skipped}</span>
                    </div>
                  )}
                  {result.stats.errors > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Hatalı:</span>
                      <span className="font-medium">{result.stats.errors}</span>
                    </div>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Hata Detayları ({result.errors.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {result.errors.slice(0, 10).map((error, i) => (
                        <li key={i} className="text-red-600">{error}</li>
                      ))}
                      {result.errors.length > 10 && (
                        <li className="text-muted-foreground">
                          ... ve {result.errors.length - 10} hata daha
                        </li>
                      )}
                    </ul>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Dosya Formatı Örnekleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Excel - Müşteriler</h4>
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <code>
                musteriKodu | firmaUnvan | vergiNo | telefon | email | durum
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">JSON - Müşteriler</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">
{`[
  {
    "musteriKodu": "M001",
    "firmaUnvan": "Örnek Ltd.",
    "vergiNo": "1234567890",
    "telefon": "0212 XXX XX XX",
    "email": "info@ornek.com",
    "durum": "Aktif"
  }
]`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}