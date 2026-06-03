// src/app/api/gsheet-sync/route.ts
// API endpoint yang dipanggil oleh Apps Script setelah push data
// URL: https://your-app.vercel.app/api/gsheet-sync

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Gunakan service role key agar bisa write
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // tambahkan di Vercel env vars
)

// Secret token untuk validasi request dari Apps Script
const SYNC_SECRET = process.env.GSHEET_SYNC_SECRET || 'nte-sync-secret-2025'

export async function POST(req: NextRequest) {
  try {
    // Validasi authorization header
    const auth = req.headers.get('x-sync-secret')
    if (auth !== SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, tanggal } = body

    if (action === 'sync_to_stok_harian') {
      // Panggil function PostgreSQL untuk sync gsheet → stok_harian
      const syncDate = tanggal || new Date().toISOString().split('T')[0]

      const { data, error } = await supabaseAdmin
        .rpc('sync_gsheet_to_stok_harian', { p_tanggal: syncDate })

      if (error) throw error

      return NextResponse.json({
        success:     true,
        message:     `Sync selesai`,
        synced_rows: data?.[0]?.synced_rows || 0,
        tanggal:     syncDate,
      })
    }

    if (action === 'get_status') {
      // Cek berapa baris di gsheet_master_stok
      const { count } = await supabaseAdmin
        .from('gsheet_master_stok')
        .select('*', { count: 'exact', head: true })

      return NextResponse.json({ success: true, total_rows: count })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err: any) {
    console.error('gsheet-sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Endpoint untuk cek status (dipanggil dari checkConnection di Apps Script)
  const auth = req.nextUrl.searchParams.get('secret')
  if (auth !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { count } = await supabaseAdmin
    .from('gsheet_master_stok')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    status:     'ok',
    total_rows: count,
    timestamp:  new Date().toISOString(),
  })
}
