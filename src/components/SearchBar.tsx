'use client'
import { useState, useEffect, useRef } from 'react'

interface BookResult {
  googleId: string
  title: string
  authors: string[]
  coverUrl: string | null
  published: string | null
}

export function SearchBar() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<BookResult[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const timer  = useRef<ReturnType<typeof setTimeout>>(undefined)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative', marginLeft: 14 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <svg style={{ position: 'absolute', left: 9, width: 13, height: 13, color: '#556', pointerEvents: 'none' }}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="6.5" cy="6.5" r="5"/><line x1="10.5" y1="10.5" x2="15" y2="15"/>
        </svg>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search books, authors…"
          style={{
            background: 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: '5px 12px 5px 27px',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 11,
            width: loading ? 170 : 136,
            outline: 'none',
            transition: 'all 0.2s',
          }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 10, width: 10, height: 10,
            border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: '#C4603A',
            borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}/>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          width: 320, background: '#1c2028',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, overflow: 'hidden', zIndex: 999,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}>
          {results.slice(0, 8).map((book, i) => (
            <a
              key={book.googleId}
              href={`/book/${book.googleId}`}
              style={{
                display: 'flex', gap: 10, padding: '9px 12px',
                textDecoration: 'none',
                borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 28, height: 42, flexShrink: 0,
                background: '#2a2a2a', borderRadius: 2, overflow: 'hidden',
              }}>
                {book.coverUrl && (
                  <img src={book.coverUrl} alt={book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#e8e0d4', fontSize: 13, fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {book.title}
                </div>
                <div style={{ color: '#789', fontSize: 11, marginTop: 1 }}>
                  {book.authors.join(', ')}
                  {book.published && <span style={{ color: '#556' }}> · {book.published.slice(0, 4)}</span>}
                </div>
              </div>
            </a>
          ))}
          <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <a href={`/search?q=${encodeURIComponent(query)}`}
              style={{ fontSize: 11, color: '#C4603A', textDecoration: 'none' }}>
              See all results for "{query}"
            </a>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
