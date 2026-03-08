import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { books } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getGoogleBook } from '@/lib/google-books'
import { searchOpenLibrary } from '@/lib/open-library'
import { cacheCoverToR2, resolveCoverUrl } from '@/lib/covers'
import { resolveCover } from '@/lib/cover-resolver'

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

  if (!googleId) {
    return NextResponse.json({ error: 'googleId required' }, { status: 400 })
  }

  // Fetch from source
  const book = googleId.startsWith('ol:')
    ? (await searchOpenLibrary(googleId.replace('ol:', ''), 1))[0] ?? null
    : await getGoogleBook(googleId)

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
      coverUrl:    book.coverUrl ?? await resolveCover({ isbn13: book.isbn13, isbn10: book.isbn10, title: book.title }),
      coverSource: book.coverUrl ? (googleId.startsWith('ol:') ? 'openlibrary' : 'google') : 'fallback',
    })
    .onConflictDoNothing({ target: books.googleId })
    .returning()

  if (!inserted) {
    const [existing] = await db
      .select()
      .from(books)
      .where(eq(books.googleId, googleId))
      .limit(1)
    return NextResponse.json({
      ...existing,
      coverUrl: resolveCoverUrl(existing.coverR2Key, existing.coverUrl),
    })
  }

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
    coverUrl: book.coverUrl,
  }, { status: 201 })
}
