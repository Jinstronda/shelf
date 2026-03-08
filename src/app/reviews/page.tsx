import { db } from '@/lib/db'
import { userBooks, users, books, reviewLikes } from '@/lib/schema'
import { eq, desc, isNotNull, sql, and } from 'drizzle-orm'
import { resolveCoverUrl } from '@/lib/covers'
import { RATING_MAP } from '@/lib/constants'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Popular Reviews — Shelf' }

export default async function ReviewsPage() {
  const rows = await db
    .select({
      id: userBooks.id,
      review: userBooks.review,
      rating: userBooks.rating,
      liked: userBooks.liked,
      spoiler: userBooks.spoiler,
      createdAt: userBooks.createdAt,
      userId: userBooks.userId,
      userName: users.username,
      userAvatar: users.avatarUrl,
      bookTitle: books.title,
      bookGoogleId: books.googleId,
      bookCoverUrl: books.coverUrl,
      bookCoverR2Key: books.coverR2Key,
      likeCount: sql<number>`count(${reviewLikes.id})`.as('like_count'),
    })
    .from(userBooks)
    .innerJoin(users, eq(userBooks.userId, users.id))
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .leftJoin(reviewLikes, eq(reviewLikes.reviewId, userBooks.id))
    .where(and(isNotNull(userBooks.review), eq(users.privacy, 'public')))
    .groupBy(
      userBooks.id, userBooks.review, userBooks.rating, userBooks.liked,
      userBooks.spoiler, userBooks.createdAt, userBooks.userId,
      users.username, users.avatarUrl,
      books.title, books.googleId, books.coverUrl, books.coverR2Key,
    )
    .orderBy(desc(sql`count(${reviewLikes.id})`), desc(userBooks.createdAt))
    .limit(50)

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 700, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            Popular Reviews
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 32 }}>
            {rows.length} {rows.length === 1 ? 'review' : 'reviews'}
          </div>

          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No reviews yet</div>
              <a href="/discover" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Discover books to review
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {rows.map((r, i) => {
                const cover = resolveCoverUrl(r.bookCoverR2Key, r.bookCoverUrl)
                const truncated = r.review && r.review.length > 200
                  ? r.review.slice(0, 200).trimEnd() + '...'
                  : r.review
                const likeCount = Number(r.likeCount)

                return (
                  <div key={r.id} style={{
                    padding: '20px 0',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <a
                        href={r.bookGoogleId ? `/book/${r.bookGoogleId}` : '#'}
                        style={{ flexShrink: 0, textDecoration: 'none' }}
                      >
                        <div style={{
                          width: 40, height: 60, borderRadius: 3, overflow: 'hidden',
                          background: '#1c2028',
                        }}>
                          {cover && (
                            <img src={cover} alt={r.bookTitle}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                      </a>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <a href={`/user/${r.userId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {r.userAvatar ? (
                              <img src={r.userAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                            ) : (
                              <div style={{
                                width: 24, height: 24, borderRadius: '50%', background: '#2a2e36',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, color: '#567',
                              }}>
                                {(r.userName ?? '?')[0]}
                              </div>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{r.userName}</span>
                          </a>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                          <a href={r.bookGoogleId ? `/book/${r.bookGoogleId}` : '#'}
                            style={{ fontSize: 15, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
                            {r.bookTitle}
                          </a>
                          {r.rating && (
                            <span style={{ fontSize: 13, color: '#C4603A', flexShrink: 0 }}>{RATING_MAP[r.rating]}</span>
                          )}
                          {r.liked && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#e05c7a" stroke="none" style={{ flexShrink: 0 }}>
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          )}
                        </div>

                        {r.spoiler ? (
                          <div>
                            <p style={{
                              fontSize: 14, lineHeight: 1.7, color: '#9ab', margin: 0,
                              filter: 'blur(5px)', userSelect: 'none',
                            }}>
                              {truncated}
                            </p>
                            <div style={{ marginTop: 4 }}>
                              <span style={{ fontSize: 12, color: '#C4603A', fontStyle: 'italic' }}>Contains spoilers</span>
                              {r.bookGoogleId && (
                                <>
                                  {' '}
                                  <a href={`/book/${r.bookGoogleId}`} style={{
                                    fontSize: 11, color: '#C4603A', textDecoration: 'underline',
                                  }}>
                                    Read on book page
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#9ab', margin: 0 }}>
                              {truncated}
                            </p>
                            {r.review && r.review.length > 200 && r.bookGoogleId && (
                              <a href={`/book/${r.bookGoogleId}`} style={{
                                fontSize: 12, color: '#C4603A', textDecoration: 'none', fontWeight: 600,
                              }}>
                                read more
                              </a>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                          {r.createdAt && (
                            <span style={{ fontSize: 11, color: '#456' }}>
                              {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                          {likeCount > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#567' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                              </svg>
                              {likeCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
