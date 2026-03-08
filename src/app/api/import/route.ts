import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { books, userBooks } from '@/lib/schema'
import { eq, and, or } from 'drizzle-orm'
import { searchGoogleBooks } from '@/lib/google-books'
import type { BookResult } from '@/lib/google-books'
import { cacheCoverToR2 } from '@/lib/covers'
import { resolveCover } from '@/lib/cover-resolver'

export const maxDuration = 300

const MAX_BOOKS = 500
const BATCH_SIZE = 10

const SHELF_MAP: Record<string, string> = {
  'read': 'read',
  'currently-reading': 'reading',
  'to-read': 'want',
}

function cleanIsbn(raw: string): string {
  return raw.replace(/^="/, '').replace(/"$/, '').replace(/[\s-]/g, '')
}

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field)
        field = ''
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        current.push(field)
        field = ''
        if (current.length > 1 || current[0] !== '') rows.push(current)
        current = []
        if (ch === '\r') i++
      } else {
        field += ch
      }
    }
  }
  if (field || current.length > 0) {
    current.push(field)
    rows.push(current)
  }

  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.trim())
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (row[i] ?? '').trim() })
    return obj
  })
}

async function findBookByIsbn(isbn13: string, isbn10: string): Promise<string | null> {
  const conditions = []
  if (isbn13) conditions.push(eq(books.isbn13, isbn13))
  if (isbn10) conditions.push(eq(books.isbn10, isbn10))
  if (conditions.length === 0) return null

  const [existing] = await db
    .select({ id: books.id })
    .from(books)
    .where(conditions.length === 1 ? conditions[0] : or(...conditions))
    .limit(1)
  return existing?.id ?? null
}

async function findBook(isbn13: string, isbn10: string, title: string, author: string): Promise<BookResult | null> {
  if (isbn13) {
    const results = await searchGoogleBooks(`isbn:${isbn13}`, 1)
    if (results.length > 0) return results[0]
  }
  if (isbn10) {
    const results = await searchGoogleBooks(`isbn:${isbn10}`, 1)
    if (results.length > 0) return results[0]
  }
  if (title) {
    const query = author
      ? `intitle:${title}+inauthor:${author}`
      : `intitle:${title}`
    const results = await searchGoogleBooks(query, 1)
    if (results.length > 0) return results[0]
  }
  return null
}

async function ensureBookInDb(result: BookResult): Promise<string> {
  if (result.googleId) {
    const [existing] = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.googleId, result.googleId))
      .limit(1)
    if (existing) return existing.id
  }

  const [inserted] = await db
    .insert(books)
    .values({
      googleId:    result.googleId,
      isbn13:      result.isbn13,
      isbn10:      result.isbn10,
      title:       result.title,
      authors:     result.authors,
      description: result.description,
      publisher:   result.publisher,
      published:   result.published,
      pageCount:   result.pageCount,
      genres:      result.genres,
      language:    result.language,
      coverUrl:    result.coverUrl ?? await resolveCover({ isbn13: result.isbn13, isbn10: result.isbn10, title: result.title, authors: result.authors }),
      coverSource: result.coverUrl ? 'google' : 'fallback',
    })
    .onConflictDoNothing({ target: books.googleId })
    .returning()

  if (inserted) {
    if (result.coverUrl) {
      cacheCoverToR2(result.coverUrl, inserted.id).then(r2Key => {
        if (r2Key) {
          db.update(books)
            .set({ coverR2Key: r2Key })
            .where(eq(books.id, inserted.id))
            .execute()
            .catch(console.error)
        }
      })
    }
    return inserted.id
  }

  const [fallback] = await db
    .select({ id: books.id })
    .from(books)
    .where(eq(books.googleId, result.googleId))
    .limit(1)
  return fallback!.id
}

interface ParsedRow {
  title: string
  author: string
  isbn13: string
  isbn10: string
  rating: number | null
  status: string
  review: string | null
  readAt: string | null
}

function parseRow(row: Record<string, string>): ParsedRow | null {
  const title = row['Title'] ?? ''
  if (!title) return null

  const rawRating = row['My Rating'] ?? '0'
  const grRating = parseInt(rawRating, 10)
  const rawReview = row['My Review'] ?? ''

  return {
    title,
    author: row['Author'] ?? '',
    isbn13: cleanIsbn(row['ISBN13'] ?? ''),
    isbn10: cleanIsbn(row['ISBN'] ?? ''),
    rating: grRating >= 1 && grRating <= 5 ? grRating : null,
    status: SHELF_MAP[row['Exclusive Shelf'] ?? 'read'] ?? 'read',
    review: rawReview ? rawReview.replace(/<[^>]*>/g, '').slice(0, 50000) : null,
    readAt: (row['Date Read'] ?? '').trim() || null,
  }
}

async function importSingleBook(
  parsed: ParsedRow,
  userId: string,
): Promise<'imported' | 'skipped'> {
  const cachedId = await findBookByIsbn(parsed.isbn13, parsed.isbn10)
  let bookId: string

  if (cachedId) {
    bookId = cachedId
  } else {
    const result = await findBook(parsed.isbn13, parsed.isbn10, parsed.title, parsed.author)
    if (!result) return 'skipped'
    bookId = await ensureBookInDb(result)
  }

  const [existing] = await db
    .select({ id: userBooks.id, rating: userBooks.rating, review: userBooks.review, readAt: userBooks.readAt })
    .from(userBooks)
    .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, bookId)))
    .limit(1)

  if (existing) {
    await db
      .update(userBooks)
      .set({
        status: parsed.status,
        rating: parsed.rating ?? existing.rating,
        review: parsed.review ?? existing.review,
        readAt: parsed.readAt ?? existing.readAt,
        updatedAt: new Date(),
      })
      .where(eq(userBooks.id, existing.id))
  } else {
    await db
      .insert(userBooks)
      .values({
        userId,
        bookId,
        status: parsed.status,
        rating: parsed.rating,
        review: parsed.review,
        readAt: parsed.readAt,
      })
  }

  return 'imported'
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
  }

  if (file.type !== 'text/csv' && !file.name?.endsWith('.csv')) {
    return NextResponse.json({ error: 'Only CSV files are accepted' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV is empty or invalid' }, { status: 400 })
  }

  const userId = session.user.id
  const parsed = rows.slice(0, MAX_BOOKS).map(parseRow).filter((r): r is ParsedRow => r !== null)

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
    const batch = parsed.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(row => importSingleBook(row, userId))
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      if (result.status === 'fulfilled') {
        if (result.value === 'imported') imported++
        else skipped++
      } else {
        const row = batch[j]
        console.error(`Import error for "${row.title}":`, result.reason)
        errors.push(`"${row.title}" by ${row.author}: import failed`)
      }
    }
  }

  return NextResponse.json({ imported, skipped, errors })
}
