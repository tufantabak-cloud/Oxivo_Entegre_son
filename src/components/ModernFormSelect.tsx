import { useState, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

export interface FormSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ModernFormSelectProps {
  label?: string | ReactNode;
  options: FormSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Modern form select dropdown component
 * Used for wizard steps and form inputs (not filters)
 * 
 * Features:
 * - Modern popover-based design
 * - Checkmark for selected item
 * - Optional descriptions
 * - Disabled state support
 * - Error state
 * - Required field indicator
 */
export function ModernFormSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
  disabled = false,
  error,
  required = false,
  className = ''
}: ModernFormSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={[
              'w-full flex items-center justify-between h-10 px-3',
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50',
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
              !selectedOption ? 'text-gray-500' : 'text-gray-900'
            ].join(' ')}
          >
            <span className="truncate">{displayText}</span>
            <ChevronDown 
              className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} 
            />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="p-0 rounded-xl shadow-lg border-gray-200"
          align="start"
          sideOffset={4}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <ScrollArea className="max-h-[280px]">
            <div className="p-1">
              {options.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  Seçenek bulunamadı
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm
                      transition-colors
                      ${option.disabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-100 cursor-pointer'
                      }
                      ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                    `}
                  >
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="truncate w-full text-left">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-xs text-gray-500 mt-0.5 truncate w-full text-left">
                          {option.description}
                        </span>
                      )}
                    </div>
                    
                    {value === option.value && (
                      <Check className="h-4 w-4 ml-2 shrink-0 text-blue-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
