import { cache } from 'react'
import { getGoogleBook } from '@/lib/google-books'
import { searchOpenLibrary } from '@/lib/open-library'
import { db } from '@/lib/db'
import { books, userBooks, users, reviewLikes, reviewComments, bookQuotes, bookTags, reReads } from '@/lib/schema'
import { eq, and, desc, ne, sql, count } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { notFound } from 'next/navigation'
import { BookDetailClient } from '@/components/BookDetailClient'
import { auth } from '@/lib/auth'
import { resolveCoverUrl } from '@/lib/covers'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

const fetchBook = cache(async function fetchBook(id: string) {
  // ISBN lookup (from the landing page book cards)
  if (/^\d{10,13}$/.test(id)) {
    const results = await searchOpenLibrary(id, 1)
    if (results.length > 0) return results[0]
  }
  // Open Library key
  if (id.startsWith('ol:')) {
    const results = await searchOpenLibrary(id.replace('ol:', ''), 1)
    if (results.length > 0) return results[0]
  }
  // Google Books ID
  return getGoogleBook(id)
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const book = await fetchBook(id)
  if (!book) return { title: 'Book not found — Shelf' }
  return {
    title: `${book.title} — Shelf`,
    description: book.description?.replace(/<[^>]*>/g, '').slice(0, 160) ?? `${book.title} by ${book.authors.join(', ')}`,
    openGraph: {
      title: book.title,
      description: book.description?.replace(/<[^>]*>/g, '').slice(0, 160) ?? '',
      images: book.coverUrl ? [{ url: book.coverUrl }] : [],
    },
  }
}

async function getReviews(bookId: string | null) {
  try {
    if (!bookId) return { reviews: [], avgRating: null, totalLogs: 0, ratingDistribution: [] }

    const rows = await db
      .select({
        id: userBooks.id,
        rating: userBooks.rating,
        review: userBooks.review,
        liked: userBooks.liked,
        spoiler: userBooks.spoiler,
        userId: userBooks.userId,
        updatedAt: userBooks.updatedAt,
        userName: users.name,
        userAvatar: users.avatarUrl,
        likeCount: sql<number>`(select count(*) from review_likes where review_likes.review_id = ${userBooks.id})`,
        commentCount: sql<number>`(select count(*) from review_comments where review_comments.review_id = ${userBooks.id})`,
      })
      .from(userBooks)
      .innerJoin(users, eq(userBooks.userId, users.id))
      .where(and(eq(userBooks.bookId, bookId), eq(users.privacy, 'public')))
      .orderBy(desc(userBooks.updatedAt))

    const withReview = rows.filter(r => r.review)
    const rated = rows.filter(r => r.rating)
    const avg = rated.length > 0
      ? rated.reduce((s, r) => s + r.rating!, 0) / rated.length
      : null

    const distMap = new Map<number, number>()
    for (const r of rated) distMap.set(r.rating!, (distMap.get(r.rating!) ?? 0) + 1)
    const ratingDistribution = Array.from({ length: 5 }, (_, i) => ({
      rating: 5 - i,
      count: distMap.get(5 - i) ?? 0,
    }))

    return {
      reviews: withReview.map(r => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName ?? 'Reader',
        userAvatar: r.userAvatar,
        rating: r.rating,
        review: r.review!,
        liked: r.liked,
        spoiler: r.spoiler,
        likeCount: Number(r.likeCount),
        commentCount: Number(r.commentCount),
        date: r.updatedAt?.toISOString() ?? null,
      })),
      avgRating: avg ? parseFloat(avg.toFixed(1)) : null,
      totalLogs: rows.length,
      ratingDistribution,
    }
  } catch (err) {
    console.error('getReviews:', err)
    return { reviews: [], avgRating: null, totalLogs: 0, ratingDistribution: [] }
  }
}

