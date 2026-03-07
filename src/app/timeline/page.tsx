import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { coverPublicUrl } from '@/lib/covers'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

interface Props {
  searchParams: Promise<{ year?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { year } = await searchParams
  return { title: year ? `Timeline ${year} — Shelf` : 'Timeline — Shelf' }
}

export default async function TimelinePage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const params = await searchParams
  const yearParam = params.year ? parseInt(params.year, 10) : null
  const selectedYear = yearParam && yearParam >= 2000 && yearParam <= 2100 ? yearParam : null

  const userId = session.user.id!
  const conditions = [
    eq(userBooks.userId, userId),
    eq(userBooks.status, 'read'),
  ]
  if (selectedYear) {
    conditions.push(
      sql`EXTRACT(YEAR FROM COALESCE(${userBooks.readAt}::timestamp, ${userBooks.createdAt})) = ${selectedYear}`
    )
  }

  const [rows, yearRows] = await Promise.all([
    db
      .select({
        readAt: userBooks.readAt,
        createdAt: userBooks.createdAt,
        rating: userBooks.rating,
        bookTitle: books.title,
        bookGoogleId: books.googleId,
        bookCoverUrl: books.coverUrl,
        bookCoverR2Key: books.coverR2Key,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .where(and(...conditions))
      .orderBy(desc(sql`COALESCE(${userBooks.readAt}::timestamp, ${userBooks.createdAt})`)),
    db.execute(sql`
      SELECT DISTINCT EXTRACT(YEAR FROM COALESCE(read_at::timestamp, created_at))::int AS year
      FROM user_books WHERE user_id = ${userId} AND status = 'read'
      AND COALESCE(read_at::timestamp, created_at) IS NOT NULL
      ORDER BY year DESC
    `),
  ])

  const years = (yearRows.rows as unknown as { year: number }[]).map(r => r.year)

  const entries = rows.map(r => {
    const dateStr = r.readAt ?? (r.createdAt ? r.createdAt.toISOString().slice(0, 10) : null)
    const date = dateStr ? new Date(dateStr) : null
    const cover = r.bookCoverR2Key ? coverPublicUrl(r.bookCoverR2Key) : r.bookCoverUrl
    return {
      date,
      year: date ? date.getFullYear() : null,
      month: date ? date.getMonth() : null,
      rating: r.rating,
      title: r.bookTitle,
      googleId: r.bookGoogleId,
      coverUrl: cover,
    }
  })

  type Entry = typeof entries[number]
  type MonthGroup = { label: string; items: Entry[] }

  const sortedEntries = entries

  const grouped = new Map<string, MonthGroup>()
  for (const entry of sortedEntries) {
    const key = entry.date
      ? `${entry.date.getFullYear()}-${String(entry.date.getMonth()).padStart(2, '0')}`
      : 'unknown'
    const existing = grouped.get(key)
    if (existing) {
      existing.items.push(entry)
    } else {
      const label = entry.date
        ? entry.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'Unknown'
      grouped.set(key, { label, items: [entry] })
    }
  }

  const months = Array.from(grouped.entries()).map(([key, group]) => ({
    key, label: group.label, items: group.items,
  }))

  const pillActive = {
    background: 'rgba(196,96,58,0.2)', color: '#C4603A',
    border: '1px solid rgba(196,96,58,0.3)',
  }
  const pillInactive = {
    background: 'rgba(255,255,255,0.05)', color: '#789',
    border: '1px solid rgba(255,255,255,0.08)',
  }
  const pillBase = {
    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 as const,
    textDecoration: 'none' as const,
  }

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 700, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            Timeline
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 24 }}>
            {entries.length} {entries.length === 1 ? 'book' : 'books'} read
            {selectedYear ? ` in ${selectedYear}` : ''}
          </div>

          {years.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
              marginBottom: 40,
            }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Year</span>
              <a href="/timeline" style={{ ...pillBase, ...(selectedYear === null ? pillActive : pillInactive) }}>All</a>
              {years.map(y => (
                <a key={y} href={`/timeline?year=${y}`} style={{ ...pillBase, ...(selectedYear === y ? pillActive : pillInactive) }}>{y}</a>
              ))}
            </div>
          )}

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No books read yet</div>
              <a href="/search" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Search for books to log
              </a>
            </div>
          ) : (
            months.map(month => (
              <div key={month.key} style={{ marginBottom: 40 }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 8,
                  paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 16,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#ccc' }}>
                    {month.label}
                  </span>
                  <span style={{ fontSize: 12, color: '#567' }}>
                    {month.items.length} {month.items.length === 1 ? 'book' : 'books'}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: 12,
                }}>
                  {month.items.map((entry, i) => (
                    <a
                      key={`${entry.googleId}-${i}`}
                      href={entry.googleId ? `/book/${entry.googleId}` : '#'}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <div style={{
                        aspectRatio: '2/3', borderRadius: 4, overflow: 'hidden',
                        background: '#1c2028',
                      }}>
                        {entry.coverUrl ? (
                          <img
                            src={entry.coverUrl}
                            alt={entry.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 8, textAlign: 'center',
                            fontSize: 11, color: '#567', lineHeight: 1.3,
                          }}>
                            {entry.title}
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 11, color: '#9ab', marginTop: 6,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {entry.title}
                      </div>
                      {entry.rating && (
                        <div style={{ fontSize: 11, color: '#C4603A', marginTop: 2 }}>
                          {renderStars(entry.rating)}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}

function renderStars(rating: number): string {
  const stars = rating / 2
  const full = Math.floor(stars)
  const half = stars % 1 >= 0.5
  let result = '\u2605'.repeat(full)
  if (half) result += '\u00BD'
  return result
}
