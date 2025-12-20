import React, { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Filter, Check, X } from 'lucide-react';
import { cn } from './ui/utils';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  source?: string; // ✅ NEW: Optional source identifier (bank_accounts, banks, epk, ok)
}

interface FilterDropdownProps {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  // ✅ BREAKING CHANGE: Support both single and multi-select
  value?: string; // For single select (deprecated, use selectedValues instead)
  selectedValues?: string[]; // For multi-select
  onChange?: (value: string) => void; // For single select (deprecated)
  onChangeMulti?: (values: string[]) => void; // For multi-select
  className?: string;
  allLabel?: string;
  allValue?: string;
  showCount?: boolean;
  multiSelect?: boolean; // ✅ NEW: Enable multi-select mode
  clearable?: boolean; // ✅ NEW: Show clear button
}

export const FilterDropdown = React.memo(function FilterDropdown({
  label,
  icon,
  options,
  value,
  selectedValues = [],
  onChange,
  onChangeMulti,
  className,
  allLabel = 'Tümü',
  allValue = 'all',
  showCount = false,
  multiSelect = false,
  clearable = false,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ COMPATIBILITY: Support both old (value) and new (selectedValues) API
  const activeValues = multiSelect 
    ? selectedValues 
    : (value ? [value] : []);

  const isAllSelected = activeValues.length === 0 || activeValues.includes(allValue);
  
  const displayLabel = multiSelect
    ? (activeValues.length === 0 
        ? label 
        : `${activeValues.length} seçili`)
    : (isAllSelected 
        ? allLabel 
        : options.find(opt => opt.value === value)?.label || label);

  const handleSelectSingle = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  const handleSelectMulti = (optionValue: string) => {
    if (!onChangeMulti && !onChange) return;
    
    let newValues: string[];
    if (activeValues.includes(optionValue)) {
      // Remove if already selected
      newValues = activeValues.filter(v => v !== optionValue);
    } else {
      // Add if not selected
      newValues = [...activeValues, optionValue];
    }

    // Call the appropriate callback
    if (onChangeMulti) {
      onChangeMulti(newValues);
    } else if (onChange) {
      // Fallback for compatibility (convert array to single value)
      onChange(newValues[0] || allValue);
    }
  };

  const handleClear = () => {
    if (multiSelect && onChangeMulti) {
      onChangeMulti([]);
    } else if (onChange) {
      onChange(allValue);
    }
    setIsOpen(false);
  };

  const handleSelect = multiSelect ? handleSelectMulti : handleSelectSingle;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className={cn(
            "gap-2 min-w-[140px] justify-between",
            !isAllSelected && "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",
            className
          )}
        >
          <div className="flex items-center gap-2">
            {icon || <Filter size={16} />}
            <span className="truncate">{displayLabel}</span>
          </div>
          {clearable && !isAllSelected && (
            <X 
              size={14} 
              className="ml-1 hover:bg-blue-200 rounded-full p-0.5 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={8}
        className="dropdown-panel w-[280px] p-0 rounded-xl shadow-lg border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700"
      >
        {/* Header */}
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm text-gray-800 dark:text-gray-200">
            {label}
          </h3>
          {clearable && activeValues.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Temizle
            </button>
          )}
        </div>

        {/* ✅ FIX: Single scrollable area (NO nested ScrollArea!) */}
        <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900 py-2">
          <div className="px-2 space-y-1">
            {/* "Tümü" option (only for single select) */}
            {!multiSelect && (
              <>
                <button
                  type="button"
                  onClick={() => handleSelectSingle(allValue)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-md cursor-pointer transition-colors",
                    value === allValue
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <span>{allLabel}</span>
                  {value === allValue && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                </button>

                {/* Divider */}
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              </>
            )}

            {/* Scroll hint (if more than 8 items) */}
            {options.length > 8 && (
              <div className="text-xs text-gray-400 text-center py-1 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-100">
                ↓ {options.length} seçenek ↓
              </div>
            )}

            {/* Individual options */}
            {options.map(option => {
              const isSelected = multiSelect 
                ? activeValues.includes(option.value)
                : value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-md cursor-pointer transition-colors",
                    isSelected
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <span className="truncate flex-1 text-left text-xs">{option.label}</span>
                  <div className="flex items-center gap-2">
                    {showCount && option.count !== undefined && (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        isSelected
                          ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {option.count}
                      </span>
                    )}
                    {isSelected && (
                      <Check size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}

            {options.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-8">
                Seçenek bulunamadı
              </div>
            )}
          </div>
        </div>

        {/* Footer - Active filter indicator */}
        {multiSelect && activeValues.length > 0 && (
          <div className="px-3 py-2 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-xs text-blue-600 dark:text-blue-400 text-center">
            {activeValues.length} seçili
          </div>
        )}
        {!multiSelect && !isAllSelected && (
          <div className="px-3 py-2 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-xs text-blue-600 dark:text-blue-400 text-center">
            Filtre aktif
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});
