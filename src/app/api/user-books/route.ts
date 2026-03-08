import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books, notifications, users, favoriteBooks } from '@/lib/schema'
import { eq, and, ne, sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { bookId, status, rating, review, notes, liked, spoiler, pagesRead, readAt, dnfReason, format } = body as Record<string, any>

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }
  if (rating != null && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 })
  }
  if (status && !['read', 'reading', 'want', 'dnf'].includes(status)) {
    return NextResponse.json({ error: 'status must be read, reading, want, or dnf' }, { status: 400 })
  }
  if (dnfReason && dnfReason.length > 500) {
    return NextResponse.json({ error: 'dnfReason must be 500 characters or less' }, { status: 400 })
  }
  if (review && review.length > 50000) {
    return NextResponse.json({ error: 'review must be 50000 characters or less' }, { status: 400 })
  }
  if (notes && notes.length > 50000) {
    return NextResponse.json({ error: 'notes must be 50000 characters or less' }, { status: 400 })
  }
  if (pagesRead != null && (!Number.isInteger(pagesRead) || pagesRead < 0)) {
    return NextResponse.json({ error: 'pagesRead must be a non-negative integer' }, { status: 400 })
  }
  if (readAt != null && (!/^\d{4}-\d{2}-\d{2}$/.test(readAt) || isNaN(Date.parse(readAt)))) {
    return NextResponse.json({ error: 'readAt must be a valid YYYY-MM-DD date' }, { status: 400 })
  }
  if (format != null && !['paperback', 'hardcover', 'ebook', 'audiobook'].includes(format)) {
    return NextResponse.json({ error: 'format must be paperback, hardcover, ebook, or audiobook' }, { status: 400 })
  }

  try {
    const [result] = await db
      .insert(userBooks)
      .values({
        userId: session.user.id,
        bookId,
        status: status ?? 'read',
        rating: rating ?? null,
        review: review ?? null,
        notes: notes ?? null,
        liked: liked ?? false,
        spoiler: spoiler ?? false,
        pagesRead: pagesRead ?? null,
        readAt: readAt ?? null,
        dnfReason: dnfReason ?? null,
        format: format ?? null,
      })
      .onConflictDoUpdate({
        target: [userBooks.userId, userBooks.bookId],
        set: {
          status: status != null ? status : sql`user_books.status`,
          rating: rating !== undefined ? (rating ?? sql`user_books.rating`) : sql`user_books.rating`,
          review: review !== undefined ? (review ?? sql`user_books.review`) : sql`user_books.review`,
          notes: notes !== undefined ? (notes ?? sql`user_books.notes`) : sql`user_books.notes`,
          liked: liked !== undefined ? liked : sql`user_books.liked`,
          spoiler: spoiler !== undefined ? (spoiler ?? false) : sql`user_books.spoiler`,
          pagesRead: pagesRead !== undefined ? (pagesRead ?? sql`user_books.pages_read`) : sql`user_books.pages_read`,
          readAt: readAt !== undefined ? (readAt ?? sql`user_books.read_at`) : sql`user_books.read_at`,
          dnfReason: dnfReason !== undefined ? (dnfReason ?? sql`user_books.dnf_reason`) : sql`user_books.dnf_reason`,
          format: format !== undefined ? (format ?? sql`user_books.format`) : sql`user_books.format`,
          updatedAt: new Date(),
        },
      })
      .returning()

    const isNew = result.createdAt?.getTime() === result.updatedAt?.getTime()
    if (review && isNew) {
      try {
        await insertReviewNotifications(session.user.id, bookId)
      } catch (err) {
        console.error('[notifications] review insert failed:', err)
      }
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '23503') {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }
    console.error('[user-books] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statusFilter = req.nextUrl.searchParams.get('status')
  const conditions = [eq(userBooks.userId, session.user.id)]
  if (statusFilter && ['read', 'reading', 'want', 'dnf'].includes(statusFilter)) {
    conditions.push(eq(userBooks.status, statusFilter))
  }

  const rows = await db
    .select()
    .from(userBooks)
    .where(and(...conditions))
    .innerJoin(books, eq(userBooks.bookId, books.id))

  const result = rows.map(r => ({
    ...r.user_books,
    book: r.books,
  }))

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let bookId: string, pagesRead: number
  try {
    const body = await req.json()
    bookId = body.bookId
    pagesRead = body.pagesRead
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }
  if (!Number.isInteger(pagesRead) || pagesRead < 0) {
    return NextResponse.json({ error: 'pagesRead must be a non-negative integer' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.userId, session.user.id), eq(userBooks.bookId, bookId)))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Book not in library' }, { status: 404 })
  }

  const [updated] = await db
    .update(userBooks)
    .set({ pagesRead, updatedAt: new Date() })
    .where(eq(userBooks.id, existing.id))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let bookId: string
  try {
    const body = await req.json()
    bookId = body.bookId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.userId, session.user.id), eq(userBooks.bookId, bookId)))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Book not in library' }, { status: 404 })
  }

  await db.batch([
    db.delete(favoriteBooks)
      .where(and(eq(favoriteBooks.userId, session.user.id), eq(favoriteBooks.bookId, bookId))),
    db.delete(userBooks)
      .where(eq(userBooks.id, existing.id)),
  ])

  return NextResponse.json({ deleted: true })
}

async function insertReviewNotifications(actorId: string, bookId: string) {
  const [actor] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, actorId))
    .limit(1)

  const [book] = await db
    .select({ title: books.title, googleId: books.googleId })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1)

  if (!book) return

  const readers = await db
    .select({ userId: userBooks.userId })
    .from(userBooks)
    .where(and(
      eq(userBooks.bookId, bookId),
      eq(userBooks.status, 'read'),
      ne(userBooks.userId, actorId),
    ))
    .limit(20)

  if (readers.length === 0) return

  await db.insert(notifications).values(
    readers.map(r => ({
      userId: r.userId,
      type: 'review' as const,
      actorId,
      actorName: actor?.name ?? null,
      actorAvatar: actor?.avatarUrl ?? null,
      bookId,
      bookTitle: book.title,
      bookGoogleId: book.googleId,
    }))
  )
}
