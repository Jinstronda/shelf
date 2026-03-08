import { cache } from 'react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelves, shelfItems, books, userBooks } from '@/lib/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ShelfDetailClient } from '@/components/ShelfDetailClient'
import { RATING_MAP } from '@/lib/constants'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

const getShelf = cache(async (id: string) => {
  const [shelf] = await db.select().from(shelves).where(eq(shelves.id, id)).limit(1)
  return shelf ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const shelf = await getShelf(id)
  if (!shelf) return { title: 'Shelf not found — Shelf' }
  return { title: `${shelf.name} — Shelf` }
}

export default async function ShelfDetailPage({ params }: Props) {
  const { id } = await params
  const shelf = await getShelf(id)
  if (!shelf) notFound()

  const session = await auth()
  if (!shelf.isPublic && shelf.userId !== session?.user?.id) notFound()

  const isOwner = session?.user?.id === shelf.userId

  const rawItems = await db
    .select()
    .from(shelfItems)
    .innerJoin(books, eq(shelfItems.bookId, books.id))
    .where(eq(shelfItems.shelfId, id))
    .orderBy(shelfItems.position)

  const bookIds = rawItems.map(r => r.books.id)
  const ratingRows = session?.user?.id && bookIds.length > 0
    ? await db
        .select({ bookId: userBooks.bookId, rating: userBooks.rating })
        .from(userBooks)
        .where(and(eq(userBooks.userId, session.user.id!), inArray(userBooks.bookId, bookIds)))
    : []
  const ratingMap = new Map(ratingRows.map(r => [r.bookId, r.rating]))

  const items = rawItems.map(({ shelf_items: item, books: book }) => ({
    id: item.id,
    bookId: item.bookId,
    googleId: book.googleId,
    title: book.title,
    authors: book.authors,
    coverUrl: book.coverUrl,
    position: item.position,
    ratingLabel: ratingMap.has(book.id) && ratingMap.get(book.id)
      ? RATING_MAP[ratingMap.get(book.id)!] ?? null
      : null,
  }))

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: '#567', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              <Link href="/shelves" style={{ color: '#567', textDecoration: 'none' }}>Shelves</Link> /
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
              fontWeight: 700, color: '#fff',
            }}>
              {shelf.name}
            </h1>
            {shelf.description && (
              <p style={{ fontSize: 14, color: '#789', marginTop: 8, lineHeight: 1.6 }}>{shelf.description}</p>
            )}
            <div style={{ fontSize: 12, color: '#456', marginTop: 8 }}>
              {items.length} {items.length === 1 ? 'book' : 'books'}
            </div>
          </div>

          <ShelfDetailClient items={items} isOwner={isOwner} shelfId={id} />
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
