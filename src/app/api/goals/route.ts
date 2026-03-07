import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { readingGoals } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { year: number; target: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { year, target } = body
  if (!year || !target || target < 1 || target > 999) {
    return NextResponse.json({ error: 'Invalid year or target' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(readingGoals)
    .where(and(eq(readingGoals.userId, session.user.id), eq(readingGoals.year, year)))
    .limit(1)

  if (existing) {
    const [updated] = await db
      .update(readingGoals)
      .set({ target })
      .where(eq(readingGoals.id, existing.id))
      .returning()
    return NextResponse.json(updated)
  }

  const [created] = await db
    .insert(readingGoals)
    .values({ userId: session.user.id, year, target })
    .returning()

  return NextResponse.json(created, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const goals = await db
    .select()
    .from(readingGoals)
    .where(eq(readingGoals.userId, session.user.id))

  return NextResponse.json(goals)
}
