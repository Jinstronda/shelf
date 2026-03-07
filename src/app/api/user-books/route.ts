import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { bookId, status, rating, review, liked } = body

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }
  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 10)) {
    return NextResponse.json({ error: 'rating must be 1-10' }, { status: 400 })
  }
  if (status && !['read', 'reading', 'want'].includes(status)) {
    return NextResponse.json({ error: 'status must be read, reading, or want' }, { status: 400 })
  }

  // Check book exists
  const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1)
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  // Upsert: check if user already logged this book
  const [existing] = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.userId, session.user.id), eq(userBooks.bookId, bookId)))
    .limit(1)

  if (existing) {
    const [updated] = await db
      .update(userBooks)
      .set({
        status: status ?? existing.status,
        rating: rating ?? existing.rating,
        review: review !== undefined ? review : existing.review,
        liked: liked !== undefined ? liked : existing.liked,
        updatedAt: new Date(),
      })
      .where(eq(userBooks.id, existing.id))
      .returning()
    return NextResponse.json(updated)
  }

  const [created] = await db
    .insert(userBooks)
    .values({
      userId: session.user.id,
      bookId,
      status: status ?? 'read',
      rating: rating ?? null,
      review: review ?? null,
      liked: liked ?? false,
    })
    .returning()

  return NextResponse.json(created, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(userBooks)
    .where(eq(userBooks.userId, session.user.id))
    .innerJoin(books, eq(userBooks.bookId, books.id))

  const result = rows.map(r => ({
    ...r.user_books,
    book: r.books,
  }))

  return NextResponse.json(result)
}
