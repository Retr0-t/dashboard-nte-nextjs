-- ================================================================
-- NTE Dashboard — Supabase Schema
-- Tabel: master_stock_nte (sesuai data existing di Supabase)
-- Jalankan HANYA jika tabel belum ada
-- ================================================================

-- Tabel master stok NTE (1 baris = 1 unit fisik dengan SN unik)
-- Di-push dari Google Sheets via Apps Script
CREATE TABLE IF NOT EXISTS master_stock_nte (
  id             BIGSERIAL,
  sn             TEXT NOT NULL,          -- Serial Number (primary key bisnis)
  reg            TEXT,                   -- REG
  witel          TEXT,                   -- WITEL (BANDUNG / SOREANG dll)
  wh_code        TEXT,                   -- WH CODE
  wh_so          TEXT,                   -- WH SO (SESUAI SCMT)
  status         TEXT,                   -- NTE BARU / REFURBISH
  jenis          TEXT,                   -- JENIS
  jenis_2        TEXT,                   -- JENIS 2 (ONT DUAL BAND, STB, dll)
  merk           TEXT,                   -- MERK
  type           TEXT,                   -- TYPE NTE lengkap
  status_scmt    TEXT,                   -- STATUS SCMT
  tanggal_update TEXT,                   -- TANGGAL UPDATE
  owner          TEXT,                   -- INV=TELKOMSEL, CCAN=TELKOM, TIF=TIF
  updated_at     TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (sn)
);

-- Index untuk performa query laporan harian
CREATE INDEX IF NOT EXISTS idx_msn_owner   ON master_stock_nte(owner);
CREATE INDEX IF NOT EXISTS idx_msn_witel   ON master_stock_nte(witel);
CREATE INDEX IF NOT EXISTS idx_msn_wh_so   ON master_stock_nte(wh_so);
CREATE INDEX IF NOT EXISTS idx_msn_jenis2  ON master_stock_nte(jenis_2);
CREATE INDEX IF NOT EXISTS idx_msn_type    ON master_stock_nte(type);
CREATE INDEX IF NOT EXISTS idx_msn_status  ON master_stock_nte(status);

-- ================================================================
-- VERIFIKASI — jalankan query ini untuk cek data
-- ================================================================
-- Cek total per owner:
-- SELECT owner, COUNT(*) FROM master_stock_nte GROUP BY owner;

-- Cek laporan harian TELKOMSEL (owner=INV):
-- SELECT wh_so, jenis_2, type, status, COUNT(*) as stok
-- FROM master_stock_nte
-- WHERE owner = 'INV'
-- GROUP BY wh_so, jenis_2, type, status
-- ORDER BY jenis_2, type, status;
