import type { BookResult } from './google-books'

export async function fetchOpenLibraryWork(key: string): Promise<BookResult | null> {
  try {
    const res = await fetch(`https://openlibrary.org${key}.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const work = await res.json()

    const editionsRes = await fetch(`https://openlibrary.org${key}/editions.json?limit=1`, { next: { revalidate: 3600 } })
    const editions = editionsRes.ok ? await editionsRes.json() : { entries: [] }
    const edition = editions.entries?.[0]

    const isbn13 = edition?.isbn_13?.[0] ?? null
    const isbn10 = edition?.isbn_10?.[0] ?? null
    const coverId = work.covers?.[0]
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : isbn13
      ? `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`
      : null

    const authorKeys: string[] = (work.authors ?? []).map((a: { author?: { key?: string } }) => a.author?.key).filter(Boolean)
    const authorNames = await Promise.all(
      authorKeys.slice(0, 3).map(async (aKey: string) => {
        const aRes = await fetch(`https://openlibrary.org${aKey}.json`, { next: { revalidate: 86400 } })
        if (!aRes.ok) return 'Unknown'
        const a = await aRes.json()
        return a.name ?? 'Unknown'
      })
    )

    const desc = typeof work.description === 'string' ? work.description : work.description?.value ?? null

    return {
      googleId: `ol:${key}`,
      title: work.title ?? 'Unknown',
      authors: authorNames,
      description: desc,
      isbn13,
      isbn10,
      coverUrl,
      publisher: edition?.publishers?.[0] ?? null,
      published: work.first_publish_date ?? edition?.publish_date ?? null,
      pageCount: edition?.number_of_pages ?? null,
      genres: (work.subjects ?? []).slice(0, 5),
      language: edition?.languages?.[0]?.key?.replace('/languages/', '') ?? 'en',
    }
  } catch (err) {
    console.error('[open-library] fetchWork failed:', err)
    return null
  }
}

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
