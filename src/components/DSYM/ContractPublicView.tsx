// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 CONTRACT PUBLIC VIEW - Müşteri Sözleşme Görünümü
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// URL: /sozlesme/:token
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { CheckCircle2, Download, Eye, Smartphone, AlertCircle } from 'lucide-react';
import { transactionApi, auditApi } from '../../src/utils/contractApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface ContractPublicViewProps {
  token: string;
}

export function ContractPublicView({ token }: ContractPublicViewProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [smsCode, setSmsCode] = useState(['', '', '', '', '', '']);
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);
  
  const [agreed, setAgreed] = useState(false);
  const [viewedDocuments, setViewedDocuments] = useState<string[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    loadTransaction();
  }, [token]);

  useEffect(() => {
    // Log: Sayfa açıldı
    if (transaction) {
      logAction('link_opened');
    }
  }, [transaction]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const data = await transactionApi.getByToken(token);
      setTransaction(data);
      
      // Eğer zaten imzalanmışsa
      if (data.digital_signed_at) {
        setError('Bu sözleşme zaten imzalanmış.');
      }
      
      // Eğer SMS zaten doğrulanmışsa
      if (data.sms_verified_at) {
        setSmsVerified(true);
      }
    } catch (error: any) {
      setError(error.message || 'Sözleşme bulunamadı.');
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (action: string, metadata: any = {}) => {
    try {
      if (!transaction) return;
      
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => d.ip)
        .catch(() => 'unknown');

      await auditApi.log(
        transaction.id,
        action,
        metadata,
        ipAddress,
        navigator.userAgent
      );
    } catch (error) {
      console.error('Audit log hatası:', error);
    }
  };

  const handleSendSMSCode = async () => {
    try {
      const { code } = await transactionApi.generateSMSCode(transaction.id);
      
      // TODO: Gerçek SMS gönderimi
      console.log('SMS kodu gönderildi:', code);
      toast.success(`SMS kodu gönderildi: ${transaction.sent_to_phone}`);
      
      // DEMO için kodu göster
      toast.info(`DEMO: SMS Kodu = ${code}`, { duration: 10000 });
      
      setSmsCodeSent(true);
      await logAction('sms_code_sent', { phone: transaction.sent_to_phone });
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  const handleSMSCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...smsCode];
    newCode[index] = value;
    setSmsCode(newCode);

    // Otomatik sonraki input'a geç
    if (value && index < 5) {
      const nextInput = document.getElementById(`sms-${index + 1}`);
      nextInput?.focus();
    }

    // Tüm alanlar doluysa doğrula
    if (newCode.every(c => c) && newCode.join('').length === 6) {
      verifySMSCode(newCode.join(''));
    }
  };

  const verifySMSCode = async (code: string) => {
    try {
      await transactionApi.verifySMSCode(transaction.id, code);
      toast.success('✓ SMS kodu doğrulandı');
      setSmsVerified(true);
      await logAction('sms_verified', { code });
    } catch (error: any) {
      toast.error('Geçersiz SMS kodu!');
      setSmsCode(['', '', '', '', '', '']);
      document.getElementById('sms-0')?.focus();
    }
  };

  const handleViewDocument = (docId: string) => {
    if (!viewedDocuments.includes(docId)) {
      setViewedDocuments([...viewedDocuments, docId]);
      logAction('document_viewed', { document_id: docId });
    }
  };

  const handleSign = async () => {
    if (!agreed) {
      alert('Lütfen tüm dökümanları okuduğunuzu onaylayın.');
      return;
    }

    if (!smsVerified) {
      alert('Lütfen önce SMS kodunu doğrulayın.');
      return;
    }

    if (viewedDocuments.length !== transaction.documents.length) {
      alert('Lütfen tüm dökümanları görüntüleyin.');
      return;
    }

    try {
      setSigning(true);

      // IP adresini al
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => d.ip)
        .catch(() => 'unknown');

      await transactionApi.digitalSign(transaction.id, ipAddress);

      toast.success('✓ Sözleşme başarıyla imzalandı!');
      
      // Sayfa yenile
      loadTransaction();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    } finally {
      setSigning(false);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: PDF oluştur ve indir
    toast.info('PDF indirme özelliği yakında eklenecek');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Eğer imzalanmışsa
  if (transaction.digital_signed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white border border-green-200 rounded-lg p-8 max-w-2xl text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-gray-900 mb-2">Sözleşme İmzalandı</h2>
          <p className="text-gray-600 mb-6">
            Bu sözleşme {new Date(transaction.digital_signed_at).toLocaleString('tr-TR')} tarihinde dijital olarak imzalanmıştır.
          </p>
          
          {transaction.hard_copy_deadline && !transaction.hard_copy_received_at && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-900">
                ⚠️ Lütfen sözleşmeleri yazdırıp ıslak imzalayarak{' '}
                <strong>{new Date(transaction.hard_copy_deadline).toLocaleDateString('tr-TR')}</strong>{' '}
                tarihine kadar aşağıdaki adrese gönderiniz:
              </p>
              <p className="text-yellow-700 mt-2">
                📮 Oxivo EU - Maslak Ofis, İstanbul
              </p>
            </div>
          )}

          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download size={18} />
            PDF İndir
          </Button>
        </div>
      </div>
    );
  }

  const currentDoc = transaction.documents[currentDocIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-gray-900">OXIVO EU</h1>
          <p className="text-gray-500 text-sm">Sözleşme Onay Sistemi</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Giriş */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 mb-4">
            Sayın <strong>{transaction.customers?.unvan}</strong>,
          </p>
          <p className="text-gray-600">
            Aşağıdaki dökümanları inceleyip dijital olarak onaylamanız rica olunur.
            Onay sonrası ıslak imzalı nüshalarını adresimize göndermeniz gerekmektedir.
          </p>
        </div>

        {/* Döküman Listesi */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-gray-900 mb-4">📄 Dökümanlar ({transaction.documents.length} adet)</h3>
          <div className="space-y-2">
            {transaction.documents.map((doc: any, index: number) => (
              <button
                key={doc.id}
                onClick={() => {
                  setCurrentDocIndex(index);
                  handleViewDocument(doc.id);
                }}
                className={`
                  w-full px-4 py-3 rounded-lg border-2 text-left transition-all
                  ${currentDocIndex === index
                    ? 'border-blue-500 bg-blue-50'
                    : viewedDocuments.includes(doc.id)
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900">
                      {index + 1}. {doc.contract_templates?.name}
                    </span>
                    {viewedDocuments.includes(doc.id) && (
                      <CheckCircle2 size={18} className="text-green-600" />
                    )}
                  </div>
                  <Eye size={18} className="text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Döküman Görüntüleyici */}
        {currentDoc && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-gray-900 mb-4">{currentDoc.contract_templates?.name}</h3>
            <div
              className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-6 bg-gray-50 max-h-[500px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: currentDoc.final_content_html }}
            />
          </div>
        )}

        {/* SMS Doğrulama */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-gray-900 mb-4">🔐 SMS Doğrulama</h3>
          
          {!smsVerified ? (
            <>
              <p className="text-gray-600 mb-4">
                Telefonunuza gönderilen 6 haneli kodu girin:
              </p>
              
              {!smsCodeSent ? (
                <div className="flex items-center gap-4">
                  <Button onClick={handleSendSMSCode} className="gap-2">
                    <Smartphone size={18} />
                    Kod Gönder
                  </Button>
                  <span className="text-gray-500 text-sm">
                    Kod: {transaction.sent_to_phone}
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 mb-4">
                  {smsCode.map((digit, index) => (
                    <Input
                      key={index}
                      id={`sms-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleSMSCodeChange(index, e.target.value)}
                      className="w-12 h-12 text-center text-xl"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={20} />
              <span>SMS kodu doğrulandı</span>
            </div>
          )}
        </div>

        {/* Onay ve İmzalama */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-6">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label htmlFor="agree" className="cursor-pointer text-gray-700">
              Tüm dökümanları okudum ve kabul ediyorum
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
              <Download size={18} />
              PDF İndir (Tümü)
            </Button>
            <Button
              onClick={handleSign}
              disabled={!agreed || !smsVerified || signing || viewedDocuments.length !== transaction.documents.length}
              className="gap-2 flex-1"
            >
              {signing ? 'İmzalanıyor...' : (
                <>
                  <CheckCircle2 size={18} />
                  ONAYLA
                </>
              )}
            </Button>
          </div>

          {/* Uyarı */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-900 text-sm">
              ⚠️ <strong>DİKKAT:</strong> Dijital onay sonrasında dökümanları yazdırıp
              ıslak imzalayarak 5 iş günü içinde aşağıdaki adrese göndermeniz gerekmektedir:
            </p>
            <p className="text-yellow-700 text-sm mt-2">
              📮 Oxivo EU - Maslak Ofis, İstanbul
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}