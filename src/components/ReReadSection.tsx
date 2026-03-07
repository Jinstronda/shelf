'use client'
import { useState } from 'react'
import type { ReRead } from '@/lib/schema'
import { RATINGS, RATING_MAP } from '@/lib/constants'

interface Props {
  bookDbId: string
  initialReReads: ReRead[]
}

const FORMATS = ['paperback', 'hardcover', 'ebook', 'audiobook'] as const

export function ReReadSection({ bookDbId, initialReReads }: Props) {
  const [reReads, setReReads] = useState<ReRead[]>(initialReReads)
  const [showForm, setShowForm] = useState(false)
  const [readAt, setReadAt] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [format, setFormat] = useState('')
  const [review, setReview] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/re-reads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: bookDbId,
          readAt: readAt || null,
          rating: rating ?? null,
          format: format || null,
          review: review.trim() || null,
        }),
      })
      if (!res.ok) throw new Error()
      const created: ReRead = await res.json()
      setReReads(prev => [created, ...prev])
      setReadAt('')
      setRating(null)
      setFormat('')
      setReview('')
      setShowForm(false)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this re-read?')) return
    try {
      const res = await fetch('/api/re-reads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setReReads(prev => prev.filter(r => r.id !== id))
    } catch {
    }
  }

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          color: '#567', textTransform: 'uppercase',
        }}>
          Re-reads {reReads.length > 0 && `(${reReads.length})`}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'none', border: '1px solid rgba(196,96,58,0.4)',
            color: '#C4603A', borderRadius: 4, padding: '4px 12px',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {showForm ? 'Cancel' : 'Log Re-read'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 6,
          padding: 16, marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: '#567', display: 'block', marginBottom: 4 }}>Date</label>
              <input
                type="date"
                value={readAt}
                onChange={e => setReadAt(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                  padding: '6px 10px', color: '#e8e0d4', fontSize: 12,
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: '#567', display: 'block', marginBottom: 4 }}>Format</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                  padding: '6px 10px', color: '#e8e0d4', fontSize: 12,
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  appearance: 'auto',
                }}
              >
                <option value="">--</option>
                {FORMATS.map(f => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#567', display: 'block', marginBottom: 4 }}>Rating</label>
            <select
              value={rating ?? ''}
              onChange={e => setRating(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '6px 10px', color: '#e8e0d4', fontSize: 12,
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                appearance: 'auto',
              }}
            >
              <option value="">No rating</option>
              {RATINGS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            placeholder="Notes on this re-read..."
            maxLength={5000}
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
              padding: '8px 10px', color: '#e8e0d4', fontSize: 13,
              fontFamily: 'inherit', outline: 'none', resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#C4603A', color: '#fff', border: 'none',
                borderRadius: 4, padding: '6px 16px', fontSize: 12, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Re-read'}
            </button>
          </div>
        </form>
      )}

      {reReads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reReads.map(r => (
            <div key={r.id} style={{
              borderLeft: '3px solid rgba(196,96,58,0.3)',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '0 4px 4px 0',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <button
                onClick={() => handleDelete(r.id)}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#456', fontSize: 14, lineHeight: 1, padding: 0,
                  fontFamily: 'inherit',
                }}
                aria-label="Delete re-read"
              >
                &times;
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {r.readAt && (
                  <span style={{ fontSize: 13, color: '#9ab', fontWeight: 600 }}>
                    {new Date(r.readAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {r.rating && (
                  <span style={{ fontSize: 13, color: '#C4603A' }}>
                    {RATING_MAP[r.rating]}
                  </span>
                )}
                {r.format && (
                  <span style={{
                    fontSize: 10, color: '#567', textTransform: 'uppercase',
                    background: 'rgba(255,255,255,0.04)', borderRadius: 3,
                    padding: '2px 6px', letterSpacing: '0.05em',
                  }}>
                    {r.format}
                  </span>
                )}
              </div>
              {r.review && (
                <p style={{
                  fontSize: 13, lineHeight: 1.7, color: '#789',
                  margin: '8px 0 0', paddingRight: 20,
                }}>
                  {r.review.length > 200 ? `${r.review.slice(0, 200)}...` : r.review}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {reReads.length === 0 && !showForm && (
        <div style={{ fontSize: 13, color: '#456', fontStyle: 'italic' }}>
          No re-reads logged yet
        </div>
      )}
    </div>
  )
}
