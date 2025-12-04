// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 CONTRACT REPORTS - Sözleşme Raporları
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { BarChart3, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { transactionApi } from '../../src/utils/contractApi';
import { toast } from 'sonner@2.0.3';

export function ContractReports() {
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    digital_signed: 0,
    hard_copy_waiting: 0,
    completed: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await transactionApi.list();
      
      setStats({
        total: data.length,
        draft: data.filter(t => t.status === 'draft').length,
        sent: data.filter(t => t.status === 'sent').length,
        digital_signed: data.filter(t => t.status === 'digital_signed').length,
        hard_copy_waiting: data.filter(t => t.status === 'hard_copy_waiting').length,
        completed: data.filter(t => t.status === 'completed').length,
        expired: data.filter(t => t.status === 'expired').length,
      });
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-gray-900 flex items-center gap-3">
            <BarChart3 size={24} className="text-blue-600" />
            Sözleşme İstatistikleri
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Tüm sözleşme işlemlerinin özeti
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText size={24} />}
            label="Toplam İşlem"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<Clock size={24} />}
            label="Gönderildi"
            value={stats.sent}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle2 size={24} />}
            label="Dijital Onay"
            value={stats.digital_signed}
            color="green"
          />
          <StatCard
            icon={<AlertCircle size={24} />}
            label="Hard Copy Bekliyor"
            value={stats.hard_copy_waiting}
            color="orange"
          />
          <StatCard
            icon={<CheckCircle2 size={24} />}
            label="Tamamlandı"
            value={stats.completed}
            color="green"
          />
          <StatCard
            icon={<FileText size={24} />}
            label="Taslak"
            value={stats.draft}
            color="yellow"
          />
          <StatCard
            icon={<AlertCircle size={24} />}
            label="Süresi Dolmuş"
            value={stats.expired}
            color="red"
          />
        </div>

        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-4">Tamamlanma Oranı</h3>
          <div className="space-y-3">
            <ProgressBar
              label="Tamamlanan"
              value={stats.completed}
              total={stats.total}
              color="green"
            />
            <ProgressBar
              label="İşlemde"
              value={stats.sent + stats.digital_signed + stats.hard_copy_waiting}
              total={stats.total}
              color="blue"
            />
            <ProgressBar
              label="Bekleyen"
              value={stats.draft}
              total={stats.total}
              color="yellow"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAT CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className={`p-2 rounded-lg w-fit ${colors[color]}`}>
        {icon}
      </div>
      <div className="mt-3">
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-gray-900 text-2xl mt-1">{value}</p>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROGRESS BAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function ProgressBar({ label, value, total, color }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  const colors: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">
          {value} / {total} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}