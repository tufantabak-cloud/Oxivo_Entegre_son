// TABELA TypeScript Interface'leri ve Tipler
import { TabelaRecord, TabelaGroup } from '../TabelaTab';
import { EkGelir } from '../RevenueModelsTab';

// Komisyon Oranı Tipi
export interface KomisyonOrani {
  vade: string;
  oran: string;
  alisTL?: string;
  satisTL?: string;
  karTL?: string;
  aktif: boolean;
}

// Hazine Geliri Tipi
export interface HazineGeliri {
  tutarTL: string;
  oxivoYuzde: string;
  kazancTL: string;
}

// Form Data - Tüm form state'lerini tek objede topluyoruz
export interface TabelaFormData {
  kisaAciklama: string;
  urun: 'UnattendedPOS' | 'AttendedPOS' | 'SoftPOS' | 'SanalPOS' | '';
  kartTipi: 'Credit' | 'Debit' | 'Paçal' | '';
  gelirModeliId: string;
  selectedEkGelirId: string;
  selectedKartProgramIds: string[];
  yurtIciDisi: 'Yurt İçi' | 'Yurt Dışı' | '';
  komisyonOranları: KomisyonOrani[];
  kurulusOrani: string;
  oxivoOrani: string;
  aciklama: string;
  fotograf: string;
  hazineGeliri: HazineGeliri;
}

// Grup Form Data
export interface GroupFormData {
  selectedRecordsForGroup: string[];
  groupName: string;
  groupStartDate: string;
  groupEndDate: string;
  groupAktif: boolean;
}

// Gelir Modeli Tipi
export interface GelirModeli {
  id: string;
  ad: string;
  aktif: boolean;
}

// Banka Tipi
export interface Bank {
  id: string;
  kod: string;
  bankaAdi: string;
  aktif: boolean;
}

// Kart Program Tipi
export interface KartProgram {
  id: string;
  kartAdi: string;
  aktif: boolean;
}

// Props Tipleri
export interface FirmaTabelaTabProps {
  firmaId: string;
  firmaAdi: string;
  firmaTipi: 'Banka' | 'PF';
  odemeKurulusuTipi?: 'ÖK' | 'EPK' | '';
  gelirModelleri?: GelirModeli[];
  ekGelirler?: EkGelir[];
  banks?: Bank[];
  kartProgramlar?: KartProgram[];
  tabelaRecords?: TabelaRecord[];
  tabelaGroups?: TabelaGroup[];
  onTabelaRecordsChange?: (records: TabelaRecord[]) => void;
  onTabelaGroupsChange?: (groups: TabelaGroup[]) => void;
  vadeListesi?: string[]; // Artık props olarak alınıyor
}

// Form Dialog Props
export interface TabelaFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: TabelaFormData;
  onFormDataChange: (data: Partial<TabelaFormData>) => void;
  currentStep: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSave: () => void;
  editingRecord: TabelaRecord | null;
  gelirModelleri: GelirModeli[];
  ekGelirler: EkGelir[];
  kartProgramlar: KartProgram[];
  vadeListesi: string[];
  isEditingGroupedRecord: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKomisyonChange: (vade: string, value: string) => void;
  onAlisTLChange: (vade: string, value: string) => void;
  onSatisTLChange: (vade: string, value: string) => void;
  onVadeAktifChange: (vade: string, aktif: boolean) => void;
  onHazineTutarTLChange: (value: string) => void;
  onHazineOxivoYuzdeChange: (value: string) => void;
  onHazineKazancTLChange: (value: string) => void;
  isPacalGelirModeli: boolean;
}

// Row Props
export interface TabelaRowProps {
  record: TabelaRecord;
  vadeListesi: string[];
  onEdit: (record: TabelaRecord) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onClose: (record: TabelaRecord) => void;
  group?: TabelaGroup;
  isGrouped: boolean;
  rowSpan?: number;
  isFirstInGroup?: boolean;
}

// Group Dialog Props
export interface TabelaGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupFormData: GroupFormData;
  onGroupFormDataChange: (data: Partial<GroupFormData>) => void;
  onCreateGroup: () => void;
  editingGroup: TabelaGroup | null;
  availableRecords: TabelaRecord[];
}
