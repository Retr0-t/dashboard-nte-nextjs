-- ============================================================
-- NTE Dashboard — Supabase Schema
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Tabel utama stok harian
CREATE TABLE IF NOT EXISTS stok_harian (
  id            BIGSERIAL PRIMARY KEY,
  tanggal       DATE        NOT NULL,
  operator      TEXT        NOT NULL,
  area          TEXT        NOT NULL,
  area_key      TEXT        NOT NULL,
  warehouse     TEXT        NOT NULL,
  jenis_nte     TEXT        NOT NULL,
  type_nte      TEXT        NOT NULL,
  status_nte    TEXT        NOT NULL,
  closing_stock INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint untuk upsert
  UNIQUE(tanggal, operator, warehouse, type_nte, status_nte)
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_stok_tanggal    ON stok_harian(tanggal);
CREATE INDEX IF NOT EXISTS idx_stok_operator   ON stok_harian(operator);
CREATE INDEX IF NOT EXISTS idx_stok_area_key   ON stok_harian(area_key);
CREATE INDEX IF NOT EXISTS idx_stok_type       ON stok_harian(type_nte);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_stok_updated
  BEFORE UPDATE ON stok_harian
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) — aktifkan jika perlu auth
-- ALTER TABLE stok_harian ENABLE ROW LEVEL SECURITY;

-- View: rekap per area per tanggal
CREATE OR REPLACE VIEW v_rekap_area AS
SELECT
  tanggal, operator, area, area_key,
  jenis_nte, type_nte, status_nte,
  SUM(closing_stock) AS total_stock
FROM stok_harian
GROUP BY tanggal, operator, area, area_key, jenis_nte, type_nte, status_nte;

-- View: grand total per tanggal per operator
CREATE OR REPLACE VIEW v_grand_total AS
SELECT
  tanggal, operator, area,
  SUM(closing_stock) AS total_stock,
  COUNT(DISTINCT warehouse) AS wh_count,
  COUNT(DISTINCT type_nte) AS type_count
FROM stok_harian
GROUP BY tanggal, operator, area;
