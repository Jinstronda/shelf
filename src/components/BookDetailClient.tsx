'use client'
import { useState } from 'react'
import { SiteNav } from './SiteNav'
import { ShareCardModal } from './ShareCardModal'
import { ReviewList } from './ReviewList'
import { LogBookForm } from './LogBookForm'
import { QuotesSection } from './QuotesSection'
import { TagsInput } from './TagsInput'
import type { BookResult } from '@/lib/google-books'
import type { Review } from './ReviewList'
import type { UserLog } from './LogBookForm'
import type { BookQuote } from '@/lib/schema'
import { RATING_MAP } from '@/lib/constants'

interface RelatedBook {
  googleId: string
  title: string
  authors: string[]
  coverUrl: string | null
  logCount: number
}

interface AuthorBook {
  googleId: string
  title: string
  coverUrl: string | null
}

interface Props {
  book: BookResult
  bookDbId: string | null
  reviews: Review[]
  avgRating: number | null
  totalLogs: number
  ratingDistribution: { rating: number; count: number }[]
  relatedBooks: RelatedBook[]
  authorBooks: AuthorBook[]
  userLog: UserLog | null
  userQuotes: BookQuote[]
  userTags: string[]
}

export function BookDetailClient({ book, bookDbId, reviews, avgRating, totalLogs, ratingDistribution, relatedBooks, authorBooks, userLog, userQuotes, userTags }: Props) {
  const [shareData, setShareData] = useState<{ rating: number | null, review: string } | null>(null)

  return (
    <>
      <SiteNav />

      <div style={{
        position: 'relative', minHeight: 320, paddingTop: 52,
        overflow: 'hidden', display: 'flex', alignItems: 'flex-end',
        background: '#14181c',
      }}>
        {book.coverUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${book.coverUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(60px) saturate(0.5)',
            opacity: 0.25, transform: 'scale(1.1)',
          }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #14181c 0%, rgba(20,24,28,0.6) 100%)' }} />

        <div className="book-hero-inner" style={{
          position: 'relative', display: 'flex', gap: 40,
          padding: '48px 48px 0', alignItems: 'flex-end', width: '100%',
        }}>
          <div style={{
            width: 160, height: 240, borderRadius: 4, overflow: 'hidden',
            flexShrink: 0, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            background: '#1c2028', marginBottom: -32,
          }}>
            {book.coverUrl && (
              <img src={book.coverUrl} alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>

          <div style={{ paddingBottom: 40 }}>
            <div style={{ fontSize: 11, color: '#567', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              {book.published?.slice(0, 4)} · {book.genres[0] ?? 'Fiction'}
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 10,
            }}>
              {book.title}
            </h1>
            <div style={{ fontSize: 15, color: '#9ab' }}>
              by <span style={{ color: '#ccc', fontWeight: 600 }}>{book.authors.join(', ')}</span>
              {book.publisher && <span style={{ color: '#567' }}> · {book.publisher}</span>}
            </div>
            {book.pageCount && (
              <div style={{ fontSize: 13, color: '#567', marginTop: 6 }}>{book.pageCount} pages</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div className="book-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 48 }}>

          <div>
            {book.description && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginBottom: 16 }}>About this book</div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: '#9ab' }}>
                  {book.description.slice(0, 600)}{book.description.length > 600 ? '…' : ''}
                </p>
              </div>
            )}

            <LogBookForm
              googleId={book.googleId}
              bookDbId={bookDbId}
              userLog={userLog}
              onShare={(rating, review) => setShareData({ rating, review })}
            />

            {bookDbId && (
              <QuotesSection bookDbId={bookDbId} initialQuotes={userQuotes} />
            )}

            {bookDbId && userTags && (
              <TagsInput bookDbId={bookDbId} initialTags={userTags} />
            )}

            {totalLogs > 0 && (
              <div style={{
                display: 'flex', gap: 24, padding: '16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24,
              }}>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24, color: '#C4603A', fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
                      {avgRating}
                    </span>
                    <span style={{ fontSize: 12, color: '#567' }}>avg rating</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16, color: '#9ab', fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
                    {totalLogs}
                  </span>
                  <span style={{ fontSize: 12, color: '#567' }}>{totalLogs === 1 ? 'log' : 'logs'}</span>
                </div>
              </div>
            )}

            {totalLogs > 0 && ratingDistribution.some(d => d.count > 0) && (() => {
              const maxCount = Math.max(...ratingDistribution.map(d => d.count))
              return (
                <div style={{ maxWidth: 400, marginBottom: 32 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    color: '#567', textTransform: 'uppercase', marginBottom: 12,
                  }}>Rating Distribution</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {ratingDistribution.map(d => (
                      <div key={d.rating} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 14 }}>
                        <span style={{ fontSize: 11, color: '#567', width: 52, textAlign: 'right', flexShrink: 0 }}>
                          {RATING_MAP[d.rating]}
                        </span>
                        <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                          {d.count > 0 && (
                            <div style={{
                              width: `${(d.count / maxCount) * 100}%`,
                              height: '100%', background: 'rgba(196,96,58,0.7)', borderRadius: 2,
                              minWidth: 3,
                            }} />
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#567', width: 24, flexShrink: 0 }}>{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {reviews.length > 0 && <ReviewList reviews={reviews} />}

            {relatedBooks.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                  color: '#567', textTransform: 'uppercase', marginBottom: 16,
                }}>Readers Also Enjoyed</div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
                  {relatedBooks.map(rb => (
                    <a key={rb.googleId} href={`/book/${rb.googleId}`} style={{
                      textDecoration: 'none', flexShrink: 0, width: 100,
                    }}>
                      <div style={{
                        width: 100, height: 150, borderRadius: 4, overflow: 'hidden',
                        background: '#1c2028', marginBottom: 8,
                      }}>
                        {rb.coverUrl ? (
                          <img src={rb.coverUrl} alt={rb.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, color: '#567', padding: 8, textAlign: 'center',
                          }}>{rb.title}</div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 12, color: '#ccc', fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{rb.title}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ background: '#1c2028', borderRadius: 6, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginBottom: 16 }}>Details</div>
              {[
                ['ISBN-13', book.isbn13],
                ['ISBN-10', book.isbn10],
                ['Publisher', book.publisher],
                ['Published', book.published],
                ['Pages', book.pageCount],
                ['Language', book.language?.toUpperCase()],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                  <span style={{ color: '#567' }}>{label}</span>
                  <span style={{ color: '#9ab', textAlign: 'right', maxWidth: 160 }}>{value}</span>
                </div>
              ))}
            </div>

            {book.genres.length > 0 && (
              <div style={{ background: '#1c2028', borderRadius: 6, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginBottom: 14 }}>Genres</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {book.genres.slice(0, 8).map(g => (
                    <span key={g} style={{
                      background: 'rgba(196,96,58,0.12)', color: '#C4603A',
                      borderRadius: 3, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                    }}>{g}</span>
                  ))}
                </div>
              </div>
            )}

            {authorBooks.length > 0 && (
              <div style={{ background: '#1c2028', borderRadius: 6, padding: 20, marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginBottom: 14 }}>
                  More by {book.authors[0]}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {authorBooks.map(ab => (
                    <a key={ab.googleId} href={`/book/${ab.googleId}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        width: 60, height: 90, borderRadius: 3, overflow: 'hidden',
                        background: '#14181c', marginBottom: 6,
                      }}>
                        {ab.coverUrl ? (
                          <img src={ab.coverUrl} alt={ab.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: '#567', padding: 4, textAlign: 'center',
                          }}>{ab.title}</div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 11, color: '#ccc', fontWeight: 600,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{ab.title}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {shareData && (
        <ShareCardModal
          title={book.title}
          authors={book.authors}
          coverUrl={book.coverUrl}
          rating={shareData.rating}
          review={shareData.review}
          onClose={() => setShareData(null)}
        />
      )}
    </>
  )
}
