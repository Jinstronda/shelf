import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq } from 'drizzle-orm'

function csvField(value: string | null | undefined): string {
  if (!value) return ''
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
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

  const header = 'Title,Authors,ISBN13,Status,Rating,Review,Date Read,Pages,Genres'
  const lines = rows.map(r => {
    const ub = r.user_books
    const b = r.books
    const rating = ub.rating ? (ub.rating / 2).toString() : ''
    return [
      csvField(b.title),
      csvField(b.authors?.join(', ')),
      csvField(b.isbn13),
      csvField(ub.status),
      rating,
      csvField(ub.review),
      csvField(ub.readAt),
      b.pageCount?.toString() ?? '',
      csvField(b.genres?.join(', ')),
    ].join(',')
  })

  const csv = [header, ...lines].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="shelf-export.csv"',
    },
  })
}
