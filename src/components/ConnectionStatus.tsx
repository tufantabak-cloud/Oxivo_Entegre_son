/**
 * Connection Status Indicator
 * 
 * Kullanıcıya bağlantı durumunu gösterir.
 * Offline olduğunda uyarı verir.
 * 
 * Created: 2025-01-12
 */

import { useConnection } from '../utils/connectionManager';
import { Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useEffect, useState } from 'react';

export function ConnectionStatus() {
  const { isOnline, consecutiveFailures } = useConnection();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Show alert if offline or multiple failures
    if (!isOnline || consecutiveFailures >= 2) {
      setShowAlert(true);
    } else if (showAlert) {
      // Auto-hide after going online
      const timer = window.setTimeout(() => setShowAlert(false), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [isOnline, consecutiveFailures, showAlert]);

  // Don't show if online and no failures
  if (isOnline && consecutiveFailures === 0 && !showAlert) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {!isOnline ? (
        <Alert className="bg-red-50 border-red-200">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>İnternet bağlantısı yok</strong>
            <p className="text-sm mt-1">
              Lütfen internet bağlantınızı kontrol edin
            </p>
          </AlertDescription>
        </Alert>
      ) : consecutiveFailures >= 2 ? (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Wifi className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Bağlantı sorunları yaşanıyor</strong>
            <p className="text-sm mt-1">
              {consecutiveFailures} başarısız deneme. Otomatik yeniden deneniyor...
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Bağlantı yeniden kuruldu</strong>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Compact Connection Indicator (for header/footer)
 */
export function ConnectionIndicator() {
  const { isOnline } = useConnection();

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <div className="flex items-center gap-1 text-green-600 text-xs">
          <Wifi size={14} />
          <span>Çevrimiçi</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600 text-xs">
          <WifiOff size={14} />
          <span>Çevrimdışı</span>
        </div>
      )}
    </div>
  );
}
