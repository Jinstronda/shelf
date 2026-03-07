import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { resolveCoverUrl } from '@/lib/covers'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { RandomizerClient } from '@/components/RandomizerClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pick Your Next Read — Shelf' }

export default async function RandomizerPage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const rows = await db
    .select({
      googleId:  books.googleId,
      title:     books.title,
      authors:   books.authors,
      coverUrl:  books.coverUrl,
      coverR2Key: books.coverR2Key,
      pageCount: books.pageCount,
      genres:    books.genres,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(
      eq(userBooks.userId, session.user.id!),
      eq(userBooks.status, 'want'),
    ))

  const tbrBooks = rows
    .filter(r => r.googleId)
    .map(r => ({
      googleId: r.googleId!,
      title: r.title,
      authors: r.authors,
      coverUrl: resolveCoverUrl(r.coverR2Key, r.coverUrl),
      pageCount: r.pageCount,
      genres: r.genres ?? [],
    }))

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
            fontWeight: 700, color: '#fff', marginBottom: 32,
            textAlign: 'center',
          }}>
            What should I read next?
          </h1>

          <RandomizerClient books={tbrBooks} />
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
