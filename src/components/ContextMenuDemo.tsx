// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧪 CONTEXT MENU DEMO - TEST KOMPONENTİ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ Context menu özelliklerini test etmek için
// ✅ Demo veriler ile çalışır
// ✅ Tüm aksiyonları gösterir
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { ExternalLink, Copy, Edit, Trash2, Eye, Download } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { openInNewTab, handleSmartClick, copyUrlToClipboard, routes } from '../utils/routingHelper';
import { toast } from 'sonner';

interface DemoItem {
  id: string;
  name: string;
  type: string;
  status: string;
}

const demoItems: DemoItem[] = [
  { id: 'cus_001', name: 'ABC Teknoloji A.Ş.', type: 'Müşteri', status: 'Aktif' },
  { id: 'cus_002', name: 'XYZ Yazılım Ltd.', type: 'Müşteri', status: 'Aktif' },
  { id: 'bpf_001', name: 'Ziraat Bankası', type: 'Banka', status: 'Aktif' },
  { id: 'bpf_002', name: 'İş Bankası', type: 'Banka', status: 'Pasif' },
  { id: 'prod_001', name: 'Terminal #12345', type: 'Ürün', status: 'Online' },
];

export const ContextMenuDemo = () => {
  const getContextMenuItems = (item: DemoItem): ContextMenuItem[] => {
    return [
      {
        label: 'Yeni Sekmede Aç',
        icon: <ExternalLink size={16} />,
        shortcut: 'Ctrl+Click',
        action: () => {
          if (item.type === 'Müşteri') {
            openInNewTab(routes.customer(item.id, 'view'));
          } else if (item.type === 'Banka') {
            openInNewTab(routes.bankpf(item.id, 'view'));
          }
          toast.success(`${item.name} yeni sekmede açıldı`);
        },
      },
      {
        label: 'Görüntüle',
        icon: <Eye size={16} />,
        action: () => {
          toast.info(`${item.name} görüntüleniyor...`);
        },
      },
      {
        label: 'Düzenle',
        icon: <Edit size={16} />,
        action: () => {
          toast.info(`${item.name} düzenleniyor...`);
        },
      },
      {
        separator: true,
        label: '',
        action: () => {},
      },
      {
        label: 'ID Kopyala',
        icon: <Copy size={16} />,
        action: async () => {
          try {
            await navigator.clipboard.writeText(item.id);
            toast.success('ID kopyalandı: ' + item.id);
          } catch (error) {
            toast.error('Kopyalama başarısız');
          }
        },
      },
      {
        label: 'URL Paylaş',
        icon: <ExternalLink size={16} />,
        action: async () => {
          let routeParams;
          if (item.type === 'Müşteri') {
            routeParams = routes.customer(item.id, 'view');
          } else if (item.type === 'Banka') {
            routeParams = routes.bankpf(item.id, 'view');
          } else {
            routeParams = routes.product(item.id, 'view');
          }
          
          const success = await copyUrlToClipboard(routeParams);
          if (success) {
            toast.success('Link kopyalandı');
          }
        },
      },
      {
        label: 'Dışa Aktar',
        icon: <Download size={16} />,
        action: () => {
          toast.info(`${item.name} dışa aktarılıyor...`);
        },
      },
      {
        separator: true,
        label: '',
        action: () => {},
      },
      {
        label: 'Sil',
        icon: <Trash2 size={16} />,
        danger: true,
        action: () => {
          toast.error(`${item.name} silme işlemi iptal edildi (demo)`);
        },
      },
    ];
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">🎯 Context Menu Demo</h1>
        <p className="text-gray-600">
          Aşağıdaki satırlara <strong>sağ tıklayın</strong> veya <strong>Ctrl+Click</strong> yapın.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">📖 Kullanım Talimatları</h3>
        <ul className="space-y-1 text-sm">
          <li>🖱️ <strong>Sağ Tık:</strong> Menü açılır</li>
          <li>⌨️ <strong>Ctrl + Click:</strong> Yeni sekmede aç</li>
          <li>⌨️ <strong>Shift + Click:</strong> Yeni pencerede aç</li>
          <li>🖱️ <strong>Orta Tuş (Scroll Wheel):</strong> Yeni sekmede aç</li>
        </ul>
      </div>

      {/* Demo Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase text-gray-500">ID</th>
              <th className="px-6 py-3 text-left text-xs uppercase text-gray-500">İsim</th>
              <th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Tip</th>
              <th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {demoItems.map((item) => (
              <ContextMenu key={item.id} items={getContextMenuItems(item)} as="fragment">
                <tr
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    let routeParams;
                    if (item.type === 'Müşteri') {
                      routeParams = routes.customer(item.id, 'view');
                    } else if (item.type === 'Banka') {
                      routeParams = routes.bankpf(item.id, 'view');
                    } else {
                      routeParams = routes.product(item.id, 'view');
                    }
                    
                    handleSmartClick(e, routeParams, () => {
                      toast.info(`${item.name} açıldı`);
                    });
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      let routeParams;
                      if (item.type === 'Müşteri') {
                        routeParams = routes.customer(item.id, 'view');
                      } else if (item.type === 'Banka') {
                        routeParams = routes.bankpf(item.id, 'view');
                      } else {
                        routeParams = routes.product(item.id, 'view');
                      }
                      openInNewTab(routeParams);
                      toast.success(`${item.name} yeni sekmede açıldı`);
                    }
                  }}
                >
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {item.id}
                    </code>
                  </td>
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      item.type === 'Müşteri' 
                        ? 'bg-blue-100 text-blue-800'
                        : item.type === 'Banka'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      item.status === 'Aktif' || item.status === 'Online'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              </ContextMenu>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Toplam Kayıt</div>
          <div className="text-2xl font-bold">{demoItems.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Aktif</div>
          <div className="text-2xl font-bold text-green-600">
            {demoItems.filter(i => i.status === 'Aktif' || i.status === 'Online').length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Pasif</div>
          <div className="text-2xl font-bold text-gray-600">
            {demoItems.filter(i => i.status === 'Pasif').length}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">💡 Pro Tips</h3>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• <strong>Toplu açma:</strong> Birden fazla satıra Ctrl+Click yaparak hepsini ayrı sekmede açabilirsiniz</li>
          <li>• <strong>Hızlı erişim:</strong> Orta tuş (scroll wheel) ile tek tıklamada yeni sekme</li>
          <li>• <strong>Link paylaşma:</strong> Sağ tık → "URL Paylaş" ile direkt link kopyalayın</li>
        </ul>
      </div>
    </div>
  );
};
