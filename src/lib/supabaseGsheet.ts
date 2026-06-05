// lib/supabaseGsheet.ts

import { supabase } from './supabase'

/* ============================================================
   TYPES
============================================================ */

export interface MasterStockRow {
  id?: number

  reg: string | null
  witel: string | null

  wh_code: string | null
  wh_so: string | null

  status: string | null

  jenis: string | null
  jenis_2: string | null

  merk: string | null
  type: string | null

  sn: string

  status_scmt: string | null

  tanggal_update: string | null

  owner: string | null

  updated_at: string | null
}

export interface PivotRow {
  jenis: string
  type: string
  status: string
  grand_total: number

  [key: string]: string | number
}

/* ============================================================
   RAW DATA
============================================================ */

export async function getRawStock(params?: {
  owner?: string
  witel?: string
  wh_so?: string
}): Promise<MasterStockRow[]> {

  let query = supabase
    .from('master_stock_nte')
    .select('*')

  if (params?.owner) {
    query = query.eq('owner', params.owner)
  }

  if (params?.witel) {
    query = query.ilike('witel', `%${params.witel}%`)
  }

  if (params?.wh_so) {
    query = query.ilike('wh_so', `%${params.wh_so}%`)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/* ============================================================
   GET ALL WITEL
============================================================ */

export async function getAllWitel(): Promise<string[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('witel')

  if (error) throw error

  return Array.from(
    new Set(
      (data || [])
        .map(r => r.witel)
        .filter(Boolean)
    )
  )
}

/* ============================================================
   GET ALL OWNER
============================================================ */

export async function getAllOwner(): Promise<string[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('owner')

  if (error) throw error

  return Array.from(
    new Set(
      (data || [])
        .map(r => r.owner)
        .filter(Boolean)
    )
  )
}

/* ============================================================
   GET ALL WH SO
============================================================ */

export async function getAllWarehouse(): Promise<string[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('wh_so')

  if (error) throw error

  return Array.from(
    new Set(
      (data || [])
        .map(r => r.wh_so)
        .filter(Boolean)
    )
  )
}

/* ============================================================
   DASHBOARD SUMMARY
============================================================ */

export async function getDashboardStats() {

  const { count, error } = await supabase
    .from('master_stock_nte')
    .select('*', {
      count: 'exact',
      head: true
    })

  if (error) throw error

  const { data: latest } = await supabase
    .from('master_stock_nte')
    .select('updated_at')
    .order('updated_at', {
      ascending: false
    })
    .limit(1)
    .single()

  return {
    totalRows: count || 0,
    lastUpdated:
      latest?.updated_at || null
  }
}

/* ============================================================
   TELKOM BANDUNG
============================================================ */

export async function getTelkomBandung() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .eq('owner', 'CCAN')
    .ilike('witel', '%BANDUNG%')

  if (error) throw error

  return data || []
}

/* ============================================================
   TELKOM SOREANG
============================================================ */

export async function getTelkomSoreang() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .eq('owner', 'CCAN')
    .ilike('witel', '%SOREANG%')

  if (error) throw error

  return data || []
}

/* ============================================================
   TELKOMSEL BANDUNG
============================================================ */

export async function getTelkomselBandung() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .eq('owner', 'INV')
    .ilike('witel', '%BANDUNG%')

  if (error) throw error

  return data || []
}

/* ============================================================
   TELKOMSEL SOREANG
============================================================ */

export async function getTelkomselSoreang() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .eq('owner', 'INV')
    .ilike('witel', '%SOREANG%')

  if (error) throw error

  return data || []
}

/* ============================================================
   TIF BANDUNG
============================================================ */

export async function getTifBandung() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .eq('owner', 'TIF')
    .ilike('witel', '%BANDUNG%')

  if (error) throw error

  return data || []
}

/* ============================================================
   TIF SOREANG
============================================================ */

export async function getTifSoreang() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .eq('owner', 'TIF')
    .ilike('witel', '%SOREANG%')

  if (error) throw error

  return data || []
}

/* ============================================================
   BUILD PIVOT
============================================================ */

export function buildPivot(
  rows: MasterStockRow[]
): PivotRow[] {

  const map: Record<string, PivotRow> = {}

  for (const row of rows) {

    const warehouse =
      row.wh_so || 'UNKNOWN'

    const key =
      `${row.jenis}|${row.type}|${row.status}`

    if (!map[key]) {

      map[key] = {
        jenis: row.jenis || '',
        type: row.type || '',
        status: row.status || '',
        grand_total: 0
      }
    }

    if (!map[key][warehouse]) {
      map[key][warehouse] = 0
    }

    map[key][warehouse] =
      Number(map[key][warehouse]) + 1

    map[key].grand_total += 1
  }

  return Object.values(map)
}

/* ============================================================
   LAST SYNC
============================================================ */

export async function getLastSync() {

  const { data } = await supabase
    .from('master_stock_nte')
    .select('updated_at')
    .order('updated_at', {
      ascending: false
    })
    .limit(1)
    .single()

  return data?.updated_at || null
}
