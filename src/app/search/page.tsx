import { searchGoogleBooks } from '@/lib/google-books'
import { searchOpenLibrary } from '@/lib/open-library'
import { NavScroll } from '@/components/NavScroll'
import { SearchBar } from '@/components/SearchBar'
import { BookCard } from '@/components/BookCard'
import { AuthNav } from '@/components/AuthNav'
import type { Metadata } from 'next'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `"${q}" — Shelf` : 'Search — Shelf' }
}

const LogoSVG = () => (
  <svg width="30" height="25" viewBox="0 0 44 36" fill="none">
    <rect x="0"  y="14" width="9" height="22" rx="1" fill="#C4603A"/>
    <rect x="0"  y="14" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="0"  y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="11" y="7"  width="9" height="29" rx="1" fill="#C4603A"/>
    <rect x="11" y="7"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="11" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="22" y="1"  width="9" height="35" rx="1" fill="#C4603A"/>
    <rect x="22" y="1"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="22" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="33" y="9"  width="9" height="27" rx="1" fill="#C4603A"/>
    <rect x="33" y="9"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="33" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
  </svg>
)

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let results = query
    ? await searchGoogleBooks(query, 20).catch(() => searchOpenLibrary(query, 20))
    : []

  // fallback to Open Library if Google Books returns nothing
  if (results.length === 0 && query) {
    results = await searchOpenLibrary(query, 20)
  }

  return (
    <>
      <NavScroll>
        <a className="nav-logo" href="/">
          <LogoSVG />
          <span className="nav-logo-text">Shelf</span>
        </a>
        <ul className="nav-links">
          <AuthNav />
          <li><a href="/books">Books</a></li>
          <li><a href="/lists">Lists</a></li>
          <li><a href="/members">Members</a></li>
        </ul>
        <SearchBar />
      </NavScroll>

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            {query ? (
              <>
                <div style={{ fontSize: 11, color: '#567', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Search results
                </div>
                <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700, color: '#fff' }}>
                  &ldquo;{query}&rdquo;
                </h1>
                <div style={{ fontSize: 13, color: '#567', marginTop: 6 }}>
                  {results.length} {results.length === 1 ? 'result' : 'results'}
                </div>
              </>
            ) : (
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700, color: '#fff' }}>
                Search books
              </h1>
            )}
          </div>

          {/* Search form */}
          <form method="GET" action="/search" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', gap: 12, maxWidth: 600 }}>
              <input
                name="q"
                defaultValue={query}
                placeholder="Title, author, or ISBN…"
                autoFocus
                style={{
                  flex: 1, background: '#1c2028',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                  padding: '12px 16px', color: '#fff', fontSize: 15,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              <button type="submit" style={{
                background: 'var(--copper)', color: '#fff', border: 'none',
                borderRadius: 4, padding: '12px 24px', fontSize: 14,
                fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}>Search</button>
            </div>
          </form>

          {/* Results grid */}
          {results.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 20,
            }}>
              {results.map((book, i) => (
                <div key={book.googleId + i}>
                  <BookCard
                    isbn={book.isbn13 ?? book.isbn10 ?? ''}
                    title={book.title}
                    author={book.authors[0] ?? ''}
                    rating=""
                    cv={['cv1','cv2','cv3','cv4','cv5','cv6','cv7','cv8','cv9','cva','cvb','cvc'][i % 12]}
                  />
                  <div style={{ marginTop: 8 }}>
                    <a href={`/book/${book.googleId}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: '#ccc', lineHeight: 1.3,
                        marginBottom: 3,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{book.title}</div>
                    </a>
                    <div style={{ fontSize: 12, color: '#567' }}>
                      {book.authors[0]}
                      {book.published && <span> · {book.published.slice(0, 4)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div style={{ color: '#567', fontSize: 15, textAlign: 'center', paddingTop: 60 }}>
              No results for &ldquo;{query}&rdquo;. Try a different title or author.
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
