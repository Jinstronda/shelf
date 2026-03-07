'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { RATING_MAP, CARD_VARIANTS as CV } from '@/lib/constants'

interface RecBook {
  googleId: string
  title: string
  authors: string[]
  coverUrl: string | null
  score: number
}

export function Recommendations() {
  const { data: session } = useSession()
  const [books, setBooks] = useState<RecBook[]>([])

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/recommendations')
      .then(r => r.ok ? r.json() : [])
      .then(setBooks)
      .catch(() => {})
  }, [session?.user?.id])

  if (books.length === 0) return null

  return (
    <div className="section">
      <div className="section-label">Recommended for You</div>
      <div className="poster-row">
        {books.map((b, i) => (
          <a key={b.googleId} href={`/book/${b.googleId}`} className={`card ${CV[i % 12]}`} style={{ textDecoration: 'none' }}>
            {b.coverUrl && (
              <img src={b.coverUrl} alt={b.title} />
            )}
            <div className="card-hover">
              <span className="card-rating">{b.authors[0] ?? ''}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
