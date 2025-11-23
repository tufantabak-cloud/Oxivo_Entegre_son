import { useMemo } from 'react';
import { Customer } from '../components/CustomerModule';
import { BankPF } from '../components/BankPFModule';
import { PayterProduct } from '../components/PayterProductTab';
import { SalesRepresentative } from '../components/DefinitionsModule';
import { performSearch, SearchResult } from '../utils/searchEngine';

interface UseGlobalSearchProps {
  customers: Customer[];
  bankPFRecords: BankPF[];
  payterProducts: PayterProduct[];
  salesReps: SalesRepresentative[];
}

interface SearchableItem {
  id: string;
  searchableText: string;
  category: SearchResult['category'];
  title: string;
  subtitle: string;
  metadata?: Record<string, any>;
  moduleLink: string;
}

/**
 * Global Search Hook
 * Prepares searchable index from all data sources
 */
export function useGlobalSearch({
  customers,
  bankPFRecords,
  payterProducts,
  salesReps,
}: UseGlobalSearchProps) {
  // Build searchable index (memoized)
  const searchableItems = useMemo<SearchableItem[]>(() => {
    const items: SearchableItem[] = [];

    // 1. Müşteriler
    if (Array.isArray(customers)) {
      customers.forEach(customer => {
        const searchableText = [
          customer.cariAdi || '',
          customer.cariHesapKodu || '',
          customer.sektor || '',
          customer.segment || '',
          customer.guncelMyPayterDomain || '',
          customer.vergiNumarasi || '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        items.push({
          id: customer.id,
          searchableText,
          category: 'Müşteri',
          title: customer.cariAdi || 'İsimsiz Müşteri',
          subtitle: customer.cariHesapKodu || 'Hesap kodu yok',
          metadata: {
            sektor: customer.sektor,
            durum: customer.durum,
            segment: customer.segment,
          },
          moduleLink: 'customers',
        });
      });
    }

    // 2. Banka/PF Kayıtları
    if (Array.isArray(bankPFRecords)) {
      bankPFRecords.forEach(record => {
        const searchableText = [
          record.firmaUnvan || '',
          record.selectedBanka || '',
          record.epk || '',
          record.ok || '',
          record.bankaOrPF === 'PF' ? record.odemeKurulusuTipi || '' : '',
          record.iletisimMatrisi?.map(k => `${k.adiSoyadi || ''} ${k.mail || ''} ${k.gsm || ''}`).join(' ') || '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        items.push({
          id: record.id,
          searchableText,
          category: 'Banka/PF',
          title: record.firmaUnvan || 'İsimsiz Firma',
          subtitle: `${record.bankaOrPF} - ${record.selectedBanka || 'Banka seçilmemiş'}`,
          metadata: {
            bankaOrPF: record.bankaOrPF,
            banka: record.selectedBanka,
            epk: record.epk,
          },
          moduleLink: 'bankpf',
        });

        // 2a. TABELA Kayıtları
        record.tabelaRecords?.forEach(tabela => {
          const tabelaSearchText = [
            tabela.musteriAdi || '',
            tabela.hesapKodu || '',
            tabela.ay || '',
            tabela.yil?.toString() || '',
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          items.push({
            id: `tabela-${tabela.id}`,
            searchableText: tabelaSearchText,
            category: 'TABELA',
            title: `${tabela.musteriAdi || 'İsimsiz'} - ${tabela.ay || ''} ${tabela.yil || ''}`.trim(),
            subtitle: record.firmaUnvan || 'Firma yok',
            metadata: {
              bankPFId: record.id,
              ay: tabela.ay,
              yil: tabela.yil,
              kesinlestirildi: tabela.kesinlestirildi,
            },
            moduleLink: 'bankpf',
          });
        });

        // 2b. Hakediş Kayıtları
        record.hakedisRecords?.forEach(hakedis => {
          const hakedisSearchText = [
            hakedis.grupAdi || '',
            hakedis.donem || '',
            hakedis.yil?.toString() || '',
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          items.push({
            id: `hakedis-${hakedis.id}`,
            searchableText: hakedisSearchText,
            category: 'Hakediş',
            title: `${hakedis.grupAdi || 'İsimsiz Grup'} - ${hakedis.donem || ''} ${hakedis.yil || ''}`.trim(),
            subtitle: record.firmaUnvan || 'Firma yok',
            metadata: {
              bankPFId: record.id,
              donem: hakedis.donem,
              yil: hakedis.yil,
              kesinlestirildi: hakedis.kesinlestirildi,
            },
            moduleLink: 'bankpf',
          });
        });
      });
    }

    // 3. Payter Ürünleri
    if (Array.isArray(payterProducts)) {
      payterProducts.forEach(product => {
        const searchableText = [
          product.urunAdi || '',
          product.domain || '',
          product.hesapKodu || '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        items.push({
          id: product.id,
          searchableText,
          category: 'Ürün',
          title: product.urunAdi || 'İsimsiz Ürün',
          subtitle: product.domain || 'Domain yok',
          metadata: {
            domain: product.domain,
            hesapKodu: product.hesapKodu,
          },
          moduleLink: 'products',
        });
      });
    }

    // 4. Satış Temsilcileri
    if (Array.isArray(salesReps)) {
      salesReps.forEach(rep => {
        const searchableText = [
          rep.adSoyad || '',
          rep.email || '',
          rep.telefon || '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        items.push({
          id: rep.id,
          searchableText,
          category: 'Satış Temsilcisi',
          title: rep.adSoyad || 'İsimsiz Temsilci',
          subtitle: rep.email || 'Email yok',
          metadata: {
            aktif: rep.aktif,
            email: rep.email,
          },
          moduleLink: 'definitions',
        });
      });
    }

    return items;
  }, [customers, bankPFRecords, payterProducts, salesReps]);

  /**
   * Perform search with query
   */
  const search = (query: string): SearchResult[] => {
    return performSearch(query, searchableItems, 10);
  };

  return {
    search,
    totalIndexedItems: searchableItems.length,
  };
}