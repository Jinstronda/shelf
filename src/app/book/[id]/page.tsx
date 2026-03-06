import { getGoogleBook } from '@/lib/google-books'
import { searchOpenLibrary } from '@/lib/open-library'
import { notFound } from 'next/navigation'
import { BookDetailClient } from '@/components/BookDetailClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

async function fetchBook(id: string) {
  // ISBN lookup (from the landing page book cards)
  if (/^\d{10,13}$/.test(id)) {
    const results = await searchOpenLibrary(id, 1)
    if (results.length > 0) return results[0]
  }
  // Open Library key
  if (id.startsWith('ol:')) {
    const results = await searchOpenLibrary(id.replace('ol:', ''), 1)
    if (results.length > 0) return results[0]
  }
  // Google Books ID
  return getGoogleBook(id)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const book = await fetchBook(id)
  if (!book) return { title: 'Book not found — Shelf' }
  return {
    title: `${book.title} — Shelf`,
    description: book.description?.slice(0, 160) ?? `${book.title} by ${book.authors.join(', ')}`,
    openGraph: {
      title: book.title,
      description: book.description?.slice(0, 160) ?? '',
      images: book.coverUrl ? [{ url: book.coverUrl }] : [],
    },
  }
}

export default async function BookPage({ params }: Props) {
  const { id } = await params
  const book = await fetchBook(id)
  if (!book) notFound()
  return <BookDetailClient book={book} />
}
