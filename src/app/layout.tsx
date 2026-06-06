import type { Metadata } from 'next'
import { DM_Sans, Syne, DM_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from 'react-hot-toast'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })
const syne   = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap', weight: ['400','600','700','800'] })
const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-dm-mono', display: 'swap', weight: ['300','400','500'] })

export const metadata: Metadata = {
  title: 'NTE Dashboard — Telkom Indonesia',
  description: 'Sistem Pelaporan Stok Harian Network Terminal Environment',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${dmSans.variable} ${syne.variable} ${dmMono.variable}`}>
      <body className="bg-[#F0F4F8] min-h-screen font-sans antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen">
            <div className="p-6 max-w-[1600px] mx-auto">{children}</div>
          </main>
        </div>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'var(--font-dm-sans)', fontSize: '13px', borderRadius: '10px' },
        }} />
      </body>
    </html>
  )
}
