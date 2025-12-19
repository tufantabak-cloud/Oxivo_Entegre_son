import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  Activity,
  TrendingUp,
  RefreshCw,
  X,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  ActivityLogEntry,
  ActivityAction,
  ActivityCategory,
  getAllActivities,
  getActivities,
  getActivityStats,
  clearActivityLog,
  clearOldActivities,
  exportActivityLog,
  formatActivityAction,
  getActivityActionIcon,
  getActivityActionColor,
} from '../utils/activityLog';
import { toast } from 'sonner';

interface ActivityLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityLogViewer({ isOpen, onClose }: ActivityLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<ActivityAction | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<ActivityCategory | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  
  // Dropdown states for controlled components
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Get filtered activities
  const filteredActivities = useMemo(() => {
    const now = new Date();
    let fromDate: Date | undefined;

    switch (dateFilter) {
      case 'TODAY':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'WEEK':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'MONTH':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return getActivities({
      action: filterAction !== 'ALL' ? filterAction : undefined,
      category: filterCategory !== 'ALL' ? filterCategory : undefined,
      fromDate,
      searchQuery: searchQuery || undefined,
    });
  }, [searchQuery, filterAction, filterCategory, dateFilter]);

  // Get statistics
  const stats = useMemo(() => getActivityStats(), []);

  const handleExport = () => {
    const json = exportActivityLog();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Aktivite günlüğü başarıyla dışa aktarıldı!');
  };

  const handleClearOld = () => {
    const removed = clearOldActivities(90);
    toast.success(`${removed} eski kayıt temizlendi (90 günden eski)`);
  };

  const handleClearAll = () => {
    if (confirm('Tüm aktivite geçmişini silmek istediğinizden emin misiniz?')) {
      clearActivityLog();
      toast.success('Aktivite günlüğü temizlendi');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Aktivite Günlüğü</CardTitle>
                <CardDescription>Tüm sistem değişikliklerinin kaydı</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-gray-500">Toplam Kayıt</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalEntries}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-gray-500">Bugün</p>
              <p className="text-xl font-bold text-blue-600">
                {
                  getAllActivities().filter(
                    e =>
                      new Date(e.timestamp).toDateString() === new Date().toDateString()
                  ).length
                }
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-gray-500">Bu Hafta</p>
              <p className="text-xl font-bold text-green-600">
                {
                  getAllActivities().filter(
                    e =>
                      e.timestamp >= new Date().getTime() - 7 * 24 * 60 * 60 * 1000
                  ).length
                }
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-gray-500">Bu Ay</p>
              <p className="text-xl font-bold text-purple-600">
                {
                  getAllActivities().filter(e => {
                    const date = new Date(e.timestamp);
                    const now = new Date();
                    return (
                      date.getMonth() === now.getMonth() &&
                      date.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
          {/* Filters */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Arama..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Action Filter */}
              <div>
                <Select
                  value={filterAction}
                  onValueChange={(v) => {
                    setFilterAction(v as ActivityAction | 'ALL');
                    setIsActionDropdownOpen(false);
                  }}
                  open={isActionDropdownOpen}
                  onOpenChange={setIsActionDropdownOpen}
                >
                  <SelectTrigger
                    onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                    className={`bg-white transition-all ${
                      isActionDropdownOpen 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <SelectValue placeholder="İşlem Türü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm İşlemler</SelectItem>
                    <SelectItem value="CREATE">Oluşturma</SelectItem>
                    <SelectItem value="UPDATE">Güncelleme</SelectItem>
                    <SelectItem value="DELETE">Silme</SelectItem>
                    <SelectItem value="EXPORT">Dışa Aktarma</SelectItem>
                    <SelectItem value="IMPORT">İçe Aktarma</SelectItem>
                    <SelectItem value="APPROVE">Onay</SelectItem>
                    <SelectItem value="FINALIZE">Kesinleştirme</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Select
                  value={filterCategory}
                  onValueChange={(v) => {
                    setFilterCategory(v as ActivityCategory | 'ALL');
                    setIsCategoryDropdownOpen(false);
                  }}
                  open={isCategoryDropdownOpen}
                  onOpenChange={setIsCategoryDropdownOpen}
                >
                  <SelectTrigger
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className={`bg-white transition-all ${
                      isCategoryDropdownOpen 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                    <SelectItem value="Müşteri">Müşteri</SelectItem>
                    <SelectItem value="Banka/PF">Banka/PF</SelectItem>
                    <SelectItem value="Ürün">Ürün</SelectItem>
                    <SelectItem value="TABELA">TABELA</SelectItem>
                    <SelectItem value="Hakediş">Hakediş</SelectItem>
                    <SelectItem value="Tanımlar">Tanımlar</SelectItem>
                    <SelectItem value="Gelir">Gelir</SelectItem>
                    <SelectItem value="Sistem">Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Filter & Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={dateFilter === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('ALL')}
                >
                  Tümü
                </Button>
                <Button
                  variant={dateFilter === 'TODAY' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('TODAY')}
                >
                  Bugün
                </Button>
                <Button
                  variant={dateFilter === 'WEEK' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('WEEK')}
                >
                  Bu Hafta
                </Button>
                <Button
                  variant={dateFilter === 'MONTH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('MONTH')}
                >
                  Bu Ay
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearOld}
                  className="gap-2 hover:bg-orange-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Eskileri Temizle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="gap-2 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Tümünü Temizle
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {filteredActivities.length} kayıt gösteriliyor
                {searchQuery && ` (arama: "${searchQuery}")`}
              </span>
              {filteredActivities.length === 0 && stats.totalEntries > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterAction('ALL');
                    setFilterCategory('ALL');
                    setDateFilter('ALL');
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Activity List */}
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4">
              {filteredActivities.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {stats.totalEntries === 0
                      ? 'Henüz aktivite kaydı bulunmuyor.'
                      : 'Seçili filtrelere uygun kayıt bulunamadı.'}
                  </AlertDescription>
                </Alert>
              )}

              {filteredActivities.map(activity => (
                <div
                  key={activity.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div className="text-2xl">{getActivityActionIcon(activity.action)}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getActivityActionColor(activity.action)}`}
                          >
                            {formatActivityAction(activity.action)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {activity.category}
                          </Badge>
                        </div>

                        <p className="font-medium text-gray-900 mb-1">{activity.entityName}</p>

                        {activity.details && (
                          <p className="text-sm text-gray-600 mb-2">{activity.details}</p>
                        )}

                        {/* Old/New Value Comparison */}
                        {(activity.oldValue !== undefined || activity.newValue !== undefined) && (
                          <div className="bg-gray-50 rounded p-2 text-xs mt-2 space-y-1">
                            {activity.oldValue !== undefined && (
                              <div>
                                <span className="text-gray-500">Eski: </span>
                                <span className="text-red-600 line-through">
                                  {JSON.stringify(activity.oldValue)}
                                </span>
                              </div>
                            )}
                            {activity.newValue !== undefined && (
                              <div>
                                <span className="text-gray-500">Yeni: </span>
                                <span className="text-green-600 font-medium">
                                  {JSON.stringify(activity.newValue)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Changes */}
                        {activity.changes && Object.keys(activity.changes).length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500">Değişiklikler:</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {Object.entries(activity.changes || {}).map(([key, change]) => (
                                <span
                                  key={key}
                                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
                                >
                                  {key}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <span
                                key={key}
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
                              >
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}