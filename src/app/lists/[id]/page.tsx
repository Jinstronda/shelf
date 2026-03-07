import { db } from '@/lib/db'
import { lists, listItems, books } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { NavScroll } from '@/components/NavScroll'
import { SearchBar } from '@/components/SearchBar'
import { AuthNav } from '@/components/AuthNav'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const [list] = await db.select().from(lists).where(eq(lists.id, id)).limit(1)
  if (!list) return { title: 'List not found — Shelf' }
  return { title: `${list.name} — Shelf` }
}

export default async function ListDetailPage({ params }: Props) {
  const { id } = await params
  const [list] = await db.select().from(lists).where(eq(lists.id, id)).limit(1)
  if (!list) notFound()

  const items = await db
    .select()
    .from(listItems)
    .innerJoin(books, eq(listItems.bookId, books.id))
    .where(eq(listItems.listId, id))
    .orderBy(listItems.position)

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
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: '#567', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              <a href="/lists" style={{ color: '#567', textDecoration: 'none' }}>Lists</a> /
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
              fontWeight: 700, color: '#fff',
            }}>
              {list.name}
            </h1>
            {list.description && (
              <p style={{ fontSize: 14, color: '#789', marginTop: 8, lineHeight: 1.6 }}>{list.description}</p>
            )}
            <div style={{ fontSize: 12, color: '#456', marginTop: 8 }}>
              {items.length} {items.length === 1 ? 'book' : 'books'}
            </div>
          </div>

          {items.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 20,
            }}>
              {items.map(({ list_items: item, books: book }) => (
                <a key={item.id} href={`/book/${book.googleId}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{
                    width: '100%', aspectRatio: '2/3', borderRadius: 4,
                    overflow: 'hidden', background: '#1c2028',
                  }}>
                    {book.coverUrl && (
                      <img src={book.coverUrl} alt={book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: '#ccc', lineHeight: 1.3,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{book.title}</div>
                    <div style={{ fontSize: 12, color: '#567', marginTop: 2 }}>
                      {book.authors[0]}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              This list is empty. Add books from their detail pages.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
