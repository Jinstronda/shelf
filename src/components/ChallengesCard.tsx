'use client'
import { useState, useEffect } from 'react'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface ChallengeData {
  id: string
  type: 'monthly' | 'yearly'
  year: number
  month: number | null
  target: number
  progress: number
}

function ChallengeRow({ c, onUpdate }: { c: ChallengeData; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(c.target))
  const [saving, setSaving] = useState(false)

  const progress = Math.min(c.progress / c.target, 1)
  const percent = Math.round(progress * 100)
  const complete = c.progress >= c.target

  const label = c.type === 'yearly'
    ? `${c.year} Yearly Challenge`
    : `${MONTH_NAMES[(c.month ?? 1) - 1]} ${c.year}`

  async function handleSave() {
    const num = parseInt(input)
    if (!num || num < 1) return
    setSaving(true)
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: c.type, target: num }),
      })
      if (!res.ok) throw new Error()
      setEditing(false)
      onUpdate()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#567', textTransform: 'uppercase' }}>
            {label}
          </span>
          {complete && (
            <span style={{ fontSize: 12, color: '#3EB489', fontWeight: 600 }}>
              Challenge complete!
            </span>
          )}
        </div>
        {!editing && (
          <button onClick={() => { setInput(String(c.target)); setEditing(true) }} style={{
            background: 'none', border: 'none', color: '#567',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          }}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
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
          <span style={{ fontSize: 13, color: '#9ab' }}>books</span>
          <button onClick={handleSave} disabled={saving} style={{
            background: 'var(--copper)', color: '#fff', border: 'none',
            borderRadius: 4, padding: '6px 16px', fontSize: 12,
            fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? '...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} style={{
            background: 'none', border: 'none', color: '#567',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 28,
              fontWeight: 700, color: '#fff',
            }}>
              {c.progress}
            </span>
            <span style={{ fontSize: 14, color: '#567' }}>/ {c.target} books</span>
            <span style={{ fontSize: 13, color: complete ? '#3EB489' : '#C4603A', fontWeight: 600, marginLeft: 'auto' }}>
              {percent}%
            </span>
          </div>
          <div style={{
            height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${percent}%`,
              background: complete
                ? 'linear-gradient(90deg, #2a7a4a, #3EB489)'
                : 'linear-gradient(90deg, #C4603A, #D4764E)',
              borderRadius: 3, transition: 'width 0.3s',
            }} />
          </div>
        </>
      )}
    </div>
  )
}

export function ChallengesCard() {
  const [challenges, setChallenges] = useState<ChallengeData[]>([])
  const [loading, setLoading] = useState(true)
  const [addType, setAddType] = useState<'monthly' | 'yearly' | null>(null)
  const [addInput, setAddInput] = useState('5')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/challenges')
      if (!res.ok) return
      setChallenges(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const hasMonthly = challenges.some(c => c.type === 'monthly')
  const hasYearly = challenges.some(c => c.type === 'yearly')

  async function handleAdd() {
    if (!addType) return
    const num = parseInt(addInput)
    if (!num || num < 1) return
    setSaving(true)
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: addType, target: num }),
      })
      if (!res.ok) throw new Error()
      setAddType(null)
      setAddInput('5')
      load()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div style={{
      background: '#1c2028', borderRadius: 6, padding: 24, marginBottom: 40,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 20,
      }}>
        Reading Challenges
      </div>

      {challenges.length === 0 && !addType && (
        <div style={{ fontSize: 13, color: '#456', marginBottom: 16 }}>
          No active challenges. Set one to track your reading.
        </div>
      )}

      {challenges.map(c => (
        <ChallengeRow key={c.id} c={c} onUpdate={load} />
      ))}

      {addType ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#9ab' }}>Read</span>
          <input
            type="number"
            value={addInput}
            onChange={e => setAddInput(e.target.value)}
            min={1}
            max={999}
            style={{
              width: 60, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
              padding: '6px 10px', color: '#fff', fontSize: 14,
              fontFamily: 'inherit', textAlign: 'center', outline: 'none',
            }}
          />
          <span style={{ fontSize: 13, color: '#9ab' }}>
            books this {addType === 'monthly' ? 'month' : 'year'}
          </span>
          <button onClick={handleAdd} disabled={saving} style={{
            background: 'var(--copper)', color: '#fff', border: 'none',
            borderRadius: 4, padding: '6px 16px', fontSize: 12,
            fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? '...' : 'Set'}
          </button>
          <button onClick={() => setAddType(null)} style={{
            background: 'none', border: 'none', color: '#567',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12 }}>
          {!hasMonthly && (
            <button onClick={() => setAddType('monthly')} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4, padding: '8px 16px', fontSize: 12, color: '#9ab',
              fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              + Monthly Challenge
            </button>
          )}
          {!hasYearly && (
            <button onClick={() => setAddType('yearly')} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4, padding: '8px 16px', fontSize: 12, color: '#9ab',
              fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              + Yearly Challenge
            </button>
          )}
        </div>
      )}
    </div>
  )
}
