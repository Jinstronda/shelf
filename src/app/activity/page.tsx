import { db } from '@/lib/db'
import { userBooks, books, users, follows } from '@/lib/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ActivityTabs } from '@/components/ActivityTabs'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Recent Activity — Shelf' }

const PAGE_SIZE = 30

async function fetchEntries(filterUserIds?: string[]) {
  const query = db
    .select({
      id: userBooks.id,
      status: userBooks.status,
      rating: userBooks.rating,
      review: userBooks.review,
      liked: userBooks.liked,
      updatedAt: userBooks.updatedAt,
      userId: userBooks.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
      bookGoogleId: books.googleId,
      bookTitle: books.title,
      bookAuthors: books.authors,
      bookCoverUrl: books.coverUrl,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .leftJoin(users, eq(userBooks.userId, users.id))
    .orderBy(desc(userBooks.updatedAt))
    .limit(PAGE_SIZE + 1)

  const rows = filterUserIds
    ? await query.where(inArray(userBooks.userId, filterUserIds))
    : await query

  const hasMore = rows.length > PAGE_SIZE
  const entries = rows.slice(0, PAGE_SIZE).map(r => ({
    id: r.id,
    status: r.status,
    rating: r.rating,
    review: r.review,
    liked: r.liked,
    updatedAt: r.updatedAt,
    userId: r.userId,
    userName: r.userName,
    userAvatar: r.userAvatar,
    book: {
      googleId: r.bookGoogleId,
      title: r.bookTitle,
      authors: r.bookAuthors,
      coverUrl: r.bookCoverUrl,
    },
  }))

  return { entries, hasMore }
}

export default async function ActivityPage() {
  const session = await auth()
  const isSignedIn = !!session?.user?.id

  let followedIds: string[] = []
  if (isSignedIn) {
    const rows = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, session!.user!.id!))
    followedIds = rows.map(r => r.followingId)
  }

  const [globalResult, followingResult] = await Promise.all([
    fetchEntries(),
    followedIds.length > 0 ? fetchEntries(followedIds) : Promise.resolve({ entries: [], hasMore: false }),
  ])

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 700, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 8,
          }}>
            Recent Activity
          </h1>
          <div style={{ fontSize: 13, color: '#567', marginBottom: 48 }}>
            What readers are logging on Shelf
          </div>

          <ActivityTabs
            globalEntries={globalResult.entries}
            followingEntries={followingResult.entries}
            globalHasMore={globalResult.hasMore}
            followingHasMore={followingResult.hasMore}
            isSignedIn={isSignedIn}
          />
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
