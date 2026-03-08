'use client'

import { useRef, useState } from 'react'
import { copyCardImage, downloadCardImage } from '@/lib/share-image'

interface Props {
  year: number
  booksRead: number
  pagesRead: number
  avgRating: string | null
  topGenre: string | null
}

export function StatsShareCard({ year, booksRead, pagesRead, avgRating, topGenre }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const filename = `shelf-${year}-stats.png`

  async function handleCopy() {
    if (!cardRef.current) return
    try {
      await copyCardImage(cardRef.current)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      await downloadCardImage(cardRef.current!, filename)
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return
    await downloadCardImage(cardRef.current, filename)
  }

  const stars = avgRating ? renderStars(parseFloat(avgRating)) : null

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: 'rgba(196,96,58,0.1)', color: '#C4603A', border: '1px solid rgba(196,96,58,0.25)',
        borderRadius: 4, padding: '8px 16px', fontSize: 13, fontWeight: 700,
        fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex',
        alignItems: 'center', gap: 6,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Share Your Stats
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw' }}>
            <div ref={cardRef} style={{
              width: 600, aspectRatio: '600 / 400', background: '#14181c',
              border: '1px solid #C4603A', borderRadius: 12,
              padding: '40px 48px', boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 28,
                  fontWeight: 700, color: '#C4603A', lineHeight: 1.2, marginBottom: 32,
                }}>
                  My Reading Year {year}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 48px' }}>
                  <div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 44,
                      fontWeight: 700, color: '#fff', lineHeight: 1,
                    }}>{booksRead}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                      color: '#567', textTransform: 'uppercase', marginTop: 6,
                    }}>Books Read</div>
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 44,
                      fontWeight: 700, color: '#fff', lineHeight: 1,
                    }}>{pagesRead.toLocaleString()}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                      color: '#567', textTransform: 'uppercase', marginTop: 6,
                    }}>Pages Read</div>
                  </div>
                  <div>
                    {stars ? (
                      <div style={{ fontSize: 28, color: '#C4603A', lineHeight: 1 }}>{stars}</div>
                    ) : (
                      <div style={{
                        fontFamily: 'Cormorant Garamond, serif', fontSize: 44,
                        fontWeight: 700, color: '#fff', lineHeight: 1,
                      }}>-</div>
                    )}
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                      color: '#567', textTransform: 'uppercase', marginTop: 6,
                    }}>Average Rating</div>
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: topGenre && topGenre.length > 10 ? 28 : 44,
                      fontWeight: 700, color: '#fff', lineHeight: 1,
                    }}>{topGenre ?? '-'}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                      color: '#567', textTransform: 'uppercase', marginTop: 6,
                    }}>Top Genre</div>
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em',
                textAlign: 'right',
              }}>
                shelf-app-gold.vercel.app
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={handleCopy} style={{
                background: copied ? '#2a5a3a' : '#C4603A', color: '#fff', border: 'none',
                borderRadius: 4, padding: '10px 20px', fontSize: 13, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer', transition: 'background 0.15s',
              }}>
                {copied ? 'Copied!' : 'Copy Image'}
              </button>
              <button onClick={handleDownload} style={{
                background: 'rgba(255,255,255,0.07)', color: '#9ab', border: 'none',
                borderRadius: 4, padding: '10px 16px', fontSize: 13,
                fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save
              </button>
              <button onClick={() => setOpen(false)} style={{
                background: 'rgba(255,255,255,0.07)', color: '#789', border: 'none',
                borderRadius: 4, padding: '10px 16px', fontSize: 13,
                fontFamily: 'inherit', cursor: 'pointer',
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function renderStars(rating: number): string {
  return '\u2605'.repeat(Math.round(rating))
}
