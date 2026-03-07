import { cache } from 'react'
import { getGoogleBook } from '@/lib/google-books'
import { searchOpenLibrary } from '@/lib/open-library'
import { db } from '@/lib/db'
import { books, userBooks, users, reviewLikes, reviewComments } from '@/lib/schema'
import { eq, and, desc, ne, sql, count } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { notFound } from 'next/navigation'
import { BookDetailClient } from '@/components/BookDetailClient'
import { auth } from '@/lib/auth'
import { coverPublicUrl } from '@/lib/covers'
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
    description: book.description?.slice(0, 160) ?? `${book.title} by ${book.authors.join(', ')}`,
    openGraph: {
      title: book.title,
      description: book.description?.slice(0, 160) ?? '',
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
      .leftJoin(users, eq(userBooks.userId, users.id))
      .where(eq(userBooks.bookId, bookId))
      .orderBy(desc(userBooks.updatedAt))

    const withReview = rows.filter(r => r.review)
    const rated = rows.filter(r => r.rating)
    const avg = rated.length > 0
      ? rated.reduce((s, r) => s + r.rating!, 0) / rated.length
      : null

    const distMap = new Map<number, number>()
    for (const r of rated) distMap.set(r.rating!, (distMap.get(r.rating!) ?? 0) + 1)
    const ratingDistribution = Array.from({ length: 10 }, (_, i) => ({
      rating: 10 - i,
      count: distMap.get(10 - i) ?? 0,
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
      coverUrl: r.coverR2Key ? coverPublicUrl(r.coverR2Key) : r.coverUrl,
    }))
  } catch (err) {
    console.error('getAuthorBooks:', err)
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

  const [{ reviews, avgRating, totalLogs, ratingDistribution }, relatedBooks, userLog, authorBooks] = await Promise.all([
    getReviews(bookDbId),
    getRelatedBooks(bookDbId),
    session?.user?.id ? getUserLog(bookDbId, session.user.id) : null,
    primaryAuthor && bookDbId ? getAuthorBooks(primaryAuthor, bookDbId) : [],
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
    />
  )
}
