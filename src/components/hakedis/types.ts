/**
 * HAKEDİŞ V2 - TYPE DEFINITIONS
 * Supabase earnings tablosu ile 1:1 mapping
 */

export interface HakedisV2Record {
  // 🔑 Primary Key
  id: string;
  
  // 🏢 İlişkiler
  firmaId: string;              // FK → bank_accounts.id
  tabelaGroupId: string;        // TABELA grup ID
  tabelaGroupAd?: string;       // Grup adı (display için)
  
  // 📅 Dönem ve Vade
  donem: string;                // YYYY-MM format
  vade: string;                 // D+1, D+7, D+14, D+31
  
  // 📊 Durum
  durum: 'Taslak' | 'Kesinleşmiş';
  aktif?: boolean;              // Soft delete (false = silinmiş)
  
  // 💰 İşlem Hacmi Mapping (JSONB)
  islemHacmiMap?: Record<string, number>;  // tabelaId → hacim
  
  // 💸 İşlem Hacmi Artışları (Manuel Ek)
  pfIslemHacmi?: string | number;          // PF ek işlem hacmi
  oxivoIslemHacmi?: string | number;       // OXİVO ek işlem hacmi
  
  // 💵 Ek Gelir
  ekGelirAciklama?: string;
  ekGelirPFTL?: number;
  ekGelirOXTL?: number;
  
  // ➖ Kesintiler
  ekKesintiAciklama?: string;
  ekKesintiPFTL?: number;
  ekKesintiOXTL?: number;
  
  // 🎯 Manuel Override (Otomatik hesaplamayı ezer)
  manualAnaTabelaIslemHacmi?: string | number;
  manualAnaTabelaOxivoTotal?: string | number;
  manualEkGelirOxivoTotal?: string | number;
  
  // 📈 Hesaplanmış Değerler (Cache - Read only)
  totalIslemHacmi?: number;
  totalPFPay?: number;
  totalOxivoPay?: number;
  
  // 📝 Metadata
  notlar?: string;
  olusturanKullanici?: string;
  createdAt?: string;           // ISO timestamp (Supabase: created_at)
  updatedAt?: string;           // ISO timestamp (Supabase: updated_at)
}

export interface HakedisV2ListItem extends HakedisV2Record {
  // Liste görünümü için ek display alanları
  kurumAdi?: string;
  tabelaSayisi?: number;
}

export interface HakedisV2FormData {
  tabelaGroupId: string;
  donem: string;
  vade: string;
  islemHacmiMap: Record<string, string>;  // Form'da string
  pfIslemHacmi?: string;
  oxivoIslemHacmi?: string;
  ekGelirAciklama?: string;
  ekGelirPFTL?: number | '';
  ekGelirOXTL?: number | '';
  ekKesintiAciklama?: string;
  ekKesintiPFTL?: number | '';
  ekKesintiOXTL?: number | '';
  manualAnaTabelaIslemHacmi?: string;
  manualAnaTabelaOxivoTotal?: string;
  notlar?: string;
}
