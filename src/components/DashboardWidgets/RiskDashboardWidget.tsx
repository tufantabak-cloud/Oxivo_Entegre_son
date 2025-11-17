// Risk Dashboard Widget'ı
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, XCircle, Clock, DollarSign, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import type { Customer } from '../CustomerModule';
import { FullListModal } from './FullListModal';

interface RiskDashboardWidgetProps {
  customers: Customer[];
}

interface RiskCustomer {
  id: string;
  name: string;
  riskType: 'overdue' | 'suspended' | 'inactive' | 'no-device';
  riskLevel: 'high' | 'medium' | 'low';
  details: string;
  deviceCount: number;
  potentialLoss: number;
}

export function RiskDashboardWidget({ customers }: RiskDashboardWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: any[] }>({ title: '', items: [] });
  
  // Risk analizi
  const riskCustomers: RiskCustomer[] = [];

  customers.forEach((customer) => {
    // Aktif cihaz sayısı
    const allDevices = customer.serviceFeeSettings?.deviceSubscriptions || [];
    const activeDevices = allDevices.filter(d => d.isActive);
    const deviceCount = activeDevices.length;
    const potentialLoss = deviceCount * 10; // €10 per device

    // 1. Gecikmiş ödemeler (overdue invoices)
    const overdueInvoices = customer.serviceFeeSettings?.invoices?.filter(
      (inv) => inv.status === 'overdue'
    ) || [];

    if (overdueInvoices.length > 0) {
      riskCustomers.push({
        id: customer.id,
        name: customer.cariAdi,
        riskType: 'overdue',
        riskLevel: overdueInvoices.length >= 3 ? 'high' : overdueInvoices.length >= 2 ? 'medium' : 'low',
        details: `${overdueInvoices.length} gecikmiş fatura`,
        deviceCount,
        potentialLoss,
      });
    }

    // 2. Askıya alınmış hizmetler
    const suspendedDevices = allDevices.filter(
      (dev) => dev.paymentStatus === 'suspended'
    );

    if (suspendedDevices.length > 0) {
      riskCustomers.push({
        id: customer.id,
        name: customer.cariAdi,
        riskType: 'suspended',
        riskLevel: suspendedDevices.length === deviceCount ? 'high' : 'medium',
        details: `${suspendedDevices.length} cihaz askıya alındı`,
        deviceCount,
        potentialLoss,
      });
    }

    // 3. Pasif müşteriler (cihazı olan ama pasif)
    if (customer.durum === 'Pasif' && deviceCount > 0) {
      riskCustomers.push({
        id: customer.id,
        name: customer.cariAdi,
        riskType: 'inactive',
        riskLevel: deviceCount >= 10 ? 'high' : deviceCount >= 5 ? 'medium' : 'low',
        details: `Pasif müşteri (${deviceCount} cihaz)`,
        deviceCount,
        potentialLoss,
      });
    }

    // 4. Cihazı olmayan aktif müşteriler
    if (customer.durum === 'Aktif' && deviceCount === 0) {
      riskCustomers.push({
        id: customer.id,
        name: customer.cariAdi,
        riskType: 'no-device',
        riskLevel: 'low',
        details: 'Cihaz tanımlı değil',
        deviceCount: 0,
        potentialLoss: 0,
      });
    }
  });

  // Risk seviyesine göre sırala
  const sortedRisks = riskCustomers.sort((a, b) => {
    const levelOrder = { high: 0, medium: 1, low: 2 };
    return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
  });

  // Risk kategorileri sayıları
  const riskCounts = {
    high: sortedRisks.filter((r) => r.riskLevel === 'high').length,
    medium: sortedRisks.filter((r) => r.riskLevel === 'medium').length,
    low: sortedRisks.filter((r) => r.riskLevel === 'low').length,
    overdue: sortedRisks.filter((r) => r.riskType === 'overdue').length,
    suspended: sortedRisks.filter((r) => r.riskType === 'suspended').length,
  };

  // Toplam potansiyel kayıp
  const totalPotentialLoss = sortedRisks.reduce((sum, r) => sum + r.potentialLoss, 0);

  // İlk 6 yüksek riskli müşteri
  const topRisks = sortedRisks.slice(0, 6);

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <Clock size={16} className="text-red-600" />;
      case 'suspended':
        return <XCircle size={16} className="text-amber-600" />;
      case 'inactive':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'no-device':
        return <DollarSign size={16} className="text-gray-600" />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const handleShowFullList = () => {
    const allItems = sortedRisks.map((risk) => ({
      label: risk.name,
      value: `${risk.deviceCount} cihaz • €${risk.potentialLoss.toLocaleString()}`,
      badge: risk.riskLevel.toUpperCase(),
      icon: getRiskIcon(risk.riskType),
      className: getRiskBadgeColor(risk.riskLevel),
    }));
    
    setModalData({
      title: 'Riskli Müşteriler - Tüm Liste',
      items: allItems,
    });
    setShowFullListModal(true);
  };

  return (
    <>
      <FullListModal
        isOpen={showFullListModal}
        onClose={() => setShowFullListModal(false)}
        title={modalData.title}
        items={modalData.items}
      />
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              Risk Dashboard'u
            </div>
            <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
            title={isExpanded ? "Daralt" : "Genişlet"}
          >
            {isExpanded ? (
              <Minimize2 size={16} className="text-gray-600" />
            ) : (
              <Maximize2 size={16} className="text-gray-600" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
        <div className="space-y-6">
          {/* Risk Özeti */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600">{riskCounts.high}</div>
              <div className="text-xs text-gray-600 mt-1">Yüksek Risk</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-3xl font-bold text-amber-600">{riskCounts.medium}</div>
              <div className="text-xs text-gray-600 mt-1">Orta Risk</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">€{totalPotentialLoss.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">Potansiyel Kayıp</div>
            </div>
          </div>

          {/* Kritik Uyarılar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <Clock size={20} className="text-red-600" />
              <div>
                <div className="font-semibold text-sm text-red-900">{riskCounts.overdue}</div>
                <div className="text-xs text-red-700">Gecikmiş Ödeme</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <XCircle size={20} className="text-amber-600" />
              <div>
                <div className="font-semibold text-sm text-amber-900">{riskCounts.suspended}</div>
                <div className="text-xs text-amber-700">Askıya Alındı</div>
              </div>
            </div>
          </div>

          {/* Risk Listesi - Card Bazlı */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Yüksek Riskli Müşteriler (Top 6)</h4>
              {sortedRisks.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowFullList}
                  className="h-8 gap-1"
                >
                  <ExternalLink size={14} />
                  <span className="text-xs">Tümünü Göster ({sortedRisks.length})</span>
                </Button>
              )}
            </div>
            {topRisks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Harika! Risk tespit edilmedi</p>
              </div>
            ) : (
              <div className="space-y-2">{topRisks.map((risk) => (
                  <div key={`${risk.id}-${risk.riskType}`} className="p-3 bg-white border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getRiskIcon(risk.riskType)}
                        <span className="font-medium text-sm truncate">{risk.name}</span>
                      </div>
                      <Badge className={`${getRiskBadgeColor(risk.riskLevel)} text-xs whitespace-nowrap ml-2`}>
                        {risk.riskLevel === 'high' && 'Yüksek'}
                        {risk.riskLevel === 'medium' && 'Orta'}
                        {risk.riskLevel === 'low' && 'Düşük'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <span className="text-gray-600">{risk.details}</span>
                      <span className="font-semibold text-red-600 ml-2">
                        {risk.potentialLoss > 0 ? `€${risk.potentialLoss}` : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </CardContent>
      )}
      </Card>
    </>
  );
}
