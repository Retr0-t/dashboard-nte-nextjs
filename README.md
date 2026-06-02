# NTE Dashboard — Next.js + Supabase

Sistem pelaporan stok harian NTE (Network Terminal Environment)  
Telkom Indonesia · Area Bandung & Soreang · Operator: Telkomsel, Telkom, TIF

---

## Tech Stack

| Layer     | Teknologi |
|-----------|-----------|
| Frontend  | Next.js 14 (App Router) + TypeScript |
| Styling   | Tailwind CSS |
| Database  | Supabase (PostgreSQL) |
| Charts    | Recharts |
| Export    | jsPDF + html2canvas |
| Deploy    | Vercel |

---

## Setup (5 menit)

### 1. Buat project Supabase

1. Buka [supabase.com](https://supabase.com) → New project
2. Buka **SQL Editor** → paste isi file `supabase_schema.sql` → Run
3. Buka **Settings → API** → salin `URL` dan `anon key`

### 2. Setup environment

```bash
cp .env.example .env.local
# Edit .env.local, isi SUPABASE_URL dan SUPABASE_ANON_KEY
```

### 3. Install & jalankan

```bash
npm install
npm run dev
# Buka http://localhost:3000
```

---

## Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di dashboard Vercel:
# NEXT_PUBLIC_SUPABASE_URL = ...
# NEXT_PUBLIC_SUPABASE_ANON_KEY = ...
```

Atau: push ke GitHub → import di [vercel.com](https://vercel.com) → set env vars → deploy otomatis.

---

## Halaman

| Route | Keterangan |
|-------|-----------|
| `/dashboard` | Overview stok + KPI + coverage WH |
| `/laporan-harian` | Pivot tabel mirip G-Sheet + export PDF/JPG |
| `/input` | Input stok spreadsheet-style (semua WH 1 layar) |
| `/upload` | Upload data dari Excel |
| `/rekap` | Rekap otomatis semua operator-area |
| `/tren` | Grafik tren stok harian |
| `/export` | Export PDF & JPG per operator-area |
| `/master` | Master data WH, katalog NTE, panduan WA Bot |

---

## Edit Master Data

Buka `src/lib/masterData.ts`:

```ts
// Tambah warehouse baru
"TELKOMSEL - BANDUNG": {
  warehouses: [
    "TA SO INV AHMAD YANI WH",
    "TA SO INV WAREHOUSE BARU", // ← tambah di sini
  ]
}

// Tambah type NTE baru
NTE_CATALOG.TELKOMSEL["ONT DUAL BAND"].push("ONT_BARU_TYPE")
```

---

## WhatsApp Bot

Lihat `nte_whatsapp_bot/README.md` untuk panduan setup bot.

Perintah utama:
```
/laporan                     → semua laporan hari ini
/laporan telkomsel bandung   → 1 laporan PDF
/laporan semua jpg           → semua JPG
/stok                        → ringkasan teks
```

---

*NTE Operations · Telkom Indonesia · 2025*
