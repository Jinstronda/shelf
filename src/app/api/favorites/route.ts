import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { favoriteBooks } from '@/lib/schema'
import { eq, and, asc } from 'drizzle-orm'
import { getFavorites } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const rows = await getFavorites(userId)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookId } = await req.json()
  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }

  const existing = await db
    .select()
    .from(favoriteBooks)
    .where(eq(favoriteBooks.userId, session.user.id))
    .orderBy(asc(favoriteBooks.position))

  if (existing.length >= 4) {
    return NextResponse.json({ error: 'Maximum 4 favorites' }, { status: 400 })
  }

  const nextPosition = existing.length > 0
    ? Math.max(...existing.map(f => f.position)) + 1
    : 0

  const [created] = await db
    .insert(favoriteBooks)
    .values({
      userId: session.user.id,
      bookId,
      position: nextPosition,
    })
    .returning()

  return NextResponse.json(created, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookId } = await req.json()
  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }

  await db
    .delete(favoriteBooks)
    .where(and(
      eq(favoriteBooks.userId, session.user.id),
      eq(favoriteBooks.bookId, bookId),
    ))

  return NextResponse.json({ ok: true })
}
