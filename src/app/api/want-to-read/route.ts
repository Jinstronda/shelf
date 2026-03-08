import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { books, userBooks } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getGoogleBook } from '@/lib/google-books'
import { cacheCoverToR2 } from '@/lib/covers'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let googleId: string
  try {
    const body = await req.json()
    googleId = body.googleId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!googleId || typeof googleId !== 'string') {
    return NextResponse.json({ error: 'googleId required' }, { status: 400 })
  }

  let [existing] = await db
    .select()
    .from(books)
    .where(eq(books.googleId, googleId))
    .limit(1)

  if (!existing) {
    const book = await getGoogleBook(googleId)
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const [inserted] = await db
      .insert(books)
      .values({
        googleId:    book.googleId,
        isbn13:      book.isbn13,
        isbn10:      book.isbn10,
        title:       book.title,
        authors:     book.authors,
        description: book.description,
        publisher:   book.publisher,
        published:   book.published,
        pageCount:   book.pageCount,
        genres:      book.genres,
        language:    book.language,
        coverUrl:    book.coverUrl,
        coverSource: book.coverUrl ? 'google' : null,
      })
      .onConflictDoNothing({ target: books.googleId })
      .returning()

    if (inserted) {
      existing = inserted
      if (book.coverUrl) {
        cacheCoverToR2(book.coverUrl, inserted.id).then(r2Key => {
          if (r2Key) {
            db.update(books)
              .set({ coverR2Key: r2Key })
              .where(eq(books.id, inserted.id))
              .execute()
              .catch(console.error)
          }
        })
      }
    } else {
      [existing] = await db
        .select()
        .from(books)
        .where(eq(books.googleId, googleId))
        .limit(1)
    }
  }

  const [alreadyLogged] = await db
    .select({ status: userBooks.status })
    .from(userBooks)
    .where(and(eq(userBooks.userId, session.user.id), eq(userBooks.bookId, existing.id)))
    .limit(1)

  if (alreadyLogged) {
    return NextResponse.json({ status: alreadyLogged.status, alreadyExists: true })
  }

  const [result] = await db
    .insert(userBooks)
    .values({
      userId: session.user.id,
      bookId: existing.id,
      status: 'want',
    })
    .onConflictDoNothing({ target: [userBooks.userId, userBooks.bookId] })
    .returning()

  return NextResponse.json(result ?? { status: 'want', alreadyExists: true })
}
