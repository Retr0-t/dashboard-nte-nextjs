/**
 * NTE Stock — Google Apps Script
 * Sync data G-Sheet ke Supabase (realtime onEdit + backup harian)
 *
 * CARA SETUP:
 * 1. Buka G-Sheet → Extensions → Apps Script
 * 2. Paste seluruh kode ini
 * 3. Isi SUPABASE_URL dan SUPABASE_KEY di bagian CONFIG
 * 4. Klik Run → setupTriggers() sekali untuk pasang trigger otomatis
 * 5. Authorize izin yang diminta → selesai!
 */

// ══════════════════════════════════════════════════════════════
// CONFIG — isi sesuai project Supabase Anda
// ══════════════════════════════════════════════════════════════
const CONFIG = {
  SUPABASE_URL:  'https://xxxxxxxxxxxx.supabase.co',   // ganti dengan URL Supabase Anda
  SUPABASE_KEY:  'eyJhbGciOiJIUzI1NiIsInR5cCI6...',   // Service Role Key (bukan anon key!)
  TABLE_NAME:    'gsheet_master_stok',                  // tabel tujuan di Supabase
  SHEET_NAME:    'Sheet1',                              // nama sheet di G-Sheet (ganti jika berbeda)
  BACKUP_HOUR:   6,                                     // jam backup harian (06:00 WIB = UTC+7 = jam 23 UTC)
  LOG_SHEET:     'Sync Log',                            // sheet untuk log sync (dibuat otomatis)
  NEXTJS_API_URL: 'https://your-app.vercel.app',        // URL app Next.js Anda di Vercel
  SYNC_SECRET:    'nte-sync-secret-2025',               // sama dengan GSHEET_SYNC_SECRET di Vercel
}

// Mapping header G-Sheet → kolom database
// Key   = nama kolom di G-Sheet (persis seperti di baris header)
// Value = nama kolom di Supabase
const COLUMN_MAP = {
  'REG':               'reg',
  'WITEL':             'witel',
  'WH CODE':           'wh_code',
  'WH SO (SESUAI SCMT)': 'warehouse',
  'STATUS':            'status_nte',
  'JENIS':             'jenis',
  'JENIS 2':           'jenis_nte',
  'MERK':              'merk',
  'TYPE':              'type_nte',
  'SN':                'sn',
  'STATUS SCMT':       'status_scmt',
  'TANGGAL UPDATE':    'tanggal_update',
  'OWNER (INV/ CCAN)': 'operator',
}

// Mapping nilai OWNER → operator di database
const OPERATOR_MAP = {
  'INV':    'TELKOMSEL',
  'CCAN':   'TELKOM',
  'TIF':    'TIF',
  'inv':    'TELKOMSEL',
  'ccan':   'TELKOM',
  'tif':    'TIF',
}

// ══════════════════════════════════════════════════════════════
// TRIGGER SETUP — jalankan sekali saja
// ══════════════════════════════════════════════════════════════
function setupTriggers() {
  // Hapus semua trigger lama supaya tidak duplikat
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t))

  // Trigger 1: onEdit — sync baris yang diedit secara realtime
  ScriptApp.newTrigger('onEditSync')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create()

  // Trigger 2: time-driven — full sync harian jam 06:00 WIB
  ScriptApp.newTrigger('dailyFullSync')
    .timeBased()
    .atHour(CONFIG.BACKUP_HOUR - 7 < 0 ? CONFIG.BACKUP_HOUR - 7 + 24 : CONFIG.BACKUP_HOUR - 7)
    .everyDays(1)
    .create()

  writeLog('INFO', 'Triggers berhasil dipasang: onEdit + daily sync jam ' + CONFIG.BACKUP_HOUR + ':00 WIB')
  SpreadsheetApp.getUi().alert('✅ Triggers berhasil dipasang!\n\n• Realtime: setiap ada perubahan di sheet\n• Harian: jam ' + CONFIG.BACKUP_HOUR + ':00 WIB')
}

