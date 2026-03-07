import { cache } from 'react'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { users, userBooks, books, follows } from '@/lib/schema'
import { eq, and, desc, count, isNotNull, sql } from 'drizzle-orm'
import { getFavorites } from '@/lib/queries'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ProfileShelf } from '@/components/ProfileShelf'
import { FollowButton } from '@/components/FollowButton'
import { FavoriteBooks } from '@/components/FavoriteBooks'
import { RATING_MAP } from '@/lib/constants'
import type { Metadata } from 'next'

const STATUS_LABELS: Record<string, string> = {
  read: 'finished reading',
  reading: 'started reading',
  want: 'wants to read',
}

interface Props {
  params: Promise<{ id: string }>
}

const fetchUser = cache(async (id: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const user = await fetchUser(id)
  if (!user) return { title: 'User not found — Shelf' }
  return { title: `${user.name ?? user.username} — Shelf` }
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params
  const [user, session] = await Promise.all([fetchUser(id), auth()])
  if (!user) notFound()

  const isOwnProfile = session?.user?.id === id

  const [rows, [followerCount], [followingCount], isFollowingResult, favRows, reviewRows, genreRows, ratingRows] = await Promise.all([
    db
      .select()
      .from(userBooks)
      .where(eq(userBooks.userId, id))
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .orderBy(desc(userBooks.updatedAt)),
    db.select({ total: count() }).from(follows).where(eq(follows.followingId, id)),
    db.select({ total: count() }).from(follows).where(eq(follows.followerId, id)),
    session?.user?.id && !isOwnProfile
      ? db
          .select()
          .from(follows)
          .where(and(eq(follows.followerId, session.user.id), eq(follows.followingId, id)))
          .limit(1)
      : Promise.resolve([]),
    getFavorites(id),
    db
      .select({
        id: userBooks.id,
        rating: userBooks.rating,
        review: userBooks.review,
        updatedAt: userBooks.updatedAt,
        bookTitle: books.title,
        bookGoogleId: books.googleId,
        bookCoverUrl: books.coverUrl,
        likeCount: sql<number>`(select count(*) from review_likes where review_likes.review_id = ${userBooks.id})`,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .where(and(eq(userBooks.userId, id), isNotNull(userBooks.review)))
      .orderBy(desc(userBooks.updatedAt))
      .limit(20),
    db.execute(sql`
      SELECT g AS genre, COUNT(*)::int AS count
      FROM user_books ub
      JOIN books b ON b.id = ub.book_id, unnest(b.genres) AS g
      WHERE ub.user_id = ${id} AND ub.status = 'read'
      GROUP BY g ORDER BY count DESC LIMIT 8
    `),
    db.execute(sql`
      SELECT rating, COUNT(*)::int AS count
      FROM user_books
      WHERE user_id = ${id} AND rating IS NOT NULL
      GROUP BY rating ORDER BY rating ASC
    `),
  ])

  const logged = rows.map(r => ({ ...r.user_books, book: r.books }))
  const read = logged.filter(l => l.status === 'read')
  const reading = logged.filter(l => l.status === 'reading')
  const want = logged.filter(l => l.status === 'want')
  const isFollowing = isFollowingResult.length > 0

  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const readThisYear = read.filter(r => r.updatedAt && new Date(r.updatedAt) >= yearStart)
  const totalPages = readThisYear.reduce((sum, r) => sum + (r.book.pageCount ?? 0), 0)
  const ratedThisYear = readThisYear.filter(r => r.rating)
  const avgRating = ratedThisYear.length > 0
    ? (ratedThisYear.reduce((sum, r) => sum + r.rating!, 0) / ratedThisYear.length).toFixed(1)
    : null

  const ratingCounts = new Map<number, number>()
  for (const r of ratingRows.rows as unknown as { rating: number; count: number }[]) {
    ratingCounts.set(r.rating, r.count)
  }
  const ratingBars = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: ratingCounts.get(i + 1) ?? 0,
    label: RATING_MAP[i + 1] ?? '',
  }))
  const maxRatingCount = Math.max(...ratingBars.map(b => b.count), 1)

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>

          <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{
                width: 72, height: 72, borderRadius: '50%',
                border: '3px solid rgba(196,96,58,0.4)',
              }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#C4603A', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff',
              }}>
                {(user.name ?? user.username)[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 32,
                fontWeight: 700, color: '#fff', lineHeight: 1.2,
              }}>
                {user.name ?? user.username}
              </h1>
              <div style={{ fontSize: 13, color: '#567', marginTop: 4, display: 'flex', gap: 16 }}>
                <span>{logged.length} {logged.length === 1 ? 'book' : 'books'}</span>
                <a href={`/user/${id}/followers`} style={{ color: 'inherit', textDecoration: 'none' }}>{followerCount.total} {followerCount.total === 1 ? 'follower' : 'followers'}</a>
                <a href={`/user/${id}/following`} style={{ color: 'inherit', textDecoration: 'none' }}>{followingCount.total} following</a>
                {user.createdAt && (
                  <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                )}
              </div>
              {user.bio && (
                <div style={{ fontSize: 14, color: '#9ab', marginTop: 8, lineHeight: 1.6 }}>
                  {user.bio}
                </div>
              )}
            </div>
            {!isOwnProfile && session?.user && (
              <FollowButton userId={id} initialFollowing={isFollowing} />
            )}
            {isOwnProfile && (
              <a href="/profile" style={{
                fontSize: 12, color: '#789', textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '6px 14px', fontWeight: 600,
              }}>
                Edit Profile
              </a>
            )}
          </div>

          <FavoriteBooks favorites={favRows} isOwner={isOwnProfile} />

          {read.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
              {[
                { value: readThisYear.length, label: 'Books This Year' },
                { value: totalPages.toLocaleString(), label: 'Pages' },
                { value: avgRating ?? '-', label: 'Avg Rating' },
                { value: read.length, label: 'All Time' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: '#1c2028', borderRadius: 6, padding: '20px 16px', textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
                    fontWeight: 700, color: '#fff', lineHeight: 1,
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    color: '#567', textTransform: 'uppercase' as const, marginTop: 6,
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(genreRows.rows as unknown as { genre: string; count: number }[]).length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                color: '#567', textTransform: 'uppercase' as const, marginBottom: 14,
              }}>
                Favorite Genres
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(genreRows.rows as unknown as { genre: string; count: number }[]).map(g => (
                  <span key={g.genre} style={{
                    background: 'rgba(196,96,58,0.12)', color: '#C4603A',
                    borderRadius: 4, padding: '6px 12px',
                    fontSize: 13, fontWeight: 600,
                  }}>
                    {g.genre} ({g.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {ratingCounts.size > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                color: '#567', textTransform: 'uppercase' as const, marginBottom: 14,
              }}>
                Rating Distribution
              </div>
              <div style={{
                background: '#1c2028', borderRadius: 6, padding: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                  {ratingBars.map(bar => (
                    <div key={bar.rating} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{
                        width: '100%',
                        height: bar.count > 0 ? Math.max((bar.count / maxRatingCount) * 60, 3) : 3,
                        background: '#C4603A',
                        opacity: bar.count > 0 ? 0.3 + (bar.count / maxRatingCount) * 0.7 : 0.1,
                        borderRadius: 2,
                      }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {ratingBars.map(bar => (
                    <div key={bar.rating} style={{
                      flex: 1, textAlign: 'center',
                      fontSize: 9, color: '#567', lineHeight: 1.2,
                    }}>
                      {bar.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {reviewRows.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                color: '#567', textTransform: 'uppercase' as const, marginBottom: 18,
              }}>
                Reviews
              </div>
              {reviewRows.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', gap: 14, padding: '14px 0',
                  borderBottom: i < reviewRows.length - 1
                    ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <a href={`/book/${r.bookGoogleId}`} style={{ flexShrink: 0 }}>
                    {r.bookCoverUrl ? (
                      <img src={r.bookCoverUrl} alt="" style={{
                        width: 40, height: 60, borderRadius: 3, objectFit: 'cover',
                      }} />
                    ) : (
                      <div style={{
                        width: 40, height: 60, borderRadius: 3, background: '#1c2028',
                      }} />
                    )}
                  </a>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={`/book/${r.bookGoogleId}`} style={{
                      fontSize: 14, fontWeight: 600, color: '#ccc', textDecoration: 'none',
                      display: 'block',
                    }}>
                      {r.bookTitle}
                    </a>
                    {r.rating && (
                      <span style={{ fontSize: 12, color: '#C4603A' }}>
                        {RATING_MAP[r.rating] ?? ''}
                      </span>
                    )}
                    <div style={{
                      fontSize: 13, color: '#789', fontStyle: 'italic', marginTop: 4,
                      lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                    }}>
                      {r.review!.length > 300 ? r.review!.slice(0, 300) + '...' : r.review}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      {Number(r.likeCount) > 0 && (
                        <span style={{ fontSize: 11, color: '#e05c7a' }}>
                          ♥ {Number(r.likeCount)}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#456' }}>
                        {r.updatedAt
                          ? new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {logged.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                color: '#567', textTransform: 'uppercase' as const, marginBottom: 18,
              }}>
                Recent Activity
              </div>
              {logged.slice(0, 5).map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0',
                  borderBottom: i < Math.min(logged.length, 5) - 1
                    ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <a href={`/book/${item.book.googleId}`}>
                    {item.book.coverUrl ? (
                      <img src={item.book.coverUrl} alt="" style={{
                        width: 40, height: 60, borderRadius: 3, objectFit: 'cover',
                        flexShrink: 0,
                      }} />
                    ) : (
                      <div style={{
                        width: 40, height: 60, borderRadius: 3,
                        background: '#1c2028', flexShrink: 0,
                      }} />
                    )}
                  </a>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={`/book/${item.book.googleId}`} style={{
                      fontSize: 13, fontWeight: 600, color: '#ccc',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      display: 'block',
                    }}>
                      {item.book.title}
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 12, color: '#567' }}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                      {item.rating && (
                        <span style={{ fontSize: 12, color: '#C4603A' }}>
                          {RATING_MAP[item.rating] ?? ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#456', flexShrink: 0 }}>
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          <ProfileShelf title="Read" items={read} />
          <ProfileShelf title="Currently Reading" items={reading} />
          <ProfileShelf title="Want to Read" items={want} />

          {logged.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 0', color: '#567',
            }}>
              <div style={{ fontSize: 15 }}>This shelf is empty</div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