async function getRelatedBooks(bookId: string | null) {
  try {
    if (!bookId) return []

    const ub1 = alias(userBooks, 'ub1')
    const ub2 = alias(userBooks, 'ub2')

    const rows = await db
      .select({
        googleId: books.googleId,
        title: books.title,
        authors: books.authors,
        coverUrl: books.coverUrl,
        logCount: count(ub2.id),
      })
      .from(ub1)
      .innerJoin(ub2, and(eq(ub1.userId, ub2.userId), ne(ub2.bookId, ub1.bookId)))
      .innerJoin(books, eq(ub2.bookId, books.id))
      .where(and(eq(ub1.bookId, bookId), eq(ub2.status, 'read')))
      .groupBy(books.id)
      .orderBy(sql`count(${ub2.id}) desc`)
      .limit(6)

    return rows.map(r => ({
      googleId: r.googleId!,
      title: r.title,
      authors: r.authors,
      coverUrl: r.coverUrl,
      logCount: Number(r.logCount),
    }))
  } catch (err) {
    console.error('getRelatedBooks:', err)
    return []
  }
}

async function getUserLog(bookId: string | null, userId: string) {
  try {
    if (!bookId) return null

    const [row] = await db
      .select({
        status: userBooks.status,
        rating: userBooks.rating,
        review: userBooks.review,
        notes: userBooks.notes,
        liked: userBooks.liked,
        spoiler: userBooks.spoiler,
        readAt: userBooks.readAt,
        dnfReason: userBooks.dnfReason,
        format: userBooks.format,
      })
      .from(userBooks)
      .where(and(eq(userBooks.bookId, bookId), eq(userBooks.userId, userId)))
      .limit(1)

    return row ?? null
  } catch (err) {
    console.error('getUserLog:', err)
    return null
  }
}

async function getAuthorBooks(authorName: string, excludeDbId: string) {
  try {
    const rows = await db
      .select({
        googleId: books.googleId,
        title: books.title,
        coverUrl: books.coverUrl,
        coverR2Key: books.coverR2Key,
        logCount: count(userBooks.id),
      })
      .from(books)
      .leftJoin(userBooks, eq(userBooks.bookId, books.id))
      .where(and(
        sql`${books.authors} @> ARRAY[${authorName}]::text[]`,
        ne(books.id, excludeDbId),
      ))
      .groupBy(books.id)
      .orderBy(sql`count(${userBooks.id}) desc`)
      .limit(8)

    return rows.map(r => ({
      googleId: r.googleId!,
      title: r.title,
      coverUrl: resolveCoverUrl(r.coverR2Key, r.coverUrl),
    }))
  } catch (err) {
    console.error('getAuthorBooks:', err)
    return []
  }
}

async function getCommunityStats(bookId: string | null) {
  try {
    if (!bookId) return { readCount: 0, readingCount: 0, wantCount: 0, reviewCount: 0, likedCount: 0 }

    const statusRows = await db
      .select({
        status: userBooks.status,
        cnt: sql<number>`count(*)`,
      })
      .from(userBooks)
      .innerJoin(users, eq(userBooks.userId, users.id))
      .where(and(eq(userBooks.bookId, bookId), eq(users.privacy, 'public')))
      .groupBy(userBooks.status)

    const statusMap = Object.fromEntries(statusRows.map(r => [r.status, Number(r.cnt)]))

    const [[reviewRow], [likedRow]] = await Promise.all([
      db
        .select({ cnt: sql<number>`count(*)` })
        .from(userBooks)
        .innerJoin(users, eq(userBooks.userId, users.id))
        .where(and(eq(userBooks.bookId, bookId), sql`${userBooks.review} IS NOT NULL`, eq(users.privacy, 'public'))),
      db
        .select({ cnt: sql<number>`count(*)` })
        .from(userBooks)
        .innerJoin(users, eq(userBooks.userId, users.id))
        .where(and(eq(userBooks.bookId, bookId), eq(userBooks.liked, true), eq(users.privacy, 'public'))),
    ])

    return {
      readCount: statusMap['read'] ?? 0,
      readingCount: statusMap['reading'] ?? 0,
      wantCount: statusMap['want'] ?? 0,
      reviewCount: Number(reviewRow?.cnt ?? 0),
      likedCount: Number(likedRow?.cnt ?? 0),
    }
  } catch (err) {
    console.error('getCommunityStats:', err)
    return { readCount: 0, readingCount: 0, wantCount: 0, reviewCount: 0, likedCount: 0 }
  }
}