// ══════════════════════════════════════════════════════════════
// TRIGGER 1 — onEdit: sync baris yang diedit saja
// ══════════════════════════════════════════════════════════════
function onEditSync(e) {
  if (!e) return  // dipanggil manual, tidak ada event

  const sheet = e.source.getActiveSheet()
  if (sheet.getName() !== CONFIG.SHEET_NAME) return  // abaikan sheet lain

  const row = e.range.getRow()
  if (row <= 1) return  // abaikan edit di baris header

  try {
    const headers = getHeaders(sheet)
    const rowData = sheet.getRange(row, 1, 1, headers.length).getValues()[0]
    const record  = buildRecord(headers, rowData, row)

    if (!record) return  // baris kosong / tidak valid

    upsertToSupabase([record])
    writeLog('EDIT', `Baris ${row} di-sync: SN=${record.sn || '-'} TYPE=${record.type_nte || '-'}`)

  } catch (err) {
    writeLog('ERROR', `onEdit baris ${row}: ${err.message}`)
  }
}

// ══════════════════════════════════════════════════════════════
// TRIGGER 2 — Full sync harian: kirim semua baris
// ══════════════════════════════════════════════════════════════
function dailyFullSync() {
  const sheet   = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME)
  if (!sheet) { writeLog('ERROR', `Sheet "${CONFIG.SHEET_NAME}" tidak ditemukan`); return }

  const headers = getHeaders(sheet)
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) { writeLog('INFO', 'Sheet kosong, tidak ada yang di-sync'); return }

  const allData = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
  const records = []

  allData.forEach((row, i) => {
    const rec = buildRecord(headers, row, i + 2)
    if (rec) records.push(rec)
  })

  if (!records.length) { writeLog('INFO', 'Tidak ada baris valid untuk di-sync'); return }

  // Kirim dalam batch agar tidak timeout (max 500 per request)
  const BATCH = 500
  let totalSent = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    upsertToSupabase(batch)
    totalSent += batch.length
    Utilities.sleep(300)  // jeda kecil antar batch
  }

  writeLog('DAILY', `Full sync selesai: ${totalSent} baris dikirim ke Supabase`)

  // Optional: trigger sync di Next.js API (gsheet master → stok_harian)
  try {
    if (CONFIG.NEXTJS_API_URL) {
      UrlFetchApp.fetch(CONFIG.NEXTJS_API_URL + '/api/gsheet-sync', {
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-sync-secret':  CONFIG.SYNC_SECRET || 'nte-sync-secret-2025',
        },
        payload: JSON.stringify({ action: 'sync_to_stok_harian' }),
        muteHttpExceptions: true,
      })
      writeLog('DAILY', 'Trigger sync ke stok_harian berhasil')
    }
  } catch(e) { writeLog('WARN', 'Trigger sync API: ' + e.message) }
}

// ══════════════════════════════════════════════════════════════
// HELPER: build record dari 1 baris
// ══════════════════════════════════════════════════════════════
function buildRecord(headers, rowValues, rowNum) {
  // Cek apakah baris kosong
  const hasData = rowValues.some(v => v !== '' && v !== null && v !== undefined)
  if (!hasData) return null

  const raw = {}
  headers.forEach((h, i) => { raw[h] = rowValues[i] })

  const rec = {}

  // Map setiap kolom G-Sheet ke field database
  Object.entries(COLUMN_MAP).forEach(([gsheetCol, dbCol]) => {
    let val = raw[gsheetCol]

    // Normalisasi nilai
    if (val instanceof Date) {
      val = Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd')
    } else if (val !== null && val !== undefined) {
      val = String(val).trim()
    } else {
      val = null
    }

    rec[dbCol] = val || null
  })

  // Normalisasi operator dari OWNER (INV/CCAN/TIF) → TELKOMSEL/TELKOM/TIF
  if (rec.operator) {
    rec.operator = OPERATOR_MAP[rec.operator] || rec.operator.toUpperCase()
  }

  // Tambah metadata
  rec.row_number  = rowNum
  rec.synced_at   = new Date().toISOString()
  rec.source      = 'gsheet'

  return rec
}

