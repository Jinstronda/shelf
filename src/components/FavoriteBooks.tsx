'use client'
import { useState, useEffect } from 'react'

interface FavoriteItem {
  bookId: string
  googleId: string | null
  title: string
  coverUrl: string | null
}

interface UserBookItem {
  bookId: string
  book: {
    id: string
    googleId: string | null
    title: string
    coverUrl: string | null
  }
}

interface Props {
  favorites: FavoriteItem[]
  isOwner: boolean
}

export function FavoriteBooks({ favorites: initial, isOwner }: Props) {
  const [favorites, setFavorites] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [userBooks, setUserBooks] = useState<UserBookItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!editing) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch('/api/user-books?status=read')
      .then(r => r.json())
      .then(data => setUserBooks(data))
      .finally(() => setLoading(false))
  }, [editing])

  async function addFavorite(bookId: string) {
    if (favorites.length >= 4) return
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId }),
    })
    if (!res.ok) return
    const match = userBooks.find(ub => ub.book.id === bookId)
    if (!match) return
    setFavorites(prev => [...prev, {
      bookId,
      googleId: match.book.googleId,
      title: match.book.title,
      coverUrl: match.book.coverUrl,
    }])
  }

  async function removeFavorite(bookId: string) {
    await fetch('/api/favorites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId }),
    })
    setFavorites(prev => prev.filter(f => f.bookId !== bookId))
  }

  const slots = Array.from({ length: 4 }, (_, i) => favorites[i] ?? null)
  const favBookIds = new Set(favorites.map(f => f.bookId))
  const available = userBooks.filter(ub => !favBookIds.has(ub.book.id))

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          color: '#567', textTransform: 'uppercase',
        }}>
          Favorite Books
        </div>
        {isOwner && (
          <button
            onClick={() => setEditing(!editing)}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4, padding: '4px 12px', fontSize: 11,
              color: editing ? '#C4603A' : '#789', cursor: 'pointer',
              fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            {editing ? 'Done' : 'Edit Favorites'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {slots.map((fav, i) => (
          <div key={fav?.bookId ?? `empty-${i}`} style={{ position: 'relative' }}>
            {fav ? (
              <a href={`/book/${fav.googleId}`} style={{ textDecoration: 'none' }}>
                {fav.coverUrl ? (
                  <img src={fav.coverUrl} alt={fav.title} style={{
                    width: 80, height: 120, borderRadius: 4, objectFit: 'cover',
                  }} />
                ) : (
                  <div style={{
                    width: 80, height: 120, borderRadius: 4,
                    background: '#1c2028', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#567', padding: 8, textAlign: 'center',
                  }}>
                    {fav.title}
                  </div>
                )}
              </a>
            ) : (
              <div style={{
                width: 80, height: 120, borderRadius: 4,
                border: '2px dashed rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }} />
            )}
            {editing && fav && (
              <button
                onClick={() => removeFavorite(fav.bookId)}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#c44', border: 'none', color: '#fff',
                  fontSize: 12, cursor: 'pointer', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                x
              </button>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div style={{
          marginTop: 20, background: '#1c2028', borderRadius: 6,
          padding: 16, maxHeight: 300, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, color: '#567', marginBottom: 12 }}>
            Select from your read books ({4 - favorites.length} slots remaining)
          </div>
          {loading && <div style={{ fontSize: 12, color: '#567' }}>Loading...</div>}
          {!loading && available.length === 0 && (
            <div style={{ fontSize: 12, color: '#567' }}>
              {userBooks.length === 0 ? 'No read books yet' : 'All read books are already favorites'}
            </div>
          )}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 8,
          }}>
            {available.map(ub => (
              <button
                key={ub.book.id}
                onClick={() => addFavorite(ub.book.id)}
                disabled={favorites.length >= 4}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 4, padding: 8, cursor: favorites.length >= 4 ? 'default' : 'pointer',
                  opacity: favorites.length >= 4 ? 0.4 : 1,
                  textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                {ub.book.coverUrl ? (
                  <img src={ub.book.coverUrl} alt="" style={{
                    width: 32, height: 48, borderRadius: 2, objectFit: 'cover', flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: 32, height: 48, borderRadius: 2,
                    background: '#2a2f38', flexShrink: 0,
                  }} />
                )}
                <div style={{
                  fontSize: 12, color: '#ccc', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', minWidth: 0,
                }}>
                  {ub.book.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
