import { NextRequest, NextResponse } from 'next/server'
import { searchBooks } from '@/lib/book-search'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  try {
    const results = await searchBooks(q)
    return NextResponse.json(results)
  } catch (err) {
    console.error('[search] error:', err)
    return NextResponse.json([], { status: 500 })
  }
}
