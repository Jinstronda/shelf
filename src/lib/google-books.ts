export interface BookResult {
  googleId:    string
  title:       string
  authors:     string[]
  description: string | null
  isbn13:      string | null
  isbn10:      string | null
  coverUrl:    string | null
  publisher:   string | null
  published:   string | null
  pageCount:   number | null
  genres:      string[]
  language:    string
}

function mapItem(item: any): BookResult {
  const v = item.volumeInfo ?? {}
  const isbns = v.industryIdentifiers ?? []
  const isbn13 = isbns.find((x: any) => x.type === 'ISBN_13')?.identifier ?? null
  const isbn10 = isbns.find((x: any) => x.type === 'ISBN_10')?.identifier ?? null

  // Upgrade to higher-res thumbnail
  let coverUrl = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null
  if (coverUrl) {
    coverUrl = coverUrl
      .replace('http://', 'https://')
      .replace('&zoom=1', '&zoom=3')
      .replace('&edge=curl', '')
  }

  return {
    googleId:    item.id,
    title:       v.title ?? 'Unknown',
    authors:     v.authors ?? [],
    description: v.description ?? null,
    isbn13,
    isbn10,
    coverUrl,
    publisher:   v.publisher ?? null,
    published:   v.publishedDate ?? null,
    pageCount:   v.pageCount ?? null,
    genres:      v.categories ?? [],
    language:    v.language ?? 'en',
  }
}

export async function searchGoogleBooks(query: string, limit = 12): Promise<BookResult[]> {
  const key = process.env.GOOGLE_BOOKS_API_KEY
  const params = new URLSearchParams({
    q: query,
    maxResults: String(limit),
    fields: 'items(id,volumeInfo(title,authors,description,industryIdentifiers,imageLinks,publisher,publishedDate,pageCount,categories,language))',
    ...(key ? { key } : {}),
  })
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []).map(mapItem)
}

export async function getGoogleBook(googleId: string): Promise<BookResult | null> {
  const key = process.env.GOOGLE_BOOKS_API_KEY
  const url = `https://www.googleapis.com/books/v1/volumes/${googleId}${key ? `?key=${key}` : ''}`
  const res = await fetch(url)
  if (!res.ok) return null
  return mapItem(await res.json())
}
