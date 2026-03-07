'use client'
import { useState } from 'react'

interface ListData {
  id: string
  name: string
  description: string | null
  itemCount: number
  covers: (string | null)[]
}

export function ListsClient({ initialLists, isSignedIn }: { initialLists: ListData[], isSignedIn: boolean }) {
  const [userLists, setLists] = useState(initialLists)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  async function handleCreate() {
    if (!name.trim()) return
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc || null }),
    })
    if (res.ok) {
      const list = await res.json()
      setLists([{ ...list, itemCount: 0, covers: [] }, ...userLists])
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
          Lists
        </h1>
        {isSignedIn && (
          <button onClick={() => setCreating(!creating)} style={{
            background: '#C4603A', color: '#fff', border: 'none',
            borderRadius: 4, padding: '8px 20px', fontSize: 13,
            fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}>
            {creating ? 'Cancel' : 'New List'}
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
            placeholder="List name"
            autoFocus
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
            Create List
          </button>
        </div>
      )}

      {userLists.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {userLists.map(list => (
            <a key={list.id} href={`/lists/${list.id}`} style={{
              textDecoration: 'none', display: 'flex', gap: 16,
              background: '#1c2028', borderRadius: 6, padding: 20,
              transition: 'background 0.15s', cursor: 'pointer',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {list.covers.slice(0, 4).map((cover, i) => (
                  <div key={i} style={{
                    width: 36, height: 54, borderRadius: 2, overflow: 'hidden',
                    background: '#2a2e36',
                  }}>
                    {cover && <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                ))}
                {list.covers.length === 0 && (
                  <div style={{ width: 36, height: 54, borderRadius: 2, background: '#2a2e36' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>{list.name}</div>
                {list.description && (
                  <div style={{ fontSize: 12, color: '#567', marginBottom: 4 }}>{list.description}</div>
                )}
                <div style={{ fontSize: 11, color: '#456' }}>
                  {list.itemCount} {list.itemCount === 1 ? 'book' : 'books'}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
          {isSignedIn
            ? 'No lists yet. Create your first one.'
            : 'Sign in to create and manage lists.'}
        </div>
      )}
    </>
  )
}
