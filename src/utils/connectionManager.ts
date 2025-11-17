/**
 * Connection Manager - Bağlantı Dayanıklılık Sistemi
 * 
 * Tüm network hatalarını yakalar ve otomatik retry yapar.
 * Offline/online durumunu izler ve kullanıcıyı bilgilendirir.
 * 
 * Created: 2025-01-12
 */

import { retry, retryPresets } from './retry';
import { toast } from 'sonner@2.0.3';

interface ConnectionState {
  isOnline: boolean;
  lastCheck: number;
  consecutiveFailures: number;
}

class ConnectionManager {
  private state: ConnectionState = {
    isOnline: navigator.onLine,
    lastCheck: Date.now(),
    consecutiveFailures: 0,
  };

  private checkInterval: number | null = null;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.setupListeners();
    this.startMonitoring();
  }

  /**
   * Setup browser online/offline listeners
   */
  private setupListeners() {
    window.addEventListener('online', () => {
      console.log('🟢 Network: ONLINE');
      this.updateState(true);
      toast.success('İnternet bağlantısı geri geldi', {
        duration: 3000,
      });
    });

    window.addEventListener('offline', () => {
      console.log('🔴 Network: OFFLINE');
      this.updateState(false);
      toast.error('İnternet bağlantısı yok', {
        duration: 5000,
        description: 'Lütfen internet bağlantınızı kontrol edin',
      });
    });
  }

  /**
   * Start periodic connection monitoring
   */
  private startMonitoring() {
    // Check connection every 30 seconds
    this.checkInterval = window.setInterval(() => {
      this.checkConnection();
    }, 30000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check connection with ping
   */
  private async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      const isOnline = response.ok;
      this.updateState(isOnline);
      return isOnline;
    } catch {
      this.updateState(false);
      return false;
    }
  }

  /**
   * Update connection state
   */
  private updateState(isOnline: boolean) {
    const wasOnline = this.state.isOnline;
    this.state.isOnline = isOnline;
    this.state.lastCheck = Date.now();

    if (isOnline) {
      this.state.consecutiveFailures = 0;
    } else {
      this.state.consecutiveFailures++;
    }

    // Notify listeners if state changed
    if (wasOnline !== isOnline) {
      this.notifyListeners(isOnline);
    }
  }

  /**
   * Add state change listener
   */
  addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(callback => callback(isOnline));
  }

  /**
   * Get current state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Wait until online
   */
  async waitUntilOnline(timeoutMs = 30000): Promise<boolean> {
    if (this.isOnline()) return true;

    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const cleanup = this.addListener((isOnline) => {
        if (isOnline) {
          window.clearTimeout(timeout);
          cleanup();
          resolve(true);
        }
      });
    });
  }

  /**
   * Execute with connection check
   */
  async executeWithCheck<T>(
    fn: () => Promise<T>,
    options: {
      showErrorToast?: boolean;
      retryCount?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<T> {
    const {
      showErrorToast = true,
      retryCount = 3,
      timeoutMs = 15000,
    } = options;

    // Check if online first
    if (!this.isOnline()) {
      const message = 'İnternet bağlantısı yok';
      if (showErrorToast) {
        toast.error(message, {
          description: 'Lütfen bağlantınızı kontrol edin',
        });
      }
      throw new Error(message);
    }

    try {
      // Execute with retry and timeout
      const result = await retry(fn, {
        ...retryPresets.network,
        maxAttempts: retryCount,
        timeout: timeoutMs,
        onRetry: (attempt, error) => {
          console.log(`🔄 Retry ${attempt}/${retryCount}: ${error.message}`);
          
          if (attempt === 1 && showErrorToast) {
            toast.loading('Bağlantı kuruluyor...', {
              id: 'connection-retry',
              duration: 3000,
            });
          }
        },
      });

      // Success - dismiss loading toast
      toast.dismiss('connection-retry');
      this.state.consecutiveFailures = 0;

      return result;
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      
      this.state.consecutiveFailures++;

      // Show error toast
      if (showErrorToast) {
        toast.dismiss('connection-retry');
        
        const isNetworkError = 
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('Failed to fetch');

        if (isNetworkError) {
          toast.error('Bağlantı hatası', {
            description: 'Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin',
            duration: 5000,
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                window.location.reload();
              },
            },
          });
        } else {
          toast.error('İşlem başarısız', {
            description: error.message || 'Bir hata oluştu',
            duration: 4000,
          });
        }
      }

      throw error;
    }
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();

/**
 * React hook for connection state
 */
import { useState, useEffect } from 'react';

export function useConnection() {
  const [isOnline, setIsOnline] = useState(connectionManager.isOnline());
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  useEffect(() => {
    const unsubscribe = connectionManager.addListener((online) => {
      setIsOnline(online);
      const state = connectionManager.getState();
      setConsecutiveFailures(state.consecutiveFailures);
    });

    return unsubscribe;
  }, []);

  return {
    isOnline,
    consecutiveFailures,
    waitUntilOnline: connectionManager.waitUntilOnline.bind(connectionManager),
    executeWithCheck: connectionManager.executeWithCheck.bind(connectionManager),
  };
}

export default connectionManager;
