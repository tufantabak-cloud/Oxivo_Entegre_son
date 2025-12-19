import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

/**
 * 🔍 SUPABASE SCHEMA CHECKER
 * 
 * Bu component Supabase tablolarının yapısını kontrol eder
 * ve is_deleted sütununun var olup olmadığını gösterir.
 */

interface SchemaInfo {
  table: string;
  columns: string[];
  hasIsDeleted: boolean;
}

export function SupabaseSchemaChecker() {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSchema();
  }, []);

  const checkSchema = async () => {
    setLoading(true);
    setError(null);

    const tablesToCheck = [
      'customers',
      'products',
      'bank_accounts',
      'signs',
      'mcc_codes',
      'banks',
      'epk_institutions',
      'ok_institutions',
      'sales_representatives',
      'job_titles',
      'partnerships',
      'account_items',
      'fixed_commissions',
      'additional_revenues',
      'sharings',
      'card_programs',
      'suspension_reasons',
      'domain_mappings',
      'earnings',
    ];

    const results: SchemaInfo[] = [];

    for (const table of tablesToCheck) {
      try {
        // Her tablodan 1 kayıt çek ve sütunları kontrol et
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.error(`❌ ${table} tablosu okunamadı:`, error.message);
          results.push({
            table,
            columns: [],
            hasIsDeleted: false,
          });
          continue;
        }

        // Eğer veri varsa, sütun isimlerini al
        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
        const hasIsDeleted = columns.includes('is_deleted');

        results.push({
          table,
          columns,
          hasIsDeleted,
        });

        console.log(`✅ ${table}:`, {
          totalColumns: columns.length,
          hasIsDeleted,
          columns: columns.join(', '),
        });
      } catch (err) {
        console.error(`❌ ${table} kontrol hatası:`, err);
      }
    }

    setSchemaInfo(results);
    setLoading(false);

    // Özet rapor
    const tablesWithIsDeleted = results.filter((r) => r.hasIsDeleted);
    const tablesWithoutIsDeleted = results.filter((r) => !r.hasIsDeleted);

    console.log('\n📊 ÖZET RAPOR:');
    console.log(`✅ is_deleted OLMAYAN tablolar: ${tablesWithoutIsDeleted.length}`);
    console.log(`⚠️  is_deleted OLAN tablolar: ${tablesWithIsDeleted.length}`);

    if (tablesWithIsDeleted.length > 0) {
      console.log('\n⚠️  is_deleted BULUNAN TABLOLAR:');
      tablesWithIsDeleted.forEach((t) => {
        console.log(`   - ${t.table}`);
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', border: '2px solid #3b82f6', borderRadius: '8px', margin: '20px' }}>
        <h2>🔍 Supabase Schema Kontrol Ediliyor...</h2>
        <p>Lütfen bekleyin, tablolar taranıyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', border: '2px solid #ef4444', borderRadius: '8px', margin: '20px' }}>
        <h2>❌ Hata</h2>
        <p>{error}</p>
      </div>
    );
  }

  const tablesWithIsDeleted = schemaInfo.filter((r) => r.hasIsDeleted);
  const tablesWithoutIsDeleted = schemaInfo.filter((r) => !r.hasIsDeleted);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Supabase Schema Raporu</h1>

      {/* ÖZET */}
      <div
        style={{
          padding: '20px',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: '#eff6ff',
        }}
      >
        <h2>📊 ÖZET</h2>
        <p style={{ fontSize: '16px', margin: '10px 0' }}>
          ✅ <strong>is_deleted OLMAYAN:</strong> {tablesWithoutIsDeleted.length} tablo
        </p>
        <p style={{ fontSize: '16px', margin: '10px 0' }}>
          ⚠️ <strong>is_deleted OLAN:</strong> {tablesWithIsDeleted.length} tablo
        </p>
      </div>

      {/* is_deleted OLAN TABLOLAR */}
      {tablesWithIsDeleted.length > 0 && (
        <div
          style={{
            padding: '20px',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: '#fffbeb',
          }}
        >
          <h2>⚠️ is_deleted BULUNAN TABLOLAR ({tablesWithIsDeleted.length})</h2>
          <ul>
            {tablesWithIsDeleted.map((info) => (
              <li key={info.table} style={{ marginBottom: '10px' }}>
                <strong>{info.table}</strong> ({info.columns.length} sütun)
                <details style={{ marginTop: '5px' }}>
                  <summary style={{ cursor: 'pointer', color: '#3b82f6' }}>
                    Sütunları göster
                  </summary>
                  <pre style={{ fontSize: '12px', marginTop: '10px' }}>
                    {info.columns.join('\n')}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
            }}
          >
            <p style={{ fontWeight: 'bold' }}>⚠️ ÖNEMLİ:</p>
            <p>
              Bu tablolarda <code>is_deleted</code> sütunu var. Frontend kodu bu sütunu
              kullanmıyor, dolayısıyla <strong>silinmiş kayıtlar da</strong> görünecek!
            </p>
            <p style={{ marginTop: '10px' }}>
              <strong>Çözüm seçenekleri:</strong>
            </p>
            <ol>
              <li>Frontend'e <code>.eq('is_deleted', false)</code> filtresini geri ekle</li>
              <li>Veya Supabase'den <code>is_deleted</code> sütununu kaldır</li>
            </ol>
          </div>
        </div>
      )}

      {/* is_deleted OLMAYAN TABLOLAR */}
      {tablesWithoutIsDeleted.length > 0 && (
        <div
          style={{
            padding: '20px',
            border: '2px solid #10b981',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: '#f0fdf4',
          }}
        >
          <h2>✅ is_deleted OLMAYAN TABLOLAR ({tablesWithoutIsDeleted.length})</h2>
          <ul>
            {tablesWithoutIsDeleted.map((info) => (
              <li key={info.table} style={{ marginBottom: '10px' }}>
                <strong>{info.table}</strong> ({info.columns.length} sütun)
                <details style={{ marginTop: '5px' }}>
                  <summary style={{ cursor: 'pointer', color: '#3b82f6' }}>
                    Sütunları göster
                  </summary>
                  <pre style={{ fontSize: '12px', marginTop: '10px' }}>
                    {info.columns.join('\n')}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TAVSİYE */}
      <div
        style={{
          padding: '20px',
          border: '2px solid #8b5cf6',
          borderRadius: '8px',
          backgroundColor: '#f5f3ff',
        }}
      >
        <h2>💡 TAVSİYE</h2>
        {tablesWithIsDeleted.length === 0 ? (
          <div>
            <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
              ✅ Mükemmel! Hiçbir tabloda is_deleted sütunu yok.
            </p>
            <p style={{ marginTop: '10px' }}>
              Frontend kodu doğru çalışacak. Herhangi bir değişiklik gerekmez.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '16px' }}>
              ⚠️ {tablesWithIsDeleted.length} tabloda is_deleted sütunu var!
            </p>
            <p style={{ marginTop: '10px' }}>
              Frontend kodu bu sütunu kullanmıyor. Silinmiş kayıtlar da görünecek.
            </p>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
              Lütfen bana bildirin: Silinmiş kayıtlar da mı görünsün, yoksa filtrelenmeli mi?
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f3f4f6' }}>
        <button
          onClick={checkSchema}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🔄 Yeniden Kontrol Et
        </button>
      </div>
    </div>
  );
}
