import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelves, shelfItems, books, users } from '@/lib/schema'
import { eq, desc, and, ne, inArray } from 'drizzle-orm'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ShelvesClient } from '@/components/ShelvesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Your Shelves — Shelf' }

async function enrichShelvesWithCovers<T extends { id: string }>(rawShelves: T[]) {
  const shelfIds = rawShelves.map(s => s.id)
  if (shelfIds.length === 0) return rawShelves.map(s => ({ ...s, itemCount: 0, covers: [] as (string | null)[] }))

  const allItems = await db
    .select({
      shelfId: shelfItems.shelfId,
      coverUrl: books.coverUrl,
    })
    .from(shelfItems)
    .innerJoin(books, eq(shelfItems.bookId, books.id))
    .where(inArray(shelfItems.shelfId, shelfIds))
    .orderBy(shelfItems.position)

  return rawShelves.map(shelf => {
    const items = allItems.filter(i => i.shelfId === shelf.id)
    return {
      ...shelf,
      itemCount: items.length,
      covers: items.slice(0, 4).map(i => i.coverUrl),
    }
  })
}

async function getUserShelves(userId: string) {
  const userShelves = await db
    .select()
    .from(shelves)
    .where(eq(shelves.userId, userId))
    .orderBy(desc(shelves.createdAt))

  return enrichShelvesWithCovers(userShelves)
}

async function getPublicShelves(excludeUserId?: string) {
  const publicShelves = await db
    .select({
      id: shelves.id,
      name: shelves.name,
      description: shelves.description,
      creatorName: users.name,
    })
    .from(shelves)
    .innerJoin(users, eq(shelves.userId, users.id))
    .where(
      excludeUserId
        ? and(eq(shelves.isPublic, true), ne(shelves.userId, excludeUserId))
        : eq(shelves.isPublic, true)
    )

  const enriched = await enrichShelvesWithCovers(publicShelves)
  return enriched
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 12)
}

export default async function ShelvesPage() {
  const session = await auth()
  const userId = session?.user?.id
  const [shelvesData, publicShelvesData] = await Promise.all([
    userId ? getUserShelves(userId) : [],
    getPublicShelves(userId),
  ])

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px 80px' }}>
          <ShelvesClient initialShelves={shelvesData} isSignedIn={!!session?.user} publicShelves={publicShelvesData} />
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
