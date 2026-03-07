import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { NavScroll } from '@/components/NavScroll'
import { SearchBar } from '@/components/SearchBar'
import { AuthNav } from '@/components/AuthNav'
import { LogoSVG } from '@/components/Logo'
import { ProfileShelf } from '@/components/ProfileShelf'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Shelf',
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const rows = await db
    .select()
    .from(userBooks)
    .where(eq(userBooks.userId, session.user.id!))
    .innerJoin(books, eq(userBooks.bookId, books.id))

  const logged = rows.map(r => ({
    ...r.user_books,
    book: r.books,
  }))

  const read = logged.filter(l => l.status === 'read')
  const reading = logged.filter(l => l.status === 'reading')
  const want = logged.filter(l => l.status === 'want')

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

          {/* Profile header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
            {session.user.image ? (
              <img src={session.user.image} alt="" style={{
                width: 64, height: 64, borderRadius: '50%',
                border: '3px solid rgba(196,96,58,0.4)',
              }} />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#C4603A', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: '#fff',
              }}>
                {session.user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <h1 style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 32,
                fontWeight: 700, color: '#fff', lineHeight: 1.2,
              }}>
                {session.user.name}
              </h1>
              <div style={{ fontSize: 13, color: '#567', marginTop: 4 }}>
                {logged.length} {logged.length === 1 ? 'book' : 'books'} logged
              </div>
            </div>
          </div>

          <ProfileShelf title="Read" items={read} />
          <ProfileShelf title="Currently Reading" items={reading} />
          <ProfileShelf title="Want to Read" items={want} />

          {logged.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '80px 0', color: '#567',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📚</div>
              <div style={{ fontSize: 15, marginBottom: 8 }}>Your shelf is empty</div>
              <a href="/search" style={{
                color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600,
              }}>Search for books to add</a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
