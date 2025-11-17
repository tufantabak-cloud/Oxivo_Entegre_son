# 🎯 FIGMA MAKE RULES — Complete Integration Guidelines

**Project:** Yönetim Uygulaması  
**For:** Figma Make AI Integration  
**Version:** 1.0.0  
**Date:** November 2, 2025

---

## 📋 OVERVIEW

These rules ensure Figma Make generates code that is fully compatible with this project's architecture, build system, and coding standards. Copy these rules into your Figma Make project settings.

---

## 🔥 CRITICAL RULES (MUST APPLY)

### **1️⃣ Import Rule — No Version Suffixes**

```
Import Rule — generate imports without pinned versions:

Always produce import statements without version suffixes. Example:
✅ Correct: import * as Label from "@radix-ui/react-label";
❌ Incorrect: import * as Label from "@radix-ui/react-label@2.1.2";

Apply this to all third-party libs (Radix UI, Sonner, Lucide, etc.). 
Do a final scan and replace any @pkg@x.y.z patterns before export.

EXCEPTION: Only react-hook-form requires version:
import { useForm } from "react-hook-form@7.55.0";
```

---

### **2️⃣ CSS Rule — Direct CSS for Variables**

```
CSS Rule — prefer direct CSS for CSS-variable tokens:

Never generate lines like @apply bg-background where bg-background maps to CSS variables. 
Instead ensure globals.css uses direct CSS, for example:

✅ Correct:
  * { border-color: hsl(var(--border)); }
  body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); }

❌ Incorrect:
  @apply bg-background text-foreground border-border;

If you must include @apply, only use Tailwind utilities that do not resolve to CSS-variable tokens.
Examples of safe @apply: flex, px-4, rounded-lg, shadow-md (layout/spacing/effects).
```

---

## 📐 PROJECT STRUCTURE RULES

### **3️⃣ File Organization**

```
File Structure Rule — root-level architecture:

This project uses a ROOT-LEVEL structure (NO src/ directory):
✅ /App.tsx
✅ /main.tsx
✅ /components/
✅ /styles/
✅ /utils/

❌ NOT: /src/App.tsx
❌ NOT: /src/components/

When generating imports:
✅ Correct: import { Button } from "./components/ui/button";
✅ Correct: import "./styles/globals.css";

❌ Incorrect: import { Button } from "../components/ui/button";
❌ Incorrect: import "../src/styles/globals.css";
```

---

### **4️⃣ Component Placement**

```
Component Placement Rule — organized by purpose:

Main Components:     /components/*.tsx
UI Components:       /components/ui/*.tsx
Utilities:           /utils/*.tsx
Styles:              /styles/*.css
Supabase Functions:  /supabase/functions/server/*.tsx

Never create:
❌ /src/* (no src directory)
❌ /lib/* (use /utils instead)
❌ /app/* (this is not Next.js)
```

---

## 🎨 STYLING RULES

### **5️⃣ Tailwind Class Usage**

```
Tailwind Typography Rule — respect base styles:

DO NOT output Tailwind classes for font size, font weight, or line-height UNLESS explicitly requested.
This project has default typography in styles/globals.css that should not be overridden.

❌ Avoid: text-2xl, font-bold, leading-none (unless user specifically asks)
✅ Use: text-foreground, bg-background (color utilities)
✅ Use: flex, px-4, rounded-lg (layout/spacing utilities)

Typography is defined in globals.css:
h1 { font-size: var(--text-2xl); font-weight: var(--font-weight-medium); }
h2 { font-size: var(--text-xl); font-weight: var(--font-weight-medium); }
```

---

### **6️⃣ Color Tokens**

```
Color Token Rule — use semantic naming:

Always use semantic color utilities from the theme:
✅ bg-background, text-foreground
✅ bg-primary, text-primary-foreground
✅ bg-destructive, text-destructive-foreground
✅ border-border, bg-muted, text-muted-foreground

❌ Never hardcode: bg-white, text-black, bg-slate-100
❌ Never use arbitrary values: bg-[#ffffff]

These map to CSS variables in globals.css and support dark mode.
```

---

## 🔧 CONFIGURATION RULES

### **7️⃣ Tailwind Config**

```
Tailwind Config Rule — content paths for root structure:

tailwind.config.js must use these content paths:
content: [
  "./index.html",
  "./App.tsx",
  "./main.tsx",
  "./components/**/*.{js,ts,jsx,tsx}",
  "./utils/**/*.{js,ts,jsx,tsx}"
]

❌ NOT: "./src/**/*.{js,ts,jsx,tsx}"

Include <alpha-value> for opacity support:
colors: {
  background: "hsl(var(--background) / <alpha-value>)",
}

Include plugins:
plugins: [require("tailwindcss-animate")]
```

---

### **8️⃣ PostCSS Config**

