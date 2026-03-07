import { db } from '@/lib/db'
import { books, userBooks } from '@/lib/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import { resolveCoverUrl } from '@/lib/covers'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { WantToReadButton } from '@/components/WantToReadButton'
import { CARD_VARIANTS as CV } from '@/lib/constants'
import type { Metadata } from 'next'

export const revalidate = 3600

interface Props {
  params: Promise<{ genre: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { genre } = await params
  const label = decodeURIComponent(genre).replace(/\b\w/g, c => c.toUpperCase())
  return { title: `${label} Books — Shelf` }
}

export default async function GenrePage({ params }: Props) {
  const { genre } = await params
  const genreDecoded = decodeURIComponent(genre)
  const label = genreDecoded.replace(/\b\w/g, c => c.toUpperCase())

  let rows: {
    id: string
    googleId: string | null
    title: string
    authors: string[]
    coverUrl: string | null
    coverR2Key: string | null
    logCount: number
  }[] = []

  try {
    rows = await db
      .select({
        id: books.id,
        googleId: books.googleId,
        title: books.title,
        authors: books.authors,
        coverUrl: books.coverUrl,
        coverR2Key: books.coverR2Key,
        logCount: count(userBooks.id).as('log_count'),
      })
      .from(books)
      .leftJoin(userBooks, eq(userBooks.bookId, books.id))
      .where(sql`${books.genres} @> ARRAY[${genreDecoded}]::text[]`)
      .groupBy(books.id, books.googleId, books.title, books.authors, books.coverUrl, books.coverR2Key)
      .orderBy(desc(sql`log_count`))
      .limit(48)
  } catch (err) {
    console.error('[genre]', err)
  }

  const filtered = rows.filter(r => r.googleId)

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            {label}
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 32 }}>
            {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
          </div>

          {filtered.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 16,
            }}>
              {filtered.map((book, i) => (
                <a key={book.id} href={`/book/${book.googleId}`}
                  style={{ textDecoration: 'none' }}>
                  <div style={{ position: 'relative' }}>
                    <div className={`card ${CV[i % 12]}`}>
                      {(book.coverR2Key || book.coverUrl) && (
                        <img
                          src={resolveCoverUrl(book.coverR2Key, book.coverUrl)!}
                          alt={book.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                      <div className="card-hover" />
                    </div>
                    <WantToReadButton googleId={book.googleId!} />
                  </div>
                  <div style={{
                    fontSize: 12, color: '#ccc', fontWeight: 600, lineHeight: 1.3,
                    marginTop: 6, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {book.title}
                  </div>
                  {book.authors[0] && (
                    <div style={{
                      fontSize: 10, color: '#678', lineHeight: 1.3,
                      marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {book.authors[0]}
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: '#678', fontSize: 14 }}>
              No books found in this genre yet.
            </p>
          )}
        </div>
      </div>

      <SiteFooter />

      <style>{`
        @media (max-width: 768px) {
          .page-content div[style*="grid-template-columns"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </>
  )
}
