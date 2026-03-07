import { db } from '@/lib/db'
import { books, userBooks } from '@/lib/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { resolveCoverUrl } from '@/lib/covers'
import { RATING_MAP } from '@/lib/constants'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  return { title: `${decodeURIComponent(name)} — Shelf` }
}

export const revalidate = 3600

type AuthorBookRow = {
  googleId: string | null
  title: string
  coverUrl: string | null
  coverR2Key: string | null
  avgRating: number | null
  readerCount: number
  published: string | null
}

async function getBooksByAuthor(authorName: string): Promise<AuthorBookRow[]> {
  try {
    const rows = await db
      .select({
        googleId:    books.googleId,
        title:       books.title,
        coverUrl:    books.coverUrl,
        coverR2Key:  books.coverR2Key,
        published:   books.published,
        avgRating:   sql<number>`avg(${userBooks.rating})`,
        readerCount: sql<number>`count(${userBooks.id})`,
      })
      .from(books)
      .leftJoin(userBooks, eq(userBooks.bookId, books.id))
      .where(sql`${books.authors} @> ARRAY[${authorName}]::text[]`)
      .groupBy(books.id)
      .orderBy(desc(sql`count(${userBooks.id})`), desc(books.published))

    return rows.map(r => ({
      googleId: r.googleId,
      title: r.title,
      coverUrl: resolveCoverUrl(r.coverR2Key, r.coverUrl),
      coverR2Key: r.coverR2Key,
      published: r.published,
      avgRating: r.avgRating ? parseFloat(Number(r.avgRating).toFixed(1)) : null,
      readerCount: Number(r.readerCount),
    }))
  } catch (err) {
    console.error('getBooksByAuthor:', err)
    return []
  }
}

export default async function AuthorPage({ params }: Props) {
  const { name } = await params
  const authorName = decodeURIComponent(name)
  const authorBooks = await getBooksByAuthor(authorName)

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            {authorName}
          </h1>
          <div style={{ fontSize: 14, color: '#678', marginBottom: 40 }}>
            {authorBooks.length} {authorBooks.length === 1 ? 'book' : 'books'}
          </div>

          {authorBooks.length === 0 ? (
            <p style={{ color: '#678', fontSize: 14 }}>
              No books found for this author.
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 16,
            }}>
              {authorBooks.filter(b => b.googleId).map(book => (
                <a key={book.googleId} href={`/book/${book.googleId}`}
                  style={{ textDecoration: 'none' }}>
                  <div style={{
                    aspectRatio: '2/3', borderRadius: 4, overflow: 'hidden',
                    background: '#1c2028', marginBottom: 8,
                  }}>
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: '#567', padding: 8, textAlign: 'center',
                      }}>{book.title}</div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, color: '#ccc', fontWeight: 600, lineHeight: 1.3,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {book.title}
                  </div>
                  {book.avgRating && (
                    <div style={{ fontSize: 12, color: '#C4603A', marginTop: 2 }}>
                      {RATING_MAP[Math.round(book.avgRating)] ?? ''}
                    </div>
                  )}
                  {book.readerCount > 0 && (
                    <div style={{ fontSize: 11, color: '#567', marginTop: 2 }}>
                      {book.readerCount} {book.readerCount === 1 ? 'reader' : 'readers'}
                    </div>
                  )}
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
