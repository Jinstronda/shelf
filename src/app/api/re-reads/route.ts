import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reReads, books } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bookId = req.nextUrl.searchParams.get('bookId')
  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }

  const rows = await db
    .select({
      id: reReads.id,
      userId: reReads.userId,
      bookId: reReads.bookId,
      rating: reReads.rating,
      review: reReads.review,
      readAt: reReads.readAt,
      format: reReads.format,
      createdAt: reReads.createdAt,
      bookTitle: books.title,
      bookCoverUrl: books.coverUrl,
    })
    .from(reReads)
    .innerJoin(books, eq(reReads.bookId, books.id))
    .where(and(eq(reReads.userId, session.user.id), eq(reReads.bookId, bookId)))
    .orderBy(desc(reReads.readAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let bookId: string, rating: number | undefined | null, review: string | undefined, readAt: string | undefined | null, format: string | undefined | null
  try {
    const body = await req.json()
    bookId = body.bookId
    rating = body.rating
    review = body.review
    readAt = body.readAt
    format = body.format
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }
  if (rating !== undefined && rating !== null && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 })
  }
  if (review && review.length > 5000) {
    return NextResponse.json({ error: 'review must be 5000 characters or less' }, { status: 400 })
  }
  if (readAt != null && (!/^\d{4}-\d{2}-\d{2}$/.test(readAt) || isNaN(Date.parse(readAt)))) {
    return NextResponse.json({ error: 'readAt must be a valid YYYY-MM-DD date' }, { status: 400 })
  }
  if (format != null && !['paperback', 'hardcover', 'ebook', 'audiobook'].includes(format)) {
    return NextResponse.json({ error: 'format must be paperback, hardcover, ebook, or audiobook' }, { status: 400 })
  }

  try {
    const [created] = await db
      .insert(reReads)
      .values({
        userId: session.user.id,
        bookId,
        rating: rating ?? null,
        review: review?.trim() || null,
        readAt: readAt ?? null,
        format: format ?? null,
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (err?.code === '23503') {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }
    throw err
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let id: string
  try {
    const body = await req.json()
    id = body.id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  await db
    .delete(reReads)
    .where(and(
      eq(reReads.id, id),
      eq(reReads.userId, session.user.id),
    ))

  return NextResponse.json({ ok: true })
}
