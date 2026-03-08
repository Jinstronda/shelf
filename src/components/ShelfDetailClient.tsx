'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ShelfItemData {
  id: string
  bookId: string
  googleId: string | null
  title: string
  authors: string[]
  coverUrl: string | null
  ratingLabel: string | null
  position: number
}

interface Props {
  items: ShelfItemData[]
  isOwner: boolean
  shelfId: string
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#567">
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  )
}

function ArrowUp({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 3, width: 28, height: 28, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#567', fontSize: 14, fontFamily: 'inherit',
    }}>
      &#9650;
    </button>
  )
}

function ArrowDown({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 3, width: 28, height: 28, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#567', fontSize: 14, fontFamily: 'inherit',
    }}>
      &#9660;
    </button>
  )
}

export function ShelfDetailClient({ items: initial, isOwner, shelfId }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [reordering, setReordering] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const savePositions = useCallback(async (reordered: ShelfItemData[]) => {
    setSaving(true)
    await fetch(`/api/shelves/${shelfId}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions: reordered.map((item, i) => ({ itemId: item.id, position: i })),
      }),
    })
    setSaving(false)
  }, [shelfId])

  function reorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    const updated = [...items]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    setItems(updated)
    savePositions(updated)
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setOverIndex(index)
  }

  function handleDrop(index: number) {
    if (dragIndex !== null && dragIndex !== index) {
      reorder(dragIndex, index)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setOverIndex(null)
  }

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

  if (items.length === 0) {
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
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
          This shelf is empty. Add books from their detail pages.
        </div>
      </>
    )
  }

  if (reordering && isOwner) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
          {saving && <span style={{ fontSize: 11, color: '#567', marginRight: 12 }}>Saving...</span>}
          <button onClick={() => setReordering(false)} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '6px 16px', fontSize: 12,
            color: '#C4603A', cursor: 'pointer', fontWeight: 600,
            fontFamily: 'inherit',
          }}>
            Done
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item, index) => {
            const isDragging = dragIndex === index
            const isOver = overIndex === index && dragIndex !== index
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: isDragging ? 'rgba(196,96,58,0.1)' : '#1c2028',
                  borderRadius: 6, padding: '10px 16px',
                  opacity: isDragging ? 0.5 : 1,
                  borderTop: isOver ? '2px solid #C4603A' : '2px solid transparent',
                  transition: 'background 0.1s',
                  cursor: 'grab',
                }}
              >
                <div style={{
                  fontSize: 13, color: '#456', fontWeight: 700,
                  width: 24, textAlign: 'center', flexShrink: 0,
                }}>
                  {index + 1}
                </div>
                <div style={{
                  width: 40, height: 60, borderRadius: 2, overflow: 'hidden',
                  background: '#2a2e36', flexShrink: 0,
                }}>
                  {item.coverUrl && (
                    <img src={item.coverUrl} alt="" style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: '#ccc',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#567', marginTop: 2 }}>
                    {item.authors[0]}
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                }}>
                  <div className="reorder-arrows" style={{ display: 'flex', gap: 4 }}>
                    {index > 0 && <ArrowUp onClick={() => reorder(index, index - 1)} />}
                    {index < items.length - 1 && <ArrowDown onClick={() => reorder(index, index + 1)} />}
                  </div>
                  <div className="drag-handle" style={{
                    padding: '4px 2px', cursor: 'grab',
                  }}>
                    <GripIcon />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <>
      {isOwner && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
          <button onClick={() => setReordering(true)} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '6px 16px', fontSize: 12,
            color: '#789', cursor: 'pointer', fontWeight: 600,
            fontFamily: 'inherit',
          }}>
            Reorder
          </button>
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
    </>
  )
}
