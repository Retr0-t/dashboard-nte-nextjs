# NTE Dashboard v2.0
Sistem Pelaporan Stok Harian NTE · Telkom Indonesia
Bandung & Soreang · Operator: TELKOMSEL (INV), TELKOM (CCAN), TIF

---

## Stack
| Layer    | Teknologi |
|----------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Database | Supabase · tabel `master_stock_nte` |
| Sync     | Google Apps Script (onEdit + daily 06:00 WIB) |
| Export   | jsPDF + html2canvas |
| Deploy   | Vercel |

---

## Struktur database (Supabase)

Tabel: `master_stock_nte`

| Field | Keterangan |
|-------|-----------|
| `sn` | Serial Number — primary key unik per unit |
| `owner` | **INV** = TELKOMSEL · **CCAN** = TELKOM · **TIF** = TIF |
| `witel` | BANDUNG / SOREANG (difilter dengan ILIKE) |
| `wh_so` | Nama WH SO sesuai SCMT |
| `jenis_2` | Jenis 2: ONT DUAL BAND, STB, ORBIT, dll |
| `type` | Type NTE: ONT_FIBERHOME_HG6145D2, dll |
| `status` | NTE BARU / REFURBISH |

Laporan harian = `COUNT(*) GROUP BY (wh_so × jenis_2 × type × status)` WHERE `owner = 'INV'`

---

## Setup

### 1. Clone & install
```bash
npm install
cp .env.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Jalankan lokal
```bash
npm run dev
# http://localhost:3000
```

### 3. Deploy Vercel
```bash
vercel
# Tambah env vars di Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# GSHEET_SYNC_SECRET
```

### 4. Setup G-Sheet Sync
1. G-Sheet → Extensions → Apps Script
2. Paste `NTE_Sync_AppsScript.js`
3. Isi `CONFIG`: SUPABASE_URL, SUPABASE_KEY, TABLE_NAME = `master_stock_nte`
4. Jalankan `setupTriggers()` sekali → authorize → selesai

---

## Halaman
| Route | Keterangan |
|-------|-----------|
| `/dashboard` | Overview + KPI + coverage WH semua operator |
| `/laporan-harian` | Pivot tabel mirip G-Sheet laporan (dari Supabase) |
| `/rekap` | Rekap semua operator-area sekaligus |
| `/export` | Download PDF & JPG |
| `/gsheet` | Status sync + panduan setup |
| `/master` | Daftar WH, owner mapping, info sistem |

---

## Edit warehouse
File: `src/lib/masterData.ts`
```ts
'INV|BANDUNG': {
  owner: 'INV',       // nilai field owner di DB
  operator: 'TELKOMSEL',
  witel: 'BANDUNG',   // dipakai untuk filter ILIKE
  warehouses: [
    'TA SO INV AHMAD YANI WH',  // nilai field wh_so di DB
    // tambah WH baru di sini
  ]
}
```

---
*NTE Operations · Telkom Indonesia · 2025*
