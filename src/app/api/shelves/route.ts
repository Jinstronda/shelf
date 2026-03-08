import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelves, shelfItems, books } from '@/lib/schema'
import { eq, desc, count } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userShelves = await db
    .select()
    .from(shelves)
    .where(eq(shelves.userId, session.user.id))
    .orderBy(desc(shelves.createdAt))

  const result = await Promise.all(
    userShelves.map(async shelf => {
      const items = await db
        .select({ coverUrl: books.coverUrl })
        .from(shelfItems)
        .innerJoin(books, eq(shelfItems.bookId, books.id))
        .where(eq(shelfItems.shelfId, shelf.id))
        .limit(4)

      const [countRow] = await db
        .select({ total: count() })
        .from(shelfItems)
        .where(eq(shelfItems.shelfId, shelf.id))

      return { ...shelf, itemCount: countRow?.total ?? 0, covers: items.map(i => i.coverUrl) }
    })
  )

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, isPublic } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }
  if (name.trim().length > 200) {
    return NextResponse.json({ error: 'name must be 200 characters or less' }, { status: 400 })
  }
  if (description && description.trim().length > 1000) {
    return NextResponse.json({ error: 'description must be 1000 characters or less' }, { status: 400 })
  }

  const [shelf] = await db
    .insert(shelves)
    .values({
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      isPublic: isPublic ?? true,
    })
    .returning()

  return NextResponse.json(shelf, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const [shelf] = await db
    .select()
    .from(shelves)
    .where(eq(shelves.id, id))
    .limit(1)

  if (!shelf || shelf.userId !== session.user.id) {
    return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
  }

  await db.delete(shelves).where(eq(shelves.id, id))

  return NextResponse.json({ deleted: true })
}
