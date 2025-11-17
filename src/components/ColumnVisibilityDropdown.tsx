import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Settings2 } from 'lucide-react';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnConfig[];
  storageKey: string;
  onVisibilityChange: (visibleColumns: Record<string, boolean>) => void;
}

export function ColumnVisibilityDropdown({
  columns,
  storageKey,
  onVisibilityChange,
}: ColumnVisibilityDropdownProps) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    // LocalStorage'dan yükle veya default değerleri kullan
    const stored = localStorage.getItem(`columnVisibility_${storageKey}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default görünürlük ayarları
    const defaultVisibility: Record<string, boolean> = {};
    columns.forEach(col => {
      defaultVisibility[col.key] = col.defaultVisible !== false; // Default true
    });
    return defaultVisibility;
  });

  const [isOpen, setIsOpen] = useState(false);

  // Görünürlük değiştiğinde parent'a bildir ve localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem(`columnVisibility_${storageKey}`, JSON.stringify(visibility));
    onVisibilityChange(visibility);
  }, [visibility, storageKey, onVisibilityChange]);

  const handleToggle = (columnKey: string) => {
    setVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const handleSelectAll = () => {
    const newVisibility: Record<string, boolean> = {};
    columns.forEach(col => {
      newVisibility[col.key] = true;
    });
    setVisibility(newVisibility);
  };

  const handleDeselectAll = () => {
    const newVisibility: Record<string, boolean> = {};
    columns.forEach(col => {
      newVisibility[col.key] = false;
    });
    setVisibility(newVisibility);
  };

  const visibleCount = Object.values(visibility).filter(Boolean).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Settings2 size={16} />
          Sütun Görünürlüğü
          {visibleCount < columns.length && (
            <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 rounded">
              {visibleCount}/{columns.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={8}
        className="dropdown-panel w-[260px] p-0 rounded-xl shadow-lg border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 overflow-hidden"
      >
        {/* Header Section */}
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-sm text-gray-800 dark:text-gray-200">
            Görmek istediğiniz sütunları seçin
          </h3>
          <div className="flex items-center justify-between mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1 text-xs"
            >
              Tümünü Seç
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              className="flex-1 text-xs"
            >
              Tümünü Kaldır
            </Button>
          </div>
        </div>

        {/* Scrollable List with ScrollArea */}
        <ScrollArea className="max-h-[280px] bg-white dark:bg-gray-900 py-2 px-3">
          <div className="space-y-2">
            {columns.map(column => (
              <label
                key={column.key}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md px-2 py-1.5 cursor-pointer transition-colors"
              >
                <Checkbox
                  id={`col-${column.key}`}
                  checked={visibility[column.key] ?? true}
                  onCheckedChange={() => handleToggle(column.key)}
                />
                <span className="truncate flex-1">{column.label}</span>
              </label>
            ))}
          </div>
        </ScrollArea>

        {/* Footer with Count */}
        {visibleCount < columns.length && (
          <div className="px-3 py-2 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 text-center">
            {visibleCount} / {columns.length} sütun görünür
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
