import { useState, useCallback, useMemo } from 'react';
import { BankPF } from './BankPFModule';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ColumnVisibilityDropdown, ColumnConfig } from './ColumnVisibilityDropdown';
import { FilterDropdown, FilterOption } from './FilterDropdown';
import { PaginationControls } from './PaginationControls';
import { usePagination } from '../hooks/usePagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface BankPFListProps {
  records: BankPF[];
  onSelectRecord: (record: BankPF) => void;
  banks?: Array<{ id: string; kod: string; bankaAdi: string; aktif: boolean }>;
  epkList?: Array<{ id: string; kod: string; kurumAdi: string; aktif: boolean }>;
  okList?: Array<{ id: string; kod: string; kurumAdi: string; aktif: boolean }>;
}

// Sütun konfigürasyonu
const BANKPF_COLUMN_CONFIGS: ColumnConfig[] = [
  { key: 'muhasebeKodu', label: 'Muhasebe Kodu', defaultVisible: true },
  { key: 'firmaUnvan', label: 'Firma Ünvan', defaultVisible: true },
  { key: 'bankaPFAd', label: 'Banka/PF Adı', defaultVisible: true },
  { key: 'tip', label: 'Tip', defaultVisible: true },
  { key: 'kategoriler', label: 'Kategoriler', defaultVisible: true },
  { key: 'odemeKurulusuAd', label: 'Ödeme Kuruluşu', defaultVisible: true },
  { key: 'epkNo', label: 'EPK No', defaultVisible: false },
  { key: 'okNo', label: 'ÖK No', defaultVisible: false },
  { key: 'durum', label: 'Durum', defaultVisible: true },
];

