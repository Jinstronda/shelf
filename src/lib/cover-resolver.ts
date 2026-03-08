const OL_COVER = 'https://covers.openlibrary.org/b'
const AMAZON_COVER = 'https://m.media-amazon.com/images/P'

export async function resolveCover(opts: {
  isbn13?: string | null
  isbn10?: string | null
  title?: string | null
}): Promise<string | null> {
  const { isbn13, isbn10, title } = opts

  // 1. Open Library by ISBN
  if (isbn13) {
    const url = await tryOpenLibraryCover('isbn', isbn13)
    if (url) return url
  }
  if (isbn10) {
    const url = await tryOpenLibraryCover('isbn', isbn10)
    if (url) return url
  }

  // 2. Amazon direct URL (ISBN-10 = ASIN for books)
  if (isbn10) {
    const url = await tryAmazonCover(isbn10)
    if (url) return url
  }

  // 3. Open Library search by title
  if (title) {
    const url = await tryOpenLibrarySearch(title)
    if (url) return url
  }

  return null
}

async function tryOpenLibraryCover(key: string, value: string): Promise<string | null> {
  try {
    const url = `${OL_COVER}/${key}/${value}-L.jpg?default=false`
    const res = await fetch(url, { method: 'HEAD' })
    if (res.ok) return `${OL_COVER}/${key}/${value}-L.jpg`
  } catch {}
  return null
}

async function tryAmazonCover(isbn10: string): Promise<string | null> {
  try {
    const url = `${AMAZON_COVER}/${isbn10}.01._SCLZZZZZZZ_.jpg`
    const res = await fetch(url, { method: 'HEAD' })
    // Amazon returns 200 even for 1x1 placeholder; check content-length
    const size = Number(res.headers.get('content-length') || 0)
    if (res.ok && size > 1000) return url
  } catch {}
  return null
}

async function tryOpenLibrarySearch(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1&fields=cover_i`
    )
    if (!res.ok) return null
    const data = await res.json()
    const coverId = data.docs?.[0]?.cover_i
    if (coverId) return `${OL_COVER}/id/${coverId}-L.jpg`
  } catch {}
  return null
}
