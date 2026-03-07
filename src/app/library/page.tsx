import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq, desc, asc, and, or, ilike, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { BookEntryRow } from '@/components/BookEntryRow'
import { coverPublicUrl } from '@/lib/covers'
import { RATINGS, RATING_MAP } from '@/lib/constants'
import type { Metadata } from 'next'

type Status = 'read' | 'reading' | 'want' | 'dnf'
type Sort = 'newest' | 'oldest' | 'rating' | 'title' | 'author'
type View = 'grid' | 'list'

interface Props {
  searchParams: Promise<{
    q?: string; status?: string; sort?: string;
    genre?: string; rating?: string; view?: string; page?: string
  }>
}

const PAGE_SIZE = 40

const VALID_STATUSES: Status[] = ['read', 'reading', 'want', 'dnf']
const VALID_SORTS: Sort[] = ['newest', 'oldest', 'rating', 'title', 'author']
const VALID_VIEWS: View[] = ['grid', 'list']
const STATUS_LABELS: Record<Status, string> = { read: 'Read', reading: 'Reading', want: 'Want', dnf: 'DNF' }
const SORT_LABELS: Record<Sort, string> = { newest: 'Newest', oldest: 'Oldest', rating: 'Rating', title: 'Title', author: 'Author' }

function buildFilterHref(base: Record<string, string>, key: string, value: string | null) {
  const params = new URLSearchParams(base)
  if (value) params.set(key, value)
  else params.delete(key)
  params.delete('page')
  const qs = params.toString()
  return qs ? `/library?${qs}` : '/library'
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { status } = await searchParams
  const suffix = status && VALID_STATUSES.includes(status as Status)
    ? ` (${STATUS_LABELS[status as Status]})`
    : ''
  return { title: `Library${suffix} — Shelf` }
}

