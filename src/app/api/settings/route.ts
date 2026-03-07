import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { favoriteBooks, userBooks, follows, readingGoals, lists, users } from '@/lib/schema'
import { eq, or } from 'drizzle-orm'

const VALID_PRIVACY = ['public', 'followers', 'private'] as const

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  if (!VALID_PRIVACY.includes(body.privacy)) {
    return NextResponse.json({ error: 'Invalid privacy value' }, { status: 400 })
  }

  await db.update(users).set({ privacy: body.privacy }).where(eq(users.id, session.user.id))
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

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
