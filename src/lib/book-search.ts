import { db } from './db'
import { books } from './schema'
import { or, ilike, sql } from 'drizzle-orm'
import { searchGoogleBooks } from './google-books'
import { searchOpenLibrary } from './open-library'
import type { BookResult } from './google-books'

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''

function dbBookToResult(book: typeof books.$inferSelect): BookResult {
  return {
    googleId:    book.googleId ?? `db:${book.id}`,
    title:       book.title,
    authors:     book.authors ?? [],
    description: book.description,
    isbn13:      book.isbn13,
    isbn10:      book.isbn10,
    coverUrl:    book.coverR2Key
      ? `${R2_PUBLIC_URL}/${book.coverR2Key}`
      : book.coverUrl ?? null,
    publisher:   book.publisher,
    published:   book.published,
    pageCount:   book.pageCount,
    genres:      book.genres ?? [],
    language:    book.language ?? 'en',
  }
}

export async function searchBooks(query: string): Promise<BookResult[]> {
  // 1. Check our DB cache first (full-text search on title)
  try {
    const cached = await db
      .select()
      .from(books)
      .where(
        or(
          ilike(books.title, `%${query}%`),
          sql`${books.authors}::text ilike ${'%' + query + '%'}`,
        )
      )
      .limit(12)

    if (cached.length >= 4) return cached.map(dbBookToResult)
  } catch {
    // DB not configured yet — fall through to APIs
  }

  // 2. Google Books (primary)
  const googleResults = await searchGoogleBooks(query)
  if (googleResults.length > 0) return googleResults

  // 3. Open Library fallback
  return searchOpenLibrary(query)
}
