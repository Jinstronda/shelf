'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { RATING_MAP } from '@/lib/constants'

interface ReviewComment {
  id: string
  reviewId: string
  userId: string
  text: string
  userName: string
  userAvatar: string | null
  createdAt: string | null
}

export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  rating: number | null
  review: string
  liked: boolean | null
  spoiler: boolean | null
  likeCount: number
  commentCount: number
  date: string | null
}

interface Props {
  reviews: Review[]
}

export function ReviewList({ reviews }: Props) {
  const { data: session } = useSession()
  const [reviewLikeCounts, setReviewLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(reviews.map(r => [r.id, r.likeCount]))
  )
  const [userLikedReviewIds, setUserLikedReviewIds] = useState<string[]>([])
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentsByReview, setCommentsByReview] = useState<Record<string, ReviewComment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    Object.fromEntries(reviews.map(r => [r.id, r.commentCount]))
  )
  const [postingComment, setPostingComment] = useState<string | null>(null)
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (reviews.length === 0) return
    const ids = reviews.map(r => r.id).join(',')
    fetch(`/api/review-likes?ids=${ids}`)
      .then(res => res.ok ? res.json() : {})
      .then((data: Record<string, { count: number, liked: boolean }>) => {
        const liked: string[] = []
        const counts: Record<string, number> = {}
        for (const [id, v] of Object.entries(data)) {
          counts[id] = v.count
          if (v.liked) liked.push(id)
        }
        setReviewLikeCounts(prev => ({ ...prev, ...counts }))
        setUserLikedReviewIds(liked)
      })
  }, [reviews])

  async function handleReviewLike(reviewId: string) {
    if (!session?.user) return
    const wasLiked = userLikedReviewIds.includes(reviewId)
    setUserLikedReviewIds(prev => wasLiked ? prev.filter(id => id !== reviewId) : [...prev, reviewId])
    setReviewLikeCounts(prev => ({ ...prev, [reviewId]: (prev[reviewId] ?? 0) + (wasLiked ? -1 : 1) }))
    try {
      const res = await fetch('/api/review-likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      })
      if (!res.ok) throw new Error()
      const { liked: nowLiked, count } = await res.json()
      setUserLikedReviewIds(prev => nowLiked ? [...prev.filter(id => id !== reviewId), reviewId] : prev.filter(id => id !== reviewId))
      setReviewLikeCounts(prev => ({ ...prev, [reviewId]: count }))
    } catch {
      setUserLikedReviewIds(prev => wasLiked ? [...prev, reviewId] : prev.filter(id => id !== reviewId))
      setReviewLikeCounts(prev => ({ ...prev, [reviewId]: (prev[reviewId] ?? 0) + (wasLiked ? 1 : -1) }))
    }
  }

  async function toggleComments(reviewId: string) {
    const isOpen = expandedComments[reviewId]
    setExpandedComments(prev => ({ ...prev, [reviewId]: !isOpen }))
    if (!isOpen && !commentsByReview[reviewId]) {
      try {
        const res = await fetch(`/api/review-comments?reviewId=${reviewId}`)
        if (res.ok) {
          const data: ReviewComment[] = await res.json()
          setCommentsByReview(prev => ({ ...prev, [reviewId]: data }))
          setCommentCounts(prev => ({ ...prev, [reviewId]: data.length }))
        }
      } catch {
        // user can retry
      }
    }
  }

  async function postComment(reviewId: string) {
    const text = commentInputs[reviewId]?.trim()
    if (!text || !session?.user) return
    setPostingComment(reviewId)
    try {
      const res = await fetch('/api/review-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, text }),
      })
      if (!res.ok) throw new Error()
      const comment: ReviewComment = await res.json()
      setCommentsByReview(prev => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] ?? []), comment],
      }))
      setCommentCounts(prev => ({ ...prev, [reviewId]: (prev[reviewId] ?? 0) + 1 }))
      setCommentInputs(prev => ({ ...prev, [reviewId]: '' }))
    } catch {
      // silently fail
    } finally {
      setPostingComment(null)
    }
  }

  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 16,
      }}>Reviews</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {reviews.map((r, i) => {
          const isLiked = userLikedReviewIds.includes(r.id)
          const likeCount = reviewLikeCounts[r.id] ?? 0
          const isSpoiler = r.spoiler && !revealedSpoilers[r.id]
          return (
            <div key={r.id} style={{
              padding: '16px 0',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <a href={`/user/${r.userId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {r.userAvatar ? (
                    <img src={r.userAvatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2e36', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#567' }}>
                      {r.userName[0]}
                    </div>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{r.userName}</span>
                </a>
                {r.rating && (
                  <span style={{ fontSize: 13, color: '#C4603A' }}>{RATING_MAP[r.rating]}</span>
                )}
                {r.liked && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#e05c7a" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                )}
              </div>
              <p style={{
                fontSize: 14, lineHeight: 1.7, color: '#9ab', margin: 0,
                ...(isSpoiler ? { filter: 'blur(5px)', userSelect: 'none' as const, cursor: 'default' } : {}),
              }}>
                {r.review}
              </p>
              {r.spoiler && !revealedSpoilers[r.id] && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#C4603A', fontStyle: 'italic' }}>This review contains spoilers</span>
                  {' '}
                  <button onClick={() => setRevealedSpoilers(prev => ({ ...prev, [r.id]: true }))} style={{
                    fontSize: 11, color: '#C4603A', background: 'none', border: 'none',
                    cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', padding: 0,
                  }}>
                    Show Review
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                {r.date && (
                  <span style={{ fontSize: 11, color: '#456' }}>
                    {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                <button onClick={() => handleReviewLike(r.id)} style={{
                  background: 'none', border: 'none', cursor: session?.user ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                  color: isLiked ? '#C4603A' : '#567', fontSize: 12, fontFamily: 'inherit',
                  transition: 'color 0.15s',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24"
                    fill={isLiked ? '#C4603A' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>
                <button onClick={() => toggleComments(r.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                  color: '#567', fontSize: 12, fontFamily: 'inherit',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Reply{(commentCounts[r.id] ?? 0) > 0 ? ` (${commentCounts[r.id]})` : ''}
                </button>
              </div>
              {expandedComments[r.id] && (
                <div style={{ marginTop: 12, paddingLeft: 20, borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                  {(commentsByReview[r.id] ?? []).map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                      {c.userAvatar ? (
                        <img src={c.userAvatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2a2e36', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#567', flexShrink: 0 }}>
                          {c.userName[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>{c.userName}</span>
                          {c.createdAt && (
                            <span style={{ fontSize: 10, color: '#456' }}>
                              {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: '#9ab', margin: '2px 0 0', lineHeight: 1.5 }}>{c.text}</p>
                      </div>
                    </div>
                  ))}
                  {session?.user && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        value={commentInputs[r.id] ?? ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') postComment(r.id) }}
                        placeholder="Write a comment..."
                        maxLength={1000}
                        style={{
                          flex: 1, background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                          padding: '6px 10px', color: '#e8e0d4', fontSize: 12,
                          fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => postComment(r.id)}
                        disabled={postingComment === r.id || !(commentInputs[r.id]?.trim())}
                        style={{
                          background: 'var(--copper)', color: '#fff', border: 'none',
                          borderRadius: 4, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                          fontFamily: 'inherit', cursor: 'pointer',
                          opacity: postingComment === r.id || !(commentInputs[r.id]?.trim()) ? 0.5 : 1,
                        }}
                      >
                        {postingComment === r.id ? '...' : 'Post'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
