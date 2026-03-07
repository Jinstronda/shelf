import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { books } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { resolveCoverUrl } from '@/lib/covers'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1)
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...book,
    coverUrl: resolveCoverUrl(book.coverR2Key, book.coverUrl),
  })
}