export default async function LibraryPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const params = await searchParams
  const q = params.q?.trim() || null
  const status = VALID_STATUSES.includes(params.status as Status) ? (params.status as Status) : null
  const sort: Sort = VALID_SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : 'newest'
  const ratingParam = params.rating ? parseInt(params.rating, 10) : null
  const rating = ratingParam && ratingParam >= 1 && ratingParam <= 10 ? ratingParam : null
  const genre = params.genre?.trim() || null
  const view: View = VALID_VIEWS.includes(params.view as View) ? (params.view as View) : 'grid'
  const pageParam = params.page ? parseInt(params.page, 10) : 1
  const page = pageParam > 0 ? pageParam : 1

  const currentParams: Record<string, string> = {}
  if (q) currentParams.q = q
  if (status) currentParams.status = status
  if (sort !== 'newest') currentParams.sort = sort
  if (rating) currentParams.rating = String(rating)
  if (genre) currentParams.genre = genre
  if (view !== 'grid') currentParams.view = view

  const conditions = [eq(userBooks.userId, session.user.id!)]
  if (status) conditions.push(eq(userBooks.status, status))
  if (rating) conditions.push(eq(userBooks.rating, rating))
  if (q) {
    conditions.push(
      or(
        ilike(books.title, `%${q}%`),
        sql`${books.authors}::text ilike ${'%' + q + '%'}`,
      )!
    )
  }
  if (genre) {
    conditions.push(sql`${genre} = ANY(${books.genres})`)
  }

  const SORT_COLUMNS = {
    newest: desc(userBooks.updatedAt),
    oldest: asc(userBooks.updatedAt),
    rating: desc(userBooks.rating),
    title: asc(books.title),
    author: sql`${books.authors}[1] asc nulls last`,
  } as const
  const orderBy = SORT_COLUMNS[sort]

  const rows = await db
    .select()
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE)

  const hasMore = rows.length > PAGE_SIZE
  const entries = rows.slice(0, PAGE_SIZE).map(r => ({
    ...r.user_books,
    book: r.books,
  }))

  // count total books for subtitle
  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(userBooks)
    .where(eq(userBooks.userId, session.user.id!))
  const totalBooks = Number(countRows[0]?.count ?? 0)

  // genres from user's books for filter dropdown
  const genreRows = await db
    .select({ genres: books.genres })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(eq(userBooks.userId, session.user.id!))
  const allGenres = [...new Set(genreRows.flatMap(r => r.genres ?? []))].sort()

  const loadMoreHref = (() => {
    const p = new URLSearchParams(currentParams)
    p.set('page', String(page + 1))
    return `/library?${p.toString()}`
  })()

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
        <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            Library
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 24 }}>
            {totalBooks} {totalBooks === 1 ? 'book' : 'books'}
          </div>

          {/* search */}
          <div style={{ marginBottom: 20 }}>
            <form action="/library" method="GET">
              {status && <input type="hidden" name="status" value={status} />}
              {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
              {rating && <input type="hidden" name="rating" value={String(rating)} />}
              {genre && <input type="hidden" name="genre" value={genre} />}
              {view !== 'grid' && <input type="hidden" name="view" value={view} />}
              <input
                name="q"
                defaultValue={q ?? ''}
                placeholder="Search your library..."
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  padding: '8px 12px',
                  color: '#e8e0d4',
                  fontSize: 14,
                  width: '100%',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </form>
          </div>

          {/* filters */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 32,
            alignItems: 'center',
          }}>
            {/* status */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Status</span>
              <a href={buildFilterHref(currentParams, 'status', null)} style={{ ...pillBase, ...(status === null ? pillActive : pillInactive) }}>All</a>
              {VALID_STATUSES.map(s => (
                <a key={s} href={buildFilterHref(currentParams, 'status', s)} style={{ ...pillBase, ...(status === s ? pillActive : pillInactive) }}>{STATUS_LABELS[s]}</a>
              ))}
            </div>

            {/* sort */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Sort</span>
              {VALID_SORTS.map(s => (
                <a key={s} href={buildFilterHref(currentParams, 'sort', s === 'newest' ? null : s)} style={{ ...pillBase, ...(sort === s ? pillActive : pillInactive) }}>{SORT_LABELS[s]}</a>
              ))}
            </div>

            {/* view toggle */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>View</span>
              <a href={buildFilterHref(currentParams, 'view', null)} style={{ ...pillBase, ...(view === 'grid' ? pillActive : pillInactive) }}>Grid</a>
              <a href={buildFilterHref(currentParams, 'view', 'list')} style={{ ...pillBase, ...(view === 'list' ? pillActive : pillInactive) }}>List</a>
            </div>
          </div>

          {/* rating + genre filters */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 40,
            alignItems: 'center',
          }}>
            {/* rating */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Rating</span>
              <a href={buildFilterHref(currentParams, 'rating', null)} style={{ ...pillBase, ...(rating === null ? pillActive : pillInactive) }}>All</a>
              {RATINGS.map(r => (
                <a key={r.value} href={buildFilterHref(currentParams, 'rating', String(r.value))} style={{ ...pillBase, ...(rating === r.value ? pillActive : pillInactive) }}>{r.label}</a>
              ))}
            </div>

            {/* genre */}
            {allGenres.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Genre</span>
                <a href={buildFilterHref(currentParams, 'genre', null)} style={{ ...pillBase, ...(genre === null ? pillActive : pillInactive) }}>All</a>
                {allGenres.map(g => (
                  <a key={g} href={buildFilterHref(currentParams, 'genre', g)} style={{ ...pillBase, ...(genre === g ? pillActive : pillInactive) }}>{g}</a>
                ))}
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No books found</div>
              <a href="/search" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Search for books to add
              </a>
            </div>
          ) : view === 'grid' ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: 12,
              }}>
                {entries.map(entry => {
                  const cover = entry.book.coverR2Key
                    ? coverPublicUrl(entry.book.coverR2Key)
                    : entry.book.coverUrl
                  return (
                    <a key={entry.id} href={`/book/${entry.book.googleId}`}
                      style={{ textDecoration: 'none' }}>
                      <div style={{
                        aspectRatio: '2/3', borderRadius: 3, overflow: 'hidden',
                        background: '#1c2028',
                      }}>
                        {cover && (
                          <img
                            src={cover}
                            alt={entry.book.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <div style={{
                        fontSize: 11, color: '#ccc', fontWeight: 600, lineHeight: 1.3,
                        marginTop: 5, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {entry.book.title}
                      </div>
                      {entry.rating && (
                        <div style={{ fontSize: 11, color: '#C4603A', marginTop: 2 }}>
                          {RATING_MAP[entry.rating] ?? ''}
                        </div>
                      )}
                    </a>
                  )
                })}
              </div>
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <a
                    href={loadMoreHref}
                    style={{
                      display: 'block',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#9ab',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 4,
                      padding: '10px 24px',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    Load More
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              {entries.map(entry => (
                <BookEntryRow key={entry.id} entry={entry} />
              ))}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <a
                    href={loadMoreHref}
                    style={{
                      display: 'block',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#9ab',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 4,
                      padding: '10px 24px',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    Load More
                  </a>
                </div>
              )}
            </>
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
