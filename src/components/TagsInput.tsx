'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  bookDbId: string
  initialTags: string[]
}

export function TagsInput({ bookDbId, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [input, setInput] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.ok ? r.json() : [])
      .then((data: { tag: string; count: number }[]) => setAllTags(data.map(d => d.tag)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const suggestions = input.trim()
    ? allTags.filter(t => t.includes(input.trim().toLowerCase()) && !tags.includes(t))
    : allTags.filter(t => !tags.includes(t))

  async function addTag(tag: string) {
    const cleaned = tag.trim().toLowerCase()
    if (!cleaned || tags.includes(cleaned)) return

    setTags(prev => [...prev, cleaned])
    setInput('')
    setShowSuggestions(false)

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: bookDbId, tag: cleaned }),
      })
      if (!res.ok) setTags(prev => prev.filter(t => t !== cleaned))
    } catch {
      setTags(prev => prev.filter(t => t !== cleaned))
    }
  }

  async function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))

    try {
      const res = await fetch('/api/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: bookDbId, tag }),
      })
      if (!res.ok) setTags(prev => [...prev, tag])
    } catch {
      setTags(prev => [...prev, tag])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    }
  }

  return (
    <div style={{ marginTop: 20 }} ref={wrapperRef}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: '#567', textTransform: 'uppercase', marginBottom: 10,
      }}>
        Tags
      </div>

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              background: 'rgba(196,96,58,0.15)', color: '#C4603A',
              borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {tag}
              <button
                onClick={() => removeTag(tag)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#C4603A', fontSize: 13, lineHeight: 1, padding: 0,
                  fontFamily: 'inherit', opacity: 0.7,
                }}
                aria-label={`Remove tag ${tag}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          maxLength={50}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
            padding: '6px 10px', color: '#e8e0d4', fontSize: 12,
            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#1c2028', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, marginTop: 4, maxHeight: 140, overflowY: 'auto',
            zIndex: 10,
          }}>
            {suggestions.slice(0, 8).map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 10px', color: '#9ab', fontSize: 12,
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
