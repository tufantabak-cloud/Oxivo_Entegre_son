/**
 * Supabase Migration Panel
 * localStorage → Supabase migration UI
 * 
 * Created: 2025-11-22
 * 
 * Usage: Add this component to your settings/admin page
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import {
  getMigrationStatus,
  migrateAllToSupabase,
  rollbackMigration,
  syncFromSupabase,
  type MigrationStatus,
  type MigrationResult,
} from '../utils/supabaseMigration';
import { Database, Upload, Download, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export function SupabaseMigrationPanel() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const currentStatus = await getMigrationStatus();
      setStatus(currentStatus);
    } catch (error) {
      toast.error('Migration durumu yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('⚠️ localStorage verileriniz Supabase\'e aktarılacak. Devam etmek istiyor musunuz?')) {
      return;
    }

    setMigrating(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result: MigrationResult = await migrateAllToSupabase();

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        toast.success(`✅ Migration başarılı! ${result.duration}ms`, {
          description: `Müşteriler: ${result.migratedCounts.customers}, Ürünler: ${result.migratedCounts.products}, Banka/PF: ${result.migratedCounts.bankPFs}`, // ✅ ADDED bankPFs
        });
      } else {
        toast.error('❌ Migration tamamlandı ama hatalar var', {
          description: result.errors.join(', '),
        });
      }

      // Refresh status
      await loadStatus();
    } catch (error) {
      toast.error('Migration başarısız!');
      console.error(error);
    } finally {
      setMigrating(false);
      setProgress(0);
    }
  };

  const handleRollback = async () => {
    if (
      !confirm(
        '⚠️⚠️⚠️ UYARI!\n\nSupabase\'deki TÜM VERİLER silinecek!\nlocalStorage verileri korunacak.\n\nBu işlem geri alınamaz. Emin misiniz?'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await rollbackMigration();

      if (result.success) {
        toast.success('✅ Rollback başarılı - Supabase verileri temizlendi');
      } else {
        toast.error('❌ Rollback hatası', {
          description: result.errors.join(', '),
        });
      }

      await loadStatus();
    } catch (error) {
      toast.error('Rollback başarısız!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await syncFromSupabase();

      if (result.success) {
        toast.success(`✅ Sync başarılı!`, {
          description: `Müşteriler: ${result.syncedCounts.customers}, Ürünler: ${result.syncedCounts.products}, Banka/PF: ${result.syncedCounts.bankPFs}`, // ✅ ADDED bankPFs
        });
      } else {
        toast.error('❌ Sync hatası', {
          description: result.errors.join(', '),
        });
      }

      await loadStatus();
    } catch (error) {
      toast.error('Sync başarısız!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Supabase Migration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  const needsMigration = status && !status.completed;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database size={20} />
              Supabase Migration
            </CardTitle>
            <CardDescription className="mt-1">
              localStorage verilerinizi Supabase PostgreSQL'e taşıyın
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadStatus} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Durum:</span>
          {status?.completed ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 size={14} />
              Tamamlandı
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle size={14} />
              Migration Gerekli
            </Badge>
          )}
        </div>

        {/* Last Migration Date */}
        {status?.lastMigrationDate && (
          <div className="text-sm text-gray-500">
            Son migration: {new Date(status.lastMigrationDate).toLocaleString('tr-TR')}
          </div>
        )}

        {/* Data Counts */}
        {status && (
          <div className="grid grid-cols-3 gap-4"> {/* ✅ CHANGED: 2 → 3 columns */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Müşteriler</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">localStorage:</span>
                <Badge variant="outline">{status.itemCounts.customers.localStorage}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Supabase:</span>
                <Badge variant="outline">{status.itemCounts.customers.supabase}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Ürünler</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">localStorage:</span>
                <Badge variant="outline">{status.itemCounts.products.localStorage}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Supabase:</span>
                <Badge variant="outline">{status.itemCounts.products.supabase}</Badge>
              </div>
            </div>
            {/* ✅ NEW: BankPF Column */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Banka/PF</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">localStorage:</span>
                <Badge variant="outline">{status.itemCounts.bankPFs.localStorage}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Supabase:</span>
                <Badge variant="outline">{status.itemCounts.bankPFs.supabase}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Migration Warning */}
        {needsMigration && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              localStorage'da veri var ama Supabase boş. Migration yapmanız önerilir.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {migrating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Migration devam ediyor...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleMigrate} disabled={loading || migrating} className="gap-2">
            <Upload size={16} />
            localStorage → Supabase
          </Button>
          <Button onClick={handleSync} disabled={loading || migrating} variant="outline" className="gap-2">
            <Download size={16} />
            Supabase → localStorage
          </Button>
          <Button onClick={handleRollback} disabled={loading || migrating} variant="destructive" className="gap-2">
            <XCircle size={16} />
            Rollback (Supabase Temizle)
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
          <div>• <strong>localStorage → Supabase:</strong> Mevcut verilerinizi buluta taşır</div>
          <div>• <strong>Supabase → localStorage:</strong> Buluttaki son veriyi indirir</div>
          <div>• <strong>Rollback:</strong> Supabase'i temizler, localStorage korunur</div>
        </div>
      </CardContent>
    </Card>
  );
}