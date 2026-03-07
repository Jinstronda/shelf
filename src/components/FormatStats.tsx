'use client'
import type { ReactNode } from 'react'

const FORMAT_ICONS: Record<string, ReactNode> = {
  paperback: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  hardcover: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 4h2v14H4"/></svg>,
  ebook: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  audiobook: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
}

interface Props {
  data: { format: string; count: number }[]
}

export function FormatStats({ data }: Props) {
  if (data.length === 0) return null

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 16,
      }}>Reading Formats</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {data.map(d => (
          <div key={d.format} style={{
            background: '#1c2028', borderRadius: 6, padding: '16px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            flex: 1,
            border: d.count === maxCount ? '1px solid rgba(196,96,58,0.3)' : '1px solid transparent',
          }}>
            <div style={{ color: d.count === maxCount ? '#C4603A' : '#789' }}>
              {FORMAT_ICONS[d.format]}
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 28,
              fontWeight: 700, color: d.count === maxCount ? '#C4603A' : '#fff', lineHeight: 1,
            }}>{d.count}</div>
            <div style={{
              fontSize: 10, fontWeight: 600, color: '#567',
              textTransform: 'capitalize',
            }}>{d.format}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
