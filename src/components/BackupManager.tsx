/**
 * 📦 OXIVO-BOX Backup Manager Component
 * 
 * LocalStorage'daki yedekleri görüntüle, yönet ve dışa aktar
 * 
 * @version 1.0.0
 * @date 2024-12-17
 */

import { useState, useEffect } from 'react';
import {
  getBackups,
  getBackupStats,
  getDeletedBackups,
  exportBackupsToJSON,
  clearAllBackups,
  cleanOldBackups,
  type BackupMetadata
} from '../utils/autoBackup';
import { Download, Trash2, RefreshCw, Archive, AlertTriangle } from 'lucide-react';

export function BackupManager() {
  const [stats, setStats] = useState<ReturnType<typeof getBackupStats> | null>(null);
  const [recentBackups, setRecentBackups] = useState<BackupMetadata[]>([]);
  const [deletedBackups, setDeletedBackups] = useState<BackupMetadata[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadData = () => {
    const backupStats = getBackupStats();
    setStats(backupStats);

    const allBackups = getBackups();
    setRecentBackups(allBackups.backups.slice(0, 10)); // Son 10 yedek

    const deleted = getDeletedBackups();
    setDeletedBackups(deleted.slice(0, 10)); // Son 10 silinen
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportBackups = () => {
    exportBackupsToJSON();
  };

  const handleClearOldBackups = () => {
    const removed = cleanOldBackups(30); // 30 günden eski
    alert(`${removed} adet eski yedek temizlendi`);
    loadData();
  };

  const handleClearAllBackups = () => {
    if (showDeleteConfirm) {
      clearAllBackups();
      alert('Tüm yedekler temizlendi!');
      setShowDeleteConfirm(false);
      loadData();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  if (!stats) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">📦 Yedek Yönetimi</h2>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Yedek</div>
          <div className="text-2xl">{stats.totalBackups}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Oluşturma</div>
          <div className="text-2xl text-green-600">{stats.byOperation.CREATE || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Güncelleme</div>
          <div className="text-2xl text-blue-600">{stats.byOperation.UPDATE || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Silme</div>
          <div className="text-2xl text-red-600">{stats.byOperation.SOFT_DELETE || 0}</div>
        </div>
      </div>

      {/* Table Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="mb-4">Tablo Bazlı İstatistikler</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byTable).map(([table, count]) => (
            <div key={table} className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600 truncate">{table}</div>
              <div className="text-xl">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExportBackups}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          JSON Olarak İndir
        </button>

        <button
          onClick={handleClearOldBackups}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Archive className="w-4 h-4" />
          Eski Yedekleri Temizle (30 gün+)
        </button>

        <button
          onClick={handleClearAllBackups}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            showDeleteConfirm
              ? 'bg-red-700 text-white hover:bg-red-800'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {showDeleteConfirm ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              Emin misiniz? Tekrar tıkla
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Tüm Yedekleri Temizle
            </>
          )}
        </button>

        {showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            İptal
          </button>
        )}
      </div>

      {/* Recent Backups */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="mb-4">Son Yedeklemeler (Son 10)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Tablo</th>
                <th className="p-2 text-left">İşlem</th>
                <th className="p-2 text-left">Kayıt ID</th>
                <th className="p-2 text-left">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {recentBackups.map((backup, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">{backup.tableName}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      backup.operation === 'CREATE' ? 'bg-green-100 text-green-800' :
                      backup.operation === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      backup.operation === 'SOFT_DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {backup.operation}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-xs truncate max-w-xs">
                    {backup.recordId}
                  </td>
                  <td className="p-2 text-xs text-gray-600">
                    {new Date(backup.timestamp).toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deleted Records */}
      {deletedBackups.length > 0 && (
        <div className="bg-red-50 p-6 rounded-lg shadow border border-red-200">
          <h3 className="mb-4 text-red-800">🗑️ Silinen Kayıtlar (Son 10)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-100">
                <tr>
                  <th className="p-2 text-left">Tablo</th>
                  <th className="p-2 text-left">Kayıt ID</th>
                  <th className="p-2 text-left">Silinme Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {deletedBackups.map((backup, idx) => (
                  <tr key={idx} className="border-t hover:bg-red-100">
                    <td className="p-2">{backup.tableName}</td>
                    <td className="p-2 font-mono text-xs truncate max-w-xs">
                      {backup.recordId}
                    </td>
                    <td className="p-2 text-xs">
                      {new Date(backup.timestamp).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
        <p className="mb-2">
          ℹ️ <strong>Bilgi:</strong> Yedekler LocalStorage'da saklanır (maksimum 1000 kayıt)
        </p>
        <p>
          📌 <strong>İpucu:</strong> Düzenli olarak JSON olarak yedeklerinizi indirin ve güvenli bir yerde saklayın.
        </p>
      </div>
    </div>
  );
}