async function getCommunityReviews(bookId: string | null, excludeUserId: string | null) {
  try {
    if (!bookId) return { communityReviews: [], totalReviewCount: 0 }

    const conditions = [
      eq(userBooks.bookId, bookId),
      sql`${userBooks.review} IS NOT NULL`,
      eq(users.privacy, 'public'),
    ]
    if (excludeUserId) conditions.push(ne(userBooks.userId, excludeUserId))

    const [rows, [countRow]] = await Promise.all([
      db
        .select({
          id: userBooks.id,
          rating: userBooks.rating,
          review: userBooks.review,
          spoiler: userBooks.spoiler,
          userId: userBooks.userId,
          updatedAt: userBooks.updatedAt,
          userName: users.name,
          userAvatar: users.avatarUrl,
        })
        .from(userBooks)
        .innerJoin(users, eq(userBooks.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(userBooks.updatedAt))
        .limit(5),
      db
        .select({ cnt: sql<number>`count(*)` })
        .from(userBooks)
        .innerJoin(users, eq(userBooks.userId, users.id))
        .where(and(...conditions)),
    ])

    return {
      communityReviews: rows.map(r => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName ?? 'Reader',
        userAvatar: r.userAvatar,
        rating: r.rating,
        review: r.review!,
        spoiler: r.spoiler,
        date: r.updatedAt?.toISOString() ?? null,
      })),
      totalReviewCount: Number(countRow?.cnt ?? 0),
    }
  } catch (err) {
    console.error('getCommunityReviews:', err)
    return { communityReviews: [], totalReviewCount: 0 }
  }
}

async function getUserQuotes(bookId: string | null, userId: string) {
  try {
    if (!bookId) return []
    return await db
      .select()
      .from(bookQuotes)
      .where(and(eq(bookQuotes.bookId, bookId), eq(bookQuotes.userId, userId)))
      .orderBy(desc(bookQuotes.createdAt))
  } catch (err) {
    console.error('getUserQuotes:', err)
    return []
  }
}

async function getUserTags(bookId: string | null, userId: string) {
  try {
    if (!bookId) return []
    const rows = await db
      .select({ tag: bookTags.tag })
      .from(bookTags)
      .where(and(eq(bookTags.bookId, bookId), eq(bookTags.userId, userId)))
      .orderBy(bookTags.tag)
    return rows.map(r => r.tag)
  } catch (err) {
    console.error('getUserTags:', err)
    return []
  }
}

async function getUserReReads(bookId: string | null, userId: string) {
  try {
    if (!bookId) return []
    return await db
      .select()
      .from(reReads)
      .where(and(eq(reReads.bookId, bookId), eq(reReads.userId, userId)))
      .orderBy(desc(reReads.readAt))
  } catch (err) {
    console.error('getUserReReads:', err)
    return []
  }
}

export default async function BookPage({ params }: Props) {
  const { id } = await params
  const [book, session] = await Promise.all([fetchBook(id), auth()])
  if (!book) notFound()

  const [dbBook] = await db
    .select({ id: books.id })
    .from(books)
    .where(eq(books.googleId, book.googleId))
    .limit(1)
  const bookDbId = dbBook?.id ?? null

  const primaryAuthor = book.authors[0] ?? null

  const [{ reviews, avgRating, totalLogs, ratingDistribution }, relatedBooks, userLog, authorBooks, userQuotes, userTags, communityStats, { communityReviews, totalReviewCount }, userReReads] = await Promise.all([
    getReviews(bookDbId),
    getRelatedBooks(bookDbId),
    session?.user?.id ? getUserLog(bookDbId, session.user.id) : null,
    primaryAuthor && bookDbId ? getAuthorBooks(primaryAuthor, bookDbId) : [],
    session?.user?.id ? getUserQuotes(bookDbId, session.user.id) : [],
    session?.user?.id ? getUserTags(bookDbId, session.user.id) : [],
    getCommunityStats(bookDbId),
    getCommunityReviews(bookDbId, session?.user?.id ?? null),
    session?.user?.id ? getUserReReads(bookDbId, session.user.id) : [],
  ])
  return (
    <BookDetailClient
      book={book}
      bookDbId={bookDbId}
      reviews={reviews}
      avgRating={avgRating}
      totalLogs={totalLogs}
      ratingDistribution={ratingDistribution}
      relatedBooks={relatedBooks}
      authorBooks={authorBooks}
      userLog={userLog}
      userQuotes={userQuotes}
      userTags={userTags}
      communityStats={communityStats}
      communityReviews={communityReviews}
      totalCommunityReviewCount={totalReviewCount}
      userReReads={userReReads}
    />
  )
}
