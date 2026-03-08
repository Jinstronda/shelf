import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['books.google.com', 'covers.openlibrary.org', 'm.media-amazon.com', 'images-na.ssl-images-amazon.com', 'archive.org']
const ALLOWED_SUFFIX = ['.r2.dev']

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  let parsed: URL
  try { parsed = new URL(url) } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname) && !ALLOWED_SUFFIX.some(s => parsed.hostname.endsWith(s))) {
    return new NextResponse('Host not allowed', { status: 403 })
  }

  const res = await fetch(url)
  if (!res.ok) return new NextResponse('Upstream error', { status: 502 })

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
