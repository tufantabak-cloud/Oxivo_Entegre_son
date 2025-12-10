// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛡️ ERROR BOUNDARY - Top-level Error Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className=\"min-h-screen flex items-center justify-center bg-gray-50 p-4\">
          <div className=\"max-w-2xl w-full bg-white rounded-lg shadow-lg p-8\">
            {/* Error Icon */}
            <div className=\"flex items-center justify-center mb-6\">
              <div className=\"bg-red-100 rounded-full p-4\">
                <AlertTriangle className=\"text-red-600\" size={48} />
              </div>
            </div>

            {/* Error Title */}
            <h1 className=\"text-2xl text-center mb-4\">
              Bir Hata Oluştu
            </h1>

            {/* Error Message */}
            <div className=\"bg-red-50 border border-red-200 rounded-lg p-4 mb-6\">
              <p className=\"text-sm text-red-900\">
                <strong>Hata:</strong> {this.state.error?.message || 'Bilinmeyen hata'}
              </p>
              {this.state.error?.stack && (
                <details className=\"mt-3\">
                  <summary className=\"text-xs text-red-700 cursor-pointer hover:underline\">
                    Teknik Detaylar (Geliştiriciler için)
                  </summary>
                  <pre className=\"mt-2 text-xs bg-white p-3 rounded border border-red-200 overflow-x-auto\">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            {/* Help Text */}
            <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6\">
              <h3 className=\"text-sm text-blue-900 mb-2\">
                🔧 Olası Çözümler:
              </h3>
              <ul className=\"text-sm text-blue-800 space-y-1 list-disc list-inside\">
                <li>Tarayıcınızı yenileyin (F5)</li>
                <li>Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete)</li>
                <li>Farklı bir tarayıcıda deneyin</li>
                <li>Geliştirici Console'u kontrol edin (F12)</li>
                <li>Supabase tablolarının oluşturulduğundan emin olun</li>
              </ul>
            </div>

            {/* Actions */}
            <div className=\"flex gap-3 justify-center\">
              <Button
                onClick={this.handleReset}
                className=\"gap-2\"
              >
                <RefreshCw size={18} />
                Sayfayı Yenile
              </Button>
              <Button
                variant=\"outline\"
                onClick={() => window.location.href = '/'}
              >
                Ana Sayfaya Dön
              </Button>
            </div>

            {/* Additional Info */}
            <div className=\"mt-6 pt-6 border-t border-gray-200 text-center\">
              <p className=\"text-sm text-gray-600\">
                Sorun devam ederse, tarayıcı console'undaki (F12) hata mesajlarını kontrol edin.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
