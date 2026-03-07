'use client'
import { useEffect, useState } from 'react'
import { RATING_MAP } from '@/lib/constants'

interface Props {
  data: { rating: number; count: number }[]
}

export function RatingDistribution({ data }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (data.length === 0) {
    return (
      <div style={{
        background: '#1c2028', borderRadius: 6, padding: 24, marginBottom: 40,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          color: '#567', textTransform: 'uppercase', marginBottom: 16,
        }}>Rating Distribution</div>
        <div style={{ fontSize: 13, color: '#456' }}>No ratings yet</div>
      </div>
    )
  }

  const full: { rating: number; count: number }[] = []
  for (let r = 1; r <= 10; r++) {
    const found = data.find(d => d.rating === r)
    full.push({ rating: r, count: found?.count ?? 0 })
  }

  const max = Math.max(...full.map(d => d.count))
  const barCount = 10
  const chartWidth = 600
  const chartHeight = 200
  const bottomPad = 36
  const topPad = 20
  const barGap = 8
  const barWidth = (chartWidth - barGap * (barCount + 1)) / barCount

  function barColor(rating: number): string {
    const t = (rating - 1) / 9
    const r = Math.round(68 + (196 - 68) * t)
    const g = Math.round(85 + (96 - 85) * t)
    const b = Math.round(102 + (58 - 102) * t)
    return `rgb(${r},${g},${b})`
  }

  return (
    <div style={{
      background: '#1c2028', borderRadius: 6, padding: 24, marginBottom: 40,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 16,
      }}>Rating Distribution</div>
      <svg
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight + bottomPad + topPad}`}
        style={{ display: 'block' }}
      >
        {full.map((d, i) => {
          const x = barGap + i * (barWidth + barGap)
          const barH = max > 0 ? (d.count / max) * chartHeight : 0
          const y = topPad + chartHeight - barH
          return (
            <g key={d.rating}>
              <rect
                x={x}
                y={mounted ? y : topPad + chartHeight}
                width={barWidth}
                height={mounted ? barH : 0}
                rx={3}
                fill={barColor(d.rating)}
                style={{
                  transition: `y 0.5s ease ${i * 0.04}s, height 0.5s ease ${i * 0.04}s`,
                }}
              />
              {d.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#9ab"
                  fontSize={11}
                  fontWeight={700}
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: `opacity 0.3s ease ${i * 0.04 + 0.4}s`,
                  }}
                >
                  {d.count}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={topPad + chartHeight + bottomPad / 2 + 4}
                textAnchor="middle"
                fill="#567"
                fontSize={10}
                fontWeight={600}
              >
                {RATING_MAP[d.rating]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
