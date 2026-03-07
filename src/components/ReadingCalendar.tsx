'use client'

const CELL = 11
const GAP = 2
const STEP = CELL + GAP
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getColor(count: number) {
  if (count === 0) return '#161b22'
  if (count === 1) return 'rgba(196,96,58,0.3)'
  if (count === 2) return 'rgba(196,96,58,0.5)'
  if (count === 3) return 'rgba(196,96,58,0.7)'
  return 'rgba(196,96,58,1.0)'
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function ReadingCalendar({ data }: { data: Record<string, number> }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayDay = today.getDay()
  const mondayOffset = todayDay === 0 ? 6 : todayDay - 1
  const endOfWeek = new Date(today)
  endOfWeek.setDate(endOfWeek.getDate() + (6 - mondayOffset))

  const start = new Date(endOfWeek)
  start.setDate(start.getDate() - (52 * 7) - 6)

  const weeks: Date[][] = []
  const cursor = new Date(start)
  let currentWeek: Date[] = []

  while (cursor <= endOfWeek) {
    currentWeek.push(new Date(cursor))
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  const labelLeft = 28
  const gridWidth = weeks.length * STEP
  const totalWidth = labelLeft + gridWidth

  const monthLabels: { label: string; x: number }[] = []
  let lastMonth = -1
  for (let w = 0; w < weeks.length; w++) {
    const firstDay = weeks[w][0]
    const month = firstDay.getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTHS[month], x: labelLeft + w * STEP })
      lastMonth = month
    }
  }

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 16,
      }}>Reading Calendar</div>
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        <svg width={totalWidth} height={14 + 7 * STEP} style={{ display: 'block' }}>
          {monthLabels.map((m, i) => (
            <text key={i} x={m.x} y={10} fontSize={10} fill="#567">{m.label}</text>
          ))}
          {DAYS.map((label, i) => (
            label ? (
              <text key={i} x={0} y={14 + i * STEP + CELL - 1} fontSize={10} fill="#567">{label}</text>
            ) : null
          ))}
          {weeks.map((week, w) =>
            week.map((day, d) => {
              const key = formatDate(day)
              const count = data[key] ?? 0
              const isFuture = day > today
              return (
                <rect
                  key={key}
                  x={labelLeft + w * STEP}
                  y={14 + d * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={isFuture ? 'transparent' : getColor(count)}
                >
                  <title>{`${key}: ${count} book${count !== 1 ? 's' : ''}`}</title>
                </rect>
              )
            })
          )}
        </svg>
      </div>
    </div>
  )
}
