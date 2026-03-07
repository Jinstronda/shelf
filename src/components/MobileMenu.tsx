'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

const NAV_LINKS = [
  { href: '/discover', label: 'Discover' },
  { href: '/books', label: 'Books' },
  { href: '/lists', label: 'Lists' },
  { href: '/journal', label: 'Journal' },
  { href: '/quotes', label: 'Quotes' },
  { href: '/tags', label: 'Tags' },
  { href: '/import', label: 'Import' },
  { href: '/members', label: 'Members' },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [unread, setUnread] = useState(false)
  const { data: session } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : [])
      .then((notifs: { read: boolean }[]) => setUnread(notifs.some(n => !n.read)))
      .catch(() => {})
  }, [session?.user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setOpen(false)
    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
  }

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, position: 'relative', lineHeight: 0,
          alignItems: 'center', justifyContent: 'center',
        }}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18"/>
            <line x1="18" y1="6" x2="6" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
        {!open && unread && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: '#C4603A',
          }}/>
        )}
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(20,24,28,0.98)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 0,
        }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute', top: 14, right: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, lineHeight: 0,
            }}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18"/>
              <line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
          </button>

          <form onSubmit={handleSearch} style={{
            marginBottom: 32, width: '80%', maxWidth: 300, position: 'relative',
          }}>
            <svg style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 15, height: 15, color: '#556', pointerEvents: 'none',
            }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="6.5" cy="6.5" r="5"/><line x1="10.5" y1="10.5" x2="15" y2="15"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search books, authors..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                padding: '10px 16px 10px 34px',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </form>

          <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 18, color: '#ccc', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '16px 0', textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
              >
                {link.label}
              </a>
            ))}

            {unread && (
              <a
                href="/notifications"
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 18, color: '#C4603A', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '16px 0', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                Notifications
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#C4603A',
                }}/>
              </a>
            )}

            <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }}/>

            {session?.user ? (
              <>
                <a
                  href="/profile"
                  onClick={() => setOpen(false)}
                  style={{
                    fontSize: 18, color: '#ccc', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    padding: '16px 0', textDecoration: 'none',
                  }}
                >
                  Profile
                </a>
                <button
                  onClick={() => { setOpen(false); signOut() }}
                  style={{
                    fontSize: 18, color: 'rgba(255,255,255,0.45)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    padding: '16px 0', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setOpen(false); signIn('google') }}
                style={{
                  fontSize: 18, color: 'var(--copper-light)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '16px 0', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
