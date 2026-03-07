export function ReadingStreak({ currentStreak, longestStreak }: {
  currentStreak: number
  longestStreak: number
}) {
  if (currentStreak === 0) {
    return (
      <div style={{
        background: '#1c2028', borderRadius: 6, padding: '24px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: '#456' }}>No active streak</div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#1c2028', borderRadius: 6, padding: '24px 20px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 23C16.5 23 19 19.5 19 15.5C19 11.5 16 8.5 14.5 7C14 10 12 11.5 10 10C8.5 8.9 8 7 8.5 4C5 7 5 10.5 5 12.5C5 18 8 23 12 23Z" fill="#C4603A" />
          <path d="M12 23C14.5 23 16 20.5 16 18C16 15.5 14.5 14 13.5 13C13.5 15 12 16 11 15.5C10 15 9.5 14 10 12C8 14 8 15.5 8 17C8 20 10 23 12 23Z" fill="#E8825A" />
        </svg>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 48,
          fontWeight: 700, color: '#fff', lineHeight: 1,
        }}>
          {currentStreak}
        </span>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginTop: 8,
      }}>
        {currentStreak === 1 ? 'week streak' : 'weeks streak'}
      </div>
      {longestStreak > currentStreak && (
        <div style={{ fontSize: 12, color: '#456', marginTop: 8 }}>
          Longest: {longestStreak} weeks
        </div>
      )}
    </div>
  )
}
