'use client'
import { useRef, useState } from 'react'
import { copyCardImage, downloadCardImage } from '@/lib/share-image'

interface Props {
  title: string
  authors: string[]
  coverUrl: string | null
  rating: number | null
  review: string
  onClose: () => void
}

type Format = 'story' | 'square'

function StarIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? '#C4603A' : 'none'}
      stroke={filled ? '#C4603A' : '#2a2a2a'} strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max) + '\u2026'
}

export function ShareCardModal({ title, authors, coverUrl, rating, review, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [format, setFormat] = useState<Format>('story')
  const cardRef = useRef<HTMLDivElement>(null)
  const downloadFilename = `shelf-${title.toLowerCase().replace(/\s+/g, '-')}.png`

  async function handleCopy() {
    if (!cardRef.current) return
    try {
      await copyCardImage(cardRef.current)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      await downloadCardImage(cardRef.current!, downloadFilename)
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return
    await downloadCardImage(cardRef.current, downloadFilename)
  }

  const excerpt = review ? truncate(review, format === 'story' ? 150 : 100) : null
  const displayTitle = truncate(title, 60)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#14181c',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          display: 'flex', padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {(['story', 'square'] as Format[]).map(f => (
            <button key={f} onClick={() => setFormat(f)} style={{
              flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700,
              fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer', border: 'none',
              borderRadius: 4,
              background: format === f ? 'rgba(196,96,58,0.15)' : 'transparent',
              color: format === f ? '#C4603A' : '#567',
              transition: 'all 0.15s',
            }}>
              {f === 'story' ? 'Story' : 'Square'}
            </button>
          ))}
        </div>

        <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
          {format === 'story' ? (
            <div key="story" ref={cardRef} style={{
              width: 360, height: 640,
              background: 'linear-gradient(180deg, #0c0e11 0%, #090a0d 50%, #0c0e11 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '40px 32px 36px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '28%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 320, height: 320, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(196,96,58,0.07) 0%, transparent 70%)',
              }} />

              <div style={{
                fontSize: 9, fontFamily: 'Syne, sans-serif',
                color: 'rgba(196,96,58,0.45)', letterSpacing: '0.3em',
                textTransform: 'uppercase', fontWeight: 700, marginBottom: 28,
              }}>
                shelf.app
              </div>

              <div style={{
                width: 200, height: 300, borderRadius: 4, overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5)',
                flexShrink: 0, background: '#181818',
              }}>
                {coverUrl && (
                  <img src={coverUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>

              <div style={{ marginTop: 24, textAlign: 'center', width: '100%' }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700,
                  color: '#f0ebe4', lineHeight: 1.2,
                }}>
                  {displayTitle}
                </div>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 11, color: '#4a5060',
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 8,
                }}>
                  {authors[0]}
                </div>
              </div>

              {rating != null && rating > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 20 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <StarIcon key={i} filled={i <= rating} size={22} />
                  ))}
                </div>
              )}

              {excerpt && (
                <>
                  <div style={{
                    width: 40, height: 1,
                    background: 'rgba(196,96,58,0.25)', marginTop: 22,
                  }} />
                  <div style={{
                    marginTop: 18, textAlign: 'center',
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 14,
                    color: 'rgba(240,235,228,0.55)', lineHeight: 1.75,
                    fontStyle: 'italic', padding: '0 8px',
                  }}>
                    {'\u201C'}{excerpt}{'\u201D'}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div key="square" ref={cardRef} style={{
              width: 400, height: 400,
              background: 'linear-gradient(135deg, #0c0e11 0%, #090a0d 100%)',
              display: 'flex', alignItems: 'center', gap: 28,
              padding: '32px 30px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '28%',
                transform: 'translate(-50%, -50%)',
                width: 280, height: 280, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(196,96,58,0.05) 0%, transparent 70%)',
              }} />

              <div style={{
                width: 150, height: 225, borderRadius: 4, overflow: 'hidden',
                boxShadow: '0 20px 52px rgba(0,0,0,0.7)',
                flexShrink: 0, background: '#181818',
              }}>
                {coverUrl && (
                  <img src={coverUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700,
                  color: '#f0ebe4', lineHeight: 1.2, marginBottom: 8,
                }}>
                  {displayTitle}
                </div>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 10, color: '#4a5060',
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16,
                }}>
                  {authors[0]}
                </div>

                {rating != null && rating > 0 && (
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <StarIcon key={i} filled={i <= rating} size={18} />
                    ))}
                  </div>
                )}

                {excerpt && (
                  <>
                    <div style={{
                      width: 30, height: 1,
                      background: 'rgba(196,96,58,0.25)', marginBottom: 14,
                    }} />
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 13,
                      color: 'rgba(240,235,228,0.5)', lineHeight: 1.7,
                      fontStyle: 'italic',
                    }}>
                      {'\u201C'}{excerpt}{'\u201D'}
                    </div>
                  </>
                )}

                <div style={{
                  fontSize: 8, fontFamily: 'Syne, sans-serif',
                  color: 'rgba(196,96,58,0.35)', letterSpacing: '0.3em',
                  textTransform: 'uppercase', fontWeight: 700, marginTop: 18,
                }}>
                  shelf.app
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} style={{
            flex: 1, background: copied ? '#2a5a3a' : '#C4603A', color: '#fff',
            border: 'none', borderRadius: 6, padding: '12px', fontSize: 13,
            fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer',
            transition: 'background 0.15s', letterSpacing: '0.02em',
          }}>
            {copied ? 'Copied!' : 'Copy Image'}
          </button>
          <button onClick={handleDownload} style={{
            background: 'rgba(255,255,255,0.06)', color: '#9ab', border: 'none',
            borderRadius: 6, padding: '12px 18px', fontSize: 13,
            fontFamily: 'Syne, sans-serif', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Save
          </button>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', color: '#567', border: 'none',
            borderRadius: 6, padding: '12px 18px', fontSize: 13,
            fontFamily: 'Syne, sans-serif', cursor: 'pointer',
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