// ══════════════════════════════════════════════════════════════
// HELPER: ambil baris header
// ══════════════════════════════════════════════════════════════
function getHeaders(sheet) {
  const lastCol = sheet.getLastColumn()
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim())
}

// ══════════════════════════════════════════════════════════════
// SUPABASE: upsert records
// ══════════════════════════════════════════════════════════════
function upsertToSupabase(records) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE_NAME}`

  const options = {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
      'Prefer':        'resolution=merge-duplicates,return=minimal',
    },
    payload:     JSON.stringify(records),
    muteHttpExceptions: true,
  }

  const response = UrlFetchApp.fetch(url, options)
  const code     = response.getResponseCode()

  if (code >= 400) {
    const body = response.getContentText()
    throw new Error(`Supabase error ${code}: ${body.substring(0, 200)}`)
  }
}

// ══════════════════════════════════════════════════════════════
// HELPER: tulis log ke sheet "Sync Log"
// ══════════════════════════════════════════════════════════════
function writeLog(type, message) {
  const ss        = SpreadsheetApp.getActive()
  let logSheet    = ss.getSheetByName(CONFIG.LOG_SHEET)

  // Buat sheet log jika belum ada
  if (!logSheet) {
    logSheet = ss.insertSheet(CONFIG.LOG_SHEET)
    logSheet.getRange(1, 1, 1, 3).setValues([['TIMESTAMP', 'TYPE', 'MESSAGE']])
    logSheet.getRange(1, 1, 1, 3).setFontWeight('bold')
    logSheet.setColumnWidth(1, 160)
    logSheet.setColumnWidth(2, 80)
    logSheet.setColumnWidth(3, 500)
  }

  const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss')
  logSheet.appendRow([timestamp, type, message])

  // Batasi log hanya 1000 baris terakhir agar sheet tidak terlalu besar
  const maxRows = 1000
  const currRows = logSheet.getLastRow() - 1  // minus header
  if (currRows > maxRows) {
    logSheet.deleteRows(2, currRows - maxRows)
  }
}

// ══════════════════════════════════════════════════════════════
// MENU tambahan di G-Sheet toolbar
// ══════════════════════════════════════════════════════════════
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 NTE Sync')
    .addItem('Setup Trigger (jalankan sekali)',  'setupTriggers')
    .addSeparator()
    .addItem('Sync Sekarang (full)',             'dailyFullSync')
    .addItem('Cek Status Koneksi',              'checkConnection')
    .addSeparator()
    .addItem('Lihat Log Sync',                  'openLog')
    .addToUi()
}

function openLog() {
  const ss       = SpreadsheetApp.getActive()
  const logSheet = ss.getSheetByName(CONFIG.LOG_SHEET)
  if (logSheet) ss.setActiveSheet(logSheet)
  else SpreadsheetApp.getUi().alert('Log belum ada. Coba sync dulu.')
}

function checkConnection() {
  try {
    const url  = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE_NAME}?limit=1`
    const res  = UrlFetchApp.fetch(url, {
      headers: {
        'apikey':        CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
      },
      muteHttpExceptions: true,
    })
    const code = res.getResponseCode()
    if (code === 200) {
      SpreadsheetApp.getUi().alert('✅ Koneksi ke Supabase berhasil!\nStatus: ' + code)
    } else {
      SpreadsheetApp.getUi().alert('⚠️ Koneksi bermasalah\nStatus: ' + code + '\n' + res.getContentText().substring(0, 300))
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert('❌ Gagal terhubung:\n' + err.message)
  }
}
