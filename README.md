# NTE Dashboard v2.0
**Sistem Pelaporan Stok Harian Network Terminal Environment**
Telkom Indonesia · Bandung & Soreang · Operator: Telkomsel, Telkom, TIF

---

## Stack
| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Sync | Google Apps Script (onEdit + daily) |
| Export | jsPDF + html2canvas |
| Deploy | Vercel |

---

## Setup (urutan wajib)

### 1. Supabase
1. Buat project di [supabase.com](https://supabase.com)
2. SQL Editor → paste & run `supabase_schema.sql`
3. Catat **URL** dan **anon key** dari Settings → API

### 2. Environment variables
```bash
cp .env.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Install & run
```bash
npm install
npm run dev
# Buka http://localhost:3000
```

### 4. Deploy ke Vercel
```bash
vercel
# Tambahkan env vars di Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# GSHEET_SYNC_SECRET
```

### 5. Setup G-Sheet Sync
1. Buka G-Sheet → Extensions → Apps Script
2. Paste isi `NTE_Sync_AppsScript.js`
3. Isi `CONFIG` (SUPABASE_URL, SUPABASE_KEY, NEXTJS_API_URL)
4. Jalankan `setupTriggers()` → authorize → selesai

---

## Halaman
| Route | Keterangan |
|-------|-----------|
| `/dashboard` | Overview stok + coverage WH semua operator |
| `/laporan-harian` | Pivot table stok NTE per operator-area (dari Supabase) |
| `/rekap` | Rekap semua operator-area sekaligus |
| `/export` | Download PDF & JPG laporan |
| `/gsheet` | Status sync G-Sheet + panduan setup |
| `/master` | Daftar warehouse & info sistem |

---

## Cara kerja laporan harian
```
G-Sheet (1 baris = 1 unit NTE dengan SN unik)
    ↓ Apps Script onEdit / daily 06:00 WIB
master_stok_nte (Supabase)
    ↓ COUNT(*) GROUP BY (warehouse × type_nte × status_nte)
Laporan Harian (pivot table identik dengan G-Sheet laporan)
```

---

## Edit warehouse
Edit `src/lib/masterData.ts` bagian `AREA_CONFIG`:
```ts
"TELKOMSEL - BANDUNG": {
  warehouses: [
    "TA SO INV AHMAD YANI WH",
    "TA SO INV WH BARU",  // ← tambah di sini
  ]
}
```

---
*NTE Operations · Telkom Indonesia · 2025*
