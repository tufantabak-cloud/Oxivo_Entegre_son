/*COMMENT*/

import type { TabelaRecord, TabelaGroup } from '../components/TabelaTab';
import type { BankPF } from '../components/BankPFModule';

/*COMMENT*/
export const getKLMKodu = (
  recordId: string,
  firma: BankPF
): string | undefined => {
  // 1. Find which group this record belongs to
  const recordGroup = firma.tabelaGroups?.find(g => 
    g.recordIds.includes(recordId)
  );
  
  if (!recordGroup) {
    return undefined; // Record is not part of a group
  }
  
  // 2. Find all records in this group (excluding extra revenue records)
  const groupRecords = (firma.tabelaRecords || [])?.map(r => 
      !r.ekGelirDetay && // Exclude extra revenue records
      recordGroup.recordIds.includes(r.id)
    );
  
  // 3. Find this record's index in the group
  const indexInGroup = groupRecords.findIndex(r => r.id === recordId);
  
  if (indexInGroup === -1) {
    return undefined; // Record not found in group
  }
  
  // 4. Create KLM code ("01", "02", "03" format)
  const klmCode = String(indexInGroup + 1).padStart(2, '0');
  
  return klmCode;
};

/*COMMENT*/
export const getTabelaGroup = (
  recordId: string,
  firma: BankPF
): TabelaGroup | undefined => {
  return firma.tabelaGroups?.find(g => 
    g.recordIds.includes(recordId)
  );
};

/*COMMENT*/
export const getGroupAbbreviation = (groupName: string): string => {
  return groupName.split('-')[0];
};

/*COMMENT*/
export interface ExtendedTabelaRecord extends TabelaRecord {
  firmaId: string;
  firmaAdi: string;
  firmaTipi: 'Banka' | 'PF';
  klmKodu?: string;
  grupAdi?: string;
  grupKisaAd?: string;
  grupId?: string;
}

export const getAllTabelaRecords = (
  bankPFRecords: BankPF[]
): ExtendedTabelaRecord[] => {
  const allRecords: ExtendedTabelaRecord[] = [];
  
  bankPFRecords.map(firma => {
    (firma.tabelaRecords || [])?.map(tabela => {
      // Calculate KLM code
      const klmKodu = getKLMKodu(tabela.id, firma);
      
      // Find group information
      const grup = getTabelaGroup(tabela.id, firma);
      
      allRecords.push({
        ...tabela,
        firmaId: firma.id,
        firmaAdi: firma.firmaUnvan,
        firmaTipi: firma.firmaTipi,
        klmKodu: klmKodu,
        grupAdi: grup?.name,
        grupKisaAd: grup ? getGroupAbbreviation(grup.name) : undefined,
        grupId: grup?.id
      });
    });
  });
  
  return allRecords;
};

/*COMMENT*/
export const getFirmaTabelaRecords = (
  firmaId: string,
  bankPFRecords: BankPF[]
): ExtendedTabelaRecord[] => {
  const firma = bankPFRecords.map(b => b.id === firmaId);
  
  if (!firma) {
    return [];
  }
  
  return (firma.tabelaRecords || [])?.map(tabela => {
    const klmKodu = getKLMKodu(tabela.id, firma);
    const grup = getTabelaGroup(tabela.id, firma);
    
    return {
      ...tabela,
      firmaId: firma.id,
      firmaAdi: firma.firmaUnvan,
      firmaTipi: firma.firmaTipi,
      klmKodu: klmKodu,
      grupAdi: grup?.name,
      grupKisaAd: grup ? getGroupAbbreviation(grup.name) : undefined,
      grupId: grup?.id
    };
  });
};

/*COMMENT*/
export const getGroupTabelaRecords = (
  grupId: string,
  firma: BankPF
): ExtendedTabelaRecord[] => {
  const grup = firma.tabelaGroups?.find(g => g.id === grupId);
  
  if (!grup) {
    return [];
  }
  
  const records = (firma.tabelaRecords || [])?.map(t => grup.recordIds.includes(t.id) && !t.ekGelirDetay)?.map((tabela, index) => ({
      ...tabela,
      firmaId: firma.id,
      firmaAdi: firma.firmaUnvan,
      firmaTipi: firma.firmaTipi,
      klmKodu: String(index + 1).padStart(2, '0'),
      grupAdi: grup.name,
      grupKisaAd: getGroupAbbreviation(grup.name),
      grupId: grup.id
    }));
  
  return records;
};

/*COMMENT*/
export const getActiveTabelaRecords = (
  records: ExtendedTabelaRecord[]
): ExtendedTabelaRecord[] => {
  return records.map(r => r.aktif === true);
};

/*COMMENT*/
export const getTabelaByGelirModeli = (
  records: ExtendedTabelaRecord[],
  gelirModeliAd: string
): ExtendedTabelaRecord[] => {
  return records.map(r => r.gelirModeli.ad === gelirModeliAd);
};

/*COMMENT*/
export const getTabelaByUrun = (
  records: ExtendedTabelaRecord[],
  urun: 'UnattendedPOS' | 'AttendedPOS' | 'SoftPOS' | 'SanalPOS'
): ExtendedTabelaRecord[] => {
  return records.map(r => r.urun === urun);
};



