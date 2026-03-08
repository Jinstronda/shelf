'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Props {
  googleId: string
}

export function WantToReadButton({ googleId }: Props) {
  const { data: session } = useSession()
  const [state, setState] = useState<'idle' | 'open' | 'loading' | 'added' | 'error'>('idle')
  const [note, setNote] = useState('')
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state !== 'open') return
    function onClickOutside(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setState('idle')
        setNote('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [state])

  async function save() {
    setState('loading')
    try {
      const res = await fetch('/api/want-to-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleId, note: note.trim() || undefined }),
      })
      if (!res.ok) throw new Error('Failed')
      setState('added')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 1200)
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      window.location.href = '/api/auth/signin'
      return
    }

    if (state === 'loading' || state === 'added') return
    setState('open')
  }

  const added = state === 'added'

  return (
    <div ref={popRef} style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        title={added ? 'Added to Want to Read' : 'Want to Read'}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(20,24,28,0.85)',
          backdropFilter: 'blur(4px)',
          border: 'none', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: state === 'added' ? 'default' : 'pointer',
          opacity: state === 'loading' ? 0.6 : 1,
          transition: 'opacity 0.15s, background 0.15s',
        }}
        onMouseEnter={e => {
          if (!added) e.currentTarget.style.background = 'rgba(196,96,58,0.3)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(20,24,28,0.85)'
        }}
      >
        {state === 'loading' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#9ab" strokeWidth="2" strokeLinecap="round"
            style={{ animation: 'spin 0.8s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24"
            fill={added ? '#C4603A' : 'none'}
            stroke={added ? '#C4603A' : '#9ab'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </button>

      {state === 'open' && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 34, right: 0,
            width: 220, padding: 10,
            background: '#1f2430', border: '1px solid rgba(196,96,58,0.3)',
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Why do you want to read this?"
            maxLength={500}
            rows={3}
            autoFocus
            style={{
              width: '100%', background: '#14181c', border: '1px solid #2a2f3a',
              borderRadius: 6, color: '#ccc', fontSize: 12, padding: 8,
              resize: 'none', fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(196,96,58,0.5)' }}
            onBlur={e => { e.target.style.borderColor = '#2a2f3a' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
            <button
              onClick={() => { setState('idle'); setNote('') }}
              style={{
                background: 'none', border: 'none', color: '#678',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', padding: '4px 8px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              style={{
                background: '#C4603A', border: 'none', color: '#fff',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', padding: '4px 12px', borderRadius: 4,
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
