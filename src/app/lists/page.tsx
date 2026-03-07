import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lists, listItems, books } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { NavScroll } from '@/components/NavScroll'
import { SearchBar } from '@/components/SearchBar'
import { AuthNav } from '@/components/AuthNav'
import { LogoSVG } from '@/components/Logo'
import { ListsClient } from '@/components/ListsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Your Lists — Shelf' }

async function getUserLists(userId: string) {
  const userLists = await db
    .select()
    .from(lists)
    .where(eq(lists.userId, userId))
    .orderBy(desc(lists.updatedAt))

  return Promise.all(
    userLists.map(async list => {
      const items = await db
        .select({ coverUrl: books.coverUrl })
        .from(listItems)
        .innerJoin(books, eq(listItems.bookId, books.id))
        .where(eq(listItems.listId, list.id))
        .orderBy(listItems.position)

      return { ...list, itemCount: items.length, covers: items.slice(0, 4).map(i => i.coverUrl) }
    })
  )
}

export default async function ListsPage() {
  const session = await auth()
  const userListsData = session?.user?.id ? await getUserLists(session.user.id) : []

  return (
    <>
      <NavScroll>
        <a className="nav-logo" href="/">
          <LogoSVG />
          <span className="nav-logo-text">Shelf</span>
        </a>
        <ul className="nav-links">
          <AuthNav />
          <li><a href="/books">Books</a></li>
          <li><a href="/lists">Lists</a></li>
          <li><a href="/members">Members</a></li>
        </ul>
        <SearchBar />
      </NavScroll>

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px 80px' }}>
          <ListsClient initialLists={userListsData} isSignedIn={!!session?.user} />
        </div>
      </div>
    </>
  )
}
