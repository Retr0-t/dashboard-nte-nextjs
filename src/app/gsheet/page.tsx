'use client'
import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/lib/supabase'
import { RefreshCw, CheckCircle2, AlertCircle, Database, Clock, Copy, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

function Code({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group rounded-xl overflow-hidden mt-2">
      <pre className="bg-[#0d1117] text-[#a8d4ff] text-[11px] font-mono leading-relaxed px-4 py-3 overflow-x-auto whitespace-pre">
        {text}
      </pre>
      <button onClick={copy}
        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white/60 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 transition opacity-0 group-hover:opacity-100">
        {copied ? <Check size={10}/> : <Copy size={10}/>} {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function GsheetPage() {
  const [stats,   setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getDashboardStats().then(s => { setStats(s); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const lastSync = stats?.lastSyncedAt
    ? formatDistanceToNow(new Date(stats.lastSyncedAt), { addSuffix: true, locale: id })
    : null

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="page-title">G-Sheet Sync</h1>
          <p className="page-subtitle">Status koneksi Google Sheets → Supabase dan panduan setup</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-xs">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="stat-value text-[#1E3A5F]">
              {loading ? '…' : stats?.totalUnits?.toLocaleString('id') || '0'}
            </div>
            <Database size={16} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Total Unit di Supabase</div>
          <div className="text-xs text-slate-400 mt-0.5">tabel master_stok_nte</div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="stat-value text-emerald-600">
              {loading ? '…' : stats?.operators?.length || '0'}
            </div>
            <CheckCircle2 size={16} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Operator Terdeteksi</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {stats?.operators?.join(', ') || '-'}
          </div>
        </div>

        <div className="stat-card col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div className="stat-value text-sky-600 text-lg mt-1">
              {loading ? '…' : (lastSync || 'Belum sync')}
            </div>
            <Clock size={16} className="text-slate-300 mt-1"/>
          </div>
          <div className="stat-label">Terakhir Sync</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {stats?.totalUnits ? '✅ Data tersedia' : '⚠️ Belum ada data'}
          </div>
        </div>
      </div>

      {/* Alur data */}
      <div className="card p-5 mb-5">
        <div className="text-sm font-display font-semibold mb-4">Alur Data</div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { label: 'G-Sheet', sub: '1 baris = 1 unit NTE', color: '#1B5E20' },
            { label: '→', sub: '', color: 'transparent' },
            { label: 'Apps Script', sub: 'onEdit + daily trigger', color: '#0D47A1' },
            { label: '→', sub: '', color: 'transparent' },
            { label: 'Supabase', sub: 'master_stok_nte', color: '#2E6DA4' },
            { label: '→', sub: '', color: 'transparent' },
            { label: 'Dashboard', sub: 'COUNT per group', color: '#1E3A5F' },
          ].map((item, i) => (
            item.label === '→'
              ? <div key={i} className="text-slate-400 text-lg">→</div>
              : (
                <div key={i} className="rounded-xl px-4 py-3 text-white text-center min-w-[100px]"
                  style={{ background: item.color }}>
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-white/60 text-[10px] mt-0.5">{item.sub}</div>
                </div>
              )
          ))}
        </div>
      </div>

      {/* Setup guide */}
      <div className="card p-5">
        <div className="text-sm font-display font-semibold mb-5">Cara Setup Apps Script di G-Sheet</div>
        <div className="space-y-6">

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#1A2332]">Jalankan SQL Schema di Supabase</div>
              <p className="text-xs text-slate-400 mt-0.5 mb-2">Buka Supabase → SQL Editor → paste & run file <code className="bg-slate-100 px-1 rounded">supabase_schema.sql</code></p>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                  <CheckCircle2 size={12}/> Tabel master_stok_nte
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                  <CheckCircle2 size={12}/> Index & RLS Policy
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#1A2332]">Buka Apps Script di G-Sheet</div>
              <p className="text-xs text-slate-400 mt-0.5">Di G-Sheet → Extensions → Apps Script → paste file <code className="bg-slate-100 px-1 rounded">NTE_Sync_AppsScript.js</code></p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#1A2332]">Isi konfigurasi CONFIG</div>
              <p className="text-xs text-slate-400 mt-0.5 mb-1">Ganti nilai berikut di bagian CONFIG script:</p>
              <Code text={`SUPABASE_URL:  'https://xxxx.supabase.co',   // dari Supabase Settings > API
SUPABASE_KEY:  'eyJhbGci...',                // Service Role Key (bukan anon key!)
TABLE_NAME:    'master_stok_nte',
SHEET_NAME:    'Sheet1',                     // nama sheet G-Sheet Anda
NEXTJS_API_URL:'https://your-app.vercel.app'`} />
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                ⚠️ Gunakan <strong>Service Role Key</strong>, bukan anon key. Ada di Supabase → Settings → API → service_role
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#1A2332]">Tambahkan env vars di Vercel</div>
              <Code text={`SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
GSHEET_SYNC_SECRET       = nte-sync-secret-2025`} />
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">5</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#1A2332]">Jalankan setupTriggers() — sekali saja</div>
              <p className="text-xs text-slate-400 mt-0.5">Di Apps Script → pilih fungsi <strong>setupTriggers</strong> → klik Run → authorize → selesai!</p>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                💡 Setelah setup, setiap perubahan di G-Sheet otomatis masuk ke Supabase (onEdit trigger).
                Full sync juga berjalan otomatis setiap hari jam 06:00 WIB.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
