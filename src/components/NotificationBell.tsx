'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface Notif {
  id: string
  type: string
  actorId: string
  actorName: string | null
  actorAvatar: string | null
  bookTitle: string | null
  bookGoogleId: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const hasUnread = notifs.some(n => !n.read)

  useEffect(() => {
    if (!session?.user) return
    const load = () => {
      fetch('/api/notifications')
        .then(r => r.ok ? r.json() : [])
        .then(setNotifs)
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [session?.user])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!session?.user) return null

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const label = (n: Notif) => {
    const name = n.actorName ?? 'Someone'
    if (n.type === 'follow') return `${name} followed you`
    if (n.type === 'review') return `${name} reviewed ${n.bookTitle ?? 'a book'}`
    return `${name} interacted with you`
  }

  const href = (n: Notif) => {
    if (n.type === 'follow') return `/user/${n.actorId}`
    if (n.type === 'review' && n.bookGoogleId) return `/book/${n.bookGoogleId}`
    return '#'
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', marginLeft: 8, marginRight: 4 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, position: 'relative', lineHeight: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {hasUnread && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            width: 7, height: 7, borderRadius: '50%',
            background: '#C4603A',
          }}/>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 300, background: '#1c2028',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, overflow: 'hidden', zIndex: 999,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}>
          <div style={{
            padding: '10px 12px', fontSize: 12, fontWeight: 600,
            color: '#e8e0d4', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            Notifications
          </div>

          {notifs.length === 0 && (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: '#556', fontSize: 12 }}>
              No notifications yet
            </div>
          )}

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifs.map((n, i) => (
              <a
                key={n.id}
                href={href(n)}
                style={{
                  display: 'flex', gap: 10, padding: '9px 12px',
                  textDecoration: 'none',
                  background: n.read ? 'transparent' : 'rgba(196,96,58,0.06)',
                  borderBottom: i < notifs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(196,96,58,0.06)')}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: '#2a2a2a', overflow: 'hidden',
                }}>
                  {n.actorAvatar && (
                    <img src={n.actorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: '#e8e0d4', fontSize: 12, lineHeight: 1.4 }}>
                    {label(n)}
                  </div>
                  <div style={{ color: '#556', fontSize: 10, marginTop: 2 }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {hasUnread && (
            <button
              onClick={markAllRead}
              style={{
                width: '100%', padding: '9px 12px',
                background: 'none', border: 'none',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                color: '#C4603A', fontSize: 11, cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              Mark all read
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}
