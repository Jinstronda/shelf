import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lists, listItems, books } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { NavScroll } from '@/components/NavScroll'
import { SearchBar } from '@/components/SearchBar'
import { AuthNav } from '@/components/AuthNav'
import { ListsClient } from '@/components/ListsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Your Lists — Shelf' }

const LogoSVG = () => (
  <svg width="30" height="25" viewBox="0 0 44 36" fill="none">
    <rect x="0"  y="14" width="9" height="22" rx="1" fill="#C4603A"/>
    <rect x="0"  y="14" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="0"  y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="11" y="7"  width="9" height="29" rx="1" fill="#C4603A"/>
    <rect x="11" y="7"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="11" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="22" y="1"  width="9" height="35" rx="1" fill="#C4603A"/>
    <rect x="22" y="1"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="22" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="33" y="9"  width="9" height="27" rx="1" fill="#C4603A"/>
    <rect x="33" y="9"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="33" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
  </svg>
)

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
