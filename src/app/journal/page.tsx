import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq, desc, asc, and, gte, lt } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { BookEntryRow } from '@/components/BookEntryRow'
import { DiaryCalendar } from '@/components/DiaryCalendar'
import type { Metadata } from 'next'

type Status = 'read' | 'reading' | 'want' | 'dnf'
type Sort = 'newest' | 'oldest' | 'rating'

interface Props {
  searchParams: Promise<{ year?: string; status?: string; sort?: string; page?: string }>
}

const PAGE_SIZE = 30

const VALID_STATUSES: Status[] = ['read', 'reading', 'want', 'dnf']
const VALID_SORTS: Sort[] = ['newest', 'oldest', 'rating']
const STATUS_LABELS: Record<Status, string> = { read: 'Read', reading: 'Reading', want: 'Want', dnf: 'DNF' }
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
  const pageParam = params.page ? parseInt(params.page, 10) : 1
  const page = pageParam > 0 ? pageParam : 1

  const currentParams: Record<string, string> = {}
  if (year) currentParams.year = String(year)
  if (status) currentParams.status = status
  if (sort !== 'newest') currentParams.sort = sort

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
              <a href={buildFilterHref(currentParams, 'year', null)} style={{ ...pillBase, ...(year === null ? pillActive : pillInactive) }}>All</a>
              {yearOptions.map(y => (
                <a key={y} href={buildFilterHref(currentParams, 'year', String(y))} style={{ ...pillBase, ...(year === y ? pillActive : pillInactive) }}>{y}</a>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Status</span>
              <a href={buildFilterHref(currentParams, 'status', null)} style={{ ...pillBase, ...(status === null ? pillActive : pillInactive) }}>All</a>
              {VALID_STATUSES.map(s => (
                <a key={s} href={buildFilterHref(currentParams, 'status', s)} style={{ ...pillBase, ...(status === s ? pillActive : pillInactive) }}>{STATUS_LABELS[s]}</a>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#567', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Sort</span>
              {VALID_SORTS.map(s => (
                <a key={s} href={buildFilterHref(currentParams, 'sort', s === 'newest' ? null : s)} style={{ ...pillBase, ...(sort === s ? pillActive : pillInactive) }}>{SORT_LABELS[s]}</a>
              ))}
            </div>
          </div>

          <DiaryCalendar entries={calendarData} year={year} month={null} />

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No entries yet</div>
              <a href="/search" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Search for books to log
              </a>
            </div>
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
