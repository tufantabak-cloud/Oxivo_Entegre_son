// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 CONTRACT PUBLIC PAGE - Sözleşme Public Route Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// URL: /sozlesme/:token
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useEffect, useState } from 'react';
import { ContractPublicView } from './DSYM/ContractPublicView';

export function ContractPublicPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // URL'den token'ı al
    // Örnek: /sozlesme/abc123xyz
    const path = window.location.pathname;
    const parts = path.split('/');
    
    if (parts[1] === 'sozlesme' && parts[2]) {
      setToken(parts[2]);
    }
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Geçersiz sözleşme linki</div>
      </div>
    );
  }

  return <ContractPublicView token={token} />;
}
