// 🔍 Supabase Data Inspector - Real-time Veri Takip Paneli
// Tüm Supabase tablolarını görüntüleme, filtreleme ve izleme aracı

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { 
  Database, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Users,
  Building2,
  CreditCard,
  FileText,
  TrendingUp,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import {
  customerApi,
  productApi,
  bankPFApi,
  mccCodesApi,
  banksApi,
  epkListApi,
  okListApi,
  salesRepsApi,
  jobTitlesApi,
  partnershipsApi,
  sharingApi,
  kartProgramApi,
  suspensionReasonApi,
  signApi,
  earningsApi,
  domainMappingApi
} from '../utils/supabaseClient';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TableInfo {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  api: any;
  count: number;
  loading: boolean;
  data: any[];
  lastUpdate: Date | null;
}

interface TableStats {
  total: number;
  active: number;
  inactive: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function SupabaseDataInspector() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('customers');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TABLE CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const [tables, setTables] = useState<Record<string, TableInfo>>({
    customers: {
      name: 'customers',
      displayName: 'Müşteriler',
      icon: <Users className="size-4" />,
      api: customerApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    },
    products: {
      name: 'products',
      displayName: 'Ürünler',
      icon: <Package className="size-4" />,
      api: productApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    },
    bank_accounts: {
      name: 'bank_accounts',
      displayName: 'Banka/PF',
      icon: <Building2 className="size-4" />,
      api: bankPFApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    },
    signs: {
      name: 'signs',
      displayName: 'TABELA',
      icon: <FileText className="size-4" />,
      api: signApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    },
    earnings: {
      name: 'earnings',
      displayName: 'Gelir',
      icon: <TrendingUp className="size-4" />,
      api: earningsApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    },
    mcc_codes: {
      name: 'mcc_codes',
      displayName: 'MCC Kodları',
      icon: <CreditCard className="size-4" />,
      api: mccCodesApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    },
    banks: {
      name: 'banks',
      displayName: 'Bankalar',
      icon: <Building2 className="size-4" />,
      api: banksApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    },
    sales_representatives: {
      name: 'sales_representatives',
      displayName: 'Satış Temsilcileri',
      icon: <Users className="size-4" />,
      api: salesRepsApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    },
    domain_mappings: {
      name: 'domain_mappings',
      displayName: 'Domain Eşleştirme',
      icon: <Settings className="size-4" />,
      api: domainMappingApi,
      count: 0,
      loading: false,
      data: [],
      lastUpdate: null
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FETCH DATA FOR A SPECIFIC TABLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const fetchTableData = async (tableName: string) => {
    setTables(prev => ({
      ...prev,
      [tableName]: { ...prev[tableName], loading: true }
    }));

    try {
      const result = await tables[tableName].api.getAll();
      
      if (result.success && result.data) {
        setTables(prev => ({
          ...prev,
          [tableName]: {
            ...prev[tableName],
            data: result.data,
            count: result.data.length,
            loading: false,
            lastUpdate: new Date()
          }
        }));
      } else {
        throw new Error(result.error || 'Veri alınamadı');
      }
    } catch (error: any) {
      console.error(`Error fetching ${tableName}:`, error);
      toast.error(`${tables[tableName].displayName} verisi alınamadı`);
      
      setTables(prev => ({
        ...prev,
        [tableName]: { ...prev[tableName], loading: false }
      }));
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FETCH ALL TABLES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const fetchAllTables = async () => {
    toast.info('Tüm tablolar güncelleniyor...');
    const tableNames = Object.keys(tables);
    await Promise.all(tableNames.map(name => fetchTableData(name)));
    toast.success('Tüm tablolar güncellendi');
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INITIAL LOAD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    fetchAllTables();
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTO REFRESH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchTableData(selectedTable);
      }, 10000); // 10 saniyede bir güncelle
      
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, selectedTable]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPUTED VALUES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const currentTable = tables[selectedTable];
  
  const filteredData = useMemo(() => {
    if (!currentTable?.data) return [];
    if (!searchQuery.trim()) return currentTable.data;

    const query = searchQuery.toLowerCase();
    return currentTable.data.filter(item => {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(query)
      );
    });
  }, [currentTable?.data, searchQuery]);

  const tableStats = useMemo((): TableStats => {
    const data = currentTable?.data || [];
    const total = data.length;
    const active = data.filter(item => item.aktif === true || item.active === true).length;
    const inactive = data.filter(item => item.aktif === false || item.active === false).length;
    
    return { total, active, inactive };
  }, [currentTable?.data]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleQuickFilter = (filter: string) => {
    switch(filter) {
      case 'moka':
        setSearchQuery('moka');
        break;
      case 'active':
        setSearchQuery('aktif');
        break;
      case 'inactive':
        setSearchQuery('pasif');
        break;
      default:
        setSearchQuery('');
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="size-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl">Supabase Data Inspector</h2>
            <p className="text-sm text-gray-600">
              Real-time veri takip ve analiz paneli
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`size-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Otomatik Yenileme Açık' : 'Otomatik Yenileme'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllTables}
            disabled={Object.values(tables).some(t => t.loading)}
          >
            <RefreshCw className="size-4 mr-2" />
            Tümünü Yenile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Tablo</p>
              <p className="text-2xl">{Object.keys(tables).length}</p>
            </div>
            <Database className="size-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Kayıt</p>
              <p className="text-2xl">
                {Object.values(tables).reduce((sum, t) => sum + t.count, 0)}
              </p>
            </div>
            <FileText className="size-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Kayıt</p>
              <p className="text-2xl text-green-600">{tableStats.active}</p>
            </div>
            <CheckCircle className="size-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pasif Kayıt</p>
              <p className="text-2xl text-red-600">{tableStats.inactive}</p>
            </div>
            <XCircle className="size-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="p-6">
        <Tabs value={selectedTable} onValueChange={setSelectedTable}>
          <TabsList className="grid grid-cols-5 lg:grid-cols-9 mb-4">
            {Object.entries(tables).map(([key, table]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                {table.icon}
                <span className="hidden lg:inline">{table.displayName}</span>
                <Badge variant="secondary" className="ml-1">
                  {table.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Search & Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTableData(selectedTable)}
                disabled={currentTable?.loading}
              >
                <RefreshCw className={`size-4 ${currentTable?.loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hızlı Filtre:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('moka')}
              >
                Moka United
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('active')}
              >
                Aktif
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('inactive')}
              >
                Pasif
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('')}
              >
                Tümü
              </Button>
            </div>

            {/* Table Info */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {currentTable?.icon}
                <span>{currentTable?.displayName}</span>
                <Badge>{filteredData.length} kayıt</Badge>
              </div>
              
              {currentTable?.lastUpdate && (
                <div className="text-sm text-gray-600">
                  Son güncelleme: {currentTable.lastUpdate.toLocaleTimeString('tr-TR')}
                </div>
              )}
            </div>
          </div>

          {/* Table Content */}
          <TabsContent value={selectedTable} className="mt-0">
            {currentTable?.loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="size-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600">Yükleniyor...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <AlertCircle className="size-12 mb-3" />
                <p>Kayıt bulunamadı</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Oluşturma</TableHead>
                      <TableHead>Güncelleme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row) => (
                      <React.Fragment key={row.id}>
                        <TableRow className="cursor-pointer hover:bg-gray-50">
                          <TableCell onClick={() => toggleRowExpansion(row.id)}>
                            {expandedRows.has(row.id) ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {row.firmaAdi || row.urun || row.name || row.kod || row.label || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {(row.aktif || row.active) ? (
                              <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                            ) : (
                              <Badge variant="secondary">Pasif</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {row.createdAt ? new Date(row.createdAt).toLocaleDateString('tr-TR') : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('tr-TR') : '-'}
                          </TableCell>
                        </TableRow>
                        
                        {expandedRows.has(row.id) && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-gray-50">
                              <div className="p-4">
                                <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
                                  {JSON.stringify(row, null, 2)}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default SupabaseDataInspector;
