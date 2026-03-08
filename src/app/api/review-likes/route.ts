import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reviewLikes, userBooks, users } from '@/lib/schema'
import { eq, and, inArray, count, or } from 'drizzle-orm'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let reviewId: string
  try {
    const body = await req.json()
    reviewId = body.reviewId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!reviewId) {
    return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
  }
  if (!UUID_RE.test(reviewId)) {
    return NextResponse.json({ error: 'Invalid reviewId' }, { status: 400 })
  }

  const [review] = await db
    .select({ userId: userBooks.userId })
    .from(userBooks)
    .innerJoin(users, eq(userBooks.userId, users.id))
    .where(and(
      eq(userBooks.id, reviewId),
      or(eq(users.privacy, 'public'), eq(userBooks.userId, session.user.id)),
    ))
    .limit(1)

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const [existing] = await db
    .select()
    .from(reviewLikes)
    .where(and(eq(reviewLikes.userId, session.user.id), eq(reviewLikes.reviewId, reviewId)))
    .limit(1)

  try {
    if (existing) {
      await db.delete(reviewLikes).where(eq(reviewLikes.id, existing.id))
    } else {
      await db.insert(reviewLikes).values({
        userId: session.user.id,
        reviewId,
      })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to update like' }, { status: 400 })
  }

  const [{ value }] = await db
    .select({ value: count() })
    .from(reviewLikes)
    .where(eq(reviewLikes.reviewId, reviewId))

  return NextResponse.json({ liked: !existing, count: Number(value) })
}

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams
    .get('ids')
    ?.split(',')
    .map(id => id.trim())
    .filter(id => UUID_RE.test(id))
    .slice(0, 100) ?? []
  if (ids.length === 0) {
    return NextResponse.json({})
  }

  const session = await auth()
  const userId = session?.user?.id

  const counts = await db
    .select({ reviewId: reviewLikes.reviewId, value: count() })
    .from(reviewLikes)
    .where(inArray(reviewLikes.reviewId, ids))
    .groupBy(reviewLikes.reviewId)

  const userLikes = userId
    ? await db
        .select({ reviewId: reviewLikes.reviewId })
        .from(reviewLikes)
        .where(and(eq(reviewLikes.userId, userId), inArray(reviewLikes.reviewId, ids)))
    : []

  const likedSet = new Set(userLikes.map(r => r.reviewId))
  const countMap = Object.fromEntries(counts.map(r => [r.reviewId, Number(r.value)]))

  const result: Record<string, { count: number, liked: boolean }> = {}
  for (const id of ids) {
    result[id] = { count: countMap[id] ?? 0, liked: likedSet.has(id) }
  }

  return NextResponse.json(result)
}
