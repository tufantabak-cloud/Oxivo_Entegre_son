import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Trash2, ArrowRight, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { SearchResult } from '../utils/searchEngine';
import {
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
  groupResultsByCategory,
} from '../utils/searchEngine';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (moduleLink: string, itemId?: string) => void;
  onSearch: (query: string) => SearchResult[];
  totalIndexedItems: number;
}

export function GlobalSearch({
  isOpen,
  onClose,
  onNavigate,
  onSearch,
  totalIndexedItems,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history on mount
  useEffect(() => {
    if (isOpen) {
      setSearchHistory(getSearchHistory());
      setQuery('');
      setSelectedIndex(0);
      // Focus input after dialog opens
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Perform search
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return onSearch(query);
  }, [query, onSearch]);

  // Group results by category
  const groupedResults = useMemo(() => {
    return groupResultsByCategory(results);
  }, [results]);

  // All selectable items (for keyboard navigation)
  const allItems = useMemo(() => {
    if (results.length > 0) return results;
    return searchHistory.map((q, i) => ({ id: `history-${i}`, query: q }));
  }, [results, searchHistory]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allItems.length > 0) {
            const item = allItems[selectedIndex];
            if ('query' in item) {
              // History item
              setQuery(item.query);
            } else {
              // Search result
              handleResultClick(item as SearchResult);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleResultClick = (result: SearchResult) => {
    saveSearchHistory(query);
    setSearchHistory(getSearchHistory());
    onNavigate(result.moduleLink, result.id);
    onClose();
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const getCategoryIcon = (category: SearchResult['category']) => {
    const iconClass = 'h-4 w-4';
    switch (category) {
      case 'Müşteri':
        return <span className={iconClass}>👤</span>;
      case 'Banka/PF':
        return <span className={iconClass}>🏦</span>;
      case 'Ürün':
        return <span className={iconClass}>📦</span>;
      case 'TABELA':
        return <span className={iconClass}>📋</span>;
      case 'Hakediş':
        return <span className={iconClass}>💰</span>;
      case 'Satış Temsilcisi':
        return <span className={iconClass}>👔</span>;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: SearchResult['category']) => {
    switch (category) {
      case 'Müşteri':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Banka/PF':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Ürün':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'TABELA':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Hakediş':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Satış Temsilcisi':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0 max-h-[80vh] flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <DialogTitle className="sr-only">Global Arama</DialogTitle>
          <DialogDescription className="sr-only">
            Müşteri, Banka/PF, Ürün, TABELA ve diğer kayıtlarda arama yapın
          </DialogDescription>
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Müşteri, Banka/PF, Ürün, TABELA ara... (Ctrl+K)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 p-0 h-8 text-base"
              autoComplete="off"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>{totalIndexedItems.toLocaleString('tr-TR')} kayıt indekslendi</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                ↑↓
              </kbd>
              <span>Gezin</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                Enter
              </kbd>
              <span>Seç</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                Esc
              </kbd>
              <span>Kapat</span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Search Results */}
            {query.trim() && results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {results.length} sonuç bulundu
                  </p>
                </div>

                {/* Group by category */}
                {Array.from(groupedResults.entries()).map(([category, categoryResults]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category as SearchResult['category'])}
                      <h3 className="text-sm font-medium text-gray-900">{category}</h3>
                      <Badge variant="outline" className="text-xs">
                        {categoryResults.length}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {categoryResults.slice(0, 5).map((result, idx) => {
                        const globalIndex = results.indexOf(result);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {result.title}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs px-2 py-0 ${getCategoryColor(
                                      result.category
                                    )}`}
                                  >
                                    {result.category}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {result.subtitle}
                                </p>
                                {result.metadata && (
                                  <div className="flex items-center gap-2 mt-1">
                                    {Object.entries(result.metadata)
                                      .slice(0, 2)
                                      .map(([key, value]) => (
                                        <span
                                          key={key}
                                          className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded"
                                        >
                                          {String(value)}
                                        </span>
                                      ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="secondary" className="text-xs px-2 py-0">
                                  %{Math.round(result.score)}
                                </Badge>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {categoryResults.length > 5 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          +{categoryResults.length - 5} sonuç daha...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.trim() && results.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Sonuç bulunamadı</h3>
                <p className="text-sm text-gray-500">
                  &ldquo;{query}&rdquo; için hiçbir kayıt bulunamadı.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Farklı anahtar kelimeler veya daha kısa terimler deneyin.
                </p>
              </div>
            )}

            {/* Search History */}
            {!query.trim() && searchHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-700">Son Aramalar</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-7 text-xs text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Temizle
                  </Button>
                </div>

                <div className="space-y-1">
                  {searchHistory.map((historyQuery, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(historyQuery)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                        idx === selectedIndex && results.length === 0
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{historyQuery}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!query.trim() && searchHistory.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full mb-4">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Hızlı Arama</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Müşteri, Banka/PF, Ürün, TABELA ve diğer kayıtlarda hızlı arama yapın.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">
                    Ctrl
                  </kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">K</kbd>
                  <span>ile her yerden açabilirsiniz</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}