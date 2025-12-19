import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface FullListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: Array<{
    id?: string; // ✅ ADD: Optional unique ID
    label: string;
    value: string | number;
    badge?: string;
    icon?: React.ReactNode;
    className?: string;
  }>;
}

export function FullListModal({ isOpen, onClose, title, items }: FullListModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] w-[95vw] sm:w-full">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-left pr-8">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {title} için detaylı liste görünümü
          </DialogDescription>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Kapat</span>
          </Button>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
          <div className="space-y-2 pb-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Gösterilecek veri bulunamadı
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id || `item-${index}`} // ✅ FIX: Use unique ID or fallback to index
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  {/* Sol: Sıra numarası */}
                  <div className="flex items-center justify-center w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                    <span className="text-sm">{index + 1}</span>
                  </div>
                  
                  {/* Orta: Icon + Label */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.icon && (
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                    )}
                    <span className="truncate" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                  
                  {/* Sağ: Value + Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="whitespace-nowrap">
                      {item.value}
                    </span>
                    {item.badge && (
                      <Badge 
                        variant="outline" 
                        className={`whitespace-nowrap ${item.className || ''}`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}