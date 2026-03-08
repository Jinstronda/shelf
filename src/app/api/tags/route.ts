import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookTags } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bookId = req.nextUrl.searchParams.get('bookId')

  if (bookId) {
    const rows = await db
      .select({ tag: bookTags.tag })
      .from(bookTags)
      .where(and(eq(bookTags.userId, session.user.id), eq(bookTags.bookId, bookId)))
      .orderBy(bookTags.tag)

    return NextResponse.json(rows.map(r => r.tag))
  }

  const rows = await db
    .select({
      tag: bookTags.tag,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(bookTags)
    .where(eq(bookTags.userId, session.user.id))
    .groupBy(bookTags.tag)
    .orderBy(bookTags.tag)

  return NextResponse.json(rows.map(r => ({ tag: r.tag, count: Number(r.count) })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let bookId: string, tag: string
  try {
    const body = await req.json()
    bookId = body.bookId
    tag = body.tag
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }

  const cleaned = typeof tag === 'string' ? tag.trim().toLowerCase() : ''
  if (!cleaned || cleaned.length > 50) {
    return NextResponse.json({ error: 'tag must be 1-50 characters' }, { status: 400 })
  }

  await db
    .insert(bookTags)
    .values({ userId: session.user.id, bookId, tag: cleaned })
    .onConflictDoNothing({ target: [bookTags.userId, bookTags.bookId, bookTags.tag] })

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let bookId: string, tag: string
  try {
    const body = await req.json()
    bookId = body.bookId
    tag = body.tag
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!bookId || !tag) {
    return NextResponse.json({ error: 'bookId and tag required' }, { status: 400 })
  }

  await db
    .delete(bookTags)
    .where(and(
      eq(bookTags.userId, session.user.id),
      eq(bookTags.bookId, bookId),
      eq(bookTags.tag, tag),
    ))

  return NextResponse.json({ ok: true })
}
