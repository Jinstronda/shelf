import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books, users, follows } from '@/lib/schema'
import { eq, count } from 'drizzle-orm'
import { getFavorites, getReadingStreak } from '@/lib/queries'
import { redirect } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ProfileShelf } from '@/components/ProfileShelf'
import { ProfileEditor } from '@/components/ProfileEditor'
import { FavoriteBooks } from '@/components/FavoriteBooks'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Your Shelf' }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const [[user], rows, [followerCount], [followingCount], favRows, streak] = await Promise.all([
    db.select().from(users).where(eq(users.id, session.user.id!)).limit(1),
    db.select().from(userBooks).where(eq(userBooks.userId, session.user.id!))
      .innerJoin(books, eq(userBooks.bookId, books.id)),
    db.select({ total: count() }).from(follows).where(eq(follows.followingId, session.user.id!)),
    db.select({ total: count() }).from(follows).where(eq(follows.followerId, session.user.id!)),
    getFavorites(session.user.id!),
    getReadingStreak(session.user.id!),
  ])

  const logged = rows.map(r => ({ ...r.user_books, book: r.books }))
  const read = logged.filter(l => l.status === 'read')
  const reading = logged.filter(l => l.status === 'reading')
  const want = logged.filter(l => l.status === 'want')

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>

          <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
            {session.user.image ? (
              <img src={session.user.image} alt="" style={{
                width: 72, height: 72, borderRadius: '50%',
                border: '3px solid rgba(196,96,58,0.4)',
              }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#C4603A', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff',
              }}>
                {session.user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 32,
                fontWeight: 700, color: '#fff', lineHeight: 1.2,
              }}>
                {session.user.name}
              </h1>
              <div style={{ fontSize: 13, color: '#567', marginTop: 4, display: 'flex', gap: 16 }}>
                <span>{logged.length} {logged.length === 1 ? 'book' : 'books'}</span>
                <span>{followerCount.total} {followerCount.total === 1 ? 'follower' : 'followers'}</span>
                <span>{followingCount.total} following</span>
                {streak.currentStreak > 0 && (
                  <span style={{ color: '#C4603A' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#C4603A" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: -1, marginRight: 3 }}>
                      <path d="M12 23C16.5 23 19 19.5 19 15.5C19 11.5 16 8.5 14.5 7C14 10 12 11.5 10 10C8.5 8.9 8 7 8.5 4C5 7 5 10.5 5 12.5C5 18 8 23 12 23Z" />
                    </svg>
                    {streak.currentStreak}w streak
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={`/user/${session.user.id}`} style={{
                fontSize: 12, color: '#789', textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '6px 14px', fontWeight: 600,
              }}>
                View Public Profile
              </a>
              <a href="/stats" style={{
                fontSize: 12, color: '#C4603A', textDecoration: 'none',
                border: '1px solid rgba(196,96,58,0.3)', borderRadius: 4,
                padding: '6px 14px', fontWeight: 600,
              }}>
                Stats
              </a>
              <a href="/settings" style={{
                fontSize: 12, color: '#789', textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '6px 14px', fontWeight: 600,
              }}>
                Settings
              </a>
            </div>
          </div>

          <ProfileEditor
            initialBio={user?.bio ?? ''}
            initialUsername={user?.username ?? ''}
          />

          <FavoriteBooks favorites={favRows} isOwner={true} />

          <ProfileShelf title="Read" items={read} />
          <ProfileShelf title="Currently Reading" items={reading} />
          <ProfileShelf title="Want to Read" items={want} />

          {logged.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>Your shelf is empty</div>
              <a href="/search" style={{
                color: '#C4603A', textDecoration: 'none', fontSize: 14, fontWeight: 600,
              }}>Search for books to add</a>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
