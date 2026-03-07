import { db } from './db'
import { favoriteBooks, books, userBooks } from './schema'
import { eq, asc, and } from 'drizzle-orm'

export async function getFavorites(userId: string) {
  return db
    .select({
      bookId: favoriteBooks.bookId,
      googleId: books.googleId,
      title: books.title,
      coverUrl: books.coverUrl,
    })
    .from(favoriteBooks)
    .innerJoin(books, eq(favoriteBooks.bookId, books.id))
    .where(eq(favoriteBooks.userId, userId))
    .orderBy(asc(favoriteBooks.position))
}

function toDateKey(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((da.getTime() - db.getTime()) / 86400000)
}

function computeStreaks(dateKeys: string[]) {
  const unique = [...new Set(dateKeys)].sort()
  if (unique.length === 0) {
    return { currentStreak: 0, longestStreak: 0, readingDaysThisYear: 0, last30: [] as string[] }
  }

  const today = toDateKey(new Date())
  const yesterday = toDateKey(new Date(Date.now() - 86400000))
  const year = new Date().getFullYear()
  const thirtyAgo = toDateKey(new Date(Date.now() - 29 * 86400000))

  const readingDaysThisYear = unique.filter(d => d.startsWith(String(year))).length
  const last30 = unique.filter(d => d >= thirtyAgo && d <= today)

  let longestStreak = 1
  let run = 1
  for (let i = 1; i < unique.length; i++) {
    if (daysBetween(unique[i], unique[i - 1]) === 1) {
      run++
      longestStreak = Math.max(longestStreak, run)
    } else {
      run = 1
    }
  }

  let currentStreak = 0
  const last = unique[unique.length - 1]
  if (last === today || last === yesterday) {
    currentStreak = 1
    for (let i = unique.length - 2; i >= 0; i--) {
      if (daysBetween(unique[i + 1], unique[i]) === 1) currentStreak++
      else break
    }
  }

  return { currentStreak, longestStreak, readingDaysThisYear, last30 }
}

export async function getReadingStreak(userId: string) {
  const rows = await db
    .select({ readAt: userBooks.readAt })
    .from(userBooks)
    .where(and(
      eq(userBooks.userId, userId),
      eq(userBooks.status, 'read'),
    ))

  const dateKeys = rows
    .filter(r => r.readAt != null)
    .map(r => toDateKey(r.readAt!))

  return computeStreaks(dateKeys)
}
