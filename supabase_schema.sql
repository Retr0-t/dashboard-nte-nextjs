-- ================================================================
-- NTE Dashboard — Supabase Schema
-- Jalankan di Supabase SQL Editor (Project > SQL Editor > New query)
-- ================================================================

-- Tabel master stok NTE (di-push dari G-Sheet via Apps Script)
-- Setiap baris = 1 unit fisik NTE dengan SN unik
CREATE TABLE IF NOT EXISTS master_stok_nte (
  id             BIGSERIAL PRIMARY KEY,
  row_number     INTEGER UNIQUE,        -- nomor baris di G-Sheet (key upsert)

  -- Kolom dari G-Sheet
  reg            TEXT,                  -- REG
  witel          TEXT,                  -- WITEL
  wh_code        TEXT,                  -- WH CODE
  warehouse      TEXT,                  -- WH SO (SESUAI SCMT)
  status_nte     TEXT,                  -- STATUS: NTE BARU / REFURBISH
  jenis          TEXT,                  -- JENIS
  jenis_nte      TEXT,                  -- JENIS 2: ONT DUAL BAND, STB, dll
  merk           TEXT,                  -- MERK
  type_nte       TEXT,                  -- TYPE: ONT_FIBERHOME_HG6145D2, dll
  sn             TEXT,                  -- Serial Number (unik per unit)
  status_scmt    TEXT,                  -- STATUS SCMT: AVAILABLE, dll
  tanggal_update TEXT,                  -- TANGGAL UPDATE
  operator       TEXT,                  -- dari OWNER: TELKOMSEL/TELKOM/TIF

  -- Metadata
  source         TEXT    DEFAULT 'gsheet',
  synced_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_mstr_operator   ON master_stok_nte(operator);
CREATE INDEX IF NOT EXISTS idx_mstr_warehouse  ON master_stok_nte(warehouse);
CREATE INDEX IF NOT EXISTS idx_mstr_type       ON master_stok_nte(type_nte);
CREATE INDEX IF NOT EXISTS idx_mstr_jenis      ON master_stok_nte(jenis_nte);
CREATE INDEX IF NOT EXISTS idx_mstr_status     ON master_stok_nte(status_nte);
CREATE INDEX IF NOT EXISTS idx_mstr_sn         ON master_stok_nte(sn);

-- Policy: izinkan service role write dari Apps Script
ALTER TABLE master_stok_nte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON master_stok_nte
  FOR ALL USING (true) WITH CHECK (true);

-- ================================================================
-- VERIFIKASI: cek data masuk setelah sync
-- ================================================================
-- SELECT operator, COUNT(*) FROM master_stok_nte GROUP BY operator;
-- SELECT warehouse, jenis_nte, type_nte, status_nte, COUNT(*) as stok
-- FROM master_stok_nte
-- WHERE operator = 'TELKOMSEL'
-- GROUP BY warehouse, jenis_nte, type_nte, status_nte
-- ORDER BY jenis_nte, type_nte;
