import { useState } from 'react';
import { Customer, ServiceFeeInvoice } from './CustomerModule';
import { Button } from './ui/button';
import { CheckCircle, X, AlertCircle, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface DeviceForApproval {
  customerId: string;
  customerName: string;
  deviceId: string;
  deviceSerial: string;
  monthlyFee: number;
  invoiceId?: string;
  currentInvoice?: ServiceFeeInvoice;
}

interface BatchApprovalConfirmationProps {
  devices: DeviceForApproval[];
  selectedPeriod: string;
  onApprove: (approvedDevices: DeviceForApproval[], createInvoice: boolean) => void;
  onCancel: () => void;
}

export function BatchApprovalConfirmation({
  devices,
  selectedPeriod,
  onApprove,
  onCancel
}: BatchApprovalConfirmationProps) {
  const [createInvoice, setCreateInvoice] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalAmount = devices.reduce((sum, d) => sum + d.monthlyFee, 0);
  const uniqueCustomers = new Set(devices.map(d => d.customerId)).size;

  const handleConfirm = async () => {
    setProcessing(true);
    setProgress(0);

    // Simüle edilmiş işlem süreci (gerçek uygulamada API çağrıları olacak)
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setProgress(i);
    }

    onApprove(devices, createInvoice);
    setProcessing(false);
  };

  // Faturası olan ve olmayan cihazları ayır
  const devicesWithInvoice = devices.filter(d => d.currentInvoice);
  const devicesWithoutInvoice = devices.filter(d => !d.currentInvoice);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Toplu Ödeme Onayı
          </DialogTitle>
          <DialogDescription>
            Seçili {devices.length} cihaz için ödeme onayı yapılacak
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Özet Bilgiler */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Toplam Cihaz</p>
              <p className="text-2xl text-blue-600">{devices.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Müşteri Sayısı</p>
              <p className="text-2xl text-green-600">{uniqueCustomers}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Toplam Tutar</p>
              <p className="text-2xl text-purple-600">{totalAmount.toFixed(2)} €</p>
            </div>
          </div>

          {/* Uyarılar */}
          {devicesWithoutInvoice.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{devicesWithoutInvoice.length} cihaz</strong> için bu dönem faturası bulunmuyor.
                {createInvoice ? (
                  <span className="text-green-700"> Otomatik olarak fatura oluşturulacak.</span>
                ) : (
                  <span className="text-orange-700"> Fatura oluşturulmadan sadece ödeme durumu güncellenecek.</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Fatura Oluşturma Seçeneği */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
            <Checkbox
              id="createInvoice"
              checked={createInvoice}
              onCheckedChange={(checked) => setCreateInvoice(checked as boolean)}
              disabled={processing}
            />
            <div className="flex-1">
              <Label htmlFor="createInvoice" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>Fatura Kayıtlarına Ekle</span>
                </div>
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                {createInvoice ? (
                  <span>
                    ✓ Onaylanan ödemeler için fatura kayıtları oluşturulacak ve Fatura Kayıtları sayfasına eklenecek
                  </span>
                ) : (
                  <span>
                    Sadece ödeme durumu güncellenecek, fatura kaydı oluşturulmayacak
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Müşteri Listesi */}
          <div className="border rounded-lg" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="bg-gray-50 px-4 py-2 border-b sticky top-0">
              <p className="text-sm">Onaylanacak Cihazlar</p>
            </div>
            <div className="divide-y">
              {devices.map((device, idx) => (
                <div key={idx} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm">{device.customerName}</p>
                      <p className="text-xs text-gray-500">
                        {device.deviceSerial}
                        {device.currentInvoice && (
                          <Badge variant="outline" className="ml-2 text-xs bg-blue-50">
                            Fatura: {device.currentInvoice.invoiceNumber}
                          </Badge>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-green-600">{device.monthlyFee.toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* İşlem İlerleme */}
          {processing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">İşleniyor...</span>
                <span className="text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Senkronizasyon Bilgisi */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Senkronizasyon:</strong> Bu işlem tüm sistemi güncelleyecektir:
              <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                <li>Müşteri Cari Kartlarındaki ödeme durumları</li>
                {createInvoice && <li>Fatura Kayıtları sayfasına yeni kayıtlar</li>}
                <li>Gelir modülü istatistikleri</li>
                <li>Banka/PF ilişkilendirme raporları</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            <X size={16} className="mr-2" />
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={processing}>
            <CheckCircle size={16} className="mr-2" />
            {processing ? 'İşleniyor...' : `${devices.length} Ödemeyi Onayla`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
