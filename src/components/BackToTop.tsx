'use client'
import { useEffect, useCallback, useRef, useState } from 'react'

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      const show = window.scrollY > 400
      if (show !== visibleRef.current) {
        visibleRef.current = show
        setVisible(show)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <button
      className="back-to-top"
      onClick={onClick}
      aria-label="Back to top"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'rgba(28,32,40,0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        pointerEvents: visible ? 'auto' as const : 'none' as const,
        transition: 'opacity 0.3s, transform 0.3s, background 0.15s',
        padding: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(196,96,58,0.3)'
        e.currentTarget.querySelector('svg')!.style.color = '#fff'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(28,32,40,0.9)'
        e.currentTarget.querySelector('svg')!.style.color = '#9ab'
      }}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: '#9ab', transition: 'color 0.15s' }}
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  )
}
