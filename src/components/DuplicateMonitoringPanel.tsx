/**
 * Duplicate Monitoring Panel
 * 
 * Supabase duplicate_monitoring view'inden real-time duplicate raporu gösterir
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { checkDuplicatesSQL, cleanupAllDuplicatesSQL, cleanupTableDuplicatesSQL } from '../utils/supabaseClient';
import { toast } from 'sonner';

interface DuplicateGroup {
  table_name: string;
  unique_field: string;
  duplicate_value: string;
  duplicate_count: number;
  duplicate_ids: string[];
}

export function DuplicateMonitoringPanel() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  // Load duplicates
  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const result = await checkDuplicatesSQL();
      if (result.success && result.duplicates) {
        setDuplicates(result.duplicates);
      } else {
        toast.error('Duplicate kontrolü başarısız', {
          description: result.error || 'Bilinmeyen hata',
        });
      }
    } catch (error: any) {
      console.error('Error loading duplicates:', error);
      toast.error('Hata oluştu', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup all duplicates
  const handleCleanupAll = async () => {
    setCleaning(true);
    const loadingToast = toast.loading('Tüm duplicate\'ler temizleniyor...');

    try {
      const result = await cleanupAllDuplicatesSQL();
      toast.dismiss(loadingToast);

      if (result.success && result.results) {
        const totalDeleted = result.results.reduce((sum, r) => sum + (r.deleted_count || 0), 0);
        
        toast.success(`✅ ${totalDeleted} kayıt silindi!`, {
          description: 'Tüm tablolar temizlendi',
        });

        // Reload
        await loadDuplicates();
      } else {
        toast.error('Temizleme başarısız', {
          description: result.error,
        });
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error('Hata oluştu', {
        description: error.message,
      });
    } finally {
      setCleaning(false);
    }
  };

  // Cleanup specific table
  const handleCleanupTable = async (tableName: string, uniqueField: string) => {
    setCleaning(true);
    const loadingToast = toast.loading(`${tableName} temizleniyor...`);

    try {
      const result = await cleanupTableDuplicatesSQL(tableName, uniqueField, 'latest');
      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success(`✅ ${result.deleted_count} kayıt silindi!`, {
          description: `${tableName} temizlendi`,
        });

        // Reload
        await loadDuplicates();
      } else {
        toast.error('Temizleme başarısız', {
          description: result.error,
        });
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error('Hata oluştu', {
        description: error.message,
      });
    } finally {
      setCleaning(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadDuplicates();
  }, []);

  // Group duplicates by table
  const duplicatesByTable = duplicates.reduce((acc, dup) => {
    if (!acc[dup.table_name]) {
      acc[dup.table_name] = [];
    }
    acc[dup.table_name].push(dup);
    return acc;
  }, {} as Record<string, DuplicateGroup[]>);

  const totalDuplicateGroups = duplicates.length;
  const totalDuplicateRecords = duplicates.reduce((sum, d) => sum + (d.duplicate_count - 1), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {totalDuplicateGroups > 0 ? (
                  <AlertTriangle className="text-orange-500" size={24} />
                ) : (
                  <CheckCircle className="text-green-500" size={24} />
                )}
                Duplicate Monitoring
              </CardTitle>
              <CardDescription>
                Real-time duplicate detection across all tables
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDuplicates}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Yenile
              </Button>
              {totalDuplicateGroups > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCleanupAll}
                  disabled={cleaning}
                >
                  <Trash2 size={16} />
                  Hepsini Temizle
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
              <p>Kontrol ediliyor...</p>
            </div>
          ) : totalDuplicateGroups === 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="text-green-600" size={20} />
              <AlertDescription className="text-green-800">
                ✨ Veritabanı temiz! Hiç duplicate kayıt bulunamadı.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="text-orange-600" size={20} />
                <AlertDescription className="text-orange-800">
                  <strong>{totalDuplicateGroups}</strong> duplicate grubu bulundu (toplam <strong>{totalDuplicateRecords}</strong> gereksiz kayıt)
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {Object.entries(duplicatesByTable).map(([tableName, dups]) => (
                  <Card key={tableName} className="border-orange-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">{tableName}</CardTitle>
                          <Badge variant="destructive">
                            {dups.length} duplicate grup
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCleanupTable(tableName, dups[0].unique_field)}
                          disabled={cleaning}
                        >
                          <Trash2 size={14} />
                          Temizle
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Unique Field</TableHead>
                            <TableHead>Duplicate Value</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead>IDs</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dups.map((dup, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">
                                {dup.unique_field}
                              </TableCell>
                              <TableCell className="font-medium">
                                {dup.duplicate_value}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="destructive">
                                  {dup.duplicate_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-gray-500">
                                {dup.duplicate_ids.slice(0, 3).join(', ')}
                                {dup.duplicate_ids.length > 3 && '...'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
