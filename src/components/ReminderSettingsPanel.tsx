import { useState } from 'react';
import { Customer, ReminderSettings } from './CustomerModule';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Bell, Settings, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { Badge } from './ui/badge';

interface ReminderSettingsPanelProps {
  customer: Customer;
  onUpdate: (customer: Customer) => void;
}

export function ReminderSettingsPanel({ customer, onUpdate }: ReminderSettingsPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const currentSettings: ReminderSettings = customer.serviceFeeSettings?.reminderSettings || {
    day3Enabled: true,
    day5Enabled: true,
    day10AutoSuspend: true,
    customMessage: ''
  };

  const [settings, setSettings] = useState<ReminderSettings>(currentSettings);

  const handleSave = () => {
    if (!customer.serviceFeeSettings) {
      toast.error('Müşteri aidat ayarları bulunamadı');
      return;
    }

    const updatedCustomer: Customer = {
      ...customer,
      serviceFeeSettings: {
        ...customer.serviceFeeSettings,
        reminderSettings: settings
      }
    };

    onUpdate(updatedCustomer);
    toast.success('✅ Hatırlatma ayarları kaydedildi');
    setDialogOpen(false);
  };

  const handleReset = () => {
    setSettings(currentSettings);
    setDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <Settings size={16} />
        <span>Hatırlatma Ayarları</span>
        {(!currentSettings.day3Enabled || !currentSettings.day5Enabled) && (
          <Badge variant="outline" className="ml-1 bg-yellow-50 text-yellow-700">
            Değiştirilmiş
          </Badge>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell size={20} />
              Hatırlatma Ayarları - {customer.cariAdi}
            </DialogTitle>
            <DialogDescription>
              Müşteriye gönderilecek ödeme hatırlatmalarını ve otomatik dondurma kurallarını yönetin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 3. Gün Hatırlatma */}
            <Card className={settings.day3Enabled ? 'border-green-300 bg-green-50' : 'border-gray-200'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">3. Gün Hatırlatması</CardTitle>
                  <Switch
                    checked={settings.day3Enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, day3Enabled: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {settings.day3Enabled ? (
                    <span className="text-green-700">
                      ✓ Ödeme vadesi 3 gün kala müşteriye otomatik hatırlatma gönderilecek
                    </span>
                  ) : (
                    <span className="text-red-700">
                      ✗ 3. gün hatırlatması devre dışı - sistem bu hatırlatmayı es geçecek
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* 5. Gün Hatırlatma */}
            <Card className={settings.day5Enabled ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">5. Gün Hatırlatması</CardTitle>
                  <Switch
                    checked={settings.day5Enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, day5Enabled: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {settings.day5Enabled ? (
                    <span className="text-orange-700">
                      ✓ Ödeme vadesi 5 gün geçince müşteriye uyarı hatırlatması gönderilecek
                    </span>
                  ) : (
                    <span className="text-red-700">
                      ✗ 5. gün hatırlatması devre dışı - sistem bu hatırlatmayı es geçecek
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* 10. Gün Otomatik Dondurma */}
            <Card className={settings.day10AutoSuspend ? 'border-red-300 bg-red-50' : 'border-gray-200'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">10. Gün Otomatik Dondurma</CardTitle>
                  <Switch
                    checked={settings.day10AutoSuspend}
                    onCheckedChange={(checked) => setSettings({ ...settings, day10AutoSuspend: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {settings.day10AutoSuspend ? (
                    <span className="text-red-700">
                      ⚠️ Ödeme vadesi 10 gün geçince müşteri hizmeti otomatik olarak dondurulacak
                    </span>
                  ) : (
                    <span className="text-gray-700">
                      ℹ️ 10. günde otomatik dondurma yapılmayacak - manuel işlem gerekir
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Özel Hatırlatma Mesajı */}
            <div className="space-y-2">
              <Label htmlFor="customMessage">
                Özel Hatırlatma Mesajı (Opsiyonel)
              </Label>
              <Textarea
                id="customMessage"
                placeholder="Örn: Sayın müşterimiz, aylık aidat bedeliniz için ödeme beklenmektedir..."
                value={settings.customMessage || ''}
                onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Boş bırakırsanız varsayılan mesaj kullanılacaktır
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>
              <X size={16} className="mr-2" />
              İptal
            </Button>
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}