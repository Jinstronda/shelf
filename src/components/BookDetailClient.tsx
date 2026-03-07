'use client'
import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toPng } from 'html-to-image'
import { NavScroll } from './NavScroll'
import { SearchBar } from './SearchBar'
import { AuthNav } from './AuthNav'
import { LogoSVG } from './Logo'
import type { BookResult } from '@/lib/google-books'

const RATINGS = [
  { value: 10, label: '★★★★★' },
  { value: 9,  label: '★★★★½' },
  { value: 8,  label: '★★★★'  },
  { value: 7,  label: '★★★½'  },
  { value: 6,  label: '★★★'   },
  { value: 5,  label: '★★½'   },
  { value: 4,  label: '★★'    },
  { value: 3,  label: '★½'    },
  { value: 2,  label: '★'     },
  { value: 1,  label: '½'     },
]

export function BookDetailClient({ book }: { book: BookResult }) {
  const [rating, setRating]   = useState<number | null>(null)
  const [review, setReview]   = useState('')
  const [status, setStatus]   = useState<'read' | 'reading' | 'want'>('read')
  const [liked, setLiked]     = useState(false)
  const [hover, setHover]     = useState<number | null>(null)
  const [saved, setSaved]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [showLists, setShowLists] = useState(false)
  const [userLists, setUserLists] = useState<{ id: string, name: string }[]>([])
  const [addedToList, setAddedToList] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  const displayRating = hover ?? rating
  const ratingLabel = displayRating ? RATINGS.find(r => r.value === displayRating)?.label : null

  async function handleLog() {
    if (!rating || !session?.user) return
    setSaving(true)
    try {
      // Persist book to DB first
      const addRes = await fetch('/api/books/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleId: book.googleId }),
      })
      if (!addRes.ok) throw new Error('Failed to add book')
      const dbBook = await addRes.json()

      // Log user's rating/review
      await fetch('/api/user-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: dbBook.id,
          status,
          rating,
          review: review || null,
          liked,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <NavScroll>
        <a className="nav-logo" href="/">
          <LogoSVG />
          <span className="nav-logo-text">Shelf</span>
        </a>
        <ul className="nav-links">
          <AuthNav />
          <li><a href="/books">Books</a></li>
          <li><a href="/lists">Lists</a></li>
          <li><a href="/members">Members</a></li>
        </ul>
        <SearchBar />
      </NavScroll>

      {/* Hero — blurred book cover bg */}
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

        <div style={{
          position: 'relative', display: 'flex', gap: 40,
          padding: '48px 48px 0', alignItems: 'flex-end', width: '100%',
        }}>
          {/* Cover */}
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

          {/* Meta */}
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

      {/* Main content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 48px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 48 }}>

          {/* Left: description + reviews */}
          <div>
            {book.description && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginBottom: 16 }}>About this book</div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: '#9ab' }}>
                  {book.description.slice(0, 600)}{book.description.length > 600 ? '…' : ''}
                </p>
              </div>
            )}

            {/* Review input */}
            <div style={{ background: '#1c2028', borderRadius: 6, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginBottom: 20 }}>Log this book</div>

              {/* Status */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['read', 'reading', 'want'] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)} style={{
                    padding: '6px 14px', borderRadius: 4, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                    background: status === s ? 'var(--copper)' : 'rgba(255,255,255,0.07)',
                    color: status === s ? '#fff' : '#789',
                    transition: 'all 0.15s',
                  }}>
                    {s === 'read' ? 'Read' : s === 'reading' ? 'Reading' : 'Want to Read'}
                  </button>
                ))}
              </div>

              {/* Star rating */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#567', marginBottom: 8 }}>Rating</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {RATINGS.slice().reverse().map(r => (
                    <button key={r.value}
                      onClick={() => setRating(rating === r.value ? null : r.value)}
                      onMouseEnter={() => setHover(r.value)}
                      onMouseLeave={() => setHover(null)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px',
                        fontSize: 22,
                        color: (displayRating ?? 0) >= r.value ? '#C4603A' : '#333',
                        transition: 'color 0.1s',
                      }}
                    >★</button>
                  ))}
                  {ratingLabel && (
                    <span style={{ fontSize: 13, color: '#C4603A', marginLeft: 8, fontWeight: 600 }}>
                      {ratingLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Like */}
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setLiked(!liked)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: liked ? '#e05c7a' : '#567', fontSize: 13,
                  fontFamily: 'inherit', padding: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"
                    fill={liked ? '#e05c7a' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {liked ? 'Liked' : 'Like this book'}
                </button>
              </div>

              {/* Review textarea */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#567', marginBottom: 8 }}>Review (optional)</div>
                <textarea
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  placeholder="Write a review…"
                  rows={4}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                    padding: '10px 12px', color: '#e8e0d4', fontSize: 14,
                    fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleLog} disabled={saving || !session?.user} style={{
                  background: saved ? '#2a5a3a' : 'var(--copper)', color: '#fff', border: 'none',
                  borderRadius: 4, padding: '10px 24px', fontSize: 13, fontWeight: 700,
                  fontFamily: 'inherit', cursor: session?.user ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s', opacity: saving ? 0.6 : 1,
                }}>
                  {saving ? 'Saving...' : saved ? 'Saved!' : !session?.user ? 'Sign in to log' : 'Log Book'}
                </button>
                <button onClick={() => setSharing(true)} style={{
                  background: 'rgba(255,255,255,0.07)', color: '#9ab', border: 'none',
                  borderRadius: 4, padding: '10px 20px', fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share Card
                </button>
                {session?.user && (
                  <div style={{ position: 'relative' }}>
                    <button onClick={async () => {
                      if (!showLists) {
                        const res = await fetch('/api/lists')
                        if (res.ok) setUserLists(await res.json())
                      }
                      setShowLists(!showLists)
                    }} style={{
                      background: 'rgba(255,255,255,0.07)', color: '#9ab', border: 'none',
                      borderRadius: 4, padding: '10px 16px', fontSize: 13, fontWeight: 600,
                      fontFamily: 'inherit', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      List
                    </button>
                    {showLists && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, marginTop: 6,
                        background: '#1c2028', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6, padding: 8, minWidth: 200, zIndex: 10,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                      }}>
                        {userLists.length > 0 ? userLists.map(list => (
                          <button key={list.id} onClick={async () => {
                            const addRes = await fetch('/api/books/add', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ googleId: book.googleId }),
                            })
                            if (!addRes.ok) return
                            const dbBook = await addRes.json()
                            await fetch(`/api/lists/${list.id}/items`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ bookId: dbBook.id }),
                            })
                            setAddedToList(list.name)
                            setShowLists(false)
                            setTimeout(() => setAddedToList(null), 2000)
                          }} style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            background: 'none', border: 'none', padding: '8px 12px',
                            color: '#ccc', fontSize: 13, fontFamily: 'inherit',
                            cursor: 'pointer', borderRadius: 4,
                          }}>
                            {list.name}
                          </button>
                        )) : (
                          <div style={{ padding: '8px 12px', fontSize: 12, color: '#567' }}>
                            No lists yet. <a href="/lists" style={{ color: '#C4603A' }}>Create one</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {addedToList && (
                <div style={{ fontSize: 12, color: '#2a5a3a', marginTop: 12, fontWeight: 600 }}>
                  Added to "{addedToList}"
                </div>
              )}
            </div>
          </div>

          {/* Right: book info sidebar */}
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
          </div>
        </div>
      </div>

      {/* Share Card Modal */}
      {sharing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }} onClick={() => setSharing(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 340, background: '#14181c',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
          }}>
            {/* Share card preview */}
            <div ref={cardRef} style={{
              background: '#0d0d0d', padding: 24,
              display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
              <div style={{ width: 70, height: 105, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: '#222' }}>
                {book.coverUrl && <img src={book.coverUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{book.title}</div>
                <div style={{ fontSize: 12, color: '#789', marginBottom: 12 }}>{book.authors[0]}</div>
                {rating && (
                  <div style={{ fontSize: 18, color: '#C4603A', marginBottom: 8 }}>
                    {RATINGS.find(r => r.value === rating)?.label}
                  </div>
                )}
                {review && (
                  <div style={{ fontSize: 12, color: '#9ab', lineHeight: 1.55, fontStyle: 'italic' }}>
                    &ldquo;{review.slice(0, 120)}{review.length > 120 ? '...' : ''}&rdquo;
                  </div>
                )}
                <div style={{ marginTop: 14, fontSize: 10, color: '#456', letterSpacing: '0.08em' }}>shelf.app</div>
              </div>
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 8 }}>
              <button onClick={async () => {
                if (!cardRef.current) return
                try {
                  const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 })
                  const res = await fetch(dataUrl)
                  const blob = await res.blob()
                  await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob }),
                  ])
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                } catch {
                  // Fallback: download the image
                  const dataUrl = await toPng(cardRef.current!, { pixelRatio: 2 })
                  const link = document.createElement('a')
                  link.download = `shelf-${book.title.toLowerCase().replace(/\s+/g, '-')}.png`
                  link.href = dataUrl
                  link.click()
                }
              }} style={{
                flex: 1, background: copied ? '#2a5a3a' : '#C4603A', color: '#fff', border: 'none',
                borderRadius: 4, padding: '10px', fontSize: 13, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer', transition: 'background 0.15s',
              }}>
                {copied ? 'Copied!' : 'Copy Image'}
              </button>
              <button onClick={async () => {
                if (!cardRef.current) return
                const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 })
                const link = document.createElement('a')
                link.download = `shelf-${book.title.toLowerCase().replace(/\s+/g, '-')}.png`
                link.href = dataUrl
                link.click()
              }} style={{
                background: 'rgba(255,255,255,0.07)', color: '#9ab', border: 'none',
                borderRadius: 4, padding: '10px 16px', fontSize: 13,
                fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Save
              </button>
              <button onClick={() => setSharing(false)} style={{
                background: 'rgba(255,255,255,0.07)', color: '#789', border: 'none',
                borderRadius: 4, padding: '10px 16px', fontSize: 13,
                fontFamily: 'inherit', cursor: 'pointer',
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
