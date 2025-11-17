/**
 * PaginationControls Component
 * 
 * Reusable pagination UI component with item-per-page selector.
 * 
 * Features:
 * - Previous/Next navigation
 * - First/Last page jumps
 * - Current page indicator
 * - Items per page selector
 * - Total count display
 * - Responsive design
 * 
 * Usage:
 * <PaginationControls
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   itemsPerPage={itemsPerPage}
 *   totalItems={items.length}
 *   onPageChange={goToPage}
 *   onItemsPerPageChange={setItemsPerPage}
 * />
 * 
 * Created: 2025-11-06
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useState } from 'react';
import { cn } from './ui/utils';

// Compact items per page selector
function ItemsPerPageSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const options = [25, 50, 100, 200, 500];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Sayfa başına:</span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-20 px-2"
          >
            {value}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={4}
          className="w-[100px] p-1 rounded-xl shadow-lg border border-gray-200 bg-white"
        >
          <div className="space-y-1">
            {options.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                  value === option
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span>{option}</span>
                {value === option && <Check size={14} className="text-blue-600" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (count: number) => void;
  startIndex: number;
  endIndex: number;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  startIndex,
  endIndex,
  className = '',
}: PaginationControlsProps) {
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className={`flex items-center justify-between gap-4 flex-wrap ${className}`}>
      {/* Items info */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">
          {startIndex + 1}-{endIndex}
        </span>{' '}
        / {totalItems} kayıt
        {totalPages > 1 && (
          <span className="ml-2 text-gray-500">
            (Sayfa {currentPage} / {totalPages})
          </span>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <ItemsPerPageSelector
            value={itemsPerPage}
            onChange={onItemsPerPageChange}
          />
        )}

        {/* Navigation buttons */}
        {totalPages > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={!hasPrevPage}
              className="h-9 w-9 p-0"
              title="İlk sayfa"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrevPage}
              className="h-9 w-9 p-0"
              title="Önceki sayfa"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="h-9 w-9 p-0"
              title="Sonraki sayfa"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNextPage}
              className="h-9 w-9 p-0"
              title="Son sayfa"
            >
              <ChevronsRight size={16} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
