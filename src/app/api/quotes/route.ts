import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookQuotes, books } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bookId = req.nextUrl.searchParams.get('bookId')

  if (bookId) {
    const rows = await db
      .select()
      .from(bookQuotes)
      .where(and(eq(bookQuotes.userId, session.user.id), eq(bookQuotes.bookId, bookId)))
      .orderBy(desc(bookQuotes.createdAt))

    return NextResponse.json(rows)
  }

  const rows = await db
    .select({
      id: bookQuotes.id,
      userId: bookQuotes.userId,
      bookId: bookQuotes.bookId,
      quote: bookQuotes.quote,
      pageNumber: bookQuotes.pageNumber,
      chapter: bookQuotes.chapter,
      createdAt: bookQuotes.createdAt,
      bookTitle: books.title,
      bookGoogleId: books.googleId,
      bookCoverUrl: books.coverUrl,
      bookCoverR2Key: books.coverR2Key,
    })
    .from(bookQuotes)
    .innerJoin(books, eq(bookQuotes.bookId, books.id))
    .where(eq(bookQuotes.userId, session.user.id))
    .orderBy(desc(bookQuotes.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let bookId: string, quote: string, pageNumber: string | undefined, chapter: string | undefined
  try {
    const body = await req.json()
    bookId = body.bookId
    quote = body.quote
    pageNumber = body.pageNumber
    chapter = body.chapter
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }
  if (!quote || typeof quote !== 'string' || quote.trim().length < 1 || quote.trim().length > 2000) {
    return NextResponse.json({ error: 'quote must be 1-2000 characters' }, { status: 400 })
  }

  const [created] = await db
    .insert(bookQuotes)
    .values({
      userId: session.user.id,
      bookId,
      quote: quote.trim(),
      pageNumber: pageNumber ? parseInt(pageNumber, 10) || null : null,
      chapter: chapter?.trim() || null,
    })
    .returning()

  return NextResponse.json(created, { status: 201 })
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
    .delete(bookQuotes)
    .where(and(
      eq(bookQuotes.id, id),
      eq(bookQuotes.userId, session.user.id),
    ))

  return NextResponse.json({ ok: true })
}
