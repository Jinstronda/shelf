import { searchGoogleBooks } from '@/lib/google-books'
import { searchOpenLibrary } from '@/lib/open-library'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { BookCard } from '@/components/BookCard'
import { WantToReadButton } from '@/components/WantToReadButton'
import { db } from '@/lib/db'
import { users, lists } from '@/lib/schema'
import { or, and, ilike, eq } from 'drizzle-orm'
import type { Metadata } from 'next'

type Tab = 'books' | 'people' | 'lists'
const TABS: { key: Tab; label: string }[] = [
  { key: 'books', label: 'Books' },
  { key: 'people', label: 'People' },
  { key: 'lists', label: 'Lists' },
]

const GENRES = ['Fiction', 'Nonfiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Biography', 'History', 'Science', 'Philosophy', 'Poetry', 'Horror']

interface Props {
  searchParams: Promise<{ q?: string; genre?: string; tab?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, genre, tab } = await searchParams
  const tabLabel = tab === 'people' ? 'People' : tab === 'lists' ? 'Lists' : 'Books'
  if (q && genre) return { title: `"${q}" in ${genre} — Shelf` }
  if (genre) return { title: `${genre} Books — Shelf` }
  if (q) return { title: `"${q}" in ${tabLabel} — Shelf` }
  return { title: 'Search — Shelf' }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, genre, tab: rawTab } = await searchParams
  const query = q?.trim() ?? ''
  const activeTab: Tab = rawTab === 'people' ? 'people' : rawTab === 'lists' ? 'lists' : 'books'

  let bookResults: Awaited<ReturnType<typeof searchGoogleBooks>> = []
  let userResults: typeof users.$inferSelect[] = []
  let listResults: { id: string; name: string; description: string | null; creatorName: string | null }[] = []

  if (activeTab === 'books') {
    const subjectTag = genre
      ? (genre.includes(' ') ? `subject:"${genre}"` : `subject:${genre}`)
      : ''
    const searchQuery = query && genre
      ? `${query}+${subjectTag}`
      : genre
        ? subjectTag
        : query

    bookResults = searchQuery
      ? await searchGoogleBooks(searchQuery, 20).catch(() => searchOpenLibrary(searchQuery, 20))
      : []

    if (bookResults.length === 0 && searchQuery) {
      bookResults = await searchOpenLibrary(searchQuery, 20)
    }
  } else if (activeTab === 'people' && query) {
    const pattern = `%${query}%`
    userResults = await db.select().from(users)
      .where(or(ilike(users.username, pattern), ilike(users.name, pattern)))
      .limit(20)
  } else if (activeTab === 'lists' && query) {
    const pattern = `%${query}%`
    const rows = await db.select({
      id: lists.id,
      name: lists.name,
      description: lists.description,
      creatorName: users.name,
    })
      .from(lists)
      .leftJoin(users, eq(lists.userId, users.id))
      .where(and(ilike(lists.name, pattern), eq(lists.isPublic, true)))
      .limit(20)
    listResults = rows
  }

  const hasQuery = activeTab === 'books' ? !!(query || genre) : !!query

  return (
    <>
      <SiteNav />

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
                {genre && activeTab === 'books' && (
                  <div style={{ fontSize: 14, color: '#789', marginTop: 4 }}>
                    in {genre}
                  </div>
                )}
              </>
            ) : genre && activeTab === 'books' ? (
              <>
                <div style={{ fontSize: 11, color: '#567', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Browse
                </div>
                <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700, color: '#fff' }}>
                  {genre}
                </h1>
              </>
            ) : (
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700, color: '#fff' }}>
                Search
              </h1>
            )}
          </div>

          {/* Search form */}
          <form method="GET" action="/search" style={{ marginBottom: 32 }}>
            {activeTab !== 'books' && <input type="hidden" name="tab" value={activeTab} />}
            {genre && activeTab === 'books' && <input type="hidden" name="genre" value={genre} />}
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

          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {TABS.map(t => {
              const params = new URLSearchParams()
              if (query) params.set('q', query)
              if (t.key !== 'books') params.set('tab', t.key)
              if (t.key === 'books' && genre) params.set('genre', genre)
              const href = `/search${params.toString() ? `?${params}` : ''}`
              const isActive = activeTab === t.key
              return (
                <a
                  key={t.key}
                  href={href}
                  style={{
                    padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none',
                    background: isActive ? '#C4603A' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#fff' : '#789',
                    border: `1px solid ${isActive ? '#C4603A' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >{t.label}</a>
              )
            })}
          </div>

          {/* Genre pills (books tab only) */}
          {activeTab === 'books' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
              {GENRES.map(g => (
                <a
                  key={g}
                  href={`/search?${new URLSearchParams({ ...(query ? { q: query } : {}), genre: g }).toString()}`}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none',
                    background: genre === g ? 'rgba(196,96,58,0.2)' : 'rgba(255,255,255,0.05)',
                    color: genre === g ? '#C4603A' : '#789',
                    border: `1px solid ${genre === g ? 'rgba(196,96,58,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >{g}</a>
              ))}
              {genre && (
                <a
                  href={query ? `/search?q=${encodeURIComponent(query)}` : '/search'}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', color: '#567',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >Clear filter</a>
              )}
            </div>
          )}

          {/* Book results */}
          {activeTab === 'books' && (
            bookResults.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 20,
              }}>
                {bookResults.map((book, i) => (
                  <div key={book.googleId + i}>
                    <div style={{ position: 'relative' }}>
                      <BookCard
                        isbn={book.isbn13 ?? book.isbn10 ?? ''}
                        title={book.title}
                        author={book.authors[0] ?? ''}
                        rating=""
                        cv={['cv1','cv2','cv3','cv4','cv5','cv6','cv7','cv8','cv9','cva','cvb','cvc'][i % 12]}
                      />
                      <WantToReadButton googleId={book.googleId} />
                    </div>
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
            ) : hasQuery ? (
              <div style={{ color: '#567', fontSize: 15, textAlign: 'center', paddingTop: 60 }}>
                No results{query ? <> for &ldquo;{query}&rdquo;</> : null}{genre ? <> in {genre}</> : null}. Try a different title or author.
              </div>
            ) : null
          )}

          {/* People results */}
          {activeTab === 'people' && (
            userResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {userResults.map(user => (
                  <a
                    key={user.id}
                    href={`/user/${user.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 16px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      textDecoration: 'none',
                    }}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(196,96,58,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#C4603A', fontSize: 16, fontWeight: 700,
                      }}>
                        {(user.name ?? user.username)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>
                        {user.name ?? user.username}
                      </div>
                      <div style={{ fontSize: 12, color: '#567' }}>
                        @{user.username}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : hasQuery ? (
              <div style={{ color: '#567', fontSize: 15, textAlign: 'center', paddingTop: 60 }}>
                No users found for &ldquo;{query}&rdquo;.
              </div>
            ) : null
          )}

          {/* List results */}
          {activeTab === 'lists' && (
            listResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {listResults.map(list => (
                  <a
                    key={list.id}
                    href={`/lists/${list.id}`}
                    style={{
                      display: 'block', padding: '14px 18px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>
                      {list.name}
                    </div>
                    {list.description && (
                      <div style={{ fontSize: 13, color: '#789', marginBottom: 6, lineHeight: 1.4 }}>
                        {list.description.length > 100 ? list.description.slice(0, 100) + '...' : list.description}
                      </div>
                    )}
                    {list.creatorName && (
                      <div style={{ fontSize: 12, color: '#567' }}>
                        by {list.creatorName}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : hasQuery ? (
              <div style={{ color: '#567', fontSize: 15, textAlign: 'center', paddingTop: 60 }}>
                No lists found for &ldquo;{query}&rdquo;.
              </div>
            ) : null
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
