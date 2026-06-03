-- ============================================================
-- Supabase Schema Tambahan — G-Sheet Integration
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Tabel master dari G-Sheet (data mentah, semua field dari G-Sheet)
CREATE TABLE IF NOT EXISTS gsheet_master_stok (
  id              BIGSERIAL PRIMARY KEY,
  row_number      INTEGER,            -- nomor baris di G-Sheet (untuk upsert key)

  -- Kolom asli dari G-Sheet
  reg             TEXT,               -- kolom REG
  witel           TEXT,               -- kolom WITEL
  wh_code         TEXT,               -- kolom WH CODE
  warehouse       TEXT,               -- kolom WH SO (SESUAI SCMT)
  status_nte      TEXT,               -- kolom STATUS (NTE BARU / REFURBISH)
  jenis           TEXT,               -- kolom JENIS
  jenis_nte       TEXT,               -- kolom JENIS 2 (ONT DUAL BAND, STB, dll)
  merk            TEXT,               -- kolom MERK
  type_nte        TEXT,               -- kolom TYPE
  sn              TEXT,               -- kolom SN (Serial Number)
  status_scmt     TEXT,               -- kolom STATUS SCMT
  tanggal_update  TEXT,               -- kolom TANGGAL UPDATE
  operator        TEXT,               -- dari OWNER: INV→TELKOMSEL, CCAN→TELKOM, TIF→TIF

  -- Metadata sync
  source          TEXT DEFAULT 'gsheet',
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Unique key: row_number sebagai identifier per baris G-Sheet
  UNIQUE(row_number)
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_gsheet_warehouse  ON gsheet_master_stok(warehouse);
CREATE INDEX IF NOT EXISTS idx_gsheet_operator   ON gsheet_master_stok(operator);
CREATE INDEX IF NOT EXISTS idx_gsheet_type_nte   ON gsheet_master_stok(type_nte);
CREATE INDEX IF NOT EXISTS idx_gsheet_status_nte ON gsheet_master_stok(status_nte);
CREATE INDEX IF NOT EXISTS idx_gsheet_tanggal    ON gsheet_master_stok(tanggal_update);

-- ============================================================
-- VIEW: closing stock per tanggal dari G-Sheet
-- Hitung jumlah unit per (tanggal, operator, warehouse, type, status)
-- ============================================================
CREATE OR REPLACE VIEW v_gsheet_stok_harian AS
SELECT
  COALESCE(tanggal_update, TO_CHAR(NOW(), 'YYYY-MM-DD'))::DATE  AS tanggal,
  operator,
  warehouse,
  jenis_nte,
  type_nte,
  status_nte,
  COUNT(*) AS closing_stock   -- setiap baris = 1 unit NTE
FROM gsheet_master_stok
WHERE
  operator  IS NOT NULL AND
  warehouse IS NOT NULL AND
  type_nte  IS NOT NULL AND
  status_nte IN ('NTE BARU', 'REFURBISH', 'NTE baru', 'Refurbish')
GROUP BY
  tanggal, operator, warehouse, jenis_nte, type_nte, status_nte
ORDER BY
  tanggal DESC, operator, warehouse, jenis_nte, type_nte, status_nte;

-- ============================================================
-- FUNCTION: sync dari gsheet_master_stok ke stok_harian
-- Dipanggil oleh API endpoint setelah G-Sheet push data
-- ============================================================
CREATE OR REPLACE FUNCTION sync_gsheet_to_stok_harian(p_tanggal DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(synced_rows INTEGER, tanggal DATE) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Upsert dari view ke tabel stok_harian
  INSERT INTO stok_harian (
    tanggal, operator, area, area_key,
    warehouse, jenis_nte, type_nte, status_nte, closing_stock, updated_at
  )
  SELECT
    v.tanggal,
    v.operator,
    CASE
      WHEN v.warehouse ILIKE '%SOREANG%' OR v.warehouse ILIKE '%BANJARAN%'
        OR v.warehouse ILIKE '%MAJALAYA%' OR v.warehouse ILIKE '%CIWIDEY%'
        OR v.warehouse ILIKE '%KADIPATEN%' OR v.warehouse ILIKE '%MAJALENGKA%'
        OR v.warehouse ILIKE '%SUMEDANG%'
      THEN 'SOREANG'
      ELSE 'BANDUNG'
    END AS area,
    CONCAT(v.operator, ' - ',
      CASE
        WHEN v.warehouse ILIKE '%SOREANG%' OR v.warehouse ILIKE '%BANJARAN%'
          OR v.warehouse ILIKE '%MAJALAYA%' OR v.warehouse ILIKE '%CIWIDEY%'
          OR v.warehouse ILIKE '%KADIPATEN%' OR v.warehouse ILIKE '%MAJALENGKA%'
          OR v.warehouse ILIKE '%SUMEDANG%'
        THEN 'SOREANG'
        ELSE 'BANDUNG'
      END
    ) AS area_key,
    v.warehouse,
    COALESCE(v.jenis_nte, 'Lainnya'),
    UPPER(v.type_nte),
    UPPER(v.status_nte),
    v.closing_stock,
    NOW()
  FROM v_gsheet_stok_harian v
  WHERE v.tanggal = p_tanggal
    AND v.operator IS NOT NULL
  ON CONFLICT (tanggal, operator, warehouse, type_nte, status_nte)
  DO UPDATE SET
    closing_stock = EXCLUDED.closing_stock,
    updated_at    = NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count, p_tanggal;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- POLICY: izinkan service role write ke gsheet_master_stok
-- ============================================================
ALTER TABLE gsheet_master_stok ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON gsheet_master_stok
  FOR ALL
  USING (true)
  WITH CHECK (true);
