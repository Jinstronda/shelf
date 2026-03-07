import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lists, listItems, books, users } from '@/lib/schema'
import { eq, desc, and, ne, inArray } from 'drizzle-orm'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ListsClient } from '@/components/ListsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Your Lists — Shelf' }

async function enrichListsWithCovers<T extends { id: string }>(rawLists: T[]) {
  const listIds = rawLists.map(l => l.id)
  if (listIds.length === 0) return rawLists.map(l => ({ ...l, itemCount: 0, covers: [] as (string | null)[] }))

  const allItems = await db
    .select({
      listId: listItems.listId,
      coverUrl: books.coverUrl,
    })
    .from(listItems)
    .innerJoin(books, eq(listItems.bookId, books.id))
    .where(inArray(listItems.listId, listIds))
    .orderBy(listItems.position)

  return rawLists.map(list => {
    const items = allItems.filter(i => i.listId === list.id)
    return {
      ...list,
      itemCount: items.length,
      covers: items.slice(0, 4).map(i => i.coverUrl),
    }
  })
}

async function getUserLists(userId: string) {
  const userLists = await db
    .select()
    .from(lists)
    .where(eq(lists.userId, userId))
    .orderBy(desc(lists.updatedAt))

  return enrichListsWithCovers(userLists)
}

async function getPublicLists(excludeUserId?: string) {
  const publicLists = await db
    .select({
      id: lists.id,
      name: lists.name,
      description: lists.description,
      creatorName: users.name,
    })
    .from(lists)
    .innerJoin(users, eq(lists.userId, users.id))
    .where(
      excludeUserId
        ? and(eq(lists.isPublic, true), ne(lists.userId, excludeUserId))
        : eq(lists.isPublic, true)
    )

  const enriched = await enrichListsWithCovers(publicLists)
  return enriched
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 12)
}

export default async function ListsPage() {
  const session = await auth()
  const userId = session?.user?.id
  const [userListsData, publicListsData] = await Promise.all([
    userId ? getUserLists(userId) : [],
    getPublicLists(userId),
  ])

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px 80px' }}>
          <ListsClient initialLists={userListsData} isSignedIn={!!session?.user} publicLists={publicListsData} />
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
