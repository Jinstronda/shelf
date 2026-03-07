'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { RATINGS } from '@/lib/constants'

export interface UserLog {
  status: string
  rating: number | null
  review: string | null
  notes: string | null
  liked: boolean | null
  spoiler: boolean | null
  readAt: string | null
  dnfReason: string | null
  format: string | null
}

interface Props {
  googleId: string
  bookDbId: string | null
  userLog: UserLog | null
  onShare: (rating: number | null, review: string) => void
}

export function LogBookForm({ googleId, bookDbId, userLog, onShare }: Props) {
  const [rating, setRating]   = useState<number | null>(userLog?.rating ?? null)
  const [review, setReview]   = useState(userLog?.review ?? '')
  const [notes, setNotes]     = useState(userLog?.notes ?? '')
  const [status, setStatus]   = useState<'read' | 'reading' | 'want' | 'dnf'>((userLog?.status as 'read' | 'reading' | 'want' | 'dnf') ?? 'read')
  const [dnfReason, setDnfReason] = useState(userLog?.dnfReason ?? '')
  const [format, setFormat]   = useState<string | null>(userLog?.format ?? null)
  const [liked, setLiked]     = useState(userLog?.liked ?? false)
  const [spoiler, setSpoiler] = useState(userLog?.spoiler ?? false)
  const [readAt, setReadAt]   = useState<string | null>(userLog?.readAt ?? (userLog?.status === 'read' || !userLog ? new Date().toISOString().slice(0, 10) : null))
  const [hover, setHover]     = useState<number | null>(null)
  const [saved, setSaved]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [showLists, setShowLists] = useState(false)
  const [userLists, setUserLists] = useState<{ id: string, name: string }[]>([])
  const [addedToList, setAddedToList] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { data: session } = useSession()

  const displayRating = hover ?? rating
  const ratingLabel = displayRating ? RATINGS.find(r => r.value === displayRating)?.label : null

  function getLogButtonLabel(): string {
    if (saving) return 'Saving...'
    if (saved) return userLog ? 'Updated!' : 'Saved!'
    if (!session?.user) return 'Sign in to log'
    return userLog ? 'Update Log' : 'Log Book'
  }

  async function resolveBookId(): Promise<string> {
    if (bookDbId) return bookDbId
    const res = await fetch('/api/books/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleId }),
    })
    if (!res.ok) throw new Error('Failed to add book')
    return (await res.json()).id
  }

  async function handleLog() {
    if (!session?.user) return
    setSaving(true)
    try {
      const id = await resolveBookId()
      const logRes = await fetch('/api/user-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: id,
          status,
          rating,
          review: review || null,
          notes: notes || null,
          liked,
          spoiler,
          readAt: status === 'read' ? readAt : null,
          dnfReason: status === 'dnf' ? (dnfReason || null) : null,
          format,
        }),
      })
      if (!logRes.ok) throw new Error('Failed to save log')
      setSaved(true)
      setError(null)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!bookDbId) return
    setDeleting(true)
    try {
      const res = await fetch('/api/user-books', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: bookDbId }),
      })
      if (!res.ok) throw new Error('Failed to remove book')
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove book')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ background: '#1c2028', borderRadius: 6, padding: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginBottom: 20 }}>Log this book</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['read', 'reading', 'want', 'dnf'] as const).map(s => (
          <button key={s} onClick={() => {
            setStatus(s)
            if (s === 'read' && !readAt) setReadAt(new Date().toISOString().slice(0, 10))
            if (s !== 'read') setReadAt(null)
          }} style={{
            padding: '6px 14px', borderRadius: 4, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            background: status === s ? (s === 'dnf' ? '#8B4513' : 'var(--copper)') : 'rgba(255,255,255,0.07)',
            color: status === s ? '#fff' : '#789',
            transition: 'all 0.15s',
          }}>
            {s === 'read' ? 'Read' : s === 'reading' ? 'Reading' : s === 'want' ? 'Want to Read' : 'DNF'}
          </button>
        ))}
      </div>

      {status === 'dnf' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#567', marginBottom: 8 }}>Reason (optional)</div>
          <textarea
            value={dnfReason}
            onChange={e => setDnfReason(e.target.value)}
            placeholder="Why did you stop reading?"
            rows={2}
            maxLength={500}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
              padding: '10px 12px', color: '#e8e0d4', fontSize: 14,
              fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>
      )}

      {status === 'read' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#567', marginBottom: 8 }}>Date read</div>
          <input
            type="date"
            value={readAt ?? ''}
            onChange={e => setReadAt(e.target.value || null)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              padding: '8px 12px',
              color: '#e8e0d4',
              fontSize: 14,
              fontFamily: 'inherit',
              colorScheme: 'dark',
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#567', marginBottom: 8 }}>Format</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'paperback', label: 'Paperback', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
            { key: 'hardcover', label: 'Hardcover', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 4h2v14H4"/></svg> },
            { key: 'ebook', label: 'Ebook', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="18" x2="15" y2="18"/></svg> },
            { key: 'audiobook', label: 'Audiobook', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFormat(format === f.key ? null : f.key)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: format === f.key ? 'var(--copper)' : 'rgba(255,255,255,0.05)',
              color: format === f.key ? '#fff' : '#789',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}>
              {f.icon}
              <span style={{ fontSize: 10 }}>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            id="spoiler-toggle"
            checked={spoiler}
            onChange={e => setSpoiler(e.target.checked)}
            style={{ accentColor: '#C4603A' }}
          />
          <label htmlFor="spoiler-toggle" style={{ fontSize: 12, color: '#567', cursor: 'pointer' }}>
            Contains spoilers
          </label>
        </div>
      </div>

      {session?.user && (
        <div style={{ marginBottom: 20, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#567" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{ fontSize: 12, color: '#567' }}>Private notes</span>
          </div>
          <div style={{ fontSize: 10, color: '#456', marginBottom: 8 }}>only you can see these</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add private notes..."
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
              padding: '10px 12px', color: '#e8e0d4', fontSize: 14,
              fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>
      )}

      <div className="log-actions" style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleLog} disabled={saving || !session?.user} style={{
          background: saved ? '#2a5a3a' : 'var(--copper)', color: '#fff', border: 'none',
          borderRadius: 4, padding: '10px 24px', fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit', cursor: session?.user ? 'pointer' : 'not-allowed',
          transition: 'background 0.15s', opacity: saving ? 0.6 : 1,
        }}>
          {getLogButtonLabel()}
        </button>
        <button onClick={() => onShare(rating, review)} style={{
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
                    try {
                      const id = await resolveBookId()
                      const listRes = await fetch(`/api/lists/${list.id}/items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bookId: id }),
                      })
                      if (!listRes.ok) throw new Error('Failed to add to list')
                      setAddedToList(list.name)
                      setShowLists(false)
                      setTimeout(() => setAddedToList(null), 2000)
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to add to list')
                    }
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
        {session?.user && userLog && (
          confirmDelete ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#c44' }}>Confirm delete?</span>
              <button onClick={handleDelete} disabled={deleting} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                color: '#c44', padding: '4px 8px', opacity: deleting ? 0.5 : 1,
              }}>
                {deleting ? 'Removing...' : 'Yes, remove'}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                color: '#567', padding: '4px 8px',
              }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: '#c44', fontSize: 12, fontFamily: 'inherit',
              padding: '4px 8px', opacity: 0.7,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Remove
            </button>
          )
        )}
      </div>
      {addedToList && (
        <div style={{ fontSize: 12, color: '#2a5a3a', marginTop: 12, fontWeight: 600 }}>
          Added to "{addedToList}"
        </div>
      )}
      {error && (
        <div style={{ fontSize: 12, color: '#c44', marginTop: 12, fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  )
}
