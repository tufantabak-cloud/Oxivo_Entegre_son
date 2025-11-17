/**
 * 📚 DROPDOWN COMPONENT GUIDE
 * All dropdown patterns with universal fix applied
 * Use this as reference when implementing dropdowns
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";

export function DropdownComponentGuide() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl">Dropdown Component Library</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Universal dropdown fix applied - No bottom gaps, clipping, or scroll issues
        </p>
      </div>

      <Tabs defaultValue="column-visibility" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="column-visibility">Column Visibility</TabsTrigger>
          <TabsTrigger value="multi-select">Multi-Select Filter</TabsTrigger>
          <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
        </TabsList>

        {/* Column Visibility Tab */}
        <TabsContent value="column-visibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ColumnVisibilityDropdown
                <Badge variant="default">Primary</Badge>
              </CardTitle>
              <CardDescription>
                Full-featured column visibility with localStorage persistence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <code className="text-sm">
                  <pre className="whitespace-pre-wrap text-xs">
{`import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown';

// Define columns
const columns = [
  { key: 'name', label: 'İsim', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'phone', label: 'Telefon', defaultVisible: false },
];

// Usage
<ColumnVisibilityDropdown
  columns={columns}
  storageKey="customer-table"
  onVisibilityChange={(visibility) => {
    console.log('Visibility changed:', visibility);
  }}
/>`}
                  </pre>
                </code>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>✅ LocalStorage persistence</li>
                  <li>✅ Default visibility settings</li>
                  <li>✅ Visible count badge</li>
                  <li>✅ Select All / Deselect All buttons</li>
                  <li>✅ ScrollArea for long lists</li>
                  <li>✅ Dark mode support</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                SimpleColumnVisibility
                <Badge variant="outline">Lightweight</Badge>
              </CardTitle>
              <CardDescription>
                Controlled component without localStorage - perfect for simple use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <code className="text-sm">
                  <pre className="whitespace-pre-wrap text-xs">
{`import SimpleColumnVisibility, { Column } from './SimpleColumnVisibility';

// State management
const [columns, setColumns] = useState<Column[]>([
  { id: 'name', title: 'İsim', visible: true },
  { id: 'age', title: 'Yaş', visible: true },
  { id: 'city', title: 'Şehir', visible: false },
]);

// Usage
<SimpleColumnVisibility
  columns={columns}
  onToggle={(id) => {
    setColumns(prev => prev.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    ));
  }}
  onSelectAll={() => {
    setColumns(prev => prev.map(col => ({ ...col, visible: true })));
  }}
  onDeselectAll={() => {
    setColumns(prev => prev.map(col => ({ ...col, visible: false })));
  }}
  buttonText="Sütunlar"
/>`}
                  </pre>
                </code>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>✅ Pure controlled component</li>
                  <li>✅ No localStorage dependency</li>
                  <li>✅ Customizable button text</li>
                  <li>✅ Visible count badge</li>
                  <li>✅ Smaller bundle size</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Select Filter Tab */}
        <TabsContent value="multi-select" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                DropdownFilter
                <Badge variant="default">Universal</Badge>
              </CardTitle>
              <CardDescription>
                Multi-select dropdown filter for any use case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <code className="text-sm">
                  <pre className="whitespace-pre-wrap text-xs">
{`import { DropdownFilter } from './ui/DropdownFilter';

const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

<DropdownFilter
  label="Durum Filtresi"
  placeholder="Durum seçiniz"
  options={['Aktif', 'Pasif', 'Beklemede', 'İptal']}
  selected={selectedStatuses}
  onChange={setSelectedStatuses}
  maxHeight="max-h-80"
  darkMode={false}
/>`}
                  </pre>
                </code>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>✅ Multi-select checkboxes</li>
                  <li>✅ Customizable max height</li>
                  <li>✅ Dark mode toggle</li>
                  <li>✅ Custom placeholder</li>
                  <li>✅ Selected count display</li>
                  <li>✅ Click outside to close</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Practices Tab */}
        <TabsContent value="best-practices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Universal Dropdown Fix Applied</CardTitle>
              <CardDescription>
                All components use the global dropdown fix from globals.css
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">✅ Problems Solved:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="font-medium text-sm text-green-900 dark:text-green-300">
                      ✓ Bottom Gap Fixed
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      No more empty space at dropdown bottom
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="font-medium text-sm text-green-900 dark:text-green-300">
                      ✓ Clipping Resolved
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      Content never gets cut off
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="font-medium text-sm text-green-900 dark:text-green-300">
                      ✓ Scroll Perfect
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      Smooth scrolling with custom scrollbar
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="font-medium text-sm text-green-900 dark:text-green-300">
                      ✓ Z-Index Managed
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      Always renders on top (z-9999)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <h4 className="font-medium">🎨 Styling Guidelines:</h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <strong>1. Always use dropdown-panel class:</strong>
                  </p>
                  <code className="text-xs block bg-white dark:bg-gray-800 p-2 rounded">
                    className="dropdown-panel max-h-[70vh]"
                  </code>

                  <p className="text-sm mt-3">
                    <strong>2. For Radix Popover/Select:</strong>
                  </p>
                  <code className="text-xs block bg-white dark:bg-gray-800 p-2 rounded">
                    {`<PopoverContent className="dropdown-panel" />`}
                  </code>

                  <p className="text-sm mt-3">
                    <strong>3. Use ScrollArea for long lists:</strong>
                  </p>
                  <code className="text-xs block bg-white dark:bg-gray-800 p-2 rounded">
                    {`<ScrollArea className="max-h-[280px]">`}
                  </code>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <h4 className="font-medium">⚠️ Common Mistakes to Avoid:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>❌ Don't use inline maxHeight in style prop</li>
                  <li>❌ Don't add overflow-hidden to parent containers</li>
                  <li>❌ Don't override mask-image or overflow-clip-margin</li>
                  <li>❌ Don't use custom z-index lower than 9999</li>
                  <li>✅ Use Tailwind classes: max-h-[280px], max-h-[70vh]</li>
                  <li>✅ Let dropdown-panel handle overflow automatically</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DropdownComponentGuide;
