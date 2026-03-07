'use client'
import { useState } from 'react'
import { RATING_MAP } from '@/lib/constants'

interface Entry {
  id: string
  status: string
  rating: number | null
  review: string | null
  liked: boolean | null
  updatedAt: Date | null
  userId: string
  userName: string | null
  userAvatar: string | null
  book: {
    googleId: string | null
    title: string
    authors: string[]
    coverUrl: string | null
  }
}

interface Props {
  globalEntries: Entry[]
  followingEntries: Entry[]
  globalHasMore: boolean
  followingHasMore: boolean
  isSignedIn: boolean
}

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '13px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <a href={`/user/${entry.userId}`} style={{
        textDecoration: 'none', flexShrink: 0, alignSelf: 'flex-start',
      }}>
        {entry.userAvatar ? (
          <img src={entry.userAvatar} alt={entry.userName ?? ''}
            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: '#2a2e36',
          }} />
        )}
      </a>
      <a href={`/book/${entry.book.googleId}`}
        style={{ textDecoration: 'none', display: 'flex', gap: 16, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 42, height: 63, borderRadius: 3, overflow: 'hidden',
          flexShrink: 0, background: '#1c2028',
        }}>
          {entry.book.coverUrl && (
            <img src={entry.book.coverUrl} alt={entry.book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <a href={`/user/${entry.userId}`} style={{
              fontSize: 13, fontWeight: 600, color: '#9ab',
              textDecoration: 'none', flexShrink: 0,
            }}>
              {entry.userName ?? 'Anonymous'}
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color: '#ccc',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{entry.book.title}</span>
            {entry.book.authors[0] && (
              <span style={{ fontSize: 12, color: '#456', flexShrink: 0 }}>
                {entry.book.authors[0]}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#567',
              background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 3,
            }}>
              {entry.status}
            </span>
            {entry.rating && (
              <span style={{ fontSize: 13, color: '#C4603A' }}>
                {RATING_MAP[entry.rating] ?? ''}
              </span>
            )}
            {entry.liked && <span style={{ fontSize: 12, color: '#e05c7a' }}>♥</span>}
          </div>
          {entry.review && (
            <div style={{ fontSize: 12, color: '#789', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>
              &ldquo;{entry.review.slice(0, 180)}{entry.review.length > 180 ? '...' : ''}&rdquo;
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#456', flexShrink: 0, paddingTop: 2 }}>
          {entry.updatedAt && new Date(entry.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </div>
      </a>
    </div>
  )
}

export function ActivityTabs({ globalEntries, followingEntries, globalHasMore, followingHasMore, isSignedIn }: Props) {
  const [tab, setTab] = useState<'everyone' | 'following'>('everyone')
  const [extraGlobal, setExtraGlobal] = useState<Entry[]>([])
  const [extraFollowing, setExtraFollowing] = useState<Entry[]>([])
  const [globalMore, setGlobalMore] = useState(globalHasMore)
  const [followingMore, setFollowingMore] = useState(followingHasMore)
  const [loading, setLoading] = useState(false)

  const allGlobal = [...globalEntries, ...extraGlobal]
  const allFollowing = [...followingEntries, ...extraFollowing]
  const entries = tab === 'everyone' ? allGlobal : allFollowing
  const hasMore = tab === 'everyone' ? globalMore : followingMore

  async function loadMore() {
    setLoading(true)
    try {
      const offset = tab === 'everyone' ? allGlobal.length : allFollowing.length
      const res = await fetch(`/api/activity?tab=${tab}&offset=${offset}&limit=30`)
      if (!res.ok) return
      const data = await res.json()
      if (!data.entries) return
      if (tab === 'everyone') {
        setExtraGlobal(prev => [...prev, ...data.entries])
        setGlobalMore(data.hasMore)
      } else {
        setExtraFollowing(prev => [...prev, ...data.entries])
        setFollowingMore(data.hasMore)
      }
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (active: boolean) => ({
    fontSize: 13, fontWeight: 600 as const,
    color: active ? '#fff' : '#567',
    borderBottom: active ? '2px solid #C4603A' : '2px solid transparent',
    padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer' as const,
    fontFamily: 'inherit',
  })

  return (
    <>
      <div style={{ display: 'flex', gap: 0, marginBottom: 32,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={() => setTab('everyone')} style={tabStyle(tab === 'everyone')}>
          Everyone
        </button>
        {isSignedIn && (
          <button onClick={() => setTab('following')} style={tabStyle(tab === 'following')}>
            Following
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#567', fontSize: 15 }}>
          {tab === 'following'
            ? 'No activity from people you follow yet.'
            : 'No activity yet. Be the first to log a book.'}
        </div>
      ) : (
        <div>
          {entries.map(entry => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={loadMore}
                disabled={loading}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#9ab',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4,
                  padding: '10px 24px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
