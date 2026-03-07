'use client'
import type { UserBook, Book } from '@/lib/schema'
import { RATING_MAP } from '@/lib/constants'

interface Props {
  title: string
  items: (UserBook & { book: Book })[]
}

export function ProfileShelf({ title, items }: Props) {
  if (items.length === 0) return null

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 18,
      }}>
        {title} ({items.length})
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 16,
      }}>
        {items.map(item => (
          <a key={item.id} href={`/book/${item.book.googleId}`} style={{ textDecoration: 'none' }}>
            <div style={{
              width: '100%', aspectRatio: '2/3', borderRadius: 4,
              overflow: 'hidden', position: 'relative',
              background: '#1c2028', cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              className="card"
            >
              {item.book.coverUrl && (
                <img src={item.book.coverUrl} alt={item.book.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div className="card-hover">
                {item.rating && (
                  <span className="card-rating">{RATING_MAP[item.rating] ?? ''}</span>
                )}
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: '#ccc', lineHeight: 1.3,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{item.book.title}</div>
              <div style={{ fontSize: 11, color: '#567', marginTop: 2 }}>
                {item.book.authors[0]}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
