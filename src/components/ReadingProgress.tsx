'use client'
import { useState } from 'react'

interface Props {
  bookId: string
  pageCount: number | null
  initialPages: number
}

export function ReadingProgress({ bookId, pageCount, initialPages }: Props) {
  const [pages, setPages] = useState(initialPages)
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(initialPages))
  const [saving, setSaving] = useState(false)

  const progress = pageCount ? Math.min(pages / pageCount, 1) : 0
  const percent = Math.round(progress * 100)

  async function handleSubmit() {
    const num = parseInt(input)
    if (isNaN(num) || num < 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/user-books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, pagesRead: num }),
      })
      if (!res.ok) throw new Error()
      setPages(num)
      setEditing(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 8, width: '100%' }} onClick={e => e.preventDefault()}>
      {pageCount && (
        <div style={{
          height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
          overflow: 'hidden', marginBottom: 4,
        }}>
          <div style={{
            height: '100%', width: `${percent}%`,
            background: 'linear-gradient(90deg, #C4603A, #D4764E)',
            borderRadius: 2, transition: 'width 0.3s',
          }} />
        </div>
      )}

      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            min={0}
            max={pageCount ?? undefined}
            autoFocus
            style={{
              width: 52, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3,
              padding: '2px 6px', color: '#fff', fontSize: 11,
              fontFamily: 'inherit', textAlign: 'center', outline: 'none',
            }}
          />
          <button onClick={handleSubmit} disabled={saving} style={{
            background: 'var(--copper)', color: '#fff', border: 'none',
            borderRadius: 3, padding: '2px 8px', fontSize: 10,
            fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? '...' : 'Save'}
          </button>
          <button onClick={() => { setEditing(false); setInput(String(pages)) }} style={{
            background: 'none', border: 'none', color: '#567',
            fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#567' }}>
            {pages}{pageCount ? ` / ${pageCount}` : ''} pages
          </span>
          <button onClick={() => setEditing(true)} style={{
            background: 'none', border: 'none', color: 'var(--copper-light)',
            fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          }}>
            Update
          </button>
        </div>
      )}
    </div>
  )
}
