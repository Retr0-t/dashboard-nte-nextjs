// lib/supabaseGsheet.ts
// Query data dari gsheet_master_stok dan transform ke format laporan harian

import { supabase } from './supabase'
import { shortWH } from './masterData'

export interface GsheetUnit {
  id: number
  reg: string
  witel: string
  wh_code: string
  warehouse: string
  status_nte: string
  jenis: string
  jenis_nte: string
  merk: string
  type_nte: string
  sn: string
  status_scmt: string
  tanggal_update: string
  operator: string
  synced_at: string
}

export interface PivotRow {
  jenis_nte: string
  type_nte:  string
  status_nte: string
  grand_total: number
  [warehouse: string]: string | number
}

// ── Ambil data mentah dari G-Sheet master ────────────────────────────────────
export async function getGsheetRaw(params: {
  operator?:  string
  warehouse?: string
  area_keys?: string[]   // filter by area (Bandung/Soreang WH names)
}): Promise<GsheetUnit[]> {
  let q = supabase
    .from('gsheet_master_stok')
    .select('*')
    .not('type_nte', 'is', null)
    .not('warehouse', 'is', null)

  if (params.operator)  q = q.eq('operator', params.operator)
  if (params.warehouse) q = q.eq('warehouse', params.warehouse)

  // Filter status hanya NTE BARU dan REFURBISH (abaikan "RUSAK" dll)
  q = q.in('status_nte', ['NTE BARU', 'REFURBISH', 'NTE baru', 'Refurbish',
                           'NTE BARU ', 'REFURBISH '])  // trim safety

  const { data, error } = await q
  if (error) throw error
  return (data || []) as GsheetUnit[]
}

// ── COUNT per group → format laporan harian ──────────────────────────────────
export async function getLaporanHarian(params: {
  operator:   string
  warehouses: string[]   // WH resmi dari masterData
}): Promise<PivotRow[]> {
  const { operator, warehouses } = params

  // Ambil semua unit untuk operator ini, filter hanya WH yang terdaftar
  const { data, error } = await supabase
    .from('gsheet_master_stok')
    .select('warehouse, jenis_nte, type_nte, status_nte')
    .eq('operator', operator)
    .not('type_nte', 'is', null)
    .not('warehouse', 'is', null)

  if (error) throw error
  if (!data?.length) return []

  // Normalisasi status
  const normalize = (s: string) => {
    const t = (s || '').trim().toUpperCase()
    if (t.includes('BARU')) return 'NTE BARU'
    if (t.includes('REFURB')) return 'REFURBISH'
    return t
  }

  // COUNT per (jenis_nte, type_nte, status_nte, warehouse)
  const countMap: Record<string, Record<string, number>> = {}
  // key = "jenis||type||status"

  for (const row of data) {
    const wh     = row.warehouse?.trim()
    const type   = (row.type_nte || '').trim()
    const status = normalize(row.status_nte || '')
    const jenis  = (row.jenis_nte || 'Lainnya').trim()

    if (!wh || !type || !status) continue

    const key = `${jenis}||${type}||${status}`
    if (!countMap[key]) countMap[key] = {}
    countMap[key][wh] = (countMap[key][wh] || 0) + 1
  }

  // Build pivot rows
  const pivotRows: PivotRow[] = []

  for (const [key, whCounts] of Object.entries(countMap)) {
    const [jenis_nte, type_nte, status_nte] = key.split('||')

    const row: PivotRow = {
      jenis_nte, type_nte, status_nte,
      grand_total: 0,
    }

    let grand = 0
    for (const wh of warehouses) {
      const count = whCounts[wh] || 0
      row[wh]     = count
      grand      += count
    }
    row.grand_total = grand

    // Hanya tampilkan baris yang ada stoknya
    if (grand > 0) pivotRows.push(row)
  }

  // Sort: jenis_nte → type_nte → status (NTE BARU dulu)
  pivotRows.sort((a, b) => {
    if (a.jenis_nte !== b.jenis_nte) return a.jenis_nte.localeCompare(b.jenis_nte)
    if (a.type_nte  !== b.type_nte)  return a.type_nte.localeCompare(b.type_nte)
    // NTE BARU sebelum REFURBISH
    if (a.status_nte === 'NTE BARU' && b.status_nte !== 'NTE BARU') return -1
    if (a.status_nte !== 'NTE BARU' && b.status_nte === 'NTE BARU') return 1
    return 0
  })

  return pivotRows
}

// ── Statistik G-Sheet ─────────────────────────────────────────────────────────
export async function getGsheetStats() {
  const { count: totalRows } = await supabase
    .from('gsheet_master_stok')
    .select('*', { count: 'exact', head: true })

  const { data: opData } = await supabase
    .from('gsheet_master_stok')
    .select('operator')
    .not('operator', 'is', null)

  const { data: latest } = await supabase
    .from('gsheet_master_stok')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  const operators = [...new Set((opData || []).map(r => r.operator).filter(Boolean))]

  return {
    totalRows:    totalRows || 0,
    operators,
    lastSyncedAt: latest?.synced_at || null,
  }
}

// ── Trigger sync G-Sheet → stok_harian ───────────────────────────────────────
export async function triggerSyncToStokHarian(tanggal?: string) {
  const { data, error } = await supabase.rpc('sync_gsheet_to_stok_harian', {
    p_tanggal: tanggal || new Date().toISOString().split('T')[0],
  })
  if (error) throw error
  return data?.[0] || { synced_rows: 0 }
}

export async function getGsheetLastSync(): Promise<string | null> {
  const { data } = await supabase
    .from('gsheet_master_stok')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()
  return data?.synced_at || null
}
