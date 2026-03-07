'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

type Book = {
  googleId: string
  title: string
  authors: string[]
  coverUrl: string | null
  pageCount: number | null
  genres: string[]
}

type PageFilter = 'all' | 'short' | 'medium' | 'long'

const PAGE_FILTERS: { key: PageFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'short', label: 'Short (< 200)' },
  { key: 'medium', label: 'Medium (200-400)' },
  { key: 'long', label: 'Long (400+)' },
]

function matchesPageFilter(book: Book, filter: PageFilter): boolean {
  if (filter === 'all') return true
  if (!book.pageCount) return false
  if (filter === 'short') return book.pageCount < 200
  if (filter === 'medium') return book.pageCount >= 200 && book.pageCount <= 400
  return book.pageCount > 400
}

const pillBase = {
  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 as const,
  border: 'none', cursor: 'pointer' as const, transition: 'all 0.15s',
}

const pillActive = {
  background: 'rgba(196,96,58,0.2)', color: '#C4603A',
  border: '1px solid rgba(196,96,58,0.3)',
}

const pillInactive = {
  background: 'rgba(255,255,255,0.05)', color: '#789',
  border: '1px solid rgba(255,255,255,0.08)',
}

export function RandomizerClient({ books }: { books: Book[] }) {
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set())
  const [pageFilter, setPageFilter] = useState<PageFilter>('all')
  const [chosenBook, setChosenBook] = useState<Book | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [flashCover, setFlashCover] = useState<string | null>(null)
  const spinRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout) }
  }, [])

  const allGenres = useMemo(() => [...new Set(books.flatMap(b => b.genres))].sort(), [books])

  const filtered = books.filter(b => {
    if (selectedGenres.size > 0 && !b.genres.some(g => selectedGenres.has(g))) return false
    if (!matchesPageFilter(b, pageFilter)) return false
    return true
  })

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev => {
      const next = new Set(prev)
      if (next.has(genre)) next.delete(genre)
      else next.add(genre)
      return next
    })
    setChosenBook(null)
  }, [])

  const pickRandom = useCallback(() => {
    const pool = books.filter(b => {
      if (selectedGenres.size > 0 && !b.genres.some(g => selectedGenres.has(g))) return false
      if (!matchesPageFilter(b, pageFilter)) return false
      return true
    })
    if (pool.length === 0 || spinRef.current) return
    spinRef.current = true
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setSpinning(true)
    setChosenBook(null)

    const flashes = 6 + Math.floor(Math.random() * 3)
    const winner = pool[Math.floor(Math.random() * pool.length)]
    let i = 0

    const flash = () => {
      if (i < flashes) {
        const rand = pool[Math.floor(Math.random() * pool.length)]
        setFlashCover(rand.coverUrl)
        i++
        timersRef.current.push(setTimeout(flash, 80 + i * 15))
      } else {
        setFlashCover(null)
        setChosenBook(winner)
        setSpinning(false)
        spinRef.current = false
      }
    }

    flash()
  }, [books, selectedGenres, pageFilter])

  if (books.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
        <div style={{ fontSize: 15, marginBottom: 8 }}>
          Your TBR is empty! Add books to your want-to-read shelf first.
        </div>
        <a href="/search" style={{ color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          Search for books
        </a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ fontSize: 14, color: '#9ab' }}>
        {filtered.length} {filtered.length === 1 ? 'book' : 'books'} to choose from
      </div>

      {/* genre filter */}
      {allGenres.length > 0 && (
        <div style={{ width: '100%' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: '#567', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Genre
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={() => { setSelectedGenres(new Set()); setChosenBook(null) }}
              style={{ ...pillBase, ...(selectedGenres.size === 0 ? pillActive : pillInactive) }}
            >
              All
            </button>
            {allGenres.map(g => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                style={{ ...pillBase, ...(selectedGenres.has(g) ? pillActive : pillInactive) }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* page count filter */}
      <div style={{ width: '100%' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: '#567', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Length
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PAGE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setPageFilter(f.key); setChosenBook(null) }}
              style={{ ...pillBase, ...(pageFilter === f.key ? pillActive : pillInactive) }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* spinning preview */}
      {spinning && (
        <div style={{
          width: 200, height: 300, borderRadius: 6, overflow: 'hidden',
          background: '#1c2028', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {flashCover ? (
            <img
              src={flashCover}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px)' }}
            />
          ) : (
            <div style={{ color: '#567', fontSize: 14 }}>...</div>
          )}
        </div>
      )}

      {/* chosen book */}
      {chosenBook && !spinning && (
        <div
          style={{
            background: '#1c2028', borderRadius: 8, padding: 32,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            width: '100%',
            animation: 'randomizerReveal 0.4s ease-out',
          }}
        >
          <a href={`/book/${chosenBook.googleId}`} style={{ textDecoration: 'none' }}>
            {chosenBook.coverUrl ? (
              <img
                src={chosenBook.coverUrl}
                alt={chosenBook.title}
                style={{
                  width: 200, borderRadius: 4, objectFit: 'cover',
                  boxShadow: '0 0 30px rgba(196,96,58,0.15)',
                }}
              />
            ) : (
              <div style={{
                width: 200, height: 300, borderRadius: 4,
                background: '#2a2e36', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, color: '#567',
              }}>
                No cover
              </div>
            )}
          </a>
          <a href={`/book/${chosenBook.googleId}`} style={{
            textDecoration: 'none', fontFamily: 'Cormorant Garamond, serif',
            fontSize: 24, fontWeight: 700, color: '#fff', textAlign: 'center',
          }}>
            {chosenBook.title}
          </a>
          {chosenBook.authors.length > 0 && (
            <div style={{ fontSize: 14, color: '#9ab' }}>
              {chosenBook.authors.join(', ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {chosenBook.pageCount && (
              <span style={{ fontSize: 12, color: '#678' }}>
                {chosenBook.pageCount} pages
              </span>
            )}
            {chosenBook.genres.length > 0 && (
              <span style={{ fontSize: 12, color: '#678' }}>
                {chosenBook.genres.slice(0, 3).join(', ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* empty filtered state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#567', fontSize: 14 }}>
          No books match your filters. Try removing some.
        </div>
      )}

      {/* pick button */}
      {filtered.length > 0 && (
        <button
          onClick={pickRandom}
          disabled={spinning}
          style={{
            background: spinning ? '#8a4229' : '#C4603A',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '16px 40px', fontSize: 18, fontWeight: 700,
            cursor: spinning ? 'default' : 'pointer',
            transition: 'all 0.2s',
            opacity: spinning ? 0.7 : 1,
          }}
        >
          {chosenBook ? 'Pick Again' : 'Pick a Random Book'}
        </button>
      )}

      <style>{`
        @keyframes randomizerReveal {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
