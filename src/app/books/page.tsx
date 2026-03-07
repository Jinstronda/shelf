import { searchGoogleBooks } from '@/lib/google-books'
import { db } from '@/lib/db'
import { books } from '@/lib/schema'
import { sql } from 'drizzle-orm'
import { CARD_VARIANTS as CV } from '@/lib/constants'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Browse Books — Shelf' }
export const revalidate = 3600

const SECTIONS = [
  { label: 'Popular Fiction',       query: 'subject:fiction',           limit: 12 },
  { label: 'Science & Nature',      query: 'subject:science',          limit: 12 },
  { label: 'History',               query: 'subject:history',          limit: 12 },
  { label: 'Philosophy',            query: 'subject:philosophy',       limit: 12 },
  { label: 'Biography & Memoir',    query: 'subject:biography',        limit: 12 },
]

async function getTopGenres(): Promise<{ genre: string; count: number }[]> {
  try {
    const rows = await db.execute(sql`
      SELECT g AS genre, COUNT(*)::int AS count
      FROM books, unnest(genres) AS g
      GROUP BY g ORDER BY count DESC LIMIT 20
    `)
    return rows.rows as { genre: string; count: number }[]
  } catch {
    return []
  }
}

export default async function BooksPage() {
  const [sections, genres] = await Promise.all([
    Promise.all(
      SECTIONS.map(async s => ({
        label: s.label,
        books: await searchGoogleBooks(s.query, s.limit).catch(err => {
          console.error(`[books] Failed to fetch "${s.query}":`, err)
          return []
        }),
      }))
    ),
    getTopGenres(),
  ])

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 48,
          }}>
            Browse Books
          </h1>

          {genres.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                color: '#567', textTransform: 'uppercase', marginBottom: 14,
              }}>
                Browse by Genre
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {genres.map(g => (
                  <a key={g.genre} href={`/books/${encodeURIComponent(g.genre)}`}
                    style={{
                      background: 'rgba(196,96,58,0.12)', color: '#C4603A',
                      borderRadius: 20, padding: '5px 12px',
                      fontSize: 12, fontWeight: 600,
                      textDecoration: 'none',
                    }}>
                    {g.genre}
                  </a>
                ))}
              </div>
            </div>
          )}

          {sections.map(section => section.books.length > 0 && (
            <div key={section.label} style={{ marginBottom: 48 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                color: '#567', textTransform: 'uppercase', marginBottom: 18,
              }}>
                {section.label}
              </div>
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto',
                scrollbarWidth: 'none', paddingBottom: 4,
              }}>
                {section.books.map((book, i) => (
                  <a key={book.googleId} href={`/book/${book.googleId}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div className={`card ${CV[i % 12]}`}>
                      {book.coverUrl && (
                        <img src={book.coverUrl} alt={book.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <div className="card-hover">
                        <span style={{ fontSize: 11, color: '#ccc', fontWeight: 600, lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{book.title}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
