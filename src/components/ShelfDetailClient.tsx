'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ShelfItemData {
  id: string
  bookId: string
  googleId: string | null
  title: string
  authors: string[]
  coverUrl: string | null
  ratingLabel: string | null
}

interface Props {
  items: ShelfItemData[]
  isOwner: boolean
  shelfId: string
}

export function ShelfDetailClient({ items, isOwner, shelfId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteShelf() {
    if (!confirm('Delete this shelf? Books will not be removed from your library.')) return
    setDeleting(true)
    const res = await fetch('/api/shelves', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: shelfId }),
    })
    if (res.ok) {
      router.push('/shelves')
    } else {
      setDeleting(false)
    }
  }

  return (
    <>
      {isOwner && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={handleDeleteShelf} disabled={deleting} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '6px 16px', fontSize: 12,
            color: '#a44', cursor: 'pointer', fontWeight: 600,
            fontFamily: 'inherit', opacity: deleting ? 0.5 : 1,
          }}>
            {deleting ? 'Deleting...' : 'Delete Shelf'}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
          This shelf is empty. Add books from their detail pages.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 20,
        }}>
          {items.map((item) => (
            <a key={item.id} href={item.googleId ? `/book/${item.googleId}` : '#'} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                width: '100%', aspectRatio: '2/3', borderRadius: 4,
                overflow: 'hidden', background: '#1c2028',
              }}>
                {item.coverUrl && (
                  <img src={item.coverUrl} alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#ccc', lineHeight: 1.3,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#567', marginTop: 2 }}>
                  {item.authors[0] ?? ''}
                </div>
                {item.ratingLabel && (
                  <div style={{ fontSize: 11, color: '#C4603A', marginTop: 2, letterSpacing: '0.05em' }}>
                    {item.ratingLabel}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
