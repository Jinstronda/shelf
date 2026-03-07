import { db } from './db'
import { favoriteBooks, books, userBooks } from './schema'
import { eq, asc, and, gte } from 'drizzle-orm'

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

function getISOWeekKey(d: Date): string {
  const date = new Date(d.getTime())
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-${String(week).padStart(2, '0')}`
}

function weekKeyToDate(key: string): Date {
  const [year, week] = key.split('-').map(Number)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  const monday = new Date(jan4.getTime() + (1 - dayOfWeek) * 86400000)
  return new Date(monday.getTime() + (week - 1) * 7 * 86400000)
}

function countStreaks(weekKeys: string[]) {
  if (weekKeys.length === 0) return { currentStreak: 0, longestStreak: 0 }

  const now = new Date()
  const currentWeek = getISOWeekKey(now)
  const unique = [...new Set(weekKeys)].sort().reverse()

  let longestStreak = 0
  let run = 1

  for (let i = 1; i < unique.length; i++) {
    const prev = weekKeyToDate(unique[i - 1])
    const curr = weekKeyToDate(unique[i])
    const diffWeeks = Math.round((prev.getTime() - curr.getTime()) / (7 * 86400000))
    if (diffWeeks === 1) {
      run++
    } else {
      longestStreak = Math.max(longestStreak, run)
      run = 1
    }
  }
  longestStreak = Math.max(longestStreak, run)

  let currentStreak = 0
  const lastWeek = getISOWeekKey(new Date(Date.now() - 7 * 86400000))
  if (unique[0] === currentWeek || unique[0] === lastWeek) {
    currentStreak = 1
    for (let i = 1; i < unique.length; i++) {
      const prev = weekKeyToDate(unique[i - 1])
      const curr = weekKeyToDate(unique[i])
      const diffWeeks = Math.round((prev.getTime() - curr.getTime()) / (7 * 86400000))
      if (diffWeeks === 1) currentStreak++
      else break
    }
  }

  return { currentStreak, longestStreak }
}

export async function getReadingStreak(userId: string) {
  const twoYearsAgo = new Date(Date.now() - 2 * 365 * 86400000)
  const rows = await db
    .select({ updatedAt: userBooks.updatedAt })
    .from(userBooks)
    .where(and(eq(userBooks.userId, userId), gte(userBooks.updatedAt, twoYearsAgo)))

  const weekKeys = rows
    .filter(r => r.updatedAt != null)
    .map(r => getISOWeekKey(r.updatedAt!))

  return countStreaks(weekKeys)
}
