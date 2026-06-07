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
  TELKOMSEL: [27, 94, 32],
  TELKOM: [13, 71, 161],
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

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  doc.text(
    `Tanggal: ${tanggal}`,
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
      r.status_scmt,
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

  const grandTotalRow = [
    'Grand Total',
    '',
    '',

    ...warehouses.map((wh) => {
      const total = rows.reduce(
        (sum, row) =>
          sum + Number(row[wh] || 0),
        0
      )

      return total > 0
        ? String(total)
        : ''
    }),

    String(
      rows.reduce(
        (sum, row) =>
          sum + Number(row.grand_total || 0),
        0
      )
    ),
  ]

  body.push(grandTotalRow)

  autoTable(doc, {
    startY: 28,

    head: [
      [
        'JENIS 2',
        'STATUS',
        'TYPE',
        ...shortWHs,
        'GRAND TOTAL',
      ],
    ],

    body,

    theme: 'grid',

    headStyles: {
      fillColor: rgb,
      textColor: [255, 255, 255],
      fontSize: 7,
    },

    styles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
  })

  doc.setFontSize(7)
  doc.setTextColor(120)

  doc.text(
    `${owner} • ${area} • ${tanggal}`,
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

  const headerColor =
    `rgb(${rgb.join(',')})`

  const total = rows.reduce(
    (sum, row) =>
      sum + Number(row.grand_total || 0),
    0
  )

  const container =
    document.createElement('div')

  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    background: white;
    padding: 20px;
    width: 1400px;
  `

  let prevJenis = ''

  container.innerHTML = `
    <div style="border:1px solid #ddd">
      <div style="
        background:${headerColor};
        color:white;
        padding:12px;
        font-weight:bold;
      ">
        STOCK NTE ${owner} - ${area}
      </div>

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:11px;
      ">
        <thead>
          <tr>
            <th>JENIS 2</th>
            <th>STATUS</th>
            <th>TYPE</th>

            ${warehouses
              .map(
                (w) =>
                  `<th>${shortWH(w)}</th>`
              )
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
                  <td>${r.status_scmt}</td>
                  <td>${String(r.type || '')
                    .replace(/_/g, ' ')}</td>

                  ${warehouses
                    .map(
                      (wh) =>
                        `<td>${
                          Number(r[wh] || 0) || ''
                        }</td>`
                    )
                    .join('')}

                  <td>${r.grand_total}</td>
                </tr>
              `
            })
            .join('')}

          <tr>
            <td colspan="3">
              Grand Total
            </td>

            ${warehouses
              .map((wh) => {
                const totalWH =
                  rows.reduce(
                    (s, r) =>
                      s +
                      Number(
                        r[wh] || 0
                      ),
                    0
                  )

                return `<td>${totalWH}</td>`
              })
              .join('')}

            <td>${total}</td>
          </tr>

        </tbody>
      </table>
    </div>
  `

  document.body.appendChild(container)

  const canvas =
    await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
    })

  document.body.removeChild(container)

  const link =
    document.createElement('a')

  link.download =
    `STOCK_NTE_${owner}_${area}_${tanggal}.jpg`

  link.href =
    canvas.toDataURL(
      'image/jpeg',
      0.95
    )

  link.click()
}
