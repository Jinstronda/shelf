const OL_COVER = 'https://covers.openlibrary.org/b'
const AMAZON_COVER = 'https://m.media-amazon.com/images/P'
const IA_SEARCH = 'https://archive.org/advancedsearch.php'
const IA_IMG = 'https://archive.org/services/img'

export async function resolveCover(opts: {
  isbn13?: string | null
  isbn10?: string | null
  title?: string | null
  authors?: string[] | null
}): Promise<string | null> {
  const { isbn13, isbn10, title, authors } = opts

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

  // 4. Internet Archive search by ISBN then title+author
  if (isbn13) {
    const url = await tryInternetArchive(`isbn:${isbn13}`)
    if (url) return url
  }
  if (title) {
    const query = authors?.[0]
      ? `title:${title} creator:${authors[0]}`
      : `title:${title}`
    const url = await tryInternetArchive(query)
    if (url) return url
  }

  // 5. Generated SVG placeholder (always works)
  return generatePlaceholderUrl(title ?? 'Unknown', authors?.[0] ?? '')
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

async function tryInternetArchive(query: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      'fl[]': 'identifier',
      output: 'json',
      rows: '1',
    })
    const res = await fetch(`${IA_SEARCH}?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const id = data.response?.docs?.[0]?.identifier
    if (!id) return null
    // Verify the cover exists and isn't a generic placeholder
    const imgRes = await fetch(`${IA_IMG}/${id}`, { method: 'HEAD', redirect: 'follow' })
    const size = Number(imgRes.headers.get('content-length') || 0)
    if (imgRes.ok && size > 1000) return `${IA_IMG}/${id}`
  } catch {}
  return null
}

function generatePlaceholderUrl(title: string, author: string): string {
  const lines = wrapText(title, 18)
  const titleSvg = lines.map((line, i) =>
    `<text x="150" y="${130 + i * 32}" text-anchor="middle" font-family="Georgia,serif" font-size="22" font-weight="700" fill="#f0ebe4">${escSvg(line)}</text>`
  ).join('')
  const authorY = 130 + lines.length * 32 + 28

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1c20"/>
      <stop offset="100%" stop-color="#0e1013"/>
    </linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#bg)"/>
  <line x1="100" y1="90" x2="200" y2="90" stroke="#C4603A" stroke-width="1.5" opacity="0.4"/>
  ${titleSvg}
  <text x="150" y="${authorY}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#4a5060" letter-spacing="2">${escSvg(author.toUpperCase())}</text>
  <line x1="100" y1="${authorY + 20}" x2="200" y2="${authorY + 20}" stroke="#C4603A" stroke-width="1.5" opacity="0.4"/>
  <text x="150" y="420" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#C4603A" opacity="0.35" letter-spacing="3">SHELF.APP</text>
</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars) {
      if (current) lines.push(current)
      current = word
      if (lines.length >= 4) { current += '\u2026'; break }
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  return lines
}

function escSvg(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
