// Debug Modülü - Müşteri Domain Eşleştirme Analizi
// Standalone debug tool - Dashboard'a entegre edilebilir
import { CustomerDomainDebugger } from './CustomerDomainDebugger';
import type { Customer } from './CustomerModule';
import type { PayterProduct } from './PayterProductTab';

interface DebugModuleProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

export function DebugModule({ customers, payterProducts }: DebugModuleProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Debug & Diagnostic Tools</h1>
        <p className="text-gray-600 mt-1">
          Müşteri-ürün eşleştirme sorunlarını analiz etmek için araçlar
        </p>
      </div>

      {/* Veri Durumu Paneli */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-900">{customers.length}</div>
          <div className="text-sm text-blue-700 mt-1">Müşteri Yüklendi</div>
          {customers.length === 0 && (
            <div className="text-xs text-red-600 mt-2">
              ⚠️ Müşteri verisi yok! Önce Müşteriler modülünden veri import edin.
            </div>
          )}
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-900">{payterProducts.length}</div>
          <div className="text-sm text-green-700 mt-1">Ürün Yüklendi</div>
          {payterProducts.length === 0 && (
            <div className="text-xs text-red-600 mt-2">
              ⚠️ Ürün verisi yok! Önce Ürün modülünden veri import edin.
            </div>
          )}
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-900">
            {customers.filter(c => c.domain || c.guncelMyPayterDomain).length}
          </div>
          <div className="text-sm text-purple-700 mt-1">Domain'li Müşteri</div>
        </div>
      </div>

      {/* Örnek Müşteri Kodları - İlk 10 */}
      {customers.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">
            💡 Örnek Müşteri Kodları (İlk 10)
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {customers.slice(0, 10).map((c, i) => (
              <div key={i} className="p-2 bg-white rounded border border-gray-100">
                <span className="font-mono text-blue-600">{c.cariKodu}</span>
                {' - '}
                <span className="text-gray-600">{c.cariAdi?.substring(0, 30)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Bu kodlardan birini kopyalayıp aşağıdaki arama kutusuna yapıştırın.
          </p>
        </div>
      )}

      <CustomerDomainDebugger 
        customers={customers} 
        payterProducts={payterProducts} 
      />
    </div>
  );
}
