import { RATING_MAP } from '@/lib/constants'
import type { UserBook, Book } from '@/lib/schema'

interface Props {
  entry: UserBook & { book: Book }
}

export function BookEntryRow({ entry }: Props) {
  return (
    <a href={`/book/${entry.book.googleId}`}
      style={{ textDecoration: 'none', display: 'flex', gap: 16, padding: '13px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
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
          <span style={{
            fontSize: 14, fontWeight: 600, color: '#ccc',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{entry.book.title}</span>
          {entry.status === 'dnf' && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#8B4513', flexShrink: 0 }}>DNF</span>
          )}
          <span style={{ fontSize: 12, color: '#456', flexShrink: 0 }}>
            {entry.book.authors[0]}
          </span>
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
      <div style={{ flexShrink: 0, paddingTop: 2, textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: '#456' }}>
          {entry.updatedAt && new Date(entry.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </div>
        {entry.format && (
          <div style={{ fontSize: 9, color: '#567', marginTop: 2, textTransform: 'capitalize' }}>
            {entry.format}
          </div>
        )}
      </div>
    </a>
  )
}
