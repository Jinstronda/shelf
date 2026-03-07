'use client'
import { useState } from 'react'

export function SettingsClient() {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

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
        reading history, lists, reviews, follows, and favorites. This action cannot be undone.
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
  )
}
