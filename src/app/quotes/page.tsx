import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookQuotes, books } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { resolveCoverUrl } from '@/lib/covers'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quotes — Shelf' }

export default async function QuotesPage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const rows = await db
    .select({
      id: bookQuotes.id,
      quote: bookQuotes.quote,
      pageNumber: bookQuotes.pageNumber,
      chapter: bookQuotes.chapter,
      createdAt: bookQuotes.createdAt,
      bookId: bookQuotes.bookId,
      bookTitle: books.title,
      bookGoogleId: books.googleId,
      bookCoverUrl: books.coverUrl,
      bookCoverR2Key: books.coverR2Key,
    })
    .from(bookQuotes)
    .innerJoin(books, eq(bookQuotes.bookId, books.id))
    .where(eq(bookQuotes.userId, session.user.id!))
    .orderBy(desc(bookQuotes.createdAt))

  const grouped = new Map<string, { title: string; googleId: string | null; coverUrl: string | null; quotes: typeof rows }>()
  for (const row of rows) {
    const existing = grouped.get(row.bookId)
    const cover = resolveCoverUrl(row.bookCoverR2Key, row.bookCoverUrl)
    if (existing) {
      existing.quotes.push(row)
    } else {
      grouped.set(row.bookId, {
        title: row.bookTitle,
        googleId: row.bookGoogleId,
        coverUrl: cover,
        quotes: [row],
      })
    }
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
            Quotes
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 32 }}>
            {rows.length} {rows.length === 1 ? 'quote' : 'quotes'} from {grouped.size} {grouped.size === 1 ? 'book' : 'books'}
          </div>

          {grouped.size === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No quotes saved yet</div>
              <a href="/search" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Search for books to save quotes from
              </a>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([bookId, group]) => (
              <div key={bookId} style={{ marginBottom: 40 }}>
                <a
                  href={group.googleId ? `/book/${group.googleId}` : '#'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    textDecoration: 'none', marginBottom: 16,
                  }}
                >
                  <div style={{
                    width: 40, height: 60, borderRadius: 3, overflow: 'hidden',
                    background: '#1c2028', flexShrink: 0,
                  }}>
                    {group.coverUrl && (
                      <img src={group.coverUrl} alt={group.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#ccc' }}>{group.title}</div>
                    <div style={{ fontSize: 12, color: '#567' }}>
                      {group.quotes.length} {group.quotes.length === 1 ? 'quote' : 'quotes'}
                    </div>
                  </div>
                </a>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {group.quotes.map(q => (
                    <div key={q.id} style={{
                      borderLeft: '3px solid rgba(196,96,58,0.5)',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '0 4px 4px 0',
                      padding: '12px 16px',
                    }}>
                      <p style={{
                        fontSize: 14, lineHeight: 1.7, color: '#9ab',
                        fontStyle: 'italic', margin: 0,
                      }}>
                        &ldquo;{q.quote}&rdquo;
                      </p>
                      {(q.pageNumber || q.chapter) && (
                        <div style={{ fontSize: 11, color: '#567', marginTop: 6 }}>
                          {q.pageNumber && <span>p. {q.pageNumber}</span>}
                          {q.pageNumber && q.chapter && <span> · </span>}
                          {q.chapter && <span>{q.chapter}</span>}
                        </div>
                      )}
                    </div>
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
