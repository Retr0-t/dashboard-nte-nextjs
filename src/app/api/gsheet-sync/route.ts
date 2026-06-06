import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SYNC_SECRET = process.env.GSHEET_SYNC_SECRET || 'nte-sync-secret-2025'

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('x-sync-secret')
    if (auth !== SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { count } = await supabaseAdmin
      .from('master_stok_nte')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      total_rows: count,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
