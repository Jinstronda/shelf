'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface Props {
  googleId: string
}

export function WantToReadButton({ googleId }: Props) {
  const { data: session } = useSession()
  const [state, setState] = useState<'idle' | 'loading' | 'added' | 'error'>('idle')

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      window.location.href = '/api/auth/signin'
      return
    }

    if (state === 'loading' || state === 'added') return

    setState('loading')
    try {
      const res = await fetch('/api/want-to-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleId }),
      })
      if (!res.ok) throw new Error('Failed')
      setState('added')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 1200)
    }
  }

  const added = state === 'added'

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      title={added ? 'Added to Want to Read' : 'Want to Read'}
      style={{
        position: 'absolute', top: 6, right: 6, zIndex: 2,
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
  )
}
