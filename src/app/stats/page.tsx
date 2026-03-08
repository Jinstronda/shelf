import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books, readingGoals } from '@/lib/schema'
import { eq, and, gte, count, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ReadingGoal } from '@/components/ReadingGoal'
import { YearInReviewCard } from '@/components/YearInReviewCard'
import { getReadingStreak } from '@/lib/queries'
import { ReadingStreak } from '@/components/ReadingStreak'
import { ReadingCalendar } from '@/components/ReadingCalendar'
import { ChallengesCard } from '@/components/ChallengesCard'
import { GenreChart } from '@/components/GenreChart'
import { FormatStats } from '@/components/FormatStats'
import { RatingDistribution } from '@/components/RatingDistribution'
import { ReadingPace } from '@/components/ReadingPace'
import { StatsShareCard } from '@/components/StatsShareCard'
import { RATING_MAP } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Your Stats — Shelf' }

export default async function StatsPage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const year = new Date().getFullYear()
  const yearStart = new Date(year, 0, 1)

  const oneYearAgo = new Date(Date.now() - 365 * 86400000)

  const [rows, [allTimeCount], streak, calendarRows, genreRows, formatRows, ratingRows] = await Promise.all([
    db.select().from(userBooks)
      .where(and(
        eq(userBooks.userId, session.user.id!),
        eq(userBooks.status, 'read'),
        gte(userBooks.updatedAt, yearStart),
      ))
      .innerJoin(books, eq(userBooks.bookId, books.id)),
    db.select({ total: count() }).from(userBooks)
      .where(and(
        eq(userBooks.userId, session.user.id!),
        eq(userBooks.status, 'read'),
      )),
    getReadingStreak(session.user.id!),
    db.select({ updatedAt: userBooks.updatedAt })
      .from(userBooks)
      .where(and(
        eq(userBooks.userId, session.user.id!),
        eq(userBooks.status, 'read'),
        gte(userBooks.updatedAt, oneYearAgo),
      )),
    db.execute(sql`
      SELECT g AS genre, COUNT(*)::int AS count
      FROM user_books ub
      JOIN books b ON b.id = ub.book_id, unnest(b.genres) AS g
      WHERE ub.user_id = ${session.user.id!} AND ub.status = 'read'
      GROUP BY g ORDER BY count DESC LIMIT 15
    `),
    db.execute(sql`
      SELECT format, COUNT(*)::int AS count
      FROM user_books
      WHERE user_id = ${session.user.id!} AND status = 'read' AND format IS NOT NULL
      GROUP BY format ORDER BY count DESC
    `),
    db.execute(sql`
      SELECT rating, COUNT(*)::int AS count
      FROM user_books
      WHERE user_id = ${session.user.id!} AND status = 'read' AND rating IS NOT NULL
      GROUP BY rating ORDER BY rating
    `),
  ])

  const thisYear = rows.map(r => ({ ...r.user_books, book: r.books }))

  const totalPages = thisYear.reduce((sum, r) => sum + (r.book.pageCount ?? 0), 0)
  const rated = thisYear.filter(r => r.rating)
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, r) => sum + r.rating!, 0) / rated.length).toFixed(1)
    : null
  const liked = thisYear.filter(r => r.liked).length

  const [goal] = await db
    .select()
    .from(readingGoals)
    .where(and(eq(readingGoals.userId, session.user.id!), eq(readingGoals.year, year)))
    .limit(1)

  const genreData = genreRows.rows as { genre: string; count: number }[]
  const formatData = formatRows.rows as { format: string; count: number }[]
  const ratingData = ratingRows.rows as { rating: number; count: number }[]

  const calendarData: Record<string, number> = {}
  for (const r of calendarRows) {
    if (!r.updatedAt) continue
    const key = r.updatedAt.toISOString().slice(0, 10)
    calendarData[key] = (calendarData[key] ?? 0) + 1
  }

  const genreCounts = new Map<string, number>()
  for (const r of thisYear) {
    for (const g of (r.book.genres ?? [])) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
    }
  }
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const highestRated = [...thisYear]
    .filter(r => r.rating)
    .sort((a, b) => b.rating! - a.rating!)
    .slice(0, 5)

  const dayOfYear = Math.floor((Date.now() - yearStart.getTime()) / 86400000) || 1
  const pagesPerDay = totalPages / dayOfYear
  const avgDaysPerBook = thisYear.length > 0 ? dayOfYear / thisYear.length : 0

  const monthCounts = new Array(12).fill(0)
  for (const r of thisYear) {
    const d = r.readAt ?? r.updatedAt
    if (d) monthCounts[new Date(d).getMonth()]++
  }
  const booksPerMonth = monthCounts.map((count, i) => ({
    month: new Date(year, i).toLocaleString('en', { month: 'short' }),
    count,
  }))

  const statBoxStyle = {
    background: '#1c2028', borderRadius: 6, padding: '24px 20px',
    textAlign: 'center' as const,
  }
  const statNumber = {
    fontFamily: 'Cormorant Garamond, serif', fontSize: 48,
    fontWeight: 700, color: '#fff', lineHeight: 1,
  }
  const statLabel = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    color: '#567', textTransform: 'uppercase' as const, marginTop: 8,
  }

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            {year} in Books
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 24 }}>
            {session.user.name}&apos;s reading year so far
          </div>

          {thisYear.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <StatsShareCard
                year={year}
                booksRead={thisYear.length}
                pagesRead={totalPages}
                avgRating={avgRating}
                topGenre={topGenres[0]?.[0] ?? null}
              />
            </div>
          )}

          <ReadingGoal
            year={year}
            booksRead={thisYear.length}
            initialTarget={goal?.target ?? null}
          />

          <ChallengesCard />

          <GenreChart data={genreData} />

          <RatingDistribution data={ratingData} />

          <ReadingPace
            pagesPerDay={pagesPerDay}
            avgDaysPerBook={avgDaysPerBook}
            booksPerMonth={booksPerMonth}
            totalBooks={thisYear.length}
            totalPages={totalPages}
          />

          <FormatStats data={formatData} />

          {thisYear.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No books read this year yet</div>
              <a href="/search" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Start reading
              </a>
            </div>
          ) : (
            <>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
                <div style={statBoxStyle}>
                  <div style={statNumber}>{thisYear.length}</div>
                  <div style={statLabel}>Books</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statNumber}>{totalPages.toLocaleString()}</div>
                  <div style={statLabel}>Pages</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statNumber}>{avgRating ?? '-'}</div>
                  <div style={statLabel}>Avg Rating</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statNumber}>{liked}</div>
                  <div style={statLabel}>Liked</div>
                </div>
              </div>

              <div style={{ marginBottom: 40 }}>
                <ReadingStreak
                  currentStreak={streak.currentStreak}
                  longestStreak={streak.longestStreak}
                  readingDaysThisYear={streak.readingDaysThisYear}
                  last30={streak.last30}
                  now={Date.now()}
                />
              </div>

              <ReadingCalendar data={calendarData} />

              {topGenres.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    color: '#567', textTransform: 'uppercase', marginBottom: 16,
                  }}>Top Genres</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {topGenres.map(([genre, total]) => (
                      <span key={genre} style={{
                        background: 'rgba(196,96,58,0.12)', color: '#C4603A',
                        borderRadius: 4, padding: '6px 12px', fontSize: 13, fontWeight: 600,
                      }}>
                        {genre} ({total})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {highestRated.length > 0 && (
                <div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    color: '#567', textTransform: 'uppercase', marginBottom: 16,
                  }}>Highest Rated</div>
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {highestRated.map(entry => (
                      <a key={entry.id} href={`/book/${entry.book.googleId}`}
                        style={{ textDecoration: 'none', flexShrink: 0, width: 120 }}>
                        <div style={{
                          width: 120, height: 180, borderRadius: 4, overflow: 'hidden',
                          background: '#1c2028', marginBottom: 8,
                        }}>
                          {entry.book.coverUrl && (
                            <img src={entry.book.coverUrl} alt={entry.book.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div style={{
                          fontSize: 12, fontWeight: 600, color: '#ccc', lineHeight: 1.3,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{entry.book.title}</div>
                        {entry.rating && (
                          <div style={{ fontSize: 12, color: '#C4603A', marginTop: 2 }}>
                            {RATING_MAP[entry.rating]}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#456' }}>
                  All time: {allTimeCount.total} books read
                </div>
              </div>

              <YearInReviewCard
                year={year}
                userName={session.user.name ?? ''}
                booksRead={thisYear.length}
                pagesRead={totalPages}
                avgRating={avgRating}
                topGenres={topGenres.slice(0, 3).map(([g]) => g)}
                topBook={highestRated[0]?.book.title ?? null}
              />
            </>
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