```
PostCSS Rule — ESM format:

Use modern ESM format in postcss.config.js:

✅ Correct:
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}

❌ Incorrect (CommonJS):
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ]
}
```

---

## 📦 PACKAGE & LIBRARY RULES

### **9️⃣ Approved Libraries**

```
Library Usage Rule — use these packages:

UI Components:     @radix-ui/* (all primitives)
Icons:             lucide-react
Toast:             sonner (import from "sonner" NOT "sonner")
Forms:             react-hook-form@7.55.0 (ONLY exception with version)
Charts:            recharts
Date Picker:       react-day-picker
Motion:            motion/react (import { motion } from "motion/react")
Carousel:          embla-carousel-react
State Management:  zustand
Backend:           @supabase/supabase-js
Utils:             class-variance-authority, clsx, tailwind-merge

Do NOT use:
❌ react-resizable (use re-resizable instead)
❌ konva (not supported, use canvas directly)
❌ framer-motion (outdated, use motion/react)
```

---

### **🔟 ShadCN Components**

```
ShadCN Import Rule — use local components:

This project has 40 pre-installed ShadCN components in /components/ui/.
Always import from local paths, never create duplicates:

✅ Correct: import { Button } from "./components/ui/button";
✅ Correct: import { Dialog } from "./components/ui/dialog";

❌ Incorrect: Create new /components/ui/button.tsx when one exists
❌ Incorrect: import { Button } from "@/components/ui/button"; (no @ alias)

Available components:
accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb,
button, calendar, card, carousel, chart, checkbox, collapsible, command,
context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp,
input, label, menubar, navigation-menu, pagination, popover, progress,
radio-group, resizable, scroll-area, select, separator, sheet, sidebar,
skeleton, slider, sonner, switch, table, tabs, textarea, toggle-group,
toggle, tooltip
```

---

## 🖼️ IMAGE & ASSET RULES

### **1️⃣1️⃣ Image Component**

```
Image Rule — use ImageWithFallback:

When creating new images, use ImageWithFallback instead of <img>:

✅ Correct:
import { ImageWithFallback } from './components/figma/ImageWithFallback';
<ImageWithFallback src={url} alt="..." />

❌ Incorrect:
<img src={url} alt="..." />

Exception: If importing from Figma designs, use the imported images:
✅ import imgA from "figma:asset/76faf8f617b56e6f079c5a7ead8f927f5a5fee32.png";
```

---

### **1️⃣2️⃣ Unsplash Images**

```
Unsplash Rule — always use unsplash_tool:

Never hallucinate image URLs. Always call unsplash_tool:
✅ Correct: unsplash_tool("modern office workspace")
❌ Incorrect: <img src="https://example.com/fake-image.jpg" />

Use 2-3 relevant keywords, not overly specific queries.
```

---

## 🔐 BACKEND RULES

### **1️⃣3️⃣ Supabase Integration**

```
Backend Rule — three-tier architecture:

Frontend -> Server -> Database

Server Code Location: /supabase/functions/server/
Server Route Prefix:  /make-server-9ec5bbb3/<route>

Protected File (NEVER modify):
❌ /supabase/functions/server/kv_store.tsx

KV Store Usage:
import * as kv from './kv_store.tsx';
await kv.set('key', value);
const value = await kv.get('key');

Frontend Client:
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
const supabase = createClient(projectId, publicAnonKey);
```

---

### **1️⃣4️⃣ Environment Variables**

```
Environment Variable Rule — use create_supabase_secret tool:

When backend code requires an API key, use create_supabase_secret tool:
✅ create_supabase_secret("OPENAI_API_KEY")

Already provided secrets (don't recreate):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_DB_URL
- VITE_GEMINI_API_KEY

Never hardcode API keys in source files.
```

---

## 🚨 ERROR HANDLING RULES

### **1️⃣5️⃣ Error Boundaries**

```
Error Handling Rule — wrap components in ErrorBoundary:

For complex components, wrap in ErrorBoundary:
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComplexComponent />
</ErrorBoundary>

Log errors with contextual information:
console.error(`Error while ${action} during ${context}: ${error}`);
```

---

## 📝 CODE STYLE RULES

### **1️⃣6️⃣ TypeScript**

```
TypeScript Rule — comprehensive types:

Always define proper types, no 'any':
✅ interface Customer { id: string; name: string; }
✅ type Status = 'active' | 'inactive';

❌ function process(data: any) { }
❌ const items: any[] = [];

Use type inference where appropriate:
const [count, setCount] = useState(0); // ✅ inferred as number
```

---

### **1️⃣7️⃣ Component Structure**

```
Component Structure Rule — organized and readable:

Order within components:
1. Imports
2. Type definitions
3. Constants
4. Component function
5. Helper functions
6. Export

Use named exports for components:
✅ export function CustomerList() { }
❌ export default function CustomerList() { }

Exception: App.tsx must have default export.
```

---

## 🧪 TESTING RULES

