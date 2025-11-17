/**
 * 🔧 UNIVERSAL DROPDOWN FILTER v2 (Tailwind + Dark Mode + Multi-Select)
 * Global dropdown fix — removes bottom gaps, clipping, and inconsistent scroll behavior.
 * Compatible with Figma AI export and Tailwind-based design systems.
 */

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./utils";

export interface DropdownFilterProps {
  label?: string;
  options?: string[];
  selected?: string[];
  onChange?: (selected: string[]) => void;
  darkMode?: boolean;
  maxHeight?: string;
  placeholder?: string;
  className?: string;
}

export function DropdownFilter({
  label = "Filtre Seçimi",
  options = [],
  selected = [],
  onChange,
  darkMode = false,
  maxHeight = "max-h-64",
  placeholder,
  className,
}: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (!onChange) return;
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const displayText = placeholder || label;
  const buttonText = selected.length > 0 
    ? `${label}: ${selected.length} seçildi` 
    : displayText;

  return (
    <div ref={ref} className={cn("relative inline-block w-full text-left", className)}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex w-full justify-between items-center rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          darkMode
            ? "bg-gray-900 text-gray-100 border-gray-700 hover:bg-gray-800"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        )}
      >
        <span className="truncate">{buttonText}</span>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 transition-transform flex-shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className={cn(
            "dropdown-panel absolute left-0 mt-2 w-full overflow-y-auto rounded-xl border shadow-lg z-[9999]",
            maxHeight,
            darkMode
              ? "bg-gray-900 text-gray-100 border-gray-700"
              : "bg-white text-gray-700 border-gray-200"
          )}
        >
          {options.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">
              Seçenek yok
            </div>
          ) : (
            options.map((opt, idx) => (
              <label
                key={idx}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer select-none transition-colors text-sm",
                  darkMode
                    ? "hover:bg-gray-800"
                    : "hover:bg-gray-50",
                  selected.includes(opt)
                    ? darkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                    : darkMode
                      ? "text-gray-200"
                      : "text-gray-700"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className={cn(
                    "h-4 w-4 rounded text-blue-600 focus:ring-blue-500",
                    darkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  )}
                />
                <span className="truncate">{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DropdownFilter;
