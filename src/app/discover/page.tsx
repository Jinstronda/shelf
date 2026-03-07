import { db } from '@/lib/db'
import { books, userBooks, users } from '@/lib/schema'
import { eq, desc, count, avg, gte, sql, isNotNull } from 'drizzle-orm'
import { coverPublicUrl } from '@/lib/covers'
import { RATING_MAP, CARD_VARIANTS as CV } from '@/lib/constants'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { WantToReadButton } from '@/components/WantToReadButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Discover — Shelf' }
export const revalidate = 3600

type DiscoverBook = {
  googleId: string
  title: string
  authors: string[]
  coverUrl: string | null
}

type BookRow = {
  googleId: string | null
  title: string
  authors: string[]
  coverUrl: string | null
  coverR2Key: string | null
}

function toDiscoverBooks(rows: BookRow[]): DiscoverBook[] {
  return rows
    .filter(r => r.googleId)
    .map(r => ({
      googleId: r.googleId!,
      title: r.title,
      authors: r.authors,
      coverUrl: r.coverR2Key ? coverPublicUrl(r.coverR2Key) : r.coverUrl,
    }))
}

const BOOK_COLUMNS = {
  googleId:   books.googleId,
  title:      books.title,
  authors:    books.authors,
  coverUrl:   books.coverUrl,
  coverR2Key: books.coverR2Key,
} as const

const BOOK_GROUP_BY = [books.id, books.googleId, books.title, books.authors, books.coverUrl, books.coverR2Key] as const

async function getTrendingBooks(): Promise<DiscoverBook[]> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const rows = await db
      .select(BOOK_COLUMNS)
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .where(gte(userBooks.updatedAt, sevenDaysAgo))
      .groupBy(...BOOK_GROUP_BY)
      .orderBy(desc(count(userBooks.id)))
      .limit(12)
    return toDiscoverBooks(rows)
  } catch (err) {
    console.error('getTrendingBooks:', err)
    return []
  }
}

async function getHighestRated(): Promise<DiscoverBook[]> {
  try {
    const rows = await db
      .select({ ...BOOK_COLUMNS, avgRating: avg(userBooks.rating) })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .groupBy(...BOOK_GROUP_BY)
      .having(gte(count(userBooks.id), 3))
      .orderBy(desc(avg(userBooks.rating)))
      .limit(12)
    return toDiscoverBooks(rows)
  } catch (err) {
    console.error('getHighestRated:', err)
    return []
  }
}

async function getRecentlyAdded(): Promise<DiscoverBook[]> {
  try {
    const rows = await db
      .select(BOOK_COLUMNS)
      .from(books)
      .where(sql`${books.googleId} IS NOT NULL`)
      .orderBy(desc(books.createdAt))
      .limit(12)
    return toDiscoverBooks(rows)
  } catch (err) {
    console.error('getRecentlyAdded:', err)
    return []
  }
}

type PopularReview = {
  id: string
  bookTitle: string
  bookGoogleId: string
  bookCover: string | null
  userName: string
  userAvatar: string | null
  rating: number | null
  review: string
  likeCount: number
}

async function getPopularReviews(): Promise<PopularReview[]> {
  try {
    const likeCountSq = sql<number>`(select count(*) from review_likes where review_likes.review_id = ${userBooks.id})`
    const rows = await db
      .select({
        id:          userBooks.id,
        review:      userBooks.review,
        rating:      userBooks.rating,
        bookTitle:   books.title,
        bookGoogleId: books.googleId,
        bookCover:   books.coverUrl,
        bookR2Key:   books.coverR2Key,
        userName:    users.name,
        userAvatar:  users.avatarUrl,
        likeCount:   likeCountSq,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .innerJoin(users, eq(userBooks.userId, users.id))
      .where(isNotNull(userBooks.review))
      .orderBy(desc(likeCountSq))
      .limit(6)

    if (rows.length === 0) return []

    const hasLikes = rows.some(r => r.likeCount > 0)
    const sorted = hasLikes
      ? rows.filter(r => r.likeCount > 0)
      : rows

    return sorted
      .filter(r => r.bookGoogleId)
      .map(r => ({
        id: r.id,
        bookTitle: r.bookTitle,
        bookGoogleId: r.bookGoogleId!,
        bookCover: r.bookR2Key ? coverPublicUrl(r.bookR2Key) : r.bookCover,
        userName: r.userName ?? 'Anonymous',
        userAvatar: r.userAvatar,
        rating: r.rating,
        review: r.review!,
        likeCount: Number(r.likeCount),
      }))
  } catch (err) {
    console.error('getPopularReviews:', err)
    return []
  }
}

export default async function DiscoverPage() {
  const [trending, highestRated, recentlyAdded, popularReviews] = await Promise.all([
    getTrendingBooks(),
    getHighestRated(),
    getRecentlyAdded(),
    getPopularReviews(),
  ])

  const sections = [
    { label: 'Trending This Week', books: trending },
    { label: 'Highest Rated',      books: highestRated },
    { label: 'Recently Added',     books: recentlyAdded },
  ]

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 48,
          }}>
            Discover
          </h1>

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
                  <a key={book.googleId} href={`/book/${book.googleId}`}
                    style={{ textDecoration: 'none', flexShrink: 0, width: 80 }}>
                    <div style={{ position: 'relative' }}>
                      <div className={`card ${CV[i % 12]}`}>
                        {book.coverUrl && (
                          <img src={book.coverUrl} alt={book.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <div className="card-hover" />
                      </div>
                      <WantToReadButton googleId={book.googleId} />
                    </div>
                    <div style={{
                      fontSize: 11, color: '#ccc', fontWeight: 600, lineHeight: 1.3,
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
            </div>
          ))}

          {popularReviews.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                color: '#567', textTransform: 'uppercase', marginBottom: 18,
              }}>
                Popular Reviews
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
              }}>
                {popularReviews.map(r => (
                  <div key={r.id} style={{
                    background: '#1c2028', borderRadius: 6, padding: 16,
                    display: 'flex', gap: 12,
                  }}>
                    <a href={`/book/${r.bookGoogleId}`} style={{ flexShrink: 0 }}>
                      {r.bookCover ? (
                        <img src={r.bookCover} alt={r.bookTitle}
                          style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 3 }} />
                      ) : (
                        <div style={{
                          width: 40, height: 60, borderRadius: 3,
                          background: '#2a2e36', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 10, color: '#567',
                        }}>?</div>
                      )}
                    </a>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={`/book/${r.bookGoogleId}`} style={{
                        textDecoration: 'none', fontSize: 14, color: '#ccc',
                        fontWeight: 600, lineHeight: 1.3, display: 'block',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>
                        {r.bookTitle}
                      </a>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        {r.userAvatar ? (
                          <img src={r.userAvatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                        ) : (
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#2a2e36',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: '#567',
                          }}>{r.userName[0]}</div>
                        )}
                        <span style={{ fontSize: 12, color: '#9ab' }}>{r.userName}</span>
                        {r.rating && (
                          <span style={{ fontSize: 12, color: '#C4603A' }}>{RATING_MAP[r.rating]}</span>
                        )}
                      </div>
                      <p style={{
                        fontSize: 13, color: '#789', fontStyle: 'italic',
                        margin: '6px 0 0', lineHeight: 1.5,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      }}>
                        {r.review}
                      </p>
                      {r.likeCount > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          marginTop: 6, fontSize: 11, color: '#e05c7a',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#e05c7a" stroke="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          {r.likeCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.every(s => s.books.length === 0) && (
            <p style={{ color: '#678', fontSize: 14 }}>
              Nothing to show yet. Start logging books to populate this page.
            </p>
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
