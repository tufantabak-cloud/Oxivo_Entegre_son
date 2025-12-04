// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 TRANSACTION LIST - Gönderim Yönetimi
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { Search, FileText, Clock, CheckCircle2, XCircle, AlertCircle, Download, Plus } from 'lucide-react';
import { transactionApi, ContractTransaction } from '../../utils/contractApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { SendContractModal } from './SendContractModal';

type StatusFilter = 'all' | 'draft' | 'sent' | 'digital_signed' | 'hard_copy_waiting' | 'completed' | 'expired';

export function TransactionList() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await transactionApi.list(filters);
      setTransactions(data);
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReceived = async (id: string) => {
    try {
      await transactionApi.receiveHardCopy(id);
      toast.success('Hard copy teslim alındı olarak işaretlendi');
      loadTransactions();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  // Filtreleme
  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.transaction_name?.toLowerCase().includes(query) ||
      tx.customers?.unvan?.toLowerCase().includes(query)
    );
  });

  // Durum istatistikleri
  const stats = {
    draft: transactions.filter(t => t.status === 'draft').length,
    sent: transactions.filter(t => t.status === 'sent').length,
    digital_signed: transactions.filter(t => t.status === 'digital_signed').length,
    hard_copy_waiting: transactions.filter(t => t.status === 'hard_copy_waiting').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    expired: transactions.filter(t => t.status === 'expired').length,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filtre Sekmeleri */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-2 overflow-x-auto">
          <StatusTab
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            label="Tümü"
            count={transactions.length}
            color="gray"
          />
          <StatusTab
            active={statusFilter === 'draft'}
            onClick={() => setStatusFilter('draft')}
            label="Taslak"
            count={stats.draft}
            color="yellow"
          />
          <StatusTab
            active={statusFilter === 'sent'}
            onClick={() => setStatusFilter('sent')}
            label="Gönderildi"
            count={stats.sent}
            color="blue"
          />
          <StatusTab
            active={statusFilter === 'digital_signed'}
            onClick={() => setStatusFilter('digital_signed')}
            label="Dijital Onay"
            count={stats.digital_signed}
            color="green"
          />
          <StatusTab
            active={statusFilter === 'hard_copy_waiting'}
            onClick={() => setStatusFilter('hard_copy_waiting')}
            label="Hard Copy Bekliyor"
            count={stats.hard_copy_waiting}
            color="orange"
          />
          <StatusTab
            active={statusFilter === 'completed'}
            onClick={() => setStatusFilter('completed')}
            label="Tamamlandı"
            count={stats.completed}
            color="green"
          />
          <StatusTab
            active={statusFilter === 'expired'}
            onClick={() => setStatusFilter('expired')}
            label="Süresi Dolmuş"
            count={stats.expired}
            color="red"
          />
        </div>
      </div>

      {/* Arama */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Müşteri adı veya işlem adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            size="sm"
            onClick={() => setShowSendModal(true)}
            className="whitespace-nowrap"
          >
            <Plus size={16} className="mr-2" />
            Yeni Gönderim
          </Button>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Kayıt bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onMarkAsReceived={handleMarkAsReceived}
                onRefresh={loadTransactions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Yeni İşlem Ekleme Modalı */}
      <SendContractModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        onRefresh={loadTransactions}
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATUS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatusTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color: string;
}

function StatusTab({ active, onClick, label, count, color }: StatusTabProps) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm flex items-center gap-2 whitespace-nowrap transition-all
        ${active
          ? `${colors[color]} ring-2 ring-${color}-300`
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        }
      `}
    >
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white' : 'bg-gray-200'}`}>
        {count}
      </span>
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRANSACTION CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TransactionCardProps {
  transaction: any;
  onMarkAsReceived: (id: string) => void;
  onRefresh: () => void;
}

function TransactionCard({ transaction, onMarkAsReceived, onRefresh }: TransactionCardProps) {
  const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
    draft: { icon: FileText, label: 'Taslak', color: 'text-yellow-600' },
    sent: { icon: Clock, label: 'Gönderildi', color: 'text-blue-600' },
    digital_signed: { icon: CheckCircle2, label: 'Dijital Onay', color: 'text-green-600' },
    hard_copy_waiting: { icon: AlertCircle, label: 'Hard Copy Bekliyor', color: 'text-orange-600' },
    completed: { icon: CheckCircle2, label: 'Tamamlandı', color: 'text-green-600' },
    expired: { icon: XCircle, label: 'Süresi Dolmuş', color: 'text-red-600' },
  };

  const config = statusConfig[transaction.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  // Hard copy deadline kontrolü
  const isHardCopyOverdue = transaction.hard_copy_deadline &&
    new Date(transaction.hard_copy_deadline) < new Date() &&
    transaction.status === 'hard_copy_waiting';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Sol taraf */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon size={20} className={config.color} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-gray-900">{transaction.transaction_name}</h3>
                {transaction.document_count > 0 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                    📄 {transaction.document_count} doküman
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm">
                {transaction.customers?.unvan || 'Müşteri bilgisi yok'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            {transaction.sent_at && (
              <div>
                <span className="text-gray-500">Gönderim:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(transaction.sent_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
            {transaction.digital_signed_at && (
              <div>
                <span className="text-gray-500">Dijital Onay:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(transaction.digital_signed_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
            {transaction.hard_copy_deadline && (
              <div>
                <span className="text-gray-500">Hard Copy Son Tarih:</span>
                <span className={`ml-2 ${isHardCopyOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(transaction.hard_copy_deadline).toLocaleDateString('tr-TR')}
                  {isHardCopyOverdue && ' ⚠️'}
                </span>
              </div>
            )}
            {transaction.hard_copy_received_at && (
              <div>
                <span className="text-gray-500">Hard Copy Teslim:</span>
                <span className="ml-2 text-green-600">
                  ✓ {new Date(transaction.hard_copy_received_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sağ taraf - Aksiyonlar */}
        <div className="flex flex-col gap-2">
          {transaction.status === 'hard_copy_waiting' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkAsReceived(transaction.id)}
              className="whitespace-nowrap"
            >
              ✅ Teslim Aldım
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              // TODO: Detay sayfası
              toast.info('Detay sayfası yakında eklenecek');
            }}
          >
            📄 Detay
          </Button>
        </div>
      </div>
    </div>
  );
}