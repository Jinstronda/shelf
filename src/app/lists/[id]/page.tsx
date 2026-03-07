import { cache } from 'react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lists, listItems, books } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ListDetailClient } from '@/components/ListDetailClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

const getList = cache(async (id: string) => {
  const [list] = await db.select().from(lists).where(eq(lists.id, id)).limit(1)
  return list ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const list = await getList(id)
  if (!list) return { title: 'List not found — Shelf' }
  return { title: `${list.name} — Shelf` }
}

export default async function ListDetailPage({ params }: Props) {
  const { id } = await params
  const list = await getList(id)
  if (!list) notFound()

  const session = await auth()
  if (!list.isPublic && list.userId !== session?.user?.id) notFound()

  const isOwner = session?.user?.id === list.userId

  const rawItems = await db
    .select()
    .from(listItems)
    .innerJoin(books, eq(listItems.bookId, books.id))
    .where(eq(listItems.listId, id))
    .orderBy(listItems.position)

  const items = rawItems.map(({ list_items: item, books: book }) => ({
    id: item.id,
    bookId: item.bookId,
    googleId: book.googleId,
    title: book.title,
    authors: book.authors,
    coverUrl: book.coverUrl,
    position: item.position,
  }))

  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: '#567', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              <a href="/lists" style={{ color: '#567', textDecoration: 'none' }}>Lists</a> /
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
              fontWeight: 700, color: '#fff',
            }}>
              {list.name}
            </h1>
            {list.description && (
              <p style={{ fontSize: 14, color: '#789', marginTop: 8, lineHeight: 1.6 }}>{list.description}</p>
            )}
            <div style={{ fontSize: 12, color: '#456', marginTop: 8 }}>
              {items.length} {items.length === 1 ? 'book' : 'books'}
            </div>
          </div>

          <ListDetailClient items={items} isOwner={isOwner} listId={id} />
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
