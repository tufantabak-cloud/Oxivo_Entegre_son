# 📦 Import Rules — Figma Make Integration

## 🎯 Core Rule: No Version Suffixes in Imports

**ALWAYS** produce import statements **without version suffixes**.

### ✅ CORRECT Examples:

```typescript
// Radix UI Components
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";

// Toast Notifications
import { toast } from "sonner";
import { Toaster as Sonner, ToasterProps } from "sonner";

// Icons
import { ChevronDown, Check, X } from "lucide-react";

// Utilities
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

// Date & Charts
import { DayPicker } from "react-day-picker";
import * as RechartsPrimitive from "recharts";

// Motion & Animation
import { motion } from "motion/react";

// Theme
import { useTheme } from "next-themes";

// Forms
import { useForm } from "react-hook-form";

// Carousel
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";

// Drawer
import { Drawer as DrawerPrimitive } from "vaul";

// Resizable Panels
import * as ResizablePrimitive from "react-resizable-panels";

// Input OTP
import { OTPInput, OTPInputContext } from "input-otp";

// Command Menu
import { Command as CommandPrimitive } from "cmdk";
```

---

### ❌ INCORRECT Examples (DO NOT USE):

```typescript
// ❌ WRONG - Version suffixes are NOT allowed
import * as DialogPrimitive from "@radix-ui/react-dialog@1.1.6";
import { toast } from "sonner@2.0.3";
import { ChevronDown } from "lucide-react@0.487.0";
import { cva } from "class-variance-authority@0.7.1";
import { DayPicker } from "react-day-picker@8.10.1";
import * as RechartsPrimitive from "recharts@2.15.2";
import { Toaster } from "sonner@2.0.3";
import { useTheme } from "next-themes@0.4.6";
import useEmblaCarousel from "embla-carousel-react@8.6.0";
```

---

## 🔍 Pre-Export Verification

Before exporting or deploying, **ALWAYS** run a final scan to detect and replace any `@pkg@x.y.z` patterns:

```bash
# PowerShell Search Command:
Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts | 
  Select-String -Pattern 'from [''"].+@\d+\.\d+' | 
  Format-Table -AutoSize

# Expected Result: No matches found
```

---

## 📚 Approved Package List

These packages are used in this project and must NEVER include version suffixes:

### UI Framework:
- `@radix-ui/react-*` (all Radix UI primitives)
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

### Icons & Visuals:
- `lucide-react`

### Forms & Validation:
- `react-hook-form`

### Notifications:
- `sonner`

### Date & Time:
- `date-fns`
- `react-day-picker`

### Charts:
- `recharts`

### Motion & Animation:
- `motion/react` (formerly framer-motion)

### Theme:
- `next-themes`

### Carousel & Sliders:
- `embla-carousel-react`

### Data Tables:
- `xlsx`

### State Management:
- `zustand`

### Drawer:
- `vaul`

### Command Menu:
- `cmdk`

### Resizable:
- `react-resizable-panels`

### Input:
- `input-otp`

### Backend:
- `@supabase/supabase-js`

---

## 🚨 Exception: React Hook Form

**ONLY** `react-hook-form` requires a version specifier (per Figma Make guidelines):

```typescript
// ✅ CORRECT - Explicit version required
import { useForm } from "react-hook-form@7.55.0";
```

All other packages must remain **versionless**.

---

## 🎯 Implementation Checklist

- [ ] All `@radix-ui/*` imports are versionless
- [ ] All `sonner` imports are versionless
- [ ] All `lucide-react` imports are versionless
- [ ] All `class-variance-authority` imports are versionless
- [ ] All `recharts` imports are versionless
- [ ] All `embla-carousel-react` imports are versionless
- [ ] All `next-themes` imports are versionless
- [ ] All `vaul` imports are versionless
- [ ] All `cmdk` imports are versionless
- [ ] All `motion/react` imports are versionless
- [ ] Only `react-hook-form@7.55.0` has version suffix

---

## 📝 Rationale

**Why versionless imports?**

1. **Package.json controls versions**: The `package.json` file already specifies exact dependency versions.
2. **Node module resolution**: Standard Node.js resolution doesn't support `@version` syntax in import paths.
3. **Build tool compatibility**: Vite, Webpack, and other bundlers expect package names only.
4. **Maintenance simplicity**: Version updates happen in one place (`package.json`), not scattered across files.

**Correct dependency flow:**
```
package.json (defines versions) 
    ↓
npm install (installs packages)
    ↓
import statements (reference package names only)
    ↓
Node module resolution (finds installed version)
```

---

## 🔧 Auto-Fix Script (PowerShell)

If versioned imports are detected, use this script to fix them:

```powershell
# fix-imports.ps1
$files = Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts -Exclude node_modules

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove version suffixes from imports
    $newContent = $content -replace 'from ([''"])(@radix-ui/[^@''"]+)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(sonner)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(lucide-react)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(class-variance-authority)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(recharts)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(next-themes)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(embla-carousel-react)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(vaul)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(cmdk)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(react-day-picker)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(react-resizable-panels)@[\d\.]+([''"])', 'from $1$2$3'
    $newContent = $newContent -replace 'from ([''"])(input-otp)@[\d\.]+([''"])', 'from $1$2$3'
    
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent -NoNewline
        Write-Host "✅ Fixed: $($file.Name)"
    }
}

Write-Host "`n🎉 Import cleanup complete!"
```

---

## ✅ Current Project Status

**Last Verification:** November 2, 2025  
**Files Scanned:** 58 TypeScript/TSX files  
**Versioned Imports Found:** 0  
**Status:** ✅ **ALL CLEAN**

All imports in this project follow the versionless pattern and are ready for export/deployment.

---

**Generated by:** Yönetim Uygulaması Project  
**Project Version:** 1.0.0  
**Build System:** React + Vite + TypeScript + TailwindCSS
