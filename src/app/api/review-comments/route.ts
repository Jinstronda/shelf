import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reviewComments, users } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reviewId, text } = await req.json()
  if (!reviewId) {
    return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
  }
  if (!text || typeof text !== 'string' || text.trim().length < 1 || text.trim().length > 1000) {
    return NextResponse.json({ error: 'text must be 1-1000 characters' }, { status: 400 })
  }

  const [comment] = await db
    .insert(reviewComments)
    .values({ reviewId, userId: session.user.id, text: text.trim() })
    .returning()

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
