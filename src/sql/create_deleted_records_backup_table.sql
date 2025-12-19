-- ========================================
-- SİLİNEN KAYITLAR YEDEK TABLOSU
-- ========================================
-- Her silme işleminde kaydı buraya yedekle

CREATE TABLE IF NOT EXISTS deleted_records_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    record_data JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by TEXT,
    reason TEXT,
    can_restore BOOLEAN DEFAULT true,
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_by TEXT
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_deleted_records_table ON deleted_records_backup(table_name);
CREATE INDEX IF NOT EXISTS idx_deleted_records_date ON deleted_records_backup(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_records_can_restore ON deleted_records_backup(can_restore);

COMMENT ON TABLE deleted_records_backup IS 'Tüm silinen kayıtların yedeği - geri yükleme için';
COMMENT ON COLUMN deleted_records_backup.record_data IS 'Silinen kaydın tüm verisi (JSONB)';
COMMENT ON COLUMN deleted_records_backup.can_restore IS 'Geri yüklenebilir mi?';
