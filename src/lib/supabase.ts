// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ──────────────────────────────────────────────────────────────────
export interface MasterStokRow {
  id:            number
  row_number:    number
  reg:           string
  witel:         string
  wh_code:       string
  wh_so:         string
  status_nte:    string
  jenis:         string
  jenis_2:       string
  merk:          string
  type:          string
  sn:            string
  status_scmt:   string
  tanggal_update:string
  operator:      string
  synced_at:     string
}

export interface PivotRow {
  jenis_2:   string
  type:    string
  status_scmt:  string
  grand_total: number
  [warehouse: string]: string | number
}

// ── Normalize status ────────────────────────────────────────────────────────
function normalizeStatus(s: string): string {
  const t = (s || '').trim().toUpperCase()
  if (t.includes('BARU'))   return 'NTE BARU'
  if (t.includes('REFURB')) return 'REFURBISH'
  return t
}

// ── getLaporanHarian ────────────────────────────────────────────────────────
// Ambil semua unit dari master_stok_nte untuk 1 operator,
// lalu COUNT per (jenis_nte, type_nte, status_nte, warehouse) → pivot
export async function getLaporanHarian(params: {
  operator: string
  warehouses: string[]
}): Promise<PivotRow[]> {
  const { operator, warehouses } = params

  const { data, error } = await supabase
    .from('master_stok_nte')
    .select('wh_so, jenis_2, type, status_scmt')
    .eq('operator', operator)
    .not('type', 'is', null)
    .not('wh_so', 'is', null)

  if (error) throw error
  if (!data?.length) return []

  const countMap: Record<string, Record<string, number>> = {}

  for (const row of data) {
    const wh = (row.wh_so || '').trim()

    const type = (row.type || '').trim()
    const status = normalizeStatus(row.status_scmt || '')
    const jenis = (row.jenis_2 || 'Lainnya').trim()

    if (!wh || !type || !['NTE BARU', 'REFURBISH'].includes(status))
      continue

    const key = `${jenis}||${type}||${status}`

    if (!countMap[key])
      countMap[key] = {}

    countMap[key][wh] = (countMap[key][wh] || 0) + 1
  }

  const rows: PivotRow[] = []

  for (const [key, whCounts] of Object.entries(countMap)) {
    const [jenis_nte, type_nte, status_nte] = key.split('||')

    const row: PivotRow = {
      jenis_2,
      type,
      status_scmt,
      grand_total: 0
    }

    let grand = 0

    for (const wh of warehouses) {
      const v = whCounts[wh] || 0
      row[wh] = v
      grand += v
    }

    row.grand_total = grand

    if (grand > 0)
      rows.push(row)
  }

  return rows
}
// ── getDashboardStats ───────────────────────────────────────────────────────
export async function getDashboardStats() {
  const { count: total } = await supabase
    .from('master_stok_nte')
    .select('*', { count: 'exact', head: true })

  const { data: opData } = await supabase
    .from('master_stok_nte')
    .select('operator')
    .not('operator', 'is', null)

  const { data: latest } = await supabase
    .from('master_stok_nte')
    .select('synced_at, tanggal_update')
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  const operators = Array.from(new Set((opData || []).map((r: any) => r.operator).filter(Boolean)))

  return {
    totalUnits:    total || 0,
    operators,
    lastSyncedAt:  latest?.synced_at     || null,
    lastUpdatedAt: latest?.tanggal_update || null,
  }
}

// ── getWHCoverage ───────────────────────────────────────────────────────────
export async function getWHCoverage(operator?: string) {
  let q = supabase
    .from('master_stok_nte')
    .select('operator, wh_so')
    .not('wh_so', 'is', null)

  if (operator) q = q.eq('operator', operator)

  const { data } = await q
  const seen = new Set<string>()
  return (data || []).filter((r: any) => {
    const k = `${r.operator}|${r.wh_so}`
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}
