'use client'

import { shortWH } from './masterData'

export interface ExportData {
  rows: any[]
  warehouses: string[]
  owner: string
  area: string
  tanggal: string
}

const OP_RGB: Record<string, [number, number, number]> = {
  INV: [13, 71, 161],
  CCAN: [27, 94, 32],
  TIF: [230, 81, 0],
}

export async function generatePDF(data: ExportData): Promise<void> {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default

  const {
    rows,
    warehouses,
    owner,
    area,
    tanggal,
  } = data

  const rgb = OP_RGB[owner] || [30, 58, 95]

  const shortWHs = warehouses.map(shortWH)

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  doc.setFillColor(...rgb)
  doc.rect(0, 0, pageW, 22, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)

  doc.text(
    `STOCK NTE ${owner} — ${area}`,
    pageW / 2,
    10,
    { align: 'center' }
  )

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  doc.text(
    `Tanggal: ${tanggal} | WH: ${warehouses.length} | ${new Date().toLocaleString('id-ID')}`,
    pageW / 2,
    17,
    { align: 'center' }
  )

  let prevJenis = ''

  const body = rows.map((r) => {
    const jenis =
      r.jenis_2 !== prevJenis
        ? r.jenis_2
        : ''

    prevJenis = r.jenis_2

    return [
      jenis,
      r.status || '',
      String(r.type || '').replace(/_/g, ' '),
      ...warehouses.map((wh) =>
        (r[wh] || 0) > 0
          ? String(r[wh])
          : ''
      ),
      r.grand_total > 0
        ? String(r.grand_total)
        : '',
    ]
  })

  const grandTotal = rows.reduce(
    (s, r) => s + (r.grand_total || 0),
    0
  )

  body.push([
    'Grand Total',
    '',
    '',
    ...warehouses.map((wh) => {
      const t = rows.reduce(
        (s, r) => s + (Number(r[wh]) || 0),
        0
      )

      return t > 0 ? String(t) : ''
    }),
    String(grandTotal),
  ])

  const nWH = warehouses.length

  autoTable(doc, {
    startY: 26,
    head: [
      [
        'JENIS 2',
        'STATUS',
        'TYPE',
        ...shortWHs,
        'TOTAL',
      ],
    ],
    body,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
    headStyles: {
      fillColor: rgb,
      textColor: [255, 255, 255],
    },
  })

  doc.setFontSize(7)
  doc.setTextColor(150)

  doc.text(
    `Telkom Akses · ${owner} · ${area}`,
    pageW / 2,
    pageH - 5,
    { align: 'center' }
  )

  doc.save(
    `STOCK_NTE_${owner}_${area}_${tanggal}.pdf`
  )
}

export async function generateJPG(
  data: ExportData
): Promise<void> {
  const html2canvas =
    (await import('html2canvas')).default

  const {
    rows,
    warehouses,
    owner,
    area,
    tanggal,
  } = data

  const rgb =
    OP_RGB[owner] || [30, 58, 95]

  const hex = `rgb(${rgb.join(',')})`

  const shortWHs =
    warehouses.map(shortWH)

  const total = rows.reduce(
    (s, r) => s + (r.grand_total || 0),
    0
  )

  const el = document.createElement('div')

  el.style.cssText = `
    position:fixed;
    left:-9999px;
    top:0;
    background:white;
    padding:16px;
    font-family:Arial,sans-serif;
    width:${Math.max(
      900,
      380 + warehouses.length * 72
    )}px
  `

  document.body.appendChild(el)

  let prevJenis = ''

  el.innerHTML = `
    <div style="border-radius:12px;overflow:hidden;background:white">
      <div style="background:${hex};padding:14px;color:white">
        <div style="font-size:16px;font-weight:bold">
          STOCK NTE ${owner} - ${area}
        </div>
        <div style="font-size:10px">
          ${tanggal} | ${total.toLocaleString('id-ID')} unit
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:11px">

      <thead>
      <tr>
      <th>JENIS 2</th>
      <th>STATUS</th>
      <th>TYPE</th>
      ${shortWHs
        .map((w) => `<th>${w}</th>`)
        .join('')}
      <th>TOTAL</th>
      </tr>
      </thead>

      <tbody>

      ${rows
        .map((r) => {
          const jenis =
            r.jenis_2 !== prevJenis
              ? r.jenis_2
              : ''

          prevJenis = r.jenis_2

          return `
          <tr>
            <td>${jenis}</td>
            <td>${r.status || ''}</td>
            <td>${String(
              r.type || ''
            ).replace(/_/g, ' ')}</td>

            ${warehouses
              .map(
                (wh) =>
                  `<td>${
                    r[wh] || ''
                  }</td>`
              )
              .join('')}

            <td>${r.grand_total || ''}</td>
          </tr>
          `
        })
        .join('')}

      </tbody>
      </table>
    </div>
  `

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
  })

  document.body.removeChild(el)

  const a =
    document.createElement('a')

  a.download =
    `STOCK_NTE_${owner}_${area}_${tanggal}.jpg`

  a.href = canvas.toDataURL(
    'image/jpeg',
    0.95
  )

  a.click()
}
