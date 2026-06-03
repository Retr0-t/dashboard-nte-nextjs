// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon)

// ── Types ──────────────────────────────────────────────────────────────────
export interface StokRow {
  id?: number
  tanggal: string
  operator: string
  area: string
  area_key: string
  warehouse: string
  jenis_nte: string
  type_nte: string
  status_nte: string
  closing_stock: number
  created_at?: string
  updated_at?: string
}

export interface PivotRow {
  jenis_nte: string
  type_nte: string
  status_nte: string
  [warehouse: string]: string | number
  grand_total: number
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function getAvailableDates(): Promise<string[]> {
  const { data } = await supabase
    .from('stok_harian')
    .select('tanggal')
    .order('tanggal', { ascending: false })
  const unique = [...new Set((data || []).map(r => r.tanggal))]
  return unique
}

export async function getStok(params: {
  tanggal: string
  operator?: string
  area?: string
  area_key?: string
}): Promise<StokRow[]> {
  let q = supabase.from('stok_harian').select('*').eq('tanggal', params.tanggal)
  if (params.operator) q = q.eq('operator', params.operator)
  if (params.area)     q = q.eq('area', params.area)
  if (params.area_key) q = q.eq('area_key', params.area_key)
  const { data } = await q.order('jenis_nte').order('type_nte').order('status_nte')
  return data || []
}

export async function getWHCoverage(tanggal: string) {
  const { data } = await supabase
    .from('stok_harian')
    .select('operator, area, area_key, warehouse')
    .eq('tanggal', tanggal)
  // Deduplicate
  const seen = new Set<string>()
  return (data || []).filter(r => {
    const k = `${r.operator}|${r.warehouse}`
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}

export async function upsertStok(rows: StokRow[]): Promise<{ count: number; error: string | null }> {
  const { error, count } = await supabase
    .from('stok_harian')
    .upsert(rows, {
      onConflict: 'tanggal,operator,warehouse,type_nte,status_nte',
      ignoreDuplicates: false,
    })
    .select()
  return { count: count || rows.length, error: error?.message || null }
}

export async function deleteStok(tanggal: string, operator: string, warehouse: string) {
  await supabase
    .from('stok_harian')
    .delete()
    .eq('tanggal', tanggal)
    .eq('operator', operator)
    .eq('warehouse', warehouse)
}

export async function getGrandTotal(tanggal: string) {
  const { data } = await supabase
    .from('stok_harian')
    .select('operator,area,area_key,jenis_nte,type_nte,status_nte,closing_stock')
    .eq('tanggal', tanggal)
  return data || []
}

export async function getTrend(typeNte: string, statusNte: string, operator?: string) {
  let q = supabase
    .from('stok_harian')
    .select('tanggal,operator,area,closing_stock')
    .eq('type_nte', typeNte)
    .eq('status_nte', statusNte)
    .order('tanggal', { ascending: true })
    .limit(180)
  if (operator) q = q.eq('operator', operator)
  const { data } = await q
  // Group by tanggal+operator+area
  const grouped: Record<string, { tanggal: string; operator: string; area: string; total: number }> = {}
  for (const r of (data || [])) {
    const k = `${r.tanggal}|${r.operator}|${r.area}`
    if (!grouped[k]) grouped[k] = { tanggal: r.tanggal, operator: r.operator, area: r.area, total: 0 }
    grouped[k].total += r.closing_stock
  }
  return Object.values(grouped)
}

// ── Build pivot ────────────────────────────────────────────────────────────
export function buildPivot(rows: StokRow[], warehouses: string[]): PivotRow[] {
  const map: Record<string, PivotRow> = {}
  for (const r of rows) {
    const k = `${r.jenis_nte}||${r.type_nte}||${r.status_nte}`
    if (!map[k]) {
      map[k] = { jenis_nte: r.jenis_nte, type_nte: r.type_nte, status_nte: r.status_nte, grand_total: 0 }
      for (const wh of warehouses) map[k][wh] = 0
    }
    map[k][r.warehouse] = (map[k][r.warehouse] as number || 0) + r.closing_stock
  }
  // Recalc grand total
  for (const row of Object.values(map)) {
    row.grand_total = warehouses.reduce((s, wh) => s + (row[wh] as number || 0), 0)
  }
  return Object.values(map).filter(r => r.grand_total > 0)
}
