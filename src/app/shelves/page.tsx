import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shelves, shelfItems, books } from '@/lib/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ShelvesClient } from '@/components/ShelvesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Your Shelves — Shelf' }

async function getUserShelves(userId: string) {
  const userShelves = await db
    .select()
    .from(shelves)
    .where(eq(shelves.userId, userId))
    .orderBy(desc(shelves.createdAt))

  const shelfIds = userShelves.map(s => s.id)
  if (shelfIds.length === 0) return userShelves.map(s => ({ ...s, itemCount: 0, covers: [] as (string | null)[] }))

  const allItems = await db
    .select({
      shelfId: shelfItems.shelfId,
      coverUrl: books.coverUrl,
    })
    .from(shelfItems)
    .innerJoin(books, eq(shelfItems.bookId, books.id))
    .where(inArray(shelfItems.shelfId, shelfIds))

  return userShelves.map(shelf => {
    const items = allItems.filter(i => i.shelfId === shelf.id)
    return {
      ...shelf,
      itemCount: items.length,
      covers: items.slice(0, 4).map(i => i.coverUrl),
    }
  })
}

export default async function ShelvesPage() {
  const session = await auth()
  const userId = session?.user?.id
  const shelvesData = userId ? await getUserShelves(userId) : []

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px 80px' }}>
          <ShelvesClient initialShelves={shelvesData} isSignedIn={!!session?.user} />
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
