'use client'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

export function GenreChart({ data }: { data: { genre: string; count: number }[] }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  if (data.length === 0) {
    return (
      <div style={{
        background: '#1c2028', borderRadius: 6, padding: 24, marginBottom: 40,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          color: '#567', textTransform: 'uppercase', marginBottom: 16,
        }}>Genre Breakdown</div>
        <div style={{ fontSize: 13, color: '#456' }}>No genre data yet</div>
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.count), 1)
  const barHeight = 28
  const gap = 4
  const leftPad = 140
  const rightPad = 40
  const totalHeight = data.length * (barHeight + gap) - gap

  function barColor(i: number): string {
    const t = data.length === 1 ? 0 : i / (data.length - 1)
    const r = Math.round(196 + (85 - 196) * t)
    const g = Math.round(96 + (102 - 96) * t)
    const b = Math.round(58 + (119 - 58) * t)
    return `rgb(${r},${g},${b})`
  }

  return (
    <div style={{
      background: '#1c2028', borderRadius: 6, padding: 24, marginBottom: 40,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 16,
      }}>Genre Breakdown</div>
      <svg
        width="100%"
        viewBox={`0 0 600 ${totalHeight}`}
        style={{ display: 'block' }}
      >
        {data.map((d, i) => {
          const y = i * (barHeight + gap)
          const barWidth = (d.count / max) * (600 - leftPad - rightPad)
          return (
            <g key={d.genre}>
              <text
                x={leftPad - 10}
                y={y + barHeight / 2}
                textAnchor="end"
                dominantBaseline="central"
                fill="#9ab"
                fontSize={12}
                fontWeight={600}
              >
                {d.genre}
              </text>
              <rect
                x={leftPad}
                y={y}
                width={mounted ? barWidth : 0}
                height={barHeight}
                rx={3}
                fill={barColor(i)}
                style={{
                  transition: `width 0.5s ease ${i * 0.04}s`,
                }}
              />
              <text
                x={leftPad + barWidth + 8}
                y={y + barHeight / 2}
                dominantBaseline="central"
                fill="#567"
                fontSize={12}
                fontWeight={700}
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: `opacity 0.3s ease ${i * 0.04 + 0.4}s`,
                }}
              >
                {d.count}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
