import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq, desc, asc, and, gte, lt } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { resolveCoverUrl } from '@/lib/covers'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { BookEntryRow } from '@/components/BookEntryRow'
import { DiaryCalendar } from '@/components/DiaryCalendar'
import { STATUS_LABELS, RATING_MAP, pillBase, pillActive, pillInactive } from '@/lib/constants'
import type { Metadata } from 'next'

type Status = 'read' | 'reading' | 'want' | 'dnf'
type Sort = 'newest' | 'oldest' | 'rating'
type View = 'list' | 'grid'

interface Props {
  searchParams: Promise<{ year?: string; status?: string; sort?: string; page?: string; view?: string }>
}

const PAGE_SIZE = 30

const VALID_STATUSES: Status[] = ['read', 'reading', 'want', 'dnf']
const VALID_SORTS: Sort[] = ['newest', 'oldest', 'rating']
const VALID_VIEWS: View[] = ['list', 'grid']
const SORT_LABELS: Record<Sort, string> = { newest: 'Newest', oldest: 'Oldest', rating: 'Rating' }

function buildFilterHref(base: Record<string, string>, key: string, value: string | null) {
  const params = new URLSearchParams(base)
  if (value) params.set(key, value)
  else params.delete(key)
  const qs = params.toString()
  return qs ? `/journal?${qs}` : '/journal'
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { year, status } = await searchParams
  const parts: string[] = []
  if (year) parts.push(year)
  if (status && VALID_STATUSES.includes(status as Status))
    parts.push(STATUS_LABELS[status as Status])
  const suffix = parts.length ? ` (${parts.join(', ')})` : ''
  return { title: `Journal${suffix} — Shelf` }
}

