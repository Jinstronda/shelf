import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { favoriteBooks, userBooks, follows, readingGoals, lists, users, shelves, reReads, notifications, reviewLikes, reviewComments, bookQuotes, challenges, bookTags } from '@/lib/schema'
import { eq, or } from 'drizzle-orm'

const VALID_PRIVACY = ['public', 'followers', 'private'] as const

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!VALID_PRIVACY.includes(body.privacy as typeof VALID_PRIVACY[number])) {
    return NextResponse.json({ error: 'Invalid privacy value' }, { status: 400 })
  }

  await db.update(users).set({ privacy: body.privacy as string }).where(eq(users.id, session.user.id))
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  await db.delete(reviewLikes).where(eq(reviewLikes.userId, userId))
  await db.delete(reviewComments).where(eq(reviewComments.userId, userId))
  await db.delete(bookQuotes).where(eq(bookQuotes.userId, userId))
  await db.delete(bookTags).where(eq(bookTags.userId, userId))
  await db.delete(reReads).where(eq(reReads.userId, userId))
  await db.delete(notifications).where(eq(notifications.userId, userId))
  await db.delete(challenges).where(eq(challenges.userId, userId))
  await db.delete(shelves).where(eq(shelves.userId, userId))
  await db.delete(favoriteBooks).where(eq(favoriteBooks.userId, userId))
  await db.delete(userBooks).where(eq(userBooks.userId, userId))
  await db.delete(follows).where(
    or(eq(follows.followerId, userId), eq(follows.followingId, userId))
  )
  await db.delete(readingGoals).where(eq(readingGoals.userId, userId))
  await db.delete(lists).where(eq(lists.userId, userId))
  await db.delete(users).where(eq(users.id, userId))

  return NextResponse.json({ ok: true })
}
