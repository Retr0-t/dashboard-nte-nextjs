-- ============================================================
-- NTE Dashboard + Master Inventory NTE
-- Supabase PostgreSQL Schema
-- ============================================================

-- ============================================================
-- TABEL 1 : STOK HARIAN (TETAP)
-- ============================================================

CREATE TABLE IF NOT EXISTS stok_harian (
  id BIGSERIAL PRIMARY KEY,

  tanggal DATE NOT NULL,

  operator TEXT NOT NULL,
  area TEXT NOT NULL,
  area_key TEXT NOT NULL,
  warehouse TEXT NOT NULL,

  jenis_nte TEXT NOT NULL,
  type_nte TEXT NOT NULL,
  status_nte TEXT NOT NULL,

  closing_stock INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (
    tanggal,
    operator,
    warehouse,
    type_nte,
    status_nte
  )
);

CREATE INDEX IF NOT EXISTS idx_stok_tanggal
ON stok_harian(tanggal);

CREATE INDEX IF NOT EXISTS idx_stok_operator
ON stok_harian(operator);

CREATE INDEX IF NOT EXISTS idx_stok_area_key
ON stok_harian(area_key);

CREATE INDEX IF NOT EXISTS idx_stok_type
ON stok_harian(type_nte);

-- ============================================================
-- TABEL 2 : MASTER INVENTORY PER SERIAL NUMBER
-- DATA DARI GOOGLE SHEET
-- ============================================================

CREATE TABLE IF NOT EXISTS master_stock_nte (

  id BIGSERIAL PRIMARY KEY,

  reg TEXT,
  witel TEXT,

  wh_code TEXT,
  wh_so TEXT,

  status TEXT,

  jenis TEXT,
  jenis_2 TEXT,

  merk TEXT,
  type TEXT,

  sn TEXT NOT NULL UNIQUE,

  status_scmt TEXT,

  tanggal_update TIMESTAMPTZ,

  owner TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX MASTER INVENTORY
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_master_sn
ON master_stock_nte(sn);

CREATE INDEX IF NOT EXISTS idx_master_type
ON master_stock_nte(type);

CREATE INDEX IF NOT EXISTS idx_master_merk
ON master_stock_nte(merk);

CREATE INDEX IF NOT EXISTS idx_master_wh
ON master_stock_nte(wh_so);

CREATE INDEX IF NOT EXISTS idx_master_owner
ON master_stock_nte(owner);

CREATE INDEX IF NOT EXISTS idx_master_status
ON master_stock_nte(status);

CREATE INDEX IF NOT EXISTS idx_master_reg
ON master_stock_nte(reg);

CREATE INDEX IF NOT EXISTS idx_master_witel
ON master_stock_nte(witel);

-- ============================================================
-- AUTO UPDATE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stok_updated
ON stok_harian;

CREATE TRIGGER trg_stok_updated
BEFORE UPDATE ON stok_harian
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_master_updated
ON master_stock_nte;

CREATE TRIGGER trg_master_updated
BEFORE UPDATE ON master_stock_nte
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VIEW REKAP AREA
-- ============================================================

CREATE OR REPLACE VIEW v_rekap_area AS
SELECT
  tanggal,
  operator,
  area,
  area_key,
  jenis_nte,
  type_nte,
  status_nte,
  SUM(closing_stock) AS total_stock
FROM stok_harian
GROUP BY
  tanggal,
  operator,
  area,
  area_key,
  jenis_nte,
  type_nte,
  status_nte;

-- ============================================================
-- VIEW GRAND TOTAL
-- ============================================================

CREATE OR REPLACE VIEW v_grand_total AS
SELECT
  tanggal,
  operator,
  area,
  SUM(closing_stock) AS total_stock,
  COUNT(DISTINCT warehouse) AS wh_count,
  COUNT(DISTINCT type_nte) AS type_count
FROM stok_harian
GROUP BY
  tanggal,
  operator,
  area;

-- ============================================================
-- VIEW INVENTORY PER TYPE
-- DARI MASTER SERIAL NUMBER
-- ============================================================

CREATE OR REPLACE VIEW v_inventory_by_type AS
SELECT
  reg,
  witel,
  wh_so,
  owner,
  merk,
  type,
  COUNT(*) AS qty
FROM master_stock_nte
GROUP BY
  reg,
  witel,
  wh_so,
  owner,
  merk,
  type;

-- ============================================================
-- VIEW INVENTORY PER WAREHOUSE
-- ============================================================

CREATE OR REPLACE VIEW v_inventory_by_wh AS
SELECT
  wh_so,
  COUNT(*) AS total_sn
FROM master_stock_nte
GROUP BY wh_so;

-- ============================================================
-- VIEW INVENTORY PER OWNER
-- ============================================================

CREATE OR REPLACE VIEW v_inventory_by_owner AS
SELECT
  owner,
  COUNT(*) AS total_sn
FROM master_stock_nte
GROUP BY owner;