export function BankPFList({ records, onSelectRecord, banks = [], epkList = [], okList = [] }: BankPFListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof BankPF>('firmaUnvan');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const handleSort = (field: keyof BankPF) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sıralama ikonu gösterici component
  const SortIcon = ({ field }: { field: keyof BankPF }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="text-blue-600" />
    ) : (
      <ArrowDown size={14} className="text-blue-600" />
    );
  };

  // ⚡ Performance: Filter ve sort işlemini memoize et
  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        const matchesSearch =
          record.firmaUnvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.muhasebeKodu.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.bankaPFAd.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.odemeKurulusuAd.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType =
          typeFilter === 'all' || record.bankaOrPF === typeFilter;

        const matchesStatus =
          statusFilter === 'all' || record.durum === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, 'tr')
            : bValue.localeCompare(aValue, 'tr');
        }

        return 0;
      });
  }, [records, searchTerm, typeFilter, statusFilter, sortField, sortDirection]);

  // ⚡ PHASE 3: Pagination for large BankPF lists (50 items per page)
  const {
    paginatedItems: paginatedRecords,
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    goToPage,
    setItemsPerPage,
  } = usePagination(filteredRecords, 50);

  // ⚡ Filter options with counts (memoized)
  const typeFilterOptions: FilterOption[] = useMemo(() => [
    { value: 'Banka', label: 'Banka', count: records.filter(r => r.bankaOrPF === 'Banka').length },
    { value: 'PF', label: 'PF', count: records.filter(r => r.bankaOrPF === 'PF').length },
  ], [records]);

  const statusFilterOptions: FilterOption[] = useMemo(() => [
    { value: 'Aktif', label: 'Aktif', count: records.filter(r => r.durum === 'Aktif').length },
    { value: 'Pasif', label: 'Pasif', count: records.filter(r => r.durum === 'Pasif').length },
  ], [records]);

  // Sütun görünürlüğü değişikliği
  const handleVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  }, []);

  return (
    <div className="space-y-4">
      {/* İstatistikler */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          Toplam: {records.length} kayıt
        </Badge>
        <Badge variant="default" className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700">
          Banka: {records.filter(r => r.bankaOrPF === 'Banka').length}
        </Badge>
        <Badge variant="default" className="text-sm px-3 py-1 bg-purple-600 hover:bg-purple-700">
          PF: {records.filter(r => r.bankaOrPF === 'PF').length}
        </Badge>
        <Badge variant="default" className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700">
          Aktif: {records.filter(r => r.durum === 'Aktif').length}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1 border-orange-300 text-orange-700">
          Pasif: {records.filter(r => r.durum === 'Pasif').length}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1 border-indigo-300 text-indigo-700">
          TABELA: {records.reduce((sum, r) => sum + (r.tabelaRecords?.length || 0), 0)}
        </Badge>
        {filteredRecords.length !== records.length && (
          <Badge variant="outline" className="text-sm px-3 py-1 border-blue-300 text-blue-700">
            Filtrelenmiş: {filteredRecords.length} kayıt
          </Badge>
        )}
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              id="bankpf-search"
              type="text"
              placeholder="Ara (ünvan, banka/PF adı)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <ColumnVisibilityDropdown
            columns={BANKPF_COLUMN_CONFIGS}
            storageKey="bankPFList"
            onVisibilityChange={handleVisibilityChange}
          />
          <FilterDropdown
            label="Tip"
            options={typeFilterOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            allLabel="Tüm Tipler"
            showCount={true}
          />
          <FilterDropdown
            label="Durum"
            options={statusFilterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="Tüm Durumlar"
            showCount={true}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columnVisibility['muhasebeKodu'] !== false && columnVisibility['firmaUnvan'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors w-[35%] ${
                    sortField === 'firmaUnvan' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('firmaUnvan')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'firmaUnvan' ? 'text-blue-600' : ''}>
                      Firma Ünvanı
                    </span>
                    <SortIcon field="firmaUnvan" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['tip'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors w-[15%] ${
                    sortField === 'bankaOrPF' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('bankaOrPF')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'bankaOrPF' ? 'text-blue-600' : ''}>
                      Banka/PF
                    </span>
                    <SortIcon field="bankaOrPF" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['bankaPFAd'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors w-[35%] ${
                    sortField === 'bankaPFAd' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('bankaPFAd')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'bankaPFAd' ? 'text-blue-600' : ''}>
                      Banka/PF Adı
                    </span>
                    <SortIcon field="bankaPFAd" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['kategoriler'] !== false && <TableHead className="w-[30%]">🏷️ Kategoriler</TableHead>}
              {columnVisibility['odemeKurulusuAd'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'odemeKurulusuAd' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('odemeKurulusuAd')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'odemeKurulusuAd' ? 'text-blue-600' : ''}>
                      Ödeme Kuruluşu
                    </span>
                    <SortIcon field="odemeKurulusuAd" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['epkNo'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'epkNo' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('epkNo')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'epkNo' ? 'text-blue-600' : ''}>
                      EPK No
                    </span>
                    <SortIcon field="epkNo" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['okNo'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                    sortField === 'okNo' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('okNo')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'okNo' ? 'text-blue-600' : ''}>
                      ÖK No
                    </span>
                    <SortIcon field="okNo" />
                  </div>
                </TableHead>
              )}
              {columnVisibility['durum'] !== false && (
                <TableHead
                  className={`cursor-pointer hover:bg-gray-100 transition-colors w-[10%] ${
                    sortField === 'durum' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSort('durum')}
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'durum' ? 'text-blue-600' : ''}>
                      Durum
                    </span>
                    <SortIcon field="durum" />
                  </div>
                </TableHead>
              )}
              <TableHead className="text-right w-[5%]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              paginatedRecords.map((record) => (
                <TableRow
                  key={record.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectRecord(record)}
                >
                  {columnVisibility['muhasebeKodu'] !== false && columnVisibility['firmaUnvan'] !== false && (
                    <TableCell>
                      <div>
                        <div>{record.firmaUnvan}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Kod: {record.muhasebeKodu}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility['tip'] !== false && (
                    <TableCell>
                      <Badge variant={record.bankaOrPF === 'Banka' ? 'default' : 'outline'}>
                        {record.bankaOrPF}
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility['bankaPFAd'] !== false && (
                    <TableCell>{record.bankaPFAd}</TableCell>
                  )}
                  {columnVisibility['kategoriler'] !== false && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const categoryBadges = [];
                          
                          // Bankalar
                          if (record.linkedBankIds && record.linkedBankIds.length > 0) {
                            const bankCount = record.linkedBankIds.length;
                            categoryBadges.push(
                              <Badge key="banks" variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700">
                                🏦 {bankCount}
                              </Badge>
                            );
                          }
                          
                          // EPK
                          if (record.linkedEPKIds && record.linkedEPKIds.length > 0) {
                            const epkCount = record.linkedEPKIds.length;
                            categoryBadges.push(
                              <Badge key="epks" variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                                EPK {epkCount}
                              </Badge>
                            );
                          }
                          
                          // ÖK
                          if (record.linkedOKIds && record.linkedOKIds.length > 0) {
                            const okCount = record.linkedOKIds.length;
                            categoryBadges.push(
                              <Badge key="oks" variant="outline" className="text-xs bg-purple-50 border-purple-300 text-purple-700">
                                ÖK {okCount}
                              </Badge>
                            );
                          }
                          
                          return categoryBadges.length > 0 ? categoryBadges : <span className="text-xs text-gray-400">-</span>;
                        })()}
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility['odemeKurulusuAd'] !== false && (
                    <TableCell>
                      <span className="text-sm">{record.odemeKurulusuAd || '-'}</span>
                    </TableCell>
                  )}
                  {columnVisibility['epkNo'] !== false && (
                    <TableCell>
                      <span className="text-sm">{record.epkNo || '-'}</span>
                    </TableCell>
                  )}
                  {columnVisibility['okNo'] !== false && (
                    <TableCell>
                      <span className="text-sm">{record.okNo || '-'}</span>
                    </TableCell>
                  )}
                  {columnVisibility['durum'] !== false && (
                    <TableCell>
                      <Badge
                        variant={record.durum === 'Aktif' ? 'default' : 'secondary'}
                      >
                        {record.durum}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(record);
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      <Eye size={16} />
                      <span>Detay</span>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ⚡ PHASE 3: Pagination Controls */}
      {filteredRecords.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredRecords.length}
            onPageChange={goToPage}
            onItemsPerPageChange={setItemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
      )}

      {/* Summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Gösterilen: <strong>{filteredRecords.length}</strong> kayıt
          </span>
          <div className="flex items-center space-x-4 text-gray-600">
            <span>
              Banka: <strong>{filteredRecords.filter(r => r.bankaOrPF === 'Banka').length}</strong>
            </span>
            <span>
              PF: <strong>{filteredRecords.filter(r => r.bankaOrPF === 'PF').length}</strong>
            </span>
            <span>
              Aktif: <strong>{filteredRecords.filter(r => r.durum === 'Aktif').length}</strong>
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
