'use client'
import { useState } from 'react'

interface Member {
  id: string
  name: string | null
  username: string
  avatarUrl: string | null
  bookCount: number
}

interface Props {
  members: Member[]
  totalCount: number
}

export function MembersSearch({ members, totalCount }: Props) {
  const [query, setQuery] = useState('')

  const filtered = query.length > 0
    ? members.filter(m => {
        const q = query.toLowerCase()
        return m.name?.toLowerCase().includes(q) || m.username.toLowerCase().includes(q)
      })
    : members

  return (
    <>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
        fontWeight: 700, color: '#fff', marginBottom: 8,
      }}>
        Members
      </h1>
      <div style={{ fontSize: 13, color: '#567', marginBottom: 24 }}>
        {query ? `${filtered.length} of ${totalCount}` : totalCount} {totalCount === 1 ? 'reader' : 'readers'} on Shelf
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by name or username..."
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          padding: '10px 14px',
          color: '#fff',
          fontSize: 14,
          fontFamily: 'inherit',
          width: '100%',
          outline: 'none',
          marginBottom: 32,
        }}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#567', fontSize: 15 }}>
          {query ? `No members matching "${query}"` : 'No members yet. Be the first to join.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(user => (
            <a key={user.id} href={`/user/${user.id}`} style={{
              textDecoration: 'none', background: '#1c2028',
              borderRadius: 6, padding: 20, display: 'flex',
              alignItems: 'center', gap: 14, transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#222a36' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1c2028' }}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                }} />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: '#C4603A', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#fff',
                }}>
                  {(user.name ?? user.username)[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: '#ccc',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.name ?? user.username}
                </div>
                <div style={{ fontSize: 12, color: '#567', marginTop: 2 }}>
                  {user.bookCount} {user.bookCount === 1 ? 'book' : 'books'}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
