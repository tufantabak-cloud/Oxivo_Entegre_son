import { useState, useRef } from 'react';
import { Customer } from './CustomerModule';
import { BankPF } from './BankPFModule';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  onImport: (customers: Customer[]) => void;
  bankPFRecords?: BankPF[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  detailedErrors: Array<{
    row: number;
    reason: string;
    data: any;
  }>;
}

export function ExcelImport({ onImport, bankPFRecords = [] }: ExcelImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      setProgress(30);

      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      setProgress(50);

      // Excel verisini JSON'a çevir
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setProgress(70);

      // Verileri Customer formatına dönüştür
      const importedCustomers: Customer[] = [];
      const errors: string[] = [];
      const detailedErrors: Array<{
        row: number;
        reason: string;
        data: any;
      }> = [];
      const seenInFile = {
        codes: new Set<string>(),
        taxNos: new Set<string>(),
        emails: new Set<string>(),
      };
      
      let totalBankPFMatches = 0;
      let totalBankPFNotFound = 0;
      
      console.log('\n🔍 Excel İmport Başlıyor...');
      console.log(`📊 Excel'de Toplam Satır: ${jsonData.length}`);
      console.log(`📊 Toplam BankPF Kayıtları: ${bankPFRecords.length}`);

      jsonData.forEach((row: any, index: number) => {
        try {
          // Excel sütun başlıklarını normalize et (case-insensitive)
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          });

          // Banka/PF sütununu işle - virgülle ayrılmış firma ünvanlarını BankPF ID'lerine dönüştür
          const bankPFText = (normalizedRow['banka/pf'] || '').toString().trim();
          let linkedBankPFIds: string[] = [];
          let matchedBankPFRecords: any[] = []; // Eşleşen BankPF kayıtlarını sakla
          let notFoundBankPFs: string[] = [];
          
          if (bankPFText && bankPFText !== '-' && !bankPFText.includes('BİLGİ') && !bankPFText.includes('(')) {
            // Virgülle ayrılmış firma ünvanlarını ayır
            const firmaUnvanlar = bankPFText
              .split(',')
              .map((unvan: string) => unvan.trim())
              .filter((unvan: string) => unvan.length > 0);
            
            // Her firma ünvanını BankPF kayıtlarında ara
            firmaUnvanlar.forEach((unvan: string) => {
              const matchedBankPF = bankPFRecords.find(
                (record) => record.firmaUnvan.toLowerCase() === unvan.toLowerCase()
              );
              
              if (matchedBankPF) {
                linkedBankPFIds.push(matchedBankPF.id);
                matchedBankPFRecords.push(matchedBankPF);
                totalBankPFMatches++;
                console.log(`  ✅ Satır ${index + 2}: "${unvan}" eşleşti → ${matchedBankPF.firmaUnvan} (${matchedBankPF.tip})`);
              } else {
                // Kısmi eşleşme dene
                const partialMatch = bankPFRecords.find(
                  (record) => 
                    record.firmaUnvan.toLowerCase().includes(unvan.toLowerCase()) ||
                    unvan.toLowerCase().includes(record.firmaUnvan.toLowerCase())
                );
                
                if (partialMatch) {
                  linkedBankPFIds.push(partialMatch.id);
                  matchedBankPFRecords.push(partialMatch);
                  totalBankPFMatches++;
                  console.log(`  ⚠️ Satır ${index + 2}: "${unvan}" kısmi eşleşti → ${partialMatch.firmaUnvan} (${partialMatch.tip})`);
                } else {
                  notFoundBankPFs.push(unvan);
                  totalBankPFNotFound++;
                  console.warn(`  ❌ Satır ${index + 2}: "${unvan}" bulunamadı!`);
                }
              }
            });
          }
          
          // linkedBankPFIds'den bankDeviceAssignments oluştur
          // Excel'den gelen veriler otomatik olarak kategorilere eklenir (cihaz ataması boş)
          let bankDeviceAssignments: any[] = [];
          if (matchedBankPFRecords.length > 0) {
            console.log(`  🔗 Satır ${index + 2}: ${matchedBankPFRecords.length} Banka/PF kaydı için kategori oluşturuluyor...`);
            
            matchedBankPFRecords.forEach((bankPF) => {
              // Tip bilgisine göre bankId formatını belirle
              let bankId = '';
              let categoryType = '';
              
              if (bankPF.tip === 'Banka') {
                bankId = `bank-${bankPF.id}`;
                categoryType = 'Banka';
              } else if (bankPF.tip === 'EPK') {
                bankId = `ok-epk-${bankPF.id}`;
                categoryType = 'EPK';
              } else if (bankPF.tip === 'ÖK') {
                bankId = `ok-ok-${bankPF.id}`;
                categoryType = 'ÖK';
              } else {
                // Varsayılan olarak Banka tipi kullan
                bankId = `bank-${bankPF.id}`;
                categoryType = 'Banka';
              }
              
              const assignment = {
                id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                bankId: bankId,
                bankName: bankPF.firmaUnvan,
                bankCode: bankPF.kod || '',
                deviceIds: [], // Boş - kullanıcı sonra cihaz atayacak
                createdAt: new Date().toISOString(),
              };
              
              bankDeviceAssignments.push(assignment);
              console.log(`    ➕ ${categoryType} kategorisi oluşturuldu: ${bankPF.firmaUnvan} (ID: ${bankId})`);
            });
          }

          // Gerekli alanları kontrol et ve map et
          const customer: Customer = {
            id: Date.now().toString() + index,
            cariHesapKodu: (normalizedRow['cari hesap kodu'] || normalizedRow['kod'] || '').toString().trim(),
            sektor: (normalizedRow['sektör'] || normalizedRow['sektor'] || '').toString().trim(),
            mcc: (normalizedRow['mcc'] || '').toString().trim(),
            cariAdi: (normalizedRow['cari adı'] || normalizedRow['cari adi'] || normalizedRow['firma'] || '').toString().trim(),
            guncelMyPayterDomain: (normalizedRow['güncel mypayter domain'] || normalizedRow['guncel mypayter domain'] || normalizedRow['domain'] || '').toString().trim(),
            vergiDairesi: (normalizedRow['vergi dairesi'] || '').toString().trim(),
            vergiNo: (normalizedRow['vergi no'] || normalizedRow['vergi numarası'] || normalizedRow['vergi numarasi'] || '').toString().trim(),
            adres: (normalizedRow['adres'] || '').toString().trim(),
            ilce: (normalizedRow['ilçe'] || normalizedRow['ilce'] || '').toString().trim(),
            postaKodu: (normalizedRow['posta kodu'] || '').toString().trim(),
            email: (normalizedRow['email'] || normalizedRow['e-posta'] || normalizedRow['mail'] || '').toString().trim(),
            yetkili: (normalizedRow['yetkili'] || '').toString().trim(),
            tel: (normalizedRow['tel'] || normalizedRow['telefon'] || '').toString().trim(),
            durum: normalizedRow['durum'] === 'Pasif' ? 'Pasif' : 'Aktif',
            p6x: normalizedRow['p6x'] ? normalizedRow['p6x'].toString().trim() : undefined,
            apollo: normalizedRow['apollo'] ? normalizedRow['apollo'].toString().trim() : undefined,
            linkedBankPFIds: linkedBankPFIds.length > 0 ? linkedBankPFIds : undefined,
            bankDeviceAssignments: bankDeviceAssignments.length > 0 ? bankDeviceAssignments : undefined,
          };

          // Zorunlu alanları kontrol et
          if (!customer.cariAdi || !customer.cariHesapKodu) {
            let reason = 'Zorunlu alan eksik: ';
            if (!customer.cariAdi) reason += '[Cari Adı boş] ';
            if (!customer.cariHesapKodu) reason += '[Cari Hesap Kodu boş] ';
            
            const errorMsg = `Satır ${index + 2}: ${reason}`;
            errors.push(errorMsg);
            detailedErrors.push({
              row: index + 2,
              reason: reason,
              data: normalizedRow
            });
            
            console.warn(`⚠️ ${errorMsg}`);
            console.warn(`   📄 Satır İçeriği:`, normalizedRow);
            return;
          }

          // Excel içi duplicate kontrolü
          const lowerCode = customer.cariHesapKodu.toLowerCase();
          if (seenInFile.codes.has(lowerCode)) {
            const reason = `Cari Hesap Kodu tekrar ediyor: "${customer.cariHesapKodu}"`;
            const errorMsg = `Satır ${index + 2}: ${reason}`;
            errors.push(errorMsg);
            detailedErrors.push({
              row: index + 2,
              reason: reason,
              data: normalizedRow
            });
            
            console.warn(`⚠️ ${errorMsg}`);
            console.warn(`   📄 Satır İçeriği:`, normalizedRow);
            return;
          }
          seenInFile.codes.add(lowerCode);

          if (customer.vergiNo && seenInFile.taxNos.has(customer.vergiNo)) {
            const reason = `Vergi No tekrar ediyor: "${customer.vergiNo}"`;
            const errorMsg = `Satır ${index + 2}: ${reason}`;
            errors.push(errorMsg);
            detailedErrors.push({
              row: index + 2,
              reason: reason,
              data: normalizedRow
            });
            
            console.warn(`⚠️ ${errorMsg}`);
            console.warn(`   📄 Satır İçeriği:`, normalizedRow);
            return;
          }
          if (customer.vergiNo) seenInFile.taxNos.add(customer.vergiNo);

          if (customer.email && seenInFile.emails.has(customer.email.toLowerCase())) {
            const reason = `Email tekrar ediyor: "${customer.email}"`;
            const errorMsg = `Satır ${index + 2}: ${reason}`;
            errors.push(errorMsg);
            detailedErrors.push({
              row: index + 2,
              reason: reason,
              data: normalizedRow
            });
            
            console.warn(`⚠️ ${errorMsg}`);
            console.warn(`   📄 Satır İçeriği:`, normalizedRow);
            // Duplicate email - Email'i boş bırak ama kaydı ekle
            customer.email = '';
            console.warn(`   💡 Çözüm: "${customer.cariAdi}" müşterisi için duplicate email temizlendi, kayıt ekleniyor`);
          } else if (customer.email) {
            seenInFile.emails.add(customer.email.toLowerCase());
          }

          importedCustomers.push(customer);
        } catch (err) {
          const errorMsg = `Satır ${index + 2}: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`;
          errors.push(errorMsg);
          detailedErrors.push({
            row: index + 2,
            reason: err instanceof Error ? err.message : 'Bilinmeyen hata',
            data: row
          });
          console.error(`❌ ${errorMsg}`);
          console.error(`   📄 Satır İçeriği:`, row);
        }
      });

      setProgress(90);
      
      // Excel import raporu
      console.log('\n📊 Excel İmport Özeti:');
      console.log(`  📝 Excel'deki toplam satır: ${jsonData.length}`);
      console.log(`  ✅ Başarıyla import edilen: ${importedCustomers.length}`);
      console.log(`  ❌ Hata/Atlanan satır: ${errors.length}`);
      if (errors.length > 0) {
        console.log('\n⚠️ Hata Detayları:');
        errors.forEach(error => console.log(`  • ${error}`));
        
        console.log('\n🔍 DETAYLI HATA ANALİZİ (Excel\'de aramak için):');
        detailedErrors.forEach((detail, idx) => {
          console.log(`\n═══════════════════════════════════════════════════════════`);
          console.log(`HATA ${idx + 1}/${detailedErrors.length} - Excel Satır ${detail.row}`);
          console.log(`═══════════════════════════════════════════════════════════`);
          console.log(`🔴 Sorun: ${detail.reason}`);
          console.log(`\n📋 Satırdaki Veriler:`);
          console.log(`   • Cari Hesap Kodu: "${detail.data['cari hesap kodu'] || detail.data['kod'] || '(BOŞ)'}"`);
          console.log(`   • Cari Adı: "${detail.data['cari adı'] || detail.data['cari adi'] || detail.data['firma'] || '(BOŞ)'}"`);
          console.log(`   • Vergi No: "${detail.data['vergi no'] || detail.data['vergi numarası'] || '(BOŞ)'}"`);
          console.log(`   • Email: "${detail.data['email'] || detail.data['e-posta'] || detail.data['mail'] || '(BOŞ)'}"`);
          console.log(`   • Sektör: "${detail.data['sektör'] || detail.data['sektor'] || '(BOŞ)'}"`);
          console.log(`\n📄 Tüm Sütunlar:`);
          Object.keys(detail.data).forEach(key => {
            console.log(`   • ${key}: "${detail.data[key]}"`);
          });
          console.log(`\n💡 Excel'de Bulmak İçin: Excel'i açın, CTRL+F yapın ve yukarıdaki bilgilerden birini arayın`);
        });
        console.log(`\n═══════════════════════════════════════════════════════════\n`);
      }
      
      // Banka/PF eşleştirme raporu
      console.log('\n📊 Banka/PF Eşleştirme ve Kategori Oluşturma Raporu:');
      console.log(`  ✅ Başarılı eşleşme: ${totalBankPFMatches}`);
      console.log(`  ❌ Bulunamayan: ${totalBankPFNotFound}`);
      
      const customersWithBankPF = importedCustomers.filter(c => c.linkedBankPFIds && c.linkedBankPFIds.length > 0);
      const customersWithCategories = importedCustomers.filter(c => c.bankDeviceAssignments && c.bankDeviceAssignments.length > 0);
      console.log(`  📈 Banka/PF bağlantısı olan müşteri: ${customersWithBankPF.length}/${importedCustomers.length}`);
      console.log(`  🏦 Otomatik kategori oluşturulan müşteri: ${customersWithCategories.length}/${importedCustomers.length}`);
      
      // Kategori tiplerine göre dağılım
      if (customersWithCategories.length > 0) {
        const categoryStats = {
          Banka: 0,
          EPK: 0,
          ÖK: 0,
        };
        
        customersWithCategories.forEach(customer => {
          customer.bankDeviceAssignments?.forEach(assignment => {
            if (assignment.bankId.startsWith('bank-')) categoryStats.Banka++;
            else if (assignment.bankId.startsWith('ok-epk-')) categoryStats.EPK++;
            else if (assignment.bankId.startsWith('ok-ok-')) categoryStats.ÖK++;
          });
        });
        
        console.log('  📊 Kategori Dağılımı:');
        console.log(`    🏦 Banka: ${categoryStats.Banka}`);
        console.log(`    💳 EPK: ${categoryStats.EPK}`);
        console.log(`    🔷 ÖK: ${categoryStats.ÖK}`);
      }

      // Sonuçları kaydet - onImport fonksiyonu kendi duplicate kontrolünü de yapacak
      if (importedCustomers.length > 0) {
        onImport(importedCustomers);
        
        // Başarılı import sonrası bilgilendirme
        if (totalBankPFMatches > 0) {
          setTimeout(() => {
            toast.success(
              `🔗 Banka/PF İşlemi Tamamlandı:\n✅ ${totalBankPFMatches} eşleşme bulundu\n🏦 ${customersWithCategories.length} müşteri için kategori oluşturuldu\n${totalBankPFNotFound > 0 ? `⚠️ ${totalBankPFNotFound} firma bulunamadı` : ''}`,
              { duration: 7000 }
            );
          }, 1000);
        }
      }

      // Sonuç raporunu güncelle
      const totalErrors = errors.length;
      setResult({
        success: importedCustomers.length,
        failed: totalErrors,
        errors: errors.slice(0, 20), // İlk 20 hatayı göster
        detailedErrors: detailedErrors
      });

      setProgress(100);
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: [`Dosya okuma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        detailedErrors: []
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setProgress(0);
    setResult(null);
    setIsProcessing(false);
  };

  const downloadTemplate = () => {
    // Örnek Excel şablonu oluştur - CustomerList Excel Export ile aynı sırada
    const template = [
      {
        'Cari Hesap Kodu': '120.01.001',
        'SEKTÖR': 'Teknoloji',
        'MCC': '5411',
        'Cari Adı': 'ABC Teknoloji A.Ş.',
        'Güncel Mypayter Domain': 'abc-teknoloji.mypayter.com',
        'Cihaz Adedi': '(BİLGİ - Domain eşleştirme ile otomatik hesaplanır)',
        'Banka/PF': 'Türkiye İş Bankası A.Ş., Garanti BBVA',
        'Yetkili': 'Ahmet Yılmaz',
        'Tel': '0532 111 2233',
        'Email': 'ahmet@abcteknoloji.com',
        'Vergi Dairesi': 'Maslak',
        'Vergi No': '1234567890',
        'Adres': 'Maslak Mahallesi, Büyükdere Cad. No:123',
        'İlçe': 'Sarıyer',
        'Posta Kodu': '34398',
        'P6X': 'P6X001',
        'APOLLO': 'APOLLO001',
        'Durum': 'Aktif',
      },
      {
        'Cari Hesap Kodu': '120.01.002',
        'SEKTÖR': 'İnşaat',
        'MCC': '1520',
        'Cari Adı': 'XYZ İnşaat Ltd. Şti.',
        'Güncel Mypayter Domain': 'xyz-insaat.mypayter.com',
        'Cihaz Adedi': '(BİLGİ - Domain eşleştirme ile otomatik hesaplanır)',
        'Banka/PF': 'Akbank T.A.Ş.',
        'Yetkili': 'Ayşe Demir',
        'Tel': '0533 444 5566',
        'Email': 'ayse@xyzinsaat.com',
        'Vergi Dairesi': 'Çankaya',
        'Vergi No': '0987654321',
        'Adres': 'Kızılay Mahallesi, Atatürk Bulvarı No:45',
        'İlçe': 'Çankaya',
        'Posta Kodu': '06420',
        'P6X': '',
        'APOLLO': 'APOLLO002',
        'Durum': 'Pasif',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Müşteriler');
    
    // Sütun genişliklerini ayarla - CustomerList Export ile aynı sıralama
    ws['!cols'] = [
      { wch: 18 }, // Cari Hesap Kodu
      { wch: 15 }, // SEKTÖR
      { wch: 8 },  // MCC
      { wch: 25 }, // Cari Adı
      { wch: 30 }, // Güncel Mypayter Domain
      { wch: 45 }, // Cihaz Adedi (Bilgi)
      { wch: 45 }, // Banka/PF (Bilgi)
      { wch: 20 }, // Yetkili
      { wch: 15 }, // Tel
      { wch: 25 }, // Email
      { wch: 15 }, // Vergi Dairesi
      { wch: 12 }, // Vergi No
      { wch: 40 }, // Adres
      { wch: 15 }, // İlçe
      { wch: 12 }, // Posta Kodu
      { wch: 10 }, // P6X
      { wch: 10 }, // APOLLO
      { wch: 10 }, // Durum
    ];

    XLSX.writeFile(wb, 'musteri-cari-listesi-sablon.xlsx');
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center space-x-2"
      >
        <Upload size={18} />
        <span>Excel'den Yükle</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Excel'den Müşteri Listesi Yükle</DialogTitle>
            <DialogDescription>
              Müşteri cari kartlarını Excel dosyasından toplu olarak yükleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Download */}
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Örnek Excel şablonunu indirmek için aşağıdaki butona tıklayın.
                <Button
                  variant="link"
                  onClick={downloadTemplate}
                  className="h-auto p-0 ml-2"
                >
                  Şablonu İndir
                </Button>
              </AlertDescription>
            </Alert>

            {/* Excel Format Info */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Excel Formatı (Sütun Başlıkları):</strong>
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li><strong>Cari Hesap Kodu</strong> (Zorunlu)</li>
                <li><strong>SEKTÖR</strong></li>
                <li><strong>MCC</strong></li>
                <li><strong>Cari Adı</strong> (Zorunlu)</li>
                <li><strong>Güncel Mypayter Domain</strong></li>
                <li><strong>Cihaz Adedi</strong> (BİLGİ - Sistem tarafından hesaplanır)</li>
                <li><strong>Banka/PF</strong> (BİLGİ - Sistem tarafından hesaplanır)</li>
                <li><strong>Yetkili</strong></li>
                <li><strong>Tel</strong></li>
                <li><strong>Email</strong></li>
                <li><strong>Vergi Dairesi</strong></li>
                <li><strong>Vergi No</strong></li>
                <li><strong>Adres</strong></li>
                <li><strong>İlçe</strong></li>
                <li><strong>Posta Kodu</strong></li>
                <li><strong>P6X</strong></li>
                <li><strong>APOLLO</strong></li>
                <li><strong>Durum</strong> (Aktif veya Pasif - Varsayılan: Aktif)</li>
              </ul>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="excel-upload"
                className={`cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="mb-2">
                  Excel dosyasını sürükleyin veya tıklayarak seçin
                </p>
                <p className="text-sm text-gray-500">
                  Desteklenen formatlar: .xlsx, .xls
                </p>
              </label>
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-600">
                  İşleniyor... {progress}%
                </p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-3">
                {/* Summary Alert */}
                <Alert className={result.failed > 0 ? "bg-yellow-50 border-yellow-300" : "bg-green-50 border-green-200"}>
                  {result.failed > 0 ? <AlertCircle className="h-4 w-4 text-yellow-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                  <AlertDescription className={result.failed > 0 ? "text-yellow-800" : "text-green-800"}>
                    <div className="space-y-1">
                      <div><strong>İmport Özeti:</strong></div>
                      <div>✅ Başarılı: {result.success} kayıt</div>
                      {result.failed > 0 && <div>⚠️ Hata/Atlanan: {result.failed} satır</div>}
                      {result.failed > 0 && (
                        <div className="text-sm mt-2 text-yellow-700">
                          ⚠️ Excel dosyanızdaki toplam {result.success + result.failed} satırdan {result.failed} tanesi hata nedeniyle atlandı. 
                          Lütfen aşağıdaki hata listesini kontrol ederek Excel'i düzeltin.
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {result.failed > 0 && (
                  <>
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Hata Detayları ({result.failed} satır):</strong>
                        <ul className="mt-2 ml-4 list-disc text-sm max-h-60 overflow-y-auto">
                          {result.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {result.failed > 20 && (
                            <li className="text-gray-500">
                              ... ve {result.failed - 20} hata daha (Konsola bakınız)
                            </li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Detaylı Hata Analizi - Excel'de aramak için */}
                    {result.detailedErrors && result.detailedErrors.length > 0 && (
                      <Alert className="bg-amber-50 border-amber-300">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-900">
                          <strong className="block mb-2">🔍 Problemli Satırları Excel'de Bulmak İçin:</strong>
                          <div className="space-y-3 text-sm max-h-96 overflow-y-auto">
                            {result.detailedErrors.map((detail, idx) => (
                              <div key={idx} className="border border-amber-200 bg-white p-3 rounded">
                                <div className="mb-2">
                                  <strong className="text-red-600">Hata {idx + 1}/{result.detailedErrors.length} - Excel Satır {detail.row}</strong>
                                </div>
                                <div className="mb-2 text-red-700">
                                  🔴 <strong>Sorun:</strong> {detail.reason}
                                </div>
                                <div className="mb-2">
                                  <strong>📋 Bu satırdaki veriler:</strong>
                                </div>
                                <ul className="ml-4 space-y-1 text-xs">
                                  <li><strong>Cari Hesap Kodu:</strong> <code className="bg-gray-100 px-1">{detail.data['cari hesap kodu'] || detail.data['kod'] || '(BOŞ)'}</code></li>
                                  <li><strong>Cari Adı:</strong> <code className="bg-gray-100 px-1">{detail.data['cari adı'] || detail.data['cari adi'] || detail.data['firma'] || '(BOŞ)'}</code></li>
                                  <li><strong>Vergi No:</strong> <code className="bg-gray-100 px-1">{detail.data['vergi no'] || detail.data['vergi numarası'] || '(BOŞ)'}</code></li>
                                  <li><strong>Email:</strong> <code className="bg-gray-100 px-1">{detail.data['email'] || detail.data['e-posta'] || detail.data['mail'] || '(BOŞ)'}</code></li>
                                  <li><strong>Sektör:</strong> <code className="bg-gray-100 px-1">{detail.data['sektör'] || detail.data['sektor'] || '(BOŞ)'}</code></li>
                                </ul>
                                <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                                  💡 <strong>Excel'de bulmak için:</strong> Excel'i açın, <kbd className="bg-white border px-1">Ctrl+F</kbd> tuşlarına basın ve yukarıdaki değerlerden birini arayın (örn: Cari Adı veya Cari Hesap Kodu)
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 text-xs text-amber-700 bg-amber-100 p-2 rounded">
                            📊 <strong>Konsol'da daha fazla detay:</strong> Tarayıcı konsolunu açın (F12) ve "DETAYLI HATA ANALİZİ" bölümünü inceleyin. Orada tüm sütunları görebilirsiniz.
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {result.success === 0 && result.failed > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Hiçbir kayıt yüklenemedi. Lütfen Excel formatını kontrol edin.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
