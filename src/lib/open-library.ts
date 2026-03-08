import type { BookResult } from './google-books'

export async function searchOpenLibrary(query: string, limit = 12): Promise<BookResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    fields: 'key,title,author_name,isbn,first_publish_year,publisher,number_of_pages_median,subject,language,cover_i',
  })
  const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    console.error(`[open-library] API returned ${res.status} for query: ${query}`)
    return []
  }
  const data = await res.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.docs ?? []).map((doc: Record<string, any>): BookResult => {
    const isbn13 = doc.isbn?.find((i: string) => i.length === 13) ?? null
    const isbn10 = doc.isbn?.find((i: string) => i.length === 10) ?? null
    const coverId = doc.cover_i
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : isbn13
      ? `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`
      : null

    return {
      googleId:    `ol:${doc.key}`,
      title:       doc.title ?? 'Unknown',
      authors:     doc.author_name ?? [],
      description: null,
      isbn13,
      isbn10,
      coverUrl,
      publisher:   doc.publisher?.[0] ?? null,
      published:   doc.first_publish_year?.toString() ?? null,
      pageCount:   doc.number_of_pages_median ?? null,
      genres:      (doc.subject ?? []).slice(0, 5),
      language:    doc.language?.[0] ?? 'en',
    }
  })
}
