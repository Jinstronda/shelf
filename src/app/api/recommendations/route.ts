import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRecommendations } from '@/lib/recommendations'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recs = await getRecommendations(session.user.id)
  return NextResponse.json(recs)
}
