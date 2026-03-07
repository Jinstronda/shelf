import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { books } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getGoogleBook } from '@/lib/google-books'
import { searchOpenLibrary } from '@/lib/open-library'
import { cacheCoverToR2, coverPublicUrl } from '@/lib/covers'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { googleId } = body

  if (!googleId) {
    return NextResponse.json({ error: 'googleId required' }, { status: 400 })
  }

  // Already in DB?
  const existing = await db
    .select()
    .from(books)
    .where(eq(books.googleId, googleId))
    .limit(1)

  if (existing.length > 0) {
    const b = existing[0]
    return NextResponse.json({
      ...b,
      coverUrl: b.coverR2Key ? coverPublicUrl(b.coverR2Key) : b.coverUrl,
    })
  }

  // Fetch from source
  let book = googleId.startsWith('ol:')
    ? (await searchOpenLibrary(googleId.replace('ol:', ''), 1))[0] ?? null
    : await getGoogleBook(googleId)

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  // Insert into DB
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
      coverSource: book.coverUrl ? (googleId.startsWith('ol:') ? 'openlibrary' : 'google') : null,
    })
    .returning()

  // Cache cover to R2 async (don't block response)
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

  return NextResponse.json({
    ...inserted,
    coverUrl: book.coverUrl, // return original URL immediately (R2 caches async)
  }, { status: 201 })
}
