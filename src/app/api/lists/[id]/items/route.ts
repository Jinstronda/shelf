import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lists, listItems, books } from '@/lib/schema'
import { eq, and, max } from 'drizzle-orm'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: listId } = await params
  const { bookId } = await req.json()

  if (!bookId) {
    return NextResponse.json({ error: 'bookId required' }, { status: 400 })
  }

  // Verify list belongs to user
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, session.user.id)))
    .limit(1)

  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }

  // Get next position
  const [maxPos] = await db
    .select({ maxPosition: max(listItems.position) })
    .from(listItems)
    .where(eq(listItems.listId, listId))

  const nextPosition = (maxPos?.maxPosition ?? -1) + 1

  const [item] = await db
    .insert(listItems)
    .values({ listId, bookId, position: nextPosition })
    .returning()

  // Update list timestamp
  await db.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, listId))

  return NextResponse.json(item, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = await params
  const session = await auth()

  const [list] = await db.select().from(lists).where(eq(lists.id, listId)).limit(1)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  if (!list.isPublic && list.userId !== session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const items = await db
    .select()
    .from(listItems)
    .innerJoin(books, eq(listItems.bookId, books.id))
    .where(eq(listItems.listId, listId))
    .orderBy(listItems.position)

  return NextResponse.json(
    items.map(r => ({ ...r.list_items, book: r.books }))
  )
}
