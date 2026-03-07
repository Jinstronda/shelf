'use client'
import { useState } from 'react'

interface Props {
  initialBio: string
  initialUsername: string
}

export function ProfileEditor({ initialBio, initialUsername }: Props) {
  const [bio, setBio] = useState(initialBio)
  const [username, setUsername] = useState(initialUsername)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, username }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: '#1c2028', borderRadius: 6, padding: 24,
      marginBottom: 40,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 20,
      }}>
        Edit Profile
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#567', marginBottom: 6 }}>Username</div>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            width: '100%', maxWidth: 300, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
            padding: '8px 12px', color: '#e8e0d4', fontSize: 14,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#567', marginBottom: 6 }}>Bio</div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell readers about yourself..."
          rows={3}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
            padding: '8px 12px', color: '#e8e0d4', fontSize: 14,
            fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave} disabled={saving} style={{
          background: saved ? '#2a5a3a' : 'var(--copper)', color: '#fff', border: 'none',
          borderRadius: 4, padding: '8px 20px', fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer',
          transition: 'background 0.15s', opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
        {error && (
          <span style={{ fontSize: 12, color: '#c44' }}>{error}</span>
        )}
      </div>
    </div>
  )
}
