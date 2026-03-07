import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookTags } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tags — Shelf' }

export default async function TagsPage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const rows = await db
    .select({
      tag: bookTags.tag,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(bookTags)
    .where(eq(bookTags.userId, session.user.id!))
    .groupBy(bookTags.tag)
    .orderBy(bookTags.tag)

  const tags = rows.map(r => ({ tag: r.tag, count: Number(r.count) }))

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 700, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            Tags
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 32 }}>
            {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
          </div>

          {tags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No tags yet</div>
              <a href="/search" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Search for books to tag
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {tags.map(t => (
                <a
                  key={t.tag}
                  href={`/tags/${encodeURIComponent(t.tag)}`}
                  style={{
                    background: 'rgba(196,96,58,0.15)', color: '#C4603A',
                    borderRadius: 4, padding: '6px 14px', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {t.tag}
                  <span style={{ fontSize: 11, color: '#567' }}>{t.count}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
