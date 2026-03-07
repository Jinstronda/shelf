'use client'
import { useState } from 'react'
import type { BookQuote } from '@/lib/schema'

interface Props {
  bookDbId: string
  initialQuotes: BookQuote[]
}

export function QuotesSection({ bookDbId, initialQuotes }: Props) {
  const [quotes, setQuotes] = useState<BookQuote[]>(initialQuotes)
  const [showForm, setShowForm] = useState(false)
  const [quote, setQuote] = useState('')
  const [pageNumber, setPageNumber] = useState('')
  const [chapter, setChapter] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quote.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: bookDbId,
          quote: quote.trim(),
          pageNumber: pageNumber || null,
          chapter: chapter.trim() || null,
        }),
      })
      if (!res.ok) throw new Error()
      const created: BookQuote = await res.json()
      setQuotes(prev => [created, ...prev])
      setQuote('')
      setPageNumber('')
      setChapter('')
      setShowForm(false)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this quote?')) return
    try {
      const res = await fetch('/api/quotes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setQuotes(prev => prev.filter(q => q.id !== id))
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
          Quotes
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'none', border: '1px solid rgba(196,96,58,0.4)',
            color: '#C4603A', borderRadius: 4, padding: '4px 12px',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {showForm ? 'Cancel' : 'Add Quote'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 6,
          padding: 16, marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <textarea
            value={quote}
            onChange={e => setQuote(e.target.value)}
            placeholder="Enter a quote..."
            maxLength={2000}
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
              padding: '8px 10px', color: '#e8e0d4', fontSize: 13,
              fontFamily: 'inherit', outline: 'none', resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <input
              value={pageNumber}
              onChange={e => setPageNumber(e.target.value)}
              placeholder="Page #"
              type="number"
              style={{
                width: 80, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '6px 10px', color: '#e8e0d4', fontSize: 12,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <input
              value={chapter}
              onChange={e => setChapter(e.target.value)}
              placeholder="Chapter"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '6px 10px', color: '#e8e0d4', fontSize: 12,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="submit"
              disabled={saving || !quote.trim()}
              style={{
                background: '#C4603A', color: '#fff', border: 'none',
                borderRadius: 4, padding: '6px 16px', fontSize: 12, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer',
                opacity: saving || !quote.trim() ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Quote'}
            </button>
          </div>
        </form>
      )}

      {quotes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {quotes.map(q => (
            <div key={q.id} style={{
              borderLeft: '3px solid rgba(196,96,58,0.5)',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '0 4px 4px 0',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <button
                onClick={() => handleDelete(q.id)}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#456', fontSize: 14, lineHeight: 1, padding: 0,
                  fontFamily: 'inherit',
                }}
                aria-label="Delete quote"
              >
                &times;
              </button>
              <p style={{
                fontSize: 14, lineHeight: 1.7, color: '#9ab',
                fontStyle: 'italic', margin: 0, paddingRight: 20,
              }}>
                &ldquo;{q.quote}&rdquo;
              </p>
              {(q.pageNumber || q.chapter) && (
                <div style={{ fontSize: 11, color: '#567', marginTop: 6 }}>
                  {q.pageNumber && <span>p. {q.pageNumber}</span>}
                  {q.pageNumber && q.chapter && <span> · </span>}
                  {q.chapter && <span>{q.chapter}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {quotes.length === 0 && !showForm && (
        <div style={{ fontSize: 13, color: '#456', fontStyle: 'italic' }}>
          No quotes saved yet
        </div>
      )}
    </div>
  )
}
