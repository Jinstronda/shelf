'use client'

import { useState } from 'react'

interface CalendarEntry {
  date: string
  bookTitle: string
  coverUrl: string | null
  googleId: string | null
}

interface Props {
  entries: CalendarEntry[]
  year: number | null
  month: number | null
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DiaryCalendar({ entries, year, month }: Props) {
  const now = new Date()
  const initialYear = year ?? now.getFullYear()
  const initialMonth = month ?? now.getMonth()

  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const byDate = new Map<string, CalendarEntry[]>()
  for (const e of entries) {
    const list = byDate.get(e.date) ?? []
    list.push(e)
    byDate.set(e.date, list)
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const lastOfMonth = new Date(viewYear, viewMonth + 1, 0)

  let startDow = firstOfMonth.getDay() - 1
  if (startDow < 0) startDow = 6

  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - startDow)

  const cells: Date[] = []
  const cursor = new Date(gridStart)
  while (cells.length < 42) {
    cells.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
    if (cells.length >= 35 && cursor.getMonth() !== viewMonth) break
  }

  const todayKey = toDateKey(now)

  function goPrev() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }

  function goNext() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  function scrollToDate(dateKey: string) {
    const el = document.getElementById(`journal-date-${dateKey}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{
      background: '#1c2028', borderRadius: 6, padding: 16, marginBottom: 32,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <button onClick={goPrev} style={{
          background: 'none', border: 'none', color: '#567', fontSize: 16,
          cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ccc' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#567' }}
        >&lt;</button>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 16,
          fontWeight: 600, color: '#fff',
        }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={goNext} style={{
          background: 'none', border: 'none', color: '#567', fontSize: 16,
          cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ccc' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#567' }}
        >&gt;</button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1,
      }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{
            fontSize: 10, color: '#567', textTransform: 'uppercase',
            textAlign: 'center', padding: '4px 0',
          }}>{d}</div>
        ))}

        {cells.map(day => {
          const key = toDateKey(day)
          const isCurrentMonth = day.getMonth() === viewMonth
          const isToday = key === todayKey
          const dayEntries = byDate.get(key)
          const hasEntries = !!dayEntries && dayEntries.length > 0
          const isHovered = hoveredDay === key && hasEntries

          return (
            <div
              key={key}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '6px 2px 8px',
                cursor: hasEntries ? 'pointer' : 'default',
                border: isToday ? '1px solid rgba(196,96,58,0.5)' : '1px solid transparent',
                borderRadius: 4,
                background: isHovered ? 'rgba(196,96,58,0.1)' : 'transparent',
              }}
              onMouseEnter={() => setHoveredDay(key)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => hasEntries && scrollToDate(key)}
            >
              <span style={{
                fontSize: 12, color: isCurrentMonth ? '#ccc' : '#333',
                lineHeight: 1,
              }}>{day.getDate()}</span>
              {hasEntries && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#C4603A', marginTop: 3,
                }} />
              )}
              {isHovered && dayEntries && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%',
                  transform: 'translateX(-50%)', marginBottom: 6,
                  background: '#252a34', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, padding: '8px 10px',
                  whiteSpace: 'nowrap', zIndex: 20,
                  minWidth: 120,
                }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: dayEntries.length > 0 ? 6 : 0 }}>
                    {dayEntries.slice(0, 3).map((e, i) =>
                      e.coverUrl ? (
                        <img key={i} src={e.coverUrl} alt=""
                          style={{ width: 28, height: 42, borderRadius: 2, objectFit: 'cover' }} />
                      ) : (
                        <div key={i} style={{
                          width: 28, height: 42, borderRadius: 2,
                          background: '#1c2028',
                        }} />
                      )
                    )}
                  </div>
                  {dayEntries.slice(0, 3).map((e, i) => (
                    <div key={i} style={{
                      fontSize: 11, color: '#ccc', lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
                    }}>{e.bookTitle}</div>
                  ))}
                  {dayEntries.length > 3 && (
                    <div style={{ fontSize: 10, color: '#567', marginTop: 2 }}>
                      +{dayEntries.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
