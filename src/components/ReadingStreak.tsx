function FlameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 23C16.5 23 19 19.5 19 15.5C19 11.5 16 8.5 14.5 7C14 10 12 11.5 10 10C8.5 8.9 8 7 8.5 4C5 7 5 10.5 5 12.5C5 18 8 23 12 23Z" fill="#C4603A" />
      <path d="M12 23C14.5 23 16 20.5 16 18C16 15.5 14.5 14 13.5 13C13.5 15 12 16 11 15.5C10 15 9.5 14 10 12C8 14 8 15.5 8 17C8 20 10 23 12 23Z" fill="#E8825A" />
    </svg>
  )
}

function StreakCalendar({ last30 }: { last30: string[] }) {
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const readSet = new Set(last30)

  const days: { key: string; hasReading: boolean; isToday: boolean }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    days.push({ key, hasReading: readSet.has(key), isToday: key === todayKey })
  }

  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 20 }}>
      {days.map(d => (
        <div key={d.key} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: d.hasReading ? '#C4603A' : 'rgba(255,255,255,0.06)',
          boxShadow: d.isToday ? '0 0 0 2px #C4603A' : 'none',
          flexShrink: 0,
        }} />
      ))}
    </div>
  )
}

export function ReadingStreak({ currentStreak, longestStreak, readingDaysThisYear, last30 }: {
  currentStreak: number
  longestStreak: number
  readingDaysThisYear: number
  last30: string[]
}) {
  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak
  const hasActivity = currentStreak > 0 || readingDaysThisYear > 0 || last30.length > 0

  if (!hasActivity) {
    return (
      <div style={{
        background: '#1c2028', borderRadius: 6, padding: '32px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 14, color: '#567', marginBottom: 4 }}>No reading activity yet</div>
        <div style={{ fontSize: 12, color: '#456' }}>Finish a book to start your streak</div>
      </div>
    )
  }

  const statNumber = {
    fontFamily: 'Cormorant Garamond, serif', fontSize: 32,
    fontWeight: 700, color: '#fff', lineHeight: 1,
  }
  const statLabel = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    color: '#567', textTransform: 'uppercase' as const, marginTop: 6,
  }

  return (
    <div style={{ background: '#1c2028', borderRadius: 6, padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {currentStreak >= 3 && <FlameIcon />}
            <span style={statNumber}>{currentStreak}</span>
          </div>
          <div style={statLabel}>Current Streak</div>
          {isNewRecord && (
            <div style={{
              display: 'inline-block', marginTop: 6,
              background: 'rgba(196,96,58,0.15)', color: '#C4603A',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase',
            }}>
              New Record!
            </div>
          )}
        </div>
        <div>
          <div style={statNumber}>{longestStreak}</div>
          <div style={statLabel}>Longest Streak</div>
        </div>
        <div>
          <div style={statNumber}>{readingDaysThisYear}</div>
          <div style={statLabel}>Reading Days</div>
        </div>
      </div>
      <StreakCalendar last30={last30} />
    </div>
  )
}
