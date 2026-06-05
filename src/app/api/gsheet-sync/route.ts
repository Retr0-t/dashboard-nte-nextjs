// src/app/api/gsheet-sync/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYNC_SECRET =
  process.env.GSHEET_SYNC_SECRET ||
  "nte-sync-secret-2025";

/**
 * POST
 * dipanggil Apps Script setelah sync selesai
 */
export async function POST(req: NextRequest) {

  try {

    const secret =
      req.headers.get("x-sync-secret");

    if (secret !== SYNC_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (body.action === "ping") {

      return NextResponse.json({
        success: true,
        message: "API aktif",
        timestamp: new Date().toISOString()
      });

    }

    if (body.action === "count_stock") {

      const { count, error } =
        await supabaseAdmin
          .from("master_stock_nte")
          .select("*", {
            count: "exact",
            head: true
          });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        total_stock: count
      });

    }

    return NextResponse.json({
      success: true,
      message: "Tidak ada proses yang dijalankan"
    });

  } catch (err: any) {

    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message
      },
      {
        status: 500
      }
    );

  }
}

/**
 * GET
 * cek status API
 */
export async function GET() {

  try {

    const { count, error } =
      await supabaseAdmin
        .from("master_stock_nte")
        .select("*", {
          count: "exact",
          head: true
        });

    if (error) throw error;

    return NextResponse.json({
      status: "ok",
      table: "master_stock_nte",
      total_rows: count,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {

    return NextResponse.json(
      {
        status: "error",
        error: err.message
      },
      {
        status: 500
      }
    );

  }
}
