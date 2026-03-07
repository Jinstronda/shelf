import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { follows, notifications, users } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId: string
  try {
    const body = await req.json()
    userId = body.userId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!userId || userId === session.user.id) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, session.user.id), eq(follows.followingId, userId)))
    .limit(1)

  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id))
    return NextResponse.json({ following: false })
  }

  await db.insert(follows).values({
    followerId: session.user.id,
    followingId: userId,
  })

  try {
    const [actor] = await db
      .select({ name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    await db.insert(notifications).values({
      userId,
      type: 'follow',
      actorId: session.user.id,
      actorName: actor?.name ?? null,
      actorAvatar: actor?.avatarUrl ?? null,
    })
  } catch (err) {
    console.error('[notifications] follow insert failed:', err)
  }

  return NextResponse.json({ following: true }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(follows)
    .where(eq(follows.followerId, session.user.id))

  return NextResponse.json(rows.map(r => r.followingId))
}
