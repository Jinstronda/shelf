import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books, users, follows } from '@/lib/schema'
import { eq, desc, inArray, ne, and } from 'drizzle-orm'
import { resolveCoverUrl } from '@/lib/covers'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams
  const tab = url.get('tab') === 'following' ? 'following' : 'everyone'
  const offset = Math.max(0, parseInt(url.get('offset') ?? '0', 10) || 0)
  const limit = Math.min(50, Math.max(1, parseInt(url.get('limit') ?? '30', 10) || 30))

  let filterUserIds: string[] | undefined

  if (tab === 'following') {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rows = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, session.user.id))
    filterUserIds = rows.map(r => r.followingId)
    if (filterUserIds.length === 0) {
      return NextResponse.json({ entries: [], hasMore: false })
    }
  }

  const conditions = filterUserIds
    ? [inArray(userBooks.userId, filterUserIds)]
    : [ne(users.privacy, 'private')]

  const rows = await db
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
      bookCoverR2Key: books.coverR2Key,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .innerJoin(users, eq(userBooks.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(userBooks.updatedAt))
    .limit(limit + 1)
    .offset(offset)

  const hasMore = rows.length > limit
  const entries = rows.slice(0, limit).map(r => ({
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
      coverUrl: resolveCoverUrl(r.bookCoverR2Key, r.bookCoverUrl),
    },
  }))

  return NextResponse.json({ entries, hasMore })
}
