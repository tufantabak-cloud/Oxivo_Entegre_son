import React, { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Filter, Check } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from './ui/utils';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  allLabel?: string;
  allValue?: string;
  showCount?: boolean;
}

export const FilterDropdown = React.memo(function FilterDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  className,
  allLabel = 'Tümü',
  allValue = 'all',
  showCount = false,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);
  const isAllSelected = value === allValue;
  
  const displayLabel = isAllSelected 
    ? allLabel 
    : selectedOption?.label || label;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

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
          {!isAllSelected && showCount && selectedOption?.count !== undefined && (
            <span className="ml-1 text-xs bg-blue-200 text-blue-800 px-2 rounded">
              {selectedOption.count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={8}
        className="dropdown-panel w-[220px] p-0 rounded-xl shadow-lg border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-sm text-gray-800 dark:text-gray-200">
            {label}
          </h3>
        </div>

        {/* Options List */}
        <ScrollArea className="max-h-[360px] bg-white dark:bg-gray-900 py-2">
          <div className="px-2 space-y-1">
            {/* "Tümü" option */}
            <button
              type="button"
              onClick={() => handleSelect(allValue)}
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

            {/* Scroll hint (if more than 6 items) */}
            {options.length > 6 && (
              <div className="text-xs text-gray-400 text-center py-1 sticky top-0 bg-white dark:bg-gray-900 z-10">
                ↓ {options.length} seçenek - Kaydırın ↓
              </div>
            )}

            {/* Individual options */}
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-md cursor-pointer transition-colors",
                  value === option.value
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <span className="truncate flex-1 text-left">{option.label}</span>
                <div className="flex items-center gap-2">
                  {showCount && option.count !== undefined && (
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      value === option.value
                        ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    )}>
                      {option.count}
                    </span>
                  )}
                  {value === option.value && (
                    <Check size={16} className="text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer - Active filter indicator */}
        {!isAllSelected && (
          <div className="px-3 py-2 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-xs text-blue-600 dark:text-blue-400 text-center">
            Filtre aktif
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});