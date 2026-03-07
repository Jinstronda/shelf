'use client'
import { useState } from 'react'

interface Props {
  userId: string
  initialFollowing: boolean
}

export function FollowButton({ userId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setFollowing(data.following)
    } catch {
      // revert on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={toggle} disabled={loading} style={{
      background: following ? 'rgba(255,255,255,0.07)' : 'var(--copper)',
      color: following ? '#9ab' : '#fff',
      border: following ? '1px solid rgba(255,255,255,0.1)' : 'none',
      borderRadius: 4, padding: '8px 20px', fontSize: 13,
      fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
      transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
    }}>
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
