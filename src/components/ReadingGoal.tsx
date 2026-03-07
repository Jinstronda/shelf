'use client'
import { useState } from 'react'

interface Props {
  year: number
  booksRead: number
  initialTarget: number | null
}

export function ReadingGoal({ year, booksRead, initialTarget }: Props) {
  const [target, setTarget] = useState(initialTarget)
  const [editing, setEditing] = useState(!initialTarget)
  const [input, setInput] = useState(String(initialTarget ?? 12))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const num = parseInt(input)
    if (!num || num < 1) return
    setSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, target: num }),
      })
      if (!res.ok) throw new Error()
      setTarget(num)
      setEditing(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const progress = target ? Math.min(booksRead / target, 1) : 0
  const percent = Math.round(progress * 100)

  return (
    <div style={{
      background: '#1c2028', borderRadius: 6, padding: 24, marginBottom: 40,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 16,
      }}>
        {year} Reading Goal
      </div>

      {target && !editing ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
              fontWeight: 700, color: '#fff',
            }}>
              {booksRead}
            </span>
            <span style={{ fontSize: 15, color: '#567' }}>/ {target} books</span>
            <span style={{ fontSize: 13, color: '#C4603A', fontWeight: 600, marginLeft: 'auto' }}>
              {percent}%
            </span>
          </div>
          <div style={{
            height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3,
            overflow: 'hidden', marginBottom: 12,
          }}>
            <div style={{
              height: '100%', width: `${percent}%`,
              background: progress >= 1
                ? 'linear-gradient(90deg, #2a7a4a, #3EB489)'
                : 'linear-gradient(90deg, #C4603A, #D4764E)',
              borderRadius: 3, transition: 'width 0.3s',
            }} />
          </div>
          {progress >= 1 && (
            <div style={{ fontSize: 13, color: '#3EB489', fontWeight: 600, marginBottom: 8 }}>
              Goal reached!
            </div>
          )}
          <button onClick={() => setEditing(true)} style={{
            background: 'none', border: 'none', color: '#567',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          }}>
            Change goal
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#9ab' }}>I want to read</span>
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            min={1}
            max={999}
            style={{
              width: 60, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
              padding: '6px 10px', color: '#fff', fontSize: 14,
              fontFamily: 'inherit', textAlign: 'center', outline: 'none',
            }}
          />
          <span style={{ fontSize: 13, color: '#9ab' }}>books in {year}</span>
          <button onClick={handleSave} disabled={saving} style={{
            background: 'var(--copper)', color: '#fff', border: 'none',
            borderRadius: 4, padding: '6px 16px', fontSize: 12,
            fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? '...' : 'Set Goal'}
          </button>
          {target && (
            <button onClick={() => setEditing(false)} style={{
              background: 'none', border: 'none', color: '#567',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancel</button>
          )}
        </div>
      )}
    </div>
  )
}
