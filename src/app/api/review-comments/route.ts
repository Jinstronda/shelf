import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reviewComments, userBooks, users } from '@/lib/schema'
import { eq, and, or, asc } from 'drizzle-orm'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let reviewId: string, text: string
  try {
    const body = await req.json()
    reviewId = body.reviewId
    text = body.text
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!reviewId) {
    return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
  }
  if (!UUID_RE.test(reviewId)) {
    return NextResponse.json({ error: 'Invalid reviewId' }, { status: 400 })
  }
  if (!text || typeof text !== 'string' || text.trim().length < 1 || text.trim().length > 1000) {
    return NextResponse.json({ error: 'text must be 1-1000 characters' }, { status: 400 })
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

  let comment
  try {
    ;[comment] = await db
      .insert(reviewComments)
      .values({ reviewId, userId: session.user.id, text: text.trim() })
      .returning()
  } catch {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 400 })
  }

  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return NextResponse.json({
    id: comment.id,
    reviewId: comment.reviewId,
    userId: comment.userId,
    text: comment.text,
    userName: user?.name ?? 'Reader',
    userAvatar: user?.avatarUrl ?? null,
    createdAt: comment.createdAt?.toISOString() ?? null,
  })
}

export async function GET(req: NextRequest) {
  const reviewId = req.nextUrl.searchParams.get('reviewId')
  if (!reviewId) {
    return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
  }
  if (!UUID_RE.test(reviewId)) {
    return NextResponse.json({ error: 'Invalid reviewId' }, { status: 400 })
  }

  const rows = await db
    .select({
      id: reviewComments.id,
      reviewId: reviewComments.reviewId,
      userId: reviewComments.userId,
      text: reviewComments.text,
      createdAt: reviewComments.createdAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(reviewComments)
    .leftJoin(users, eq(reviewComments.userId, users.id))
    .where(eq(reviewComments.reviewId, reviewId))
    .orderBy(asc(reviewComments.createdAt))

  return NextResponse.json(rows.map(r => ({
    id: r.id,
    reviewId: r.reviewId,
    userId: r.userId,
    text: r.text,
    userName: r.userName ?? 'Reader',
    userAvatar: r.userAvatar ?? null,
    createdAt: r.createdAt?.toISOString() ?? null,
  })))
}
