import { db } from './db'
import { books, userBooks } from './schema'
import { eq, and, gte, ne, inArray, notInArray, desc, count, sql } from 'drizzle-orm'
import { resolveCoverUrl } from './covers'

interface RecommendedBook {
  googleId: string
  title: string
  authors: string[]
  coverUrl: string | null
  score: number
}

export async function getRecommendations(userId: string, limit = 12): Promise<RecommendedBook[]> {
  try {
    // Step 1: books the user rated highly
    const likedBooks = await db
      .select({ bookId: userBooks.bookId })
      .from(userBooks)
      .where(and(eq(userBooks.userId, userId), gte(userBooks.rating, 7)))

    if (likedBooks.length === 0) return []
    const likedBookIds = likedBooks.map(r => r.bookId)

    // Step 2: users with similar taste (overlap >= 2, cap at 50)
    const similarUsers = await db
      .select({
        userId: userBooks.userId,
        overlap: count(userBooks.id),
      })
      .from(userBooks)
      .where(and(
        inArray(userBooks.bookId, likedBookIds),
        ne(userBooks.userId, userId),
        gte(userBooks.rating, 7),
      ))
      .groupBy(userBooks.userId)
      .having(sql`count(${userBooks.id}) >= 2`)
      .orderBy(desc(count(userBooks.id)))
      .limit(50)

    if (similarUsers.length === 0) return []
    const similarUserIds = similarUsers.map(r => r.userId)

    // All books the user has in their library (any status)
    const userLibrary = await db
      .select({ bookId: userBooks.bookId })
      .from(userBooks)
      .where(eq(userBooks.userId, userId))
    const userBookIds = userLibrary.map(r => r.bookId)

    // Step 3: books similar users liked that aren't in user's library
    const rows = await db
      .select({
        bookId: userBooks.bookId,
        googleId: books.googleId,
        title: books.title,
        authors: books.authors,
        coverUrl: books.coverUrl,
        coverR2Key: books.coverR2Key,
        score: count(userBooks.id),
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .where(and(
        inArray(userBooks.userId, similarUserIds),
        gte(userBooks.rating, 7),
        ...(userBookIds.length > 0 ? [notInArray(userBooks.bookId, userBookIds)] : []),
      ))
      .groupBy(userBooks.bookId, books.id)
      .orderBy(desc(count(userBooks.id)))
      .limit(limit)

    return rows
      .filter(r => r.googleId)
      .map(r => ({
        googleId: r.googleId!,
        title: r.title,
        authors: r.authors,
        coverUrl: resolveCoverUrl(r.coverR2Key, r.coverUrl),
        score: Number(r.score),
      }))
  } catch (err) {
    console.error('getRecommendations:', err)
    return []
  }
}
