import { useState } from 'react';
import { Customer, DomainNode } from './CustomerModule';
import { ChevronDown, ChevronRight, Users, Database, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface DomainReportTabProps {
  customers: Customer[];
}

// Recursive Domain Tree Viewer (Read-only)
interface DomainTreeViewProps {
  node: DomainNode;
  level: number;
  index: number;
  customerName?: string;
}

function DomainTreeView({ node, level, index, customerName }: DomainTreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Numaralandırma fonksiyonu - Hiyerarşik sıralama
  const getNumbering = (level: number, index: number): string => {
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    
    if (level === 0) return `${index + 1}.`; // 1. 2. 3.
    if (level === 1) return String.fromCharCode(97 + index) + '.'; // a. b. c.
    if (level === 2) return romanNumerals[index] || `${index + 1}.`; // i. ii. iii.
    if (level === 3) return `${index + 1}.`; // 1. 2. 3.
    if (level === 4) return romanNumerals[index] || `${index + 1}.`; // i. ii. iii.
    return `${index + 1}.`; // Fallback
  };

  const numbering = getNumbering(level, index);
  const indent = level * 20; // Kompakt girinti (20px per level)

  return (
    <div className="select-none">
      <div 
        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 transition-colors mb-1"
        style={{ marginLeft: `${indent}px` }}
      >
        {/* Toggle button */}
        {node.children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? 'Daralt' : 'Genişlet'}
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-gray-600" />
            ) : (
              <ChevronRight size={14} className="text-gray-600" />
            )}
          </button>
        )}
        {node.children.length === 0 && <div className="w-[18px]" />}

        {/* Numaralandırma */}
        <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded min-w-[28px] text-center tabular-nums">
          {numbering}
        </span>

        {/* Domain adı */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-gray-900">
            {node.name}
          </span>
          {node.children.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {node.children.length}
            </span>
          )}
        </div>
      </div>

      {/* Alt domainler (recursive) */}
      {isExpanded && node.children.length > 0 && (
        <div className="relative">
          {/* Dikey bağlantı çizgisi */}
          <div 
            className="absolute left-2 top-0 bottom-2 w-px bg-gray-200"
            style={{ marginLeft: `${indent}px` }}
          />
          {node.children.map((child, childIndex) => (
            <DomainTreeView 
              key={child.id} 
              node={child} 
              level={level + 1}
              index={childIndex}
              customerName={customerName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DomainReportTab({ customers }: DomainReportTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Domain verisi olan müşterileri grupla
  const customersWithDomains = customers.filter(c => 
    c.domainHierarchy && c.domainHierarchy.length > 0
  );

  // Domain verisi olmayan müşteriler
  const customersWithoutDomains = customers.filter(c => 
    !c.domainHierarchy || c.domainHierarchy.length === 0
  );

  // Arama filtresi
  const filteredCustomersWithDomains = customersWithDomains.filter(customer =>
    customer.cariAdi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.guncelMyPayterDomain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomersWithoutDomains = customersWithoutDomains.filter(customer =>
    customer.cariAdi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tüm domainleri topla (unique domain isimleri)
  const allDomainNames = new Set<string>();
  const collectDomainNames = (nodes: DomainNode[]) => {
    nodes.forEach(node => {
      allDomainNames.add(node.name);
      if (node.children.length > 0) {
        collectDomainNames(node.children);
      }
    });
  };
  customersWithDomains.forEach(customer => {
    if (customer.domainHierarchy) {
      collectDomainNames(customer.domainHierarchy);
    }
  });

  // Domain sayma fonksiyonu (tüm node'ları say)
  const countDomainNodes = (nodes: DomainNode[]): number => {
    let count = nodes.length;
    nodes.forEach(node => {
      if (node.children.length > 0) {
        count += countDomainNodes(node.children);
      }
    });
    return count;
  };

  const totalDomainNodes = customersWithDomains.reduce((sum, customer) => {
    return sum + (customer.domainHierarchy ? countDomainNodes(customer.domainHierarchy) : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Toplam Müşteri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-2xl font-semibold cursor-help">{customers.length}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">Veri Kaynağı:</p>
                    <p className="text-xs">Müşteriler modülündeki tüm kayıtlar</p>
                    <p className="text-xs opacity-75">Domain tanımlı + tanımsız müşteriler</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Domain Tanımlı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="text-green-600" size={24} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-2xl font-semibold cursor-help">{customersWithDomains.length}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">Veri Kaynağı:</p>
                    <p className="text-xs">domainHierarchy verisi olan müşteriler</p>
                    <p className="text-xs opacity-75">Domain hiyerarşisi tanımlanmış müşteri sayısı</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Domain Tanımsız</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="text-orange-600" size={24} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-2xl font-semibold cursor-help">{customersWithoutDomains.length}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">Veri Kaynağı:</p>
                    <p className="text-xs">domainHierarchy verisi olmayan müşteriler</p>
                    <p className="text-xs opacity-75">Domain tanımı yapılması gereken müşteriler</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Toplam Domain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="text-purple-600" size={24} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-2xl font-semibold cursor-help">{totalDomainNodes}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">Hesaplama:</p>
                    <p className="text-xs">Tüm müşterilerdeki toplam domain node sayısı</p>
                    <p className="text-xs opacity-75">Ana domain + alt domainler dahil (recursive)</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arama */}
      <div>
        <Input
          id="domain-report-search"
          placeholder="Müşteri adı veya domain ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Domain Tanımlı Müşteriler */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Domain Hiyerarşisi Tanımlı Müşteriler</CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {filteredCustomersWithDomains.length} Müşteri
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomersWithDomains.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? (
                <p>Arama kriterlerine uygun domain tanımlı müşteri bulunamadı.</p>
              ) : (
                <p>Henüz domain hiyerarşisi tanımlı müşteri bulunmuyor.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCustomersWithDomains.map(customer => (
                <div key={customer.id} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50/30">
                  {/* Müşteri Başlığı */}
                  <div className="mb-4 pb-3 border-b-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className={customer.durum === 'Pasif' ? 'text-gray-500 line-through' : 'text-gray-900'}>
                          {customer.cariAdi}
                        </h3>
                        {customer.guncelMyPayterDomain && (
                          <p className="text-sm text-gray-600">
                            🌐 {customer.guncelMyPayterDomain}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={customer.durum === 'Aktif' 
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                          }
                        >
                          {customer.durum}
                        </Badge>
                        {customer.domainHierarchy && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            {countDomainNodes(customer.domainHierarchy)} Domain
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Domain Hiyerarşisi */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="space-y-1">
                      {customer.domainHierarchy?.map((node, index) => (
                        <DomainTreeView 
                          key={node.id} 
                          node={node} 
                          level={0}
                          index={index}
                          customerName={customer.cariAdi}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain Tanımsız Müşteriler */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Domain Hiyerarşisi Tanımsız Müşteriler</CardTitle>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              {filteredCustomersWithoutDomains.length} Müşteri
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomersWithoutDomains.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? (
                <p>Arama kriterlerine uygun domain tanımsız müşteri bulunamadı.</p>
              ) : (
                <p>Tüm müşterilerde domain hiyerarşisi tanımlı! 🎉</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCustomersWithoutDomains.map(customer => (
                <div 
                  key={customer.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${customer.durum === 'Pasif' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {customer.cariAdi}
                      </p>
                      {customer.guncelMyPayterDomain && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {customer.guncelMyPayterDomain}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={customer.durum === 'Aktif' 
                        ? 'bg-green-50 text-green-700 border-green-300 text-xs'
                        : 'bg-gray-100 text-gray-600 border-gray-300 text-xs'
                      }
                    >
                      {customer.durum}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
