/**
 * 🎯 Simple Column Visibility Dropdown
 * Lightweight version for simple column toggle use cases
 * No localStorage, pure controlled component
 */

import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { useState } from "react";
import { Columns3 } from "lucide-react";

export interface Column {
  id: string;
  title: string;
  visible: boolean;
}

interface SimpleColumnVisibilityProps {
  columns: Column[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  buttonText?: string;
}

export default function SimpleColumnVisibility({
  columns,
  onToggle,
  onSelectAll,
  onDeselectAll,
  buttonText = "Görünür Sütunlar",
}: SimpleColumnVisibilityProps) {
  const [open, setOpen] = useState(false);
  
  const visibleCount = columns.filter(col => col.visible).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Columns3 size={16} />
          {buttonText}
          {visibleCount < columns.length && (
            <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 rounded">
              {visibleCount}/{columns.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="dropdown-panel w-[260px] p-0 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-sm text-gray-800 dark:text-gray-200">
            Görmek istediğiniz sütunları seçin
          </h3>
          <div className="flex items-center justify-between mt-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectAll();
              }}
              className="flex-1 text-xs"
            >
              Tümünü Seç
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDeselectAll();
              }}
              className="flex-1 text-xs"
            >
              Tümünü Kaldır
            </Button>
          </div>
        </div>

        {/* Scrollable List */}
        <ScrollArea className="max-h-[280px] bg-white dark:bg-gray-900 py-2 px-3">
          <div className="space-y-2">
            {columns.map((col) => (
              <label
                key={col.id}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md px-2 py-1.5 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={col.visible}
                  onCheckedChange={() => onToggle(col.id)}
                />
                <span className="truncate flex-1">{col.title}</span>
              </label>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        {visibleCount < columns.length && (
          <div className="px-3 py-2 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 text-center">
            {visibleCount} / {columns.length} sütun görünür
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
