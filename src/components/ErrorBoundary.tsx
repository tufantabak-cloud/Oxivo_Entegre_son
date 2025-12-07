/**
 * ErrorBoundary Component
 * 
 * Catches React errors and prevents app crashes.
 * Shows friendly error UI with retry option.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * Created: 2025-11-04
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { toast } from 'sonner';
import { logger } from '../utils/logger';
import { ENV_CONFIG } from '../utils/environmentConfig';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: any[];
  isolate?: boolean; // If true, only this boundary crashes, not entire app
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  goHome: () => void;
  errorCount: number;
}

/**
 * ErrorBoundary Class Component
 * (Must be class component - React doesn't support error boundaries as hooks)
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // ⚡ PRODUCTION HARDENING: Use logger instead of console.error
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in onError handler', handlerError);
      }
    }

    // Log to external service (future)
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error if resetKeys changed
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || [];
      const currentKeys = this.props.resetKeys;

      if (prevKeys.length !== currentKeys.length) {
        this.resetError();
        return;
      }

      for (let i = 0; i < prevKeys.length; i++) {
        if (prevKeys[i] !== currentKeys[i]) {
          this.resetError();
          return;
        }
      }
    }
  }

  resetError = (): void => {
    logger.info('Resetting error boundary');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  goHome = (): void => {
    logger.info('Navigating to home');
    this.resetError();
    // Trigger app to go to home (future: use router)
    window.location.hash = '#home';
  };

  logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // ⚡ PRODUCTION HARDENING: Enhanced error tracking
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        isDevelopment: ENV_CONFIG.isDevelopment,
      };

      // Store in localStorage for debugging
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(errorData);
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift();
      }
      
      localStorage.setItem('app_errors', JSON.stringify(errors));
      
      logger.debug('Error logged to localStorage', { errorCount: errors.length });
    } catch (logError) {
      logger.error('Failed to log error to service', logError);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;

      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={error!}
            errorInfo={errorInfo}
            resetError={this.resetError}
            goHome={this.goHome}
            errorCount={errorCount}
          />
        );
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error!}
          errorInfo={errorInfo}
          resetError={this.resetError}
          goHome={this.goHome}
          errorCount={errorCount}
        />
      );
    }

    // No error - render children normally
    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  goHome,
  errorCount,
}: ErrorFallbackProps): JSX.Element {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // ⚡ PRODUCTION HARDENING: Safe environment detection
  const isDevelopment = ENV_CONFIG.isDevelopment;

  const copyErrorToClipboard = (): void => {
    const errorText = `
Error: ${error.message}

Stack Trace:
${error.stack}

Component Stack:
${errorInfo?.componentStack}

Timestamp: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      toast.success('Hata bilgisi kopyalandı');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Too many errors - suggest refresh
  if (errorCount > 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <Card className="max-w-2xl w-full border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Ciddi Bir Sorun Oluştu</CardTitle>
            <CardDescription>
              Uygulama birden fazla hatayla karşılaştı ({errorCount} kez)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Önerilen Çözüm</AlertTitle>
              <AlertDescription>
                Lütfen sayfayı yenileyerek uygulamayı yeniden başlatın.
                Sorun devam ederse tarayıcı önbelleğini temizleyin.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sayfayı Yenile
              </Button>
              <Button variant="outline" onClick={copyErrorToClipboard}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Hata Detayını Kopyala
              </Button>
            </div>

            {isDevelopment && (
              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded border">
                <strong>Dev Mode:</strong> {error.message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle>Bir Sorun Oluştu</CardTitle>
          <CardDescription>
            Üzgünüz, beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertTitle>Hata Mesajı</AlertTitle>
            <AlertDescription className="font-mono text-sm">
              {error?.message || 'Bilinmeyen hata'}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button onClick={resetError} variant="default" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </Button>
            <Button onClick={goHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Ana Sayfaya Dön
            </Button>
          </div>

          {/* Developer Details Toggle */}
          {isDevelopment && (
            <>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Detayları Gizle' : 'Geliştirici Detaylarını Göster'}
                </Button>
              </div>

              {showDetails && (
                <div className="space-y-3">
                  {/* Stack Trace */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-sm">Stack Trace</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyErrorToClipboard}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                      {error.stack}
                    </pre>
                  </div>

                  {/* Component Stack */}
                  {errorInfo?.componentStack && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-sm mb-2">Component Stack</h3>
                      <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  {/* Error Count */}
                  <div className="text-xs text-gray-500 text-center">
                    Hata sayısı: {errorCount} | Timestamp: {new Date().toLocaleString('tr-TR')}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Help Text */}
          <div className="text-center text-sm text-gray-600">
            <p>Sorun devam ederse:</p>
            <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
              <li>Sayfayı yenileyin (F5 veya Ctrl+R)</li>
              <li>Tarayıcı önbelleğini temizleyin</li>
              <li>Farklı bir tarayıcı deneyin</li>
              <li>Teknik destek ile iletişime geçin</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Minimal Error Fallback (for nested boundaries)
 */
export function MinimalErrorFallback({ error, resetError }: ErrorFallbackProps): JSX.Element {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-red-900 mb-1">Bu bölüm yüklenemedi</h3>
          <p className="text-sm text-red-700 mb-3">{error.message}</p>
          <Button onClick={resetError} size="sm" variant="outline">
            Tekrar Dene
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: Wrap component with ErrorBoundary (HOC)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default ErrorBoundary;