### **1️⃣8️⃣ Console Logging**

```
Logging Rule — detailed error messages:

Include context in all error logs:
✅ console.error(`Failed to fetch customers during initial load: ${error}`);
❌ console.error(error);

Use structured logging:
console.log('✅ Success:', data);
console.warn('⚠️ Warning:', message);
console.error('❌ Error:', error);
```

---

## 🎯 PERFORMANCE RULES

### **1️⃣9️⃣ State Management**

```
State Management Rule — use Zustand for global state:

Use Zustand stores for shared state:
✅ import { useCustomerStore } from './stores/customerStore';

React useState for local component state:
✅ const [isOpen, setIsOpen] = useState(false);

Avoid prop drilling - use stores for deeply nested data.
```

---

### **2️⃣0️⃣ Memoization**

```
Memoization Rule — optimize expensive operations:

Use useMemo for expensive calculations:
const filtered = useMemo(() => 
  items.filter(item => item.active), 
  [items]
);

Use useCallback for callbacks passed to children:
const handleClick = useCallback(() => {
  // handler
}, [deps]);
```

---

## 🔍 VERIFICATION COMMANDS

### **Pre-Export Checks:**

```bash
# 1. Check for versioned imports (should find 0 except react-hook-form)
Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts | 
  Select-String -Pattern 'from [''"].+@\d+\.\d+' | 
  Where-Object { $_ -notmatch 'react-hook-form@7.55.0' }

# 2. Check for @apply with CSS variables (should find 0)
Get-ChildItem -Path . -Recurse -Include *.css | 
  Select-String -Pattern '@apply.*(bg-background|text-foreground|border-border)'

# 3. Verify direct CSS usage (should find 4+)
Get-Content styles/globals.css | 
  Select-String -Pattern 'hsl\(var\(--'

# 4. Check for hardcoded colors (should find 0)
Get-ChildItem -Path . -Recurse -Include *.tsx | 
  Select-String -Pattern 'className=.*bg-\[#[0-9a-fA-F]{3,6}\]'

# 5. Verify imports (should build without errors)
npm run build
```

---

## ✅ COMPLIANCE CHECKLIST

Before considering a Figma Make integration complete, verify:

- [ ] All imports are versionless (except react-hook-form@7.55.0)
- [ ] No `@apply` with CSS variable utilities in .css files
- [ ] Direct CSS properties used in globals.css
- [ ] All paths use root-level structure (no /src/)
- [ ] Component imports use relative paths (./components/...)
- [ ] ShadCN components imported from local /components/ui/
- [ ] Colors use semantic tokens (bg-background, not bg-white)
- [ ] Typography classes avoided unless explicitly requested
- [ ] ImageWithFallback used for new images
- [ ] Unsplash tool used for placeholder images
- [ ] TypeScript types defined (no 'any')
- [ ] Error logging includes contextual information
- [ ] Backend code uses /make-server-9ec5bbb3/ prefix
- [ ] Protected files not modified (kv_store.tsx, ImageWithFallback.tsx)
- [ ] Build completes without errors: `npm run build`

---

## 📚 RELATED DOCUMENTATION

| Document | Purpose |
|----------|---------|
| `/guidelines/IMPORT_RULES.md` | Detailed import statement rules |
| `/guidelines/CSS_RULES.md` | CSS and @apply guidelines |
| `/EXPORT_CHECKLIST.md` | Pre-export verification steps |
| `/tailwind.config.js` | Tailwind configuration reference |
| `/styles/globals.css` | Color tokens and base styles |
| `/package.json` | Approved dependencies list |

---

## 🎯 QUICK REFERENCE CARD

```
IMPORTS:   No versions (@radix-ui/react-dialog, NOT @1.1.6)
CSS:       Direct CSS (hsl(var(--background)), NOT @apply bg-background)
PATHS:     Root-level (./components/ui/button, NOT ../src/components)
COLORS:    Semantic (bg-background, NOT bg-white or bg-[#fff])
TYPES:     Comprehensive (interface Customer{...}, NOT any)
IMAGES:    ImageWithFallback or unsplash_tool
UI:        Use existing ShadCN from /components/ui/
STATE:     Zustand for global, useState for local
BACKEND:   /make-server-9ec5bbb3/ prefix, kv_store.tsx for data
LOGGING:   Contextual errors (console.error(`Context: ${error}`))
```

---

## 🚀 INTEGRATION WORKFLOW

1. **Setup:** Copy all 20 rules into Figma Make project settings
2. **Generate:** Let Figma Make generate code following rules
3. **Verify:** Run verification commands from section above
4. **Test:** `npm run build` and `npm run dev`
5. **Deploy:** Follow `/EXPORT_CHECKLIST.md` for production

---

**Last Updated:** November 2, 2025  
**Rules Version:** 1.0.0  
**Total Rules:** 20  
**Compliance Status:** ✅ Project fully compliant with all rules
