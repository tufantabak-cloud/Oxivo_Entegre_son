import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import jsPDF from 'jspdf';

interface DetailPopoverProps {
  title: string;
  count?: number;
  percentage?: string;
  items: Array<{ 
    id?: string; 
    name?: string; 
    title?: string; 
    subtitle?: string; 
    value?: string | number 
  }>;
  children: React.ReactNode;
  itemLabel?: string; // "müşteriler", "kayıtlar", "sektörler" gibi
}

export function DetailPopover({ title, count, percentage, items, children, itemLabel = 'kayıt' }: DetailPopoverProps) {
  // Count otomatik hesapla eğer verilmemişse
  const actualCount = count !== undefined ? count : items.length;
  const [open, setOpen] = useState(false);

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // PDF başlık
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, 20);
      
      // Özet bilgi kutusu
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const summary = `Toplam: ${actualCount} ${itemLabel}`;
      doc.text(summary, 20, 32);
      
      if (percentage) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(percentage, 20, 39);
        doc.setTextColor(0, 0, 0);
      }
      
      // Tarih
      const now = new Date().toLocaleString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Rapor Tarihi: ${now}`, 20, 46);
      doc.setTextColor(0, 0, 0);
      
      // Çizgi
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 50, 190, 50);
      
      // Liste başlığı
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detaylı Liste:', 20, 58);
      
      // Liste içeriği
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      let y = 68;
      
      items.forEach((item, index) => {
        // Sayfa sonu kontrolü
        if (y > 270) {
          doc.addPage();
          y = 20;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Detaylı Liste (devam):', 20, y);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          y += 10;
        }
        
        // Sıra numarası
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}.`, 22, y);
        
        // Ana başlık (name veya title)
        doc.setFont('helvetica', 'normal');
        const maxWidth = 165;
        const itemName = item.name || item.title || '-';
        const nameText = doc.splitTextToSize(itemName, maxWidth);
        doc.text(nameText, 30, y);
        
        const nameHeight = nameText.length * 5;
        y += nameHeight;
        
        // Alt başlık
        if (item.subtitle) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const subtitleText = doc.splitTextToSize(item.subtitle, maxWidth);
          doc.text(subtitleText, 32, y);
          const subtitleHeight = subtitleText.length * 4;
          y += subtitleHeight;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
        }
        
        // Değer bilgisi
        if (item.value !== undefined && item.value !== null && item.value !== '') {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 100, 200);
          doc.text(`${item.value}`, 32, y);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          y += 5;
        }
        
        y += 3; // Satırlar arası boşluk
      });
      
      // PDF'i indir
      const fileName = `${title.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '_').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success(`PDF başarıyla indirildi!`);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken bir hata oluştu');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="inline-block outline-none focus:outline-none focus-visible:outline-none" style={{ cursor: 'pointer' }}>
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        className="dropdown-panel w-[480px] p-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gray-700 shadow-2xl rounded-xl overflow-hidden" 
        align="start"
        side="bottom"
        sideOffset={8}
      >
        {/* Premium Header - Siyah Zemin */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 border-b border-blue-400/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base tracking-tight">
                {title}
              </h3>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-semibold">
                    {actualCount} {itemLabel}
                  </span>
                </div>
                {percentage && (
                  <span className="text-blue-100 text-xs font-medium">
                    {percentage}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPDF}
              className="gap-2 h-9 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all shadow-lg hover:shadow-xl backdrop-blur-sm"
              title="PDF olarak indir"
            >
              <FileDown size={16} />
              <span className="text-xs font-semibold">PDF İndir</span>
            </Button>
          </div>
        </div>

        {/* Minimal Liste - Düz Scroll */}
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="p-3">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium">Kayıt bulunamadı</p>
              </div>
            ) : (
              <div className="space-y-0">
                {items.map((item, index) => (
                  <div 
                    key={item.id ? `${item.id}-${index}` : `item-${index}`} 
                    className="px-3 py-2 hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Basit numara */}
                      <span className="text-xs text-gray-500 font-medium w-6 flex-shrink-0">
                        {index + 1}.
                      </span>
                      
                      {/* Tek satırda tüm bilgiler */}
                      <div className="flex-1 min-w-0 flex items-center gap-2 text-xs">
                        <span className="text-gray-200 truncate">
                          {item.name || item.title || '-'}
                        </span>
                        {item.subtitle && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 truncate">
                              {item.subtitle}
                            </span>
                          </>
                        )}
                        {item.value !== undefined && item.value !== null && item.value !== '' && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-blue-400 flex-shrink-0">
                              {item.value}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