export default async function JournalPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const params = await searchParams
  const yearParam = params.year ? parseInt(params.year, 10) : null
  const year = yearParam && yearParam >= 2000 && yearParam <= 2100 ? yearParam : null
  const status = VALID_STATUSES.includes(params.status as Status) ? (params.status as Status) : null
  const sort: Sort = VALID_SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : 'newest'
  const view: View = VALID_VIEWS.includes(params.view as View) ? (params.view as View) : 'list'
  const pageParam = params.page ? parseInt(params.page, 10) : 1
  const page = pageParam > 0 ? pageParam : 1

  const currentParams: Record<string, string> = {}
  if (year) currentParams.year = String(year)
  if (status) currentParams.status = status
  if (sort !== 'newest') currentParams.sort = sort
  if (view !== 'list') currentParams.view = view

  const conditions = [eq(userBooks.userId, session.user.id!)]
  if (year) {
    conditions.push(gte(userBooks.updatedAt, new Date(year, 0, 1)))
    conditions.push(lt(userBooks.updatedAt, new Date(year + 1, 0, 1)))
  }
  if (status) conditions.push(eq(userBooks.status, status))

  const SORT_COLUMNS = {
    newest: desc(userBooks.updatedAt),
    oldest: asc(userBooks.updatedAt),
    rating: desc(userBooks.rating),
  } as const
  const orderBy = SORT_COLUMNS[sort]

  const rows = await db
    .select()
    .from(userBooks)
    .where(and(...conditions))
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .orderBy(orderBy)
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE)

  const hasMore = rows.length > PAGE_SIZE
  const entries = rows.slice(0, PAGE_SIZE).map(r => ({
    ...r.user_books,
    book: r.books,
  }))

  const grouped = new Map<string, typeof entries>()
  for (const entry of entries) {
    const date = entry.updatedAt
      ? new Date(entry.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : 'Unknown'
    const existing = grouped.get(date) ?? []
    existing.push(entry)
    grouped.set(date, existing)
  }

  const calYear = year ?? new Date().getFullYear()
  const calConditions = [
    eq(userBooks.userId, session.user.id!),
    gte(userBooks.updatedAt, new Date(calYear, 0, 1)),
    lt(userBooks.updatedAt, new Date(calYear + 1, 0, 1)),
  ]
  if (status) calConditions.push(eq(userBooks.status, status))

  const calRows = await db
    .select({
      updatedAt: userBooks.updatedAt,
      title: books.title,
      coverUrl: books.coverUrl,
      googleId: books.googleId,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(...calConditions))

  const calendarData = calRows
    .filter(r => r.updatedAt)
    .map(r => ({
      date: r.updatedAt!.toISOString().slice(0, 10),
      bookTitle: r.title,
      coverUrl: r.coverUrl,
      googleId: r.googleId,
    }))

  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2]

  const countStr = hasMore ? `${entries.length}+` : `${entries.length}`
  const countLabel = year
    ? `${countStr} ${entries.length === 1 ? 'entry' : 'entries'} in ${year}${page > 1 ? ` (page ${page})` : ''}`
    : `${countStr} ${entries.length === 1 ? 'entry' : 'entries'}${page > 1 ? ` (page ${page})` : ''}`

  const loadMoreHref = (() => {
    const p = new URLSearchParams(currentParams)
    p.set('page', String(page + 1))
    return `/journal?${p.toString()}`
  })()

  const pill = { ...pillBase, textDecoration: 'none' as const }

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 700, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            Journal
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 24 }}>
            {countLabel}
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 40,
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Year</span>
              <a href={buildFilterHref(currentParams, 'year', null)} style={{ ...pill, ...(year === null ? pillActive : pillInactive) }}>All</a>
              {yearOptions.map(y => (
                <a key={y} href={buildFilterHref(currentParams, 'year', String(y))} style={{ ...pill, ...(year === y ? pillActive : pillInactive) }}>{y}</a>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Status</span>
              <a href={buildFilterHref(currentParams, 'status', null)} style={{ ...pill, ...(status === null ? pillActive : pillInactive) }}>All</a>
              {VALID_STATUSES.map(s => (
                <a key={s} href={buildFilterHref(currentParams, 'status', s)} style={{ ...pill, ...(status === s ? pillActive : pillInactive) }}>{STATUS_LABELS[s]}</a>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Sort</span>
              {VALID_SORTS.map(s => (
                <a key={s} href={buildFilterHref(currentParams, 'sort', s === 'newest' ? null : s)} style={{ ...pill, ...(sort === s ? pillActive : pillInactive) }}>{SORT_LABELS[s]}</a>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
              <a
                href={buildFilterHref(currentParams, 'view', null)}
                style={{
                  ...pill, padding: '5px 8px',
                  ...(view === 'list' ? pillActive : pillInactive),
                }}
                aria-label="List view"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>
                </svg>
              </a>
              <a
                href={buildFilterHref(currentParams, 'view', 'grid')}
                style={{
                  ...pill, padding: '5px 8px',
                  ...(view === 'grid' ? pillActive : pillInactive),
                }}
                aria-label="Grid view"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="1" width="5" height="5"/><rect x="10" y="1" width="5" height="5"/><rect x="1" y="10" width="5" height="5"/><rect x="10" y="10" width="5" height="5"/>
                </svg>
              </a>
            </div>
          </div>

          {view === 'list' && <DiaryCalendar entries={calendarData} year={year} month={null} />}

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No entries yet</div>
              <a href="/search" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Search for books to log
              </a>
            </div>
          ) : view === 'grid' ? (
            <>
              {Array.from(grouped.entries()).map(([month, items]) => (
                <div key={month} style={{ marginBottom: 40 }}>
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: 8,
                    paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 16,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#ccc' }}>
                      {month}
                    </span>
                    <span style={{ fontSize: 12, color: '#567' }}>
                      {items.length} {items.length === 1 ? 'book' : 'books'}
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 12,
                  }}>
                    {items.map((entry, i) => {
                      const coverUrl = resolveCoverUrl(entry.book.coverR2Key, entry.book.coverUrl)
                      return (
                        <a
                          key={`${entry.book.googleId}-${i}`}
                          href={entry.book.googleId ? `/book/${entry.book.googleId}` : '#'}
                          style={{ textDecoration: 'none', display: 'block' }}
                        >
                          <div style={{
                            aspectRatio: '2/3', borderRadius: 4, overflow: 'hidden',
                            background: '#1c2028',
                          }}>
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={entry.book.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: 8, textAlign: 'center',
                                fontSize: 11, color: '#567', lineHeight: 1.3,
                              }}>
                                {entry.book.title}
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontSize: 11, color: '#9ab', marginTop: 6,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
                </div>
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
          ) : (
            <>
              {Array.from(grouped.entries()).map(([month, items]) => (
                <div key={month} style={{ marginBottom: 40 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    color: '#567', textTransform: 'uppercase', marginBottom: 16,
                    paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {month}
                  </div>
                  {items.map((entry, i) => {
                    const dateKey = entry.updatedAt ? entry.updatedAt.toISOString().slice(0, 10) : null
                    const isFirst = dateKey && items.findIndex(e => e.updatedAt?.toISOString().slice(0, 10) === dateKey) === i
                    return (
                      <div key={entry.id} id={isFirst ? `journal-date-${dateKey}` : undefined}>
                        <BookEntryRow entry={entry} />
                      </div>
                    )
                  })}
                </div>
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
    </>
  )
}
