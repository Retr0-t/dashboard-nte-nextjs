// lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

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

  updated_at?: string
}

/* ============================================================
   GET ALL DATA
============================================================ */

export async function getMasterStock(): Promise<MasterStockRow[]> {
  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error(error)
    throw error
  }

  return data || []
}

/* ============================================================
   FILTER OWNER
============================================================ */

export async function getByOwner(
  owner: string
): Promise<MasterStockRow[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .eq('owner', owner)

  if (error) {
    console.error(error)
    throw error
  }

  return data || []
}

/* ============================================================
   FILTER WITEL
============================================================ */

export async function getByWitel(
  witel: string
): Promise<MasterStockRow[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .ilike('witel', `%${witel}%`)

  if (error) {
    console.error(error)
    throw error
  }

  return data || []
}

/* ============================================================
   FILTER OWNER + WITEL
============================================================ */

export async function getByOwnerAndWitel(
  owner: string,
  witel: string
): Promise<MasterStockRow[]> {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('*')
    .eq('owner', owner)
    .ilike('witel', `%${witel}%`)

  if (error) {
    console.error(error)
    throw error
  }

  return data || []
}

/* ============================================================
   DASHBOARD SUMMARY
============================================================ */

export async function getDashboardSummary() {

  const { count, error } = await supabase
    .from('master_stock_nte')
    .select('*', {
      count: 'exact',
      head: true
    })

  if (error) {
    console.error(error)
    throw error
  }

  return {
    total_stock: count || 0
  }
}

/* ============================================================
   TOTAL PER OWNER
============================================================ */

export async function getOwnerSummary() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('owner')

  if (error) {
    console.error(error)
    throw error
  }

  const summary: Record<string, number> = {}

  data?.forEach(row => {

    const owner = row.owner || 'UNKNOWN'

    if (!summary[owner]) {
      summary[owner] = 0
    }

    summary[owner]++
  })

  return summary
}

/* ============================================================
   TOTAL PER WITEL
============================================================ */

export async function getWitelSummary() {

  const { data, error } = await supabase
    .from('master_stock_nte')
    .select('witel')

  if (error) {
    console.error(error)
    throw error
  }

  const summary: Record<string, number> = {}

  data?.forEach(row => {

    const witel = row.witel || 'UNKNOWN'

    if (!summary[witel]) {
      summary[witel] = 0
    }

    summary[witel]++
  })

  return summary
}

/* ============================================================
   TELKOM BANDUNG
============================================================ */

export async function getTelkomBandung() {
  return getByOwnerAndWitel(
    'CCAN',
    'BANDUNG'
  )
}

/* ============================================================
   TELKOM SOREANG
============================================================ */

export async function getTelkomSoreang() {
  return getByOwnerAndWitel(
    'CCAN',
    'SOREANG'
  )
}

/* ============================================================
   TELKOMSEL BANDUNG
============================================================ */

export async function getTelkomselBandung() {
  return getByOwnerAndWitel(
    'INV',
    'BANDUNG'
  )
}

/* ============================================================
   TELKOMSEL SOREANG
============================================================ */

export async function getTelkomselSoreang() {
  return getByOwnerAndWitel(
    'INV',
    'SOREANG'
  )
}

/* ============================================================
   TIF BANDUNG
============================================================ */

export async function getTifBandung() {
  return getByOwnerAndWitel(
    'TIF',
    'BANDUNG'
  )
}

/* ============================================================
   TIF SOREANG
============================================================ */

export async function getTifSoreang() {
  return getByOwnerAndWitel(
    'TIF',
    'SOREANG'
  )
}
