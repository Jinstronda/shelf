'use client'
import { useRef, useState } from 'react'
import { RATINGS } from '@/lib/constants'
import { copyCardImage, downloadCardImage } from '@/lib/share-image'

interface Props {
  title: string
  authors: string[]
  coverUrl: string | null
  rating: number | null
  review: string
  onClose: () => void
}

export function ShareCardModal({ title, authors, coverUrl, rating, review, onClose }: Props) {
  const [copied, setCopied] = useState(false)
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

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 340, background: '#14181c',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
        overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>
        <div ref={cardRef} style={{
          background: '#0d0d0d', padding: 24,
          display: 'flex', gap: 16, alignItems: 'flex-start',
        }}>
          <div style={{ width: 70, height: 105, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: '#222' }}>
            {coverUrl && <img src={coverUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#789', marginBottom: 12 }}>{authors[0]}</div>
            {rating && (
              <div style={{ fontSize: 18, color: '#C4603A', marginBottom: 8 }}>
                {RATINGS.find(r => r.value === rating)?.label}
              </div>
            )}
            {review && (
              <div style={{ fontSize: 12, color: '#9ab', lineHeight: 1.55, fontStyle: 'italic' }}>
                &ldquo;{review.slice(0, 120)}{review.length > 120 ? '...' : ''}&rdquo;
              </div>
            )}
            <div style={{ marginTop: 14, fontSize: 10, color: '#456', letterSpacing: '0.08em' }}>shelf.app</div>
          </div>
        </div>
        <div style={{ padding: 16, display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} style={{
            flex: 1, background: copied ? '#2a5a3a' : '#C4603A', color: '#fff', border: 'none',
            borderRadius: 4, padding: '10px', fontSize: 13, fontWeight: 700,
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Save
          </button>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.07)', color: '#789', border: 'none',
            borderRadius: 4, padding: '10px 16px', fontSize: 13,
            fontFamily: 'inherit', cursor: 'pointer',
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
