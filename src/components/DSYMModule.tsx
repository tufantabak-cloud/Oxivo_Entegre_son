// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 DSYM MODULE - Dijital Sözleşme Yönetim Modülü
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState } from 'react';
import { FileText, Mail, MessageSquare, BarChart3, Send } from 'lucide-react';
import { TemplateList } from './DSYM/TemplateList';
import { TransactionList } from './DSYM/TransactionList';
import { EmailTemplateList } from './DSYM/EmailTemplateList';
import { SMSTemplateList } from './DSYM/SMSTemplateList';
import { ContractReports } from './DSYM/ContractReports';

type TabType = 'templates' | 'transactions' | 'email' | 'sms' | 'reports';

export function DSYMModule() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 flex items-center gap-3">
              <FileText size={28} className="text-blue-600" />
              DSYM - Dijital Sözleşme Yönetimi
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sözleşme şablonları, gönderim yönetimi ve takip sistemi
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'transactions'}
            onClick={() => setActiveTab('transactions')}
            icon={<Send size={18} />}
            label="Gönderim Yönetimi"
          />
          <TabButton
            active={activeTab === 'templates'}
            onClick={() => setActiveTab('templates')}
            icon={<FileText size={18} />}
            label="Sözleşme Şablonları"
          />
          <TabButton
            active={activeTab === 'email'}
            onClick={() => setActiveTab('email')}
            icon={<Mail size={18} />}
            label="Email Şablonları"
          />
          <TabButton
            active={activeTab === 'sms'}
            onClick={() => setActiveTab('sms')}
            icon={<MessageSquare size={18} />}
            label="SMS Şablonları"
          />
          <TabButton
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            icon={<BarChart3 size={18} />}
            label="Raporlar"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'templates' && <TemplateList />}
        {activeTab === 'transactions' && <TransactionList />}
        {activeTab === 'email' && <EmailTemplateList />}
        {activeTab === 'sms' && <SMSTemplateList />}
        {activeTab === 'reports' && <ContractReports />}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-3 flex items-center gap-2 border-b-2 transition-colors
        ${active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
        }
      `}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}