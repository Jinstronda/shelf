'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

export function AuthNav() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <li style={{ padding: '0 11px', fontSize: 11, color: '#567' }}>...</li>
  }

  if (session?.user) {
    return (
      <>
        <li>
          <button onClick={() => signOut()} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            fontFamily: 'inherit', padding: '0 11px',
          }}>
            Sign Out
          </button>
        </li>
        <li style={{ padding: '0 6px' }}>
          <a href="/profile" style={{ display: 'block', lineHeight: 0 }}>
            {session.user.image ? (
              <img src={session.user.image} alt="" style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '2px solid rgba(196,96,58,0.5)',
              }} />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#C4603A', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {session.user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </a>
        </li>
      </>
    )
  }

  return (
    <>
      <li className="hl">
        <button onClick={() => signIn('google')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--copper-light)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          fontFamily: 'inherit', padding: '0 11px',
        }}>
          Sign In
        </button>
      </li>
    </>
  )
}
