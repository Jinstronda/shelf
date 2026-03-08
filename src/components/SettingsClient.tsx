'use client'
import { useState } from 'react'

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Anyone can see your profile, reviews, and activity' },
  { value: 'followers', label: 'Followers Only', desc: 'Only people who follow you can see your full profile' },
  { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
] as const

export function SettingsClient({ initialPrivacy }: { initialPrivacy: string }) {
  const [privacy, setPrivacy] = useState(initialPrivacy)
  const [saved, setSaved] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handlePrivacy(value: string) {
    setPrivacy(value)
    setSaved(false)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privacy: value }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete account')
      }
      window.location.href = '/'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete account')
      setDeleting(false)
    }
  }

  return (
    <>
      <div style={{
        background: '#1c2028', borderRadius: 6, padding: 24, marginBottom: 24,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#567', textTransform: 'uppercase',
          }}>
            Privacy
          </div>
          {saved && (
            <span style={{ fontSize: 12, color: '#C4603A', fontWeight: 600 }}>
              Saved
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PRIVACY_OPTIONS.map(opt => {
            const active = privacy === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handlePrivacy(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: active ? 'rgba(196,96,58,0.08)' : 'rgba(255,255,255,0.03)',
                  border: active ? '1px solid rgba(196,96,58,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 6, padding: '14px 16px',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', width: '100%',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: active ? '2px solid #C4603A' : '2px solid #456',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {active && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#C4603A',
                    }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#567', marginTop: 2 }}>
                    {opt.desc}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{
        background: '#1c2028', borderRadius: 6, padding: 24,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          color: '#567', textTransform: 'uppercase', marginBottom: 20,
        }}>
          Delete Account
        </div>

      <p style={{ fontSize: 14, color: '#9aa', lineHeight: 1.6, marginBottom: 16 }}>
        This will permanently delete your account and all associated data, including your
        reading history, shelves, reviews, follows, and favorites. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button onClick={() => setShowConfirm(true)} style={{
          background: 'transparent', color: '#c44', border: '1px solid rgba(204,68,68,0.4)',
          borderRadius: 4, padding: '8px 20px', fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          Delete Account
        </button>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: '#c44', marginBottom: 10, fontWeight: 600 }}>
            Type DELETE to confirm
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{
                width: 200, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(204,68,68,0.4)', borderRadius: 4,
                padding: '8px 12px', color: '#e8e0d4', fontSize: 14,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={handleDelete}
              disabled={confirmText !== 'DELETE' || deleting}
              style={{
                background: confirmText === 'DELETE' ? '#c44' : 'rgba(204,68,68,0.3)',
                color: '#fff', border: 'none', borderRadius: 4,
                padding: '8px 20px', fontSize: 13, fontWeight: 700,
                fontFamily: 'inherit',
                cursor: confirmText === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText('') }}
              style={{
                background: 'transparent', color: '#567', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
          {error && (
            <div style={{ fontSize: 12, color: '#c44', marginTop: 10 }}>{error}</div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
