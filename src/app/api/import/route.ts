import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { books, userBooks } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { searchGoogleBooks } from '@/lib/google-books'
import type { BookResult } from '@/lib/google-books'
import { cacheCoverToR2 } from '@/lib/covers'

const MAX_BOOKS = 500
const DELAY_MS = 200

const SHELF_MAP: Record<string, string> = {
  'read': 'read',
  'currently-reading': 'reading',
  'to-read': 'want',
}

function cleanIsbn(raw: string): string {
  return raw.replace(/^="/, '').replace(/"$/, '').replace(/[\s-]/g, '')
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []

  const headers = parseLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseLine(line)
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? ''
    }
    rows.push(row)
  }

  return rows
}

function parseLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current.trim())
  return fields
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
      coverUrl:    result.coverUrl,
      coverSource: result.coverUrl ? 'google' : null,
    })
    .returning()

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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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

  const capped = rows.slice(0, MAX_BOOKS)
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < capped.length; i++) {
    const row = capped[i]
    const title = row['Title'] ?? ''
    const author = row['Author'] ?? ''
    const rawIsbn13 = row['ISBN13'] ?? ''
    const rawIsbn10 = row['ISBN'] ?? ''
    const rawRating = row['My Rating'] ?? '0'
    const rawShelf = row['Exclusive Shelf'] ?? 'read'
    const rawReview = row['My Review'] ?? ''
    const rawDateRead = row['Date Read'] ?? ''

    if (!title) {
      skipped++
      continue
    }

    const isbn13 = cleanIsbn(rawIsbn13)
    const isbn10 = cleanIsbn(rawIsbn10)

    try {
      const result = await findBook(isbn13, isbn10, title, author)
      if (!result) {
        skipped++
        continue
      }

      const bookId = await ensureBookInDb(result)

      const grRating = parseInt(rawRating, 10)
      const rating = grRating >= 1 && grRating <= 5 ? grRating * 2 : null
      const status = SHELF_MAP[rawShelf] ?? 'read'
      const review = rawReview ? rawReview.replace(/<[^>]*>/g, '').slice(0, 5000) : null
      const readAt = rawDateRead.trim() || null

      const [existing] = await db
        .select({ id: userBooks.id, rating: userBooks.rating, review: userBooks.review, readAt: userBooks.readAt })
        .from(userBooks)
        .where(and(eq(userBooks.userId, session.user.id), eq(userBooks.bookId, bookId)))
        .limit(1)

      if (existing) {
        await db
          .update(userBooks)
          .set({
            status,
            rating: rating ?? existing.rating,
            review: review ?? existing.review,
            readAt: readAt ?? existing.readAt,
            updatedAt: new Date(),
          })
          .where(eq(userBooks.id, existing.id))
      } else {
        await db
          .insert(userBooks)
          .values({
            userId: session.user.id,
            bookId,
            status,
            rating,
            review,
            readAt,
          })
      }

      imported++
    } catch (err) {
      console.error(`Import error for "${title}":`, err)
      errors.push(`"${title}" by ${author}: import failed`)
    }

    if (i < capped.length - 1) await sleep(DELAY_MS)
  }

  return NextResponse.json({ imported, skipped, errors })
}
