import { db } from '@/lib/db'
import { users, userBooks } from '@/lib/schema'
import { desc, count, inArray } from 'drizzle-orm'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { MembersSearch } from '@/components/MembersSearch'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Members — Shelf' }

export default async function MembersPage() {
  const allUsers = await db
    .select({ id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(50)

  const userIds = allUsers.map(u => u.id)
  const bookCounts = await db
    .select({
      userId: userBooks.userId,
      total: count(),
    })
    .from(userBooks)
    .where(inArray(userBooks.userId, userIds))
    .groupBy(userBooks.userId)

  const countMap = new Map(bookCounts.map(r => [r.userId, r.total]))

  const usersWithCounts = allUsers.map(user => ({
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bookCount: countMap.get(user.id) ?? 0,
  }))

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 40px 80px' }}>
          <MembersSearch members={usersWithCounts} totalCount={allUsers.length} />
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
