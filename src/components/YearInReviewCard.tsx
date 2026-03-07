'use client'

import { useRef, useState } from 'react'
import { copyCardImage, downloadCardImage } from '@/lib/share-image'

interface Props {
  year: number
  userName: string
  booksRead: number
  pagesRead: number
  avgRating: string | null
  topGenres: string[]
  topBook: string | null
}

export function YearInReviewCard({ year, userName, booksRead, pagesRead, avgRating, topGenres, topBook }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  if (!open) {
    return (
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={() => setOpen(true)} style={{
          background: '#C4603A', color: '#fff', border: 'none',
          borderRadius: 4, padding: '10px 20px', fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          Share Your Year
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div ref={cardRef} style={{
        background: '#0d0d0d', padding: 32, width: 400,
        margin: '0 auto', boxSizing: 'border-box',
      }}>
        <div style={{ fontSize: 10, color: '#456', letterSpacing: '0.08em', marginBottom: 4 }}>shelf.app</div>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 48,
          fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 28,
        }}>{year}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {booksRead}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginTop: 4 }}>
              Books Read
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {pagesRead.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginTop: 4 }}>
              Pages Read
            </div>
          </div>
          {avgRating && (
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {avgRating}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginTop: 4 }}>
                Avg Rating
              </div>
            </div>
          )}
        </div>

        {topGenres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {topGenres.map(g => (
              <span key={g} style={{
                background: 'rgba(196,96,58,0.12)', color: '#C4603A',
                borderRadius: 3, padding: '4px 10px', fontSize: 11, fontWeight: 600,
              }}>{g}</span>
            ))}
          </div>
        )}

        {topBook && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase', marginBottom: 6 }}>
              Top Book
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc', lineHeight: 1.3 }}>{topBook}</div>
          </div>
        )}

        <div style={{ fontSize: 12, color: '#567', marginTop: 8 }}>{userName}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
        <button onClick={async () => {
          if (!cardRef.current) return
          try {
            await copyCardImage(cardRef.current)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            await downloadCardImage(cardRef.current!, `shelf-${year}-in-review.png`)
          }
        }} style={{
          background: copied ? '#2a5a3a' : '#C4603A', color: '#fff', border: 'none',
          borderRadius: 4, padding: '10px 20px', fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer', transition: 'background 0.15s',
        }}>
          {copied ? 'Copied!' : 'Copy Image'}
        </button>
        <button onClick={async () => {
          if (!cardRef.current) return
          await downloadCardImage(cardRef.current, `shelf-${year}-in-review.png`)
        }} style={{
          background: 'rgba(255,255,255,0.07)', color: '#9ab', border: 'none',
          borderRadius: 4, padding: '10px 16px', fontSize: 13,
          fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Save
        </button>
      </div>
    </div>
  )
}
