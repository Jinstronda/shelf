import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelves, shelfItems, books } from '@/lib/schema'
import { eq, and, max } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: shelfId } = await params
  const session = await auth()

  const [shelf] = await db.select().from(shelves).where(eq(shelves.id, shelfId)).limit(1)
  if (!shelf) {
    return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
  }
  if (!shelf.isPublic && shelf.userId !== session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const items = await db
    .select()
    .from(shelfItems)
    .innerJoin(books, eq(shelfItems.bookId, books.id))
    .where(eq(shelfItems.shelfId, shelfId))
    .orderBy(shelfItems.position)

  return NextResponse.json(
    items.map(r => ({ ...r.shelf_items, book: r.books }))
  )
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: shelfId } = await params
  const { bookId } = await req.json()

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }

  const [shelf] = await db
    .select()
    .from(shelves)
    .where(and(eq(shelves.id, shelfId), eq(shelves.userId, session.user.id)))
    .limit(1)

  if (!shelf) {
    return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
  }

  const [maxPos] = await db
    .select({ maxPosition: max(shelfItems.position) })
    .from(shelfItems)
    .where(eq(shelfItems.shelfId, shelfId))

  const nextPosition = (maxPos?.maxPosition ?? -1) + 1

  const [item] = await db
    .insert(shelfItems)
    .values({ shelfId, bookId, position: nextPosition })
    .onConflictDoNothing()
    .returning()

  if (!item) {
    return NextResponse.json({ error: 'Book already in shelf' }, { status: 409 })
  }

  await db.update(shelves).set({ updatedAt: new Date() }).where(eq(shelves.id, shelfId))

  return NextResponse.json(item, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: shelfId } = await params
  const { positions } = await req.json() as {
    positions: { itemId: string, position: number }[]
  }

  if (!Array.isArray(positions) || positions.length === 0) {
    return NextResponse.json({ error: 'positions array required' }, { status: 400 })
  }

  const [shelf] = await db
    .select()
    .from(shelves)
    .where(and(eq(shelves.id, shelfId), eq(shelves.userId, session.user.id)))
    .limit(1)

  if (!shelf) {
    return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
  }

  for (const { itemId, position } of positions) {
    await db
      .update(shelfItems)
      .set({ position })
      .where(and(eq(shelfItems.id, itemId), eq(shelfItems.shelfId, shelfId)))
  }

  await db.update(shelves).set({ updatedAt: new Date() }).where(eq(shelves.id, shelfId))

  return NextResponse.json({ updated: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: shelfId } = await params
  const { bookId } = await req.json()

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }

  const [shelf] = await db
    .select()
    .from(shelves)
    .where(and(eq(shelves.id, shelfId), eq(shelves.userId, session.user.id)))
    .limit(1)

  if (!shelf) {
    return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
  }

  await db
    .delete(shelfItems)
    .where(and(eq(shelfItems.shelfId, shelfId), eq(shelfItems.bookId, bookId)))

  return NextResponse.json({ deleted: true })
}
