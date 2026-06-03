'use client'
import { useEffect, useState } from 'react'
import {
  getGsheetStats, triggerSyncToStokHarian, getGsheetLastSync
} from '@/lib/supabaseGsheet'
import { getAvailableDates, getStok } from '@/lib/supabase'
import {
  RefreshCw, CheckCircle2, AlertCircle, Database,
  Clock, Wifi, Play, FileSpreadsheet
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function GsheetSyncPage() {
  const [stats, setStats]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [dates, setDates]     = useState<string[]>([])
  const [selDate, setSelDate] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([getGsheetStats(), getAvailableDates()])
      setStats(s)
      setDates(d)
      if (d[0]) setSelDate(d[0])
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await triggerSyncToStokHarian(selDate || undefined)
      toast.success(`✅ Sync berhasil! ${result.synced_rows} baris diperbarui.`)
      load()
    } catch (e: any) {
      toast.error('Sync gagal: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  const lastSync = stats?.lastSyncedAt
    ? formatDistanceToNow(new Date(stats.lastSyncedAt), { addSuffix: true, locale: id })
    : 'Belum pernah'

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">G-Sheet Integration</h1>
          <p className="page-subtitle">Status sync data dari Google Sheets ke Supabase</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="stat-value text-navy">{loading ? '…' : stats?.totalRows?.toLocaleString('id') || 0}</div>
            <Database size={16} className="text-slate-300 mt-1" />
          </div>
          <div className="stat-label">Total Baris G-Sheet</div>
          <div className="text-xs text-slate-400 mt-0.5">di tabel master</div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div className="stat-value text-emerald-600">{loading ? '…' : stats?.operators?.length || 0}</div>
            <CheckCircle2 size={16} className="text-slate-300 mt-1" />
          </div>
          <div className="stat-label">Operator Terdeteksi</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {stats?.operators?.join(', ') || '-'}
          </div>
        </div>

        <div className="stat-card col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="stat-value text-sky-600 text-lg">{lastSync}</div>
              <div className="stat-label">Terakhir Sync</div>
            </div>
            <Clock size={16} className="text-slate-300 mt-1" />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {stats?.lastSyncedAt
              ? format(new Date(stats.lastSyncedAt), "dd MMM yyyy, HH:mm", { locale: id })
              : 'Belum ada data dari G-Sheet'}
          </div>
        </div>
      </div>

      {/* Manual sync trigger */}
      <div className="card p-5 mb-5">
        <div className="text-sm font-display font-semibold text-[#1A2332] mb-1">
          Sync Manual ke Stok Harian
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Trigger sync dari tabel G-Sheet master ke tabel stok_harian untuk tanggal tertentu.
          Biasanya ini otomatis — gunakan ini hanya jika perlu force sync.
        </p>
        <div className="flex items-center gap-3">
          <select
            className="input-base w-44"
            value={selDate}
            onChange={e => setSelDate(e.target.value)}
          >
            <option value="">Hari ini</option>
            {dates.map(d => (
              <option key={d} value={d}>
                {format(new Date(d), 'dd MMM yyyy', { locale: id })}
              </option>
            ))}
          </select>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-primary"
          >
            <Play size={14} />
            {syncing ? 'Menyinkronkan...' : 'Sync Sekarang'}
          </button>
        </div>
      </div>

      {/* Setup guide */}
      <div className="card p-5">
        <div className="text-sm font-display font-semibold text-[#1A2332] mb-4">
          Cara Setup Apps Script di G-Sheet
        </div>
        <div className="space-y-4">
          {[
            {
              step: '1',
              title: 'Buka Apps Script di G-Sheet',
              desc: 'Di G-Sheet Anda → Extensions → Apps Script',
              code: null,
            },
            {
              step: '2',
              title: 'Paste kode NTE_Sync_AppsScript.js',
              desc: 'Copy isi file NTE_Sync_AppsScript.js, paste ke editor Apps Script',
              code: null,
            },
            {
              step: '3',
              title: 'Isi konfigurasi CONFIG',
              desc: 'Ganti SUPABASE_URL dan SUPABASE_KEY dengan nilai dari project Supabase Anda',
              code: `SUPABASE_URL:  'https://xxxx.supabase.co'
SUPABASE_KEY:  'service_role_key_bukan_anon_key'`,
            },
            {
              step: '4',
              title: 'Tambahkan environment variable di Vercel',
              desc: 'Di Vercel Dashboard → Settings → Environment Variables:',
              code: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
GSHEET_SYNC_SECRET=nte-sync-secret-2025`,
            },
            {
              step: '5',
              title: 'Jalankan setupTriggers()',
              desc: 'Di Apps Script → pilih function setupTriggers → klik Run → authorize → selesai!',
              code: null,
            },
          ].map(({ step, title, desc, code }) => (
            <div key={step} className="flex gap-4">
              <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#1A2332]">{title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                {code && (
                  <div className="mt-2 bg-[#0d1117] rounded-lg px-4 py-3 font-mono text-xs text-[#a8d4ff] whitespace-pre">
                    {code}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700">
              <strong>Gunakan Service Role Key</strong>, bukan anon key. Service Role Key ada di
              Supabase Dashboard → Settings → API → <code>service_role</code>.
              Jangan pernah expose key ini di frontend.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
