import type { Metadata } from 'next'
import { Cormorant_Garamond, Syne } from 'next/font/google'
import { SessionWrapper } from '@/components/SessionWrapper'
import { BackToTop } from '@/components/BackToTop'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { Analytics } from '@vercel/analytics/next'
import { initServerJsonLogging } from '@/lib/logger'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-syne',
})

initServerJsonLogging()

export const metadata: Metadata = {
  title: 'Shelf — Your reading life, beautifully tracked.',
  description: 'Log the books you\'ve read. Save the ones you want to read. Tell the world what you think.',
  openGraph: {
    title: 'Shelf',
    description: 'Letterboxd for books.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${syne.variable}`}>
      <body><SessionWrapper>{children}</SessionWrapper><BackToTop /><KeyboardShortcuts /><Analytics /></body>
    </html>
  )
}
