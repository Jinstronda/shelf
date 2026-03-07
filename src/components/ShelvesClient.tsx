'use client'
import { useState } from 'react'

interface ShelfData {
  id: string
  name: string
  description: string | null
  itemCount: number
  covers: (string | null)[]
}

function ShelfCard({ shelf }: { shelf: ShelfData }) {
  return (
    <a href={`/shelves/${shelf.id}`} className="list-card" style={{
      textDecoration: 'none', display: 'flex', gap: 16,
      background: '#1c2028', borderRadius: 6, padding: 20,
      transition: 'background 0.15s', cursor: 'pointer',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {shelf.covers.slice(0, 4).map((cover, i) => (
          <div key={i} style={{
            width: 36, height: 54, borderRadius: 2, overflow: 'hidden',
            background: '#2a2e36',
          }}>
            {cover && <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
        ))}
        {shelf.covers.length === 0 && (
          <div style={{ width: 36, height: 54, borderRadius: 2, background: '#2a2e36' }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>{shelf.name}</div>
        {shelf.description && (
          <div style={{ fontSize: 12, color: '#567', marginBottom: 4 }}>{shelf.description}</div>
        )}
        <div style={{ fontSize: 11, color: '#456' }}>
          {shelf.itemCount} {shelf.itemCount === 1 ? 'book' : 'books'}
        </div>
      </div>
    </a>
  )
}

export function ShelvesClient({ initialShelves, isSignedIn }: { initialShelves: ShelfData[], isSignedIn: boolean }) {
  const [userShelves, setShelves] = useState(initialShelves)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  async function handleCreate() {
    if (!name.trim()) return
    const res = await fetch('/api/shelves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc || null }),
    })
    if (res.ok) {
      const shelf = await res.json()
      setShelves(prev => [{ ...shelf, itemCount: 0, covers: [] }, ...prev])
      setName('')
      setDesc('')
      setCreating(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
          fontWeight: 700, color: '#fff',
        }}>
          Shelves
        </h1>
        {isSignedIn && (
          <button onClick={() => setCreating(!creating)} style={{
            background: '#C4603A', color: '#fff', border: 'none',
            borderRadius: 4, padding: '8px 20px', fontSize: 13,
            fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}>
            {creating ? 'Cancel' : 'New Shelf'}
          </button>
        )}
      </div>

      {creating && (
        <div style={{
          background: '#1c2028', borderRadius: 6, padding: 24,
          marginBottom: 32,
        }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Shelf name"
            autoFocus
            maxLength={100}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
              padding: '10px 14px', color: '#fff', fontSize: 15,
              fontFamily: 'inherit', outline: 'none', marginBottom: 12,
            }}
          />
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
              padding: '10px 14px', color: '#e8e0d4', fontSize: 14,
              fontFamily: 'inherit', outline: 'none', resize: 'vertical',
              marginBottom: 16,
            }}
          />
          <button onClick={handleCreate} style={{
            background: '#C4603A', color: '#fff', border: 'none',
            borderRadius: 4, padding: '10px 24px', fontSize: 13,
            fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}>
            Create Shelf
          </button>
        </div>
      )}

      {userShelves.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {userShelves.map(shelf => (
            <ShelfCard key={shelf.id} shelf={shelf} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
          {isSignedIn
            ? 'No custom shelves yet. Create one to organize your books.'
            : 'Sign in to create and manage shelves.'}
        </div>
      )}
    </>
  )
}
