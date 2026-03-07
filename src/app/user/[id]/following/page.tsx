import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { users, follows, userBooks } from '@/lib/schema'
import { eq, count, and, inArray } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { FollowButton } from '@/components/FollowButton'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!user) return { title: 'User not found — Shelf' }
  return { title: `${user.name ?? user.username} Following — Shelf` }
}

export default async function FollowingPage({ params }: Props) {
  const { id } = await params
  const [user, session] = await Promise.all([
    db.select().from(users).where(eq(users.id, id)).limit(1).then(r => r[0] ?? null),
    auth(),
  ])
  if (!user) notFound()

  const followingRows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, id))
    .limit(200)

  const followingIds = followingRows.map(f => f.id)
  const bookCountRows = followingIds.length > 0
    ? await db
        .select({ userId: userBooks.userId, total: count() })
        .from(userBooks)
        .where(inArray(userBooks.userId, followingIds))
        .groupBy(userBooks.userId)
    : []
  const bookCountMap = new Map(bookCountRows.map(r => [r.userId, Number(r.total)]))

  const currentUserId = session?.user?.id
  const followingSet = new Set<string>()
  if (currentUserId && followingIds.length > 0) {
    const myFollows = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(and(eq(follows.followerId, currentUserId), inArray(follows.followingId, followingIds)))
    myFollows.forEach(r => followingSet.add(r.followingId))
  }

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 700, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 32,
          }}>
            {user.name ?? user.username} Following
          </h1>

          {followingRows.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#567', fontSize: 15 }}>
              Not following anyone
            </div>
          )}

          {followingRows.map((f, i) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
              borderBottom: i < followingRows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <a href={`/user/${f.id}`} style={{ flexShrink: 0 }}>
                {f.avatarUrl ? (
                  <img src={f.avatarUrl} alt="" style={{
                    width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                  }} />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: '#C4603A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                  }}>
                    {(f.name ?? f.username)[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </a>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={`/user/${f.id}`} style={{
                  fontSize: 14, fontWeight: 600, color: '#ccc', textDecoration: 'none',
                  display: 'block',
                }}>
                  {f.name ?? f.username}
                </a>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 12, color: '#567' }}>@{f.username}</span>
                  <span style={{ fontSize: 12, color: '#567' }}>{bookCountMap.get(f.id) ?? 0} {(bookCountMap.get(f.id) ?? 0) === 1 ? 'book' : 'books'}</span>
                </div>
              </div>
              {currentUserId && currentUserId !== f.id && (
                <FollowButton userId={f.id} initialFollowing={followingSet.has(f.id)} />
              )}
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
