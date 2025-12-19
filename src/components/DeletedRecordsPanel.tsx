/**
 * 🗑️ OXIVO-BOX Deleted Records Panel
 * 
 * Soft delete edilmiş kayıtları görüntüle ve geri yükle
 * 
 * @version 1.0.0
 * @date 2024-12-17
 */

import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, RotateCcw, AlertCircle } from 'lucide-react';

// API'leri import et
import {
  customerApi,
  productApi,
  bankPFApi,
  mccCodesApi,
  banksApi,
  partnershipsApi,
  sharingApi,
  kartProgramApi,
  suspensionReasonApi,
  domainMappingApi,
  signApi,
  earningsApi
} from '../utils/supabaseClient';

type TableConfig = {
  name: string;
  label: string;
  api: any;
};

const TABLES: TableConfig[] = [
  { name: 'customers', label: 'Müşteriler', api: customerApi },
  { name: 'products', label: 'Ürünler', api: productApi },
  { name: 'bank_accounts', label: 'Banka/PF', api: bankPFApi },
  { name: 'mcc_codes', label: 'MCC Kodları', api: mccCodesApi },
  { name: 'banks', label: 'Bankalar', api: banksApi },
  { name: 'partnerships', label: 'Partnerlikler', api: partnershipsApi },
  { name: 'sharings', label: 'Paylaşımlar', api: sharingApi },
  { name: 'card_programs', label: 'Kart Programları', api: kartProgramApi },
  { name: 'suspension_reasons', label: 'Askıya Alma Sebepleri', api: suspensionReasonApi },
  { name: 'domain_mappings', label: 'Domain Mapping', api: domainMappingApi },
  { name: 'signs', label: 'Tabelalar', api: signApi },
  { name: 'earnings', label: 'Hakediş', api: earningsApi },
];

export function DeletedRecordsPanel() {
  const [selectedTable, setSelectedTable] = useState<string>('customers');
  const [deletedRecords, setDeletedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTable = TABLES.find(t => t.name === selectedTable);

  const loadDeletedRecords = async () => {
    if (!currentTable) return;

    setLoading(true);
    setError(null);

    try {
      const result = await currentTable.api.getDeleted();
      
      if (result.success) {
        setDeletedRecords(result.data || []);
      } else {
        setError(result.error || 'Silinen kayıtlar yüklenemedi');
        setDeletedRecords([]);
      }
    } catch (err: any) {
      setError(err.message || 'Beklenmeyen bir hata oluştu');
      setDeletedRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedRecords();
  }, [selectedTable]);

  const handleRestore = async (id: string) => {
    if (!currentTable) return;

    const confirmed = window.confirm('Bu kaydı geri getirmek istediğinizden emin misiniz?');
    if (!confirmed) return;

    try {
      const result = await currentTable.api.restore(id);
      
      if (result.success) {
        alert('✅ Kayıt başarıyla geri getirildi!');
        loadDeletedRecords(); // Listeyi yenile
      } else {
        alert(`❌ Hata: ${result.error}`);
      }
    } catch (err: any) {
      alert(`❌ Beklenmeyen hata: ${err.message}`);
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!currentTable) return;

    const token = window.prompt(
      '⚠️ UYARI: Bu işlem geri alınamaz!\n\n' +
      'Kaydı kalıcı olarak silmek için aşağıdaki metni yazın:\n' +
      'CONFIRM_HARD_DELETE_PERMANENTLY'
    );

    if (!token) return;

    try {
      const result = await currentTable.api.hardDelete(id, token);
      
      if (result.success) {
        alert('✅ Kayıt kalıcı olarak silindi!');
        loadDeletedRecords(); // Listeyi yenile
      } else {
        alert(`❌ Hata: ${result.error}`);
      }
    } catch (err: any) {
      alert(`❌ Beklenmeyen hata: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">🗑️ Silinen Kayıtlar</h2>
        <button
          onClick={loadDeletedRecords}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Table Selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block mb-2 text-sm">Tablo Seçin:</label>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="w-full md:w-64 p-2 border rounded-lg"
        >
          {TABLES.map(table => (
            <option key={table.name} value={table.name}>
              {table.label} ({table.name})
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="mb-1">Hata Oluştu:</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="">
            {currentTable?.label} - Silinen Kayıtlar ({deletedRecords.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
        ) : deletedRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Bu tabloda silinmiş kayıt bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Kayıt Bilgisi</th>
                  <th className="p-3 text-left">Silinme Tarihi</th>
                  <th className="p-3 text-left">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {deletedRecords.map((record) => {
                  // En fazla 3 alan göster
                  const displayFields = Object.entries(record)
                    .filter(([key]) => !['id', 'deletedAt', 'deletedBy', 'isDeleted', 'createdAt', 'updatedAt'].includes(key))
                    .slice(0, 3)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');

                  return (
                    <tr key={record.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs truncate max-w-xs">
                        {record.id}
                      </td>
                      <td className="p-3 text-xs text-gray-600 truncate max-w-md">
                        {displayFields || 'Bilgi yok'}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {record.deletedAt
                          ? new Date(record.deletedAt).toLocaleString('tr-TR')
                          : 'Bilinmiyor'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestore(record.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-xs"
                            title="Geri Getir"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Geri Getir
                          </button>
                          <button
                            onClick={() => handleHardDelete(record.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1 text-xs"
                            title="Kalıcı Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                            Kalıcı Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 p-4 rounded-lg text-sm">
        <p className="mb-2">
          ⚠️ <strong>Dikkat:</strong> "Geri Getir" butonu kaydı tekrar aktif eder.
        </p>
        <p>
          🚨 <strong>Uyarı:</strong> "Kalıcı Sil" butonu kaydı veritabanından tamamen siler ve GERİ ALINAMAZ!
        </p>
      </div>
    </div>
  );
}
