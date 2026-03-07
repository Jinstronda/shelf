import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ImportClient } from '@/components/ImportClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Import from Goodreads — Shelf' }

export default async function ImportPage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')
  return (
    <>
      <SiteNav />
      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 600, margin: '0 auto', padding: '40px 40px 80px' }}>
          <ImportClient />
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
