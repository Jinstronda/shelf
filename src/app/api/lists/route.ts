import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lists, listItems, books } from '@/lib/schema'
import { eq, desc, count } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, isPublic } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const [list] = await db
    .insert(lists)
    .values({
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      isPublic: isPublic ?? true,
    })
    .returning()

  return NextResponse.json(list, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userLists = await db
    .select()
    .from(lists)
    .where(eq(lists.userId, session.user.id))
    .orderBy(desc(lists.updatedAt))

  // Get item counts + first 4 covers per list
  const result = await Promise.all(
    userLists.map(async list => {
      const items = await db
        .select({ bookId: listItems.bookId, coverUrl: books.coverUrl, title: books.title })
        .from(listItems)
        .innerJoin(books, eq(listItems.bookId, books.id))
        .where(eq(listItems.listId, list.id))
        .orderBy(listItems.position)
        .limit(4)

      const [countRow] = await db
        .select({ total: count() })
        .from(listItems)
        .where(eq(listItems.listId, list.id))

      return { ...list, itemCount: countRow?.total ?? 0, previews: items }
    })
  )

  return NextResponse.json(result)
}
