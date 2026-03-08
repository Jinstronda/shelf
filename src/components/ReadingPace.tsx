'use client'
import { useSyncExternalStore } from 'react'

interface Props {
  pagesPerDay: number
  avgDaysPerBook: number
  booksPerMonth: { month: string; count: number }[]
  totalBooks: number
  totalPages: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const subscribe = () => () => {}

export function ReadingPace({ pagesPerDay, avgDaysPerBook, booksPerMonth, totalBooks, totalPages }: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  const max = Math.max(...booksPerMonth.map(d => d.count), 1)
  const currentMonth = new Date().getMonth()

  return (
    <div style={{
      background: '#1c2028', borderRadius: 6, padding: 24, marginBottom: 40,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 16,
      }}>Reading Pace</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{
          background: '#14181c', borderRadius: 6, padding: '20px 16px', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 40,
            fontWeight: 700, color: '#fff', lineHeight: 1,
          }}>{pagesPerDay.toFixed(1)}</div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#567', textTransform: 'uppercase', marginTop: 8,
          }}>Pages per day</div>
        </div>
        <div style={{
          background: '#14181c', borderRadius: 6, padding: '20px 16px', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 40,
            fontWeight: 700, color: '#fff', lineHeight: 1,
          }}>{avgDaysPerBook > 0 ? avgDaysPerBook.toFixed(1) : '-'}</div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#567', textTransform: 'uppercase', marginTop: 8,
          }}>Avg days per book</div>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 6, height: 80,
      }}>
        {booksPerMonth.map((d, i) => {
          const barH = max > 0 ? (d.count / max) * 60 : 0
          const isCurrent = i === currentMonth
          return (
            <div key={d.month} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                width: '100%',
                height: mounted ? barH : 0,
                minHeight: d.count > 0 ? 3 : 0,
                background: '#C4603A',
                opacity: isCurrent ? 1 : 0.7,
                borderRadius: '3px 3px 0 0',
                transition: `height 0.5s ease ${i * 0.04}s`,
              }} />
              <div style={{
                fontSize: 9, fontWeight: 600,
                color: isCurrent ? '#C4603A' : '#567',
              }}>{MONTHS[i]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
