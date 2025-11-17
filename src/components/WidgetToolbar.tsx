// Widget Toolbar Component
// Provides common controls for widgets (refresh, export, filter)
import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export interface DateRange {
  from: Date;
  to: Date;
}

interface WidgetToolbarProps {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  badge?: string;
  onRefresh?: () => void | Promise<void>;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  showDateFilter?: boolean;
  showExport?: boolean;
}

export function WidgetToolbar({
  title,
  icon,
  iconColor = 'text-blue-600',
  badge,
  onRefresh,
  onExportExcel,
  onExportPDF,
  dateRange,
  onDateRangeChange,
  showDateFilter = false,
  showExport = true,
}: WidgetToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && onDateRangeChange) {
      // Simple date selection - set as both from and to for now
      onDateRangeChange({ from: date, to: date });
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Title Section */}
      <div className="flex items-center gap-2">
        <span className={iconColor}>{icon}</span>
        <h3 className="font-semibold text-lg">{title}</h3>
        {badge && (
          <Badge variant="secondary" className="ml-2">
            {badge}
          </Badge>
        )}
      </div>

      {/* Controls Section */}
      <div className="flex items-center gap-2">
        {/* Date Filter */}
        {showDateFilter && (
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar size={14} />
                {dateRange
                  ? `${format(dateRange.from, 'dd MMM', { locale: tr })} - ${format(dateRange.to, 'dd MMM', { locale: tr })}`
                  : 'Tarih Seç'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={dateRange?.from}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Export Dropdown */}
        {showExport && (onExportExcel || onExportPDF) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download size={14} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onExportExcel && (
                <DropdownMenuItem onClick={onExportExcel}>
                  <FileSpreadsheet size={14} className="mr-2" />
                  Excel (.xlsx)
                </DropdownMenuItem>
              )}
              {onExportPDF && (
                <DropdownMenuItem onClick={onExportPDF}>
                  <FileText size={14} className="mr-2" />
                  PDF (.pdf)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'animate-spin' : ''}
            />
          </Button>
        )}
      </div>
    </div>
  );
}
