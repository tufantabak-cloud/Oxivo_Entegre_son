/**
 * TABELA Helper Functions
 * Helper functions for accessing and computing data from TABELA records
 */

import type { TabelaRecord, TabelaGroup } from '../components/TabelaTab';
import type { BankPF } from '../components/BankPFModule';

/**
 * KLM Code Calculation
 * Calculates the sequence number of a TABELA record within its group
 * 
 * @param recordId - TABELA record ID
 * @param firma - BankPF record (contains tabelaRecords and tabelaGroups)
 * @returns KLM code (e.g., "01", "02", "03") or undefined (if not in a group)
 */
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
  const groupRecords = (firma.tabelaRecords || [])
    .filter(r => 
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

/**
 * Find Group Information
 * Finds the group that a TABELA record belongs to
 * 
 * @param recordId - TABELA record ID
 * @param firma - BankPF record
 * @returns Group information or undefined
 */
export const getTabelaGroup = (
  recordId: string,
  firma: BankPF
): TabelaGroup | undefined => {
  return firma.tabelaGroups?.find(g => 
    g.recordIds.includes(recordId)
  );
};

/**
 * Group Name Abbreviation
 * Shortens group name (e.g., "Deniz-1.86" → "Deniz")
 * 
 * @param groupName - Full group name
 * @returns Abbreviated group name
 */
export const getGroupAbbreviation = (groupName: string): string => {
  return groupName.split('-')[0];
};

/**
 * Aggregate All TABELA Records
 * Combines TABELA records from all companies
 * 
 * @param bankPFRecords - All BankPF records
 * @returns Extended TABELA records (with company info, KLM, group info)
 */
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
  
  bankPFRecords.forEach(firma => {
    (firma.tabelaRecords || []).forEach(tabela => {
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

/**
 * Get Company TABELA Records
 * Gets TABELA records for a specific company
 * 
 * @param firmaId - Company ID
 * @param bankPFRecords - All BankPF records
 * @returns Company TABELA records (with KLM and group info)
 */
export const getFirmaTabelaRecords = (
  firmaId: string,
  bankPFRecords: BankPF[]
): ExtendedTabelaRecord[] => {
  const firma = bankPFRecords.find(b => b.id === firmaId);
  
  if (!firma) {
    return [];
  }
  
  return (firma.tabelaRecords || []).map(tabela => {
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

/**
 * Get TABELA Records by Group
 * Gets records in a specific TABELA group
 * 
 * @param grupId - Group ID
 * @param firma - BankPF record
 * @returns Group TABELA records (sorted by KLM)
 */
export const getGroupTabelaRecords = (
  grupId: string,
  firma: BankPF
): ExtendedTabelaRecord[] => {
  const grup = firma.tabelaGroups?.find(g => g.id === grupId);
  
  if (!grup) {
    return [];
  }
  
  const records = (firma.tabelaRecords || [])
    .filter(t => grup.recordIds.includes(t.id) && !t.ekGelirDetay)
    .map((tabela, index) => ({
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

/**
 * Filter Active TABELA Records
 * Returns only active TABELA records
 * 
 * @param records - TABELA records
 * @returns Active records
 */
export const getActiveTabelaRecords = (
  records: ExtendedTabelaRecord[]
): ExtendedTabelaRecord[] => {
  return records.filter(r => r.aktif === true);
};

/**
 * Filter by Revenue Model
 * Returns TABELA records with a specific revenue model
 * 
 * @param records - TABELA records
 * @param gelirModeliAd - Revenue model name ("Gelir Ortaklığı", "Sabit Komisyon", "Hazine Geliri")
 * @returns Filtered records
 */
export const getTabelaByGelirModeli = (
  records: ExtendedTabelaRecord[],
  gelirModeliAd: string
): ExtendedTabelaRecord[] => {
  return records.filter(r => r.gelirModeli?.ad === gelirModeliAd);
};

/**
 * Filter by Product
 * Returns TABELA records with a specific product
 * 
 * @param records - TABELA records
 * @param urun - Product type
 * @returns Filtered records
 */
export const getTabelaByUrun = (
  records: ExtendedTabelaRecord[],
  urun: 'UnattendedPOS' | 'AttendedPOS' | 'SoftPOS' | 'SanalPOS'
): ExtendedTabelaRecord[] => {
  return records.filter(r => r.urun === urun);
};