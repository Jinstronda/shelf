'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SHORTCUTS = [
  { keys: ['/', 's'], label: 'Focus search' },
  { keys: ['g', 'h'], label: 'Go home' },
  { keys: ['g', 'j'], label: 'Go to journal' },
  { keys: ['g', 'a'], label: 'Go to activity' },
  { keys: ['g', 'd'], label: 'Go to discover' },
  { keys: ['g', 's'], label: 'Go to stats' },
  { keys: ['g', 'p'], label: 'Go to profile' },
  { keys: ['g', 'l'], label: 'Go to shelves' },
  { keys: ['?'], label: 'Toggle this help' },
]

const NAV_MAP: Record<string, string> = {
  h: '/',
  j: '/journal',
  a: '/activity',
  d: '/discover',
  s: '/stats',
  p: '/profile',
  l: '/shelves',
}

function isTyping(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if ((e.target as HTMLElement)?.isContentEditable) return true
  return false
}

export function KeyboardShortcuts() {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const gPending = useRef(false)
  const gTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (isTyping(e)) return

    if (e.key === '?') {
      e.preventDefault()
      setShowModal(prev => !prev)
      return
    }

    if (e.key === 'Escape' && showModal) {
      setShowModal(false)
      return
    }

    if (e.key === '/' || (e.key === 's' && !gPending.current)) {
      e.preventDefault()
      const input = document.querySelector<HTMLInputElement>('.nav-search input')
      if (input) input.focus()
      return
    }

    if (e.key === 'g' && !gPending.current) {
      gPending.current = true
      clearTimeout(gTimer.current)
      gTimer.current = setTimeout(() => { gPending.current = false }, 1000)
      return
    }

    if (gPending.current) {
      gPending.current = false
      clearTimeout(gTimer.current)
      const path = NAV_MAP[e.key]
      if (path) {
        e.preventDefault()
        router.push(path)
      }
    }
  }, [router, showModal])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      clearTimeout(gTimer.current)
    }
  }, [handleKey])

  if (!showModal) return null

  return <ShortcutsModal onClose={() => setShowModal(false)} />
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const kbdStyle: React.CSSProperties = {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    padding: '2px 7px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    color: '#e8e0d4',
    lineHeight: '20px',
    minWidth: 22,
    textAlign: 'center',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(20,24,28,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1c2028',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '28px 36px',
          width: 360,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <h2 style={{
            margin: 0, fontSize: 15, fontWeight: 700,
            color: '#e8e0d4', letterSpacing: '0.03em',
          }}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 2, lineHeight: 0,
            }}
            aria-label="Close shortcuts"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18"/>
              <line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SHORTCUTS.map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#789', fontSize: 13 }}>{s.label}</span>
              <span style={{ display: 'flex', gap: 4 }}>
                {s.keys.map(k => (
                  <kbd key={k} style={kbdStyle}>{k}</kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
