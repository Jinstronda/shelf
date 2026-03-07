'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { ReadingProgress } from './ReadingProgress'

interface ReadingBook {
  bookId: string
  googleId: string
  title: string
  coverUrl: string | null
  authors: string[]
  pagesRead: number
  pageCount: number | null
}

export function CurrentlyReading() {
  const { data: session } = useSession()
  const [books, setBooks] = useState<ReadingBook[]>([])

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/user-books?status=reading')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setBooks(data.map((d: any) => ({
          bookId: d.bookId,
          googleId: d.book.googleId ?? d.book.id,
          title: d.book.title,
          coverUrl: d.book.coverUrl,
          authors: d.book.authors,
          pagesRead: d.pagesRead ?? 0,
          pageCount: d.book.pageCount,
        })))
      })
      .catch(() => {})
  }, [session?.user?.id])

  if (books.length === 0) return null

  return (
    <div className="currently-reading" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 40px' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 12,
      }}>Currently Reading</div>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
        {books.map(b => (
          <a key={b.googleId} href={`/book/${b.googleId}`} style={{
            textDecoration: 'none', display: 'flex', gap: 12,
            alignItems: 'center', flexShrink: 0,
            background: '#1c2028', borderRadius: 6, padding: '12px 16px',
          }}>
            <div style={{
              width: 36, height: 54, borderRadius: 3, overflow: 'hidden',
              background: '#2a2e36', flexShrink: 0,
            }}>
              {b.coverUrl && <img src={b.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{b.title}</div>
              <div style={{ fontSize: 11, color: '#567' }}>{b.authors[0]}</div>
              <ReadingProgress bookId={b.bookId} pageCount={b.pageCount} initialPages={b.pagesRead} />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
