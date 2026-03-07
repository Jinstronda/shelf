import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { SettingsClient } from '@/components/SettingsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings — Shelf' }

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  return (
    <>
      <SiteNav />
      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 600, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 32,
            fontWeight: 700, color: '#fff', marginBottom: 40,
          }}>
            Settings
          </h1>

          <div style={{
            background: '#1c2028', borderRadius: 6, padding: 24,
            marginBottom: 24,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              color: '#567', textTransform: 'uppercase', marginBottom: 20,
            }}>
              Export Data
            </div>
            <p style={{ fontSize: 14, color: '#9aa', lineHeight: 1.6, marginBottom: 16 }}>
              Download your reading history as a CSV file.
            </p>
            <a href="/api/export" download style={{
              display: 'inline-block', background: 'var(--copper)', color: '#fff',
              border: 'none', borderRadius: 4, padding: '8px 20px',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              fontFamily: 'inherit',
            }}>
              Download CSV
            </a>
          </div>

          <SettingsClient />
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
