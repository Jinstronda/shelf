import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { challenges, userBooks } from '@/lib/schema'
import { eq, and, sql, gte } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1

  const rows = await db
    .select()
    .from(challenges)
    .where(and(eq(challenges.userId, session.user.id), eq(challenges.year, year)))

  const yearStart = new Date(year, 0, 1)
  const monthStart = new Date(year, month - 1, 1)

  const [yearlyCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(userBooks)
    .where(and(
      eq(userBooks.userId, session.user.id),
      eq(userBooks.status, 'read'),
      gte(userBooks.updatedAt, yearStart),
    ))

  const [monthlyCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(userBooks)
    .where(and(
      eq(userBooks.userId, session.user.id),
      eq(userBooks.status, 'read'),
      gte(userBooks.updatedAt, monthStart),
    ))

  const result = rows.map(c => ({
    ...c,
    progress: c.type === 'yearly' ? yearlyCount.total : monthlyCount.total,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { type: string; target: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { type, target } = body
  if (!type || !['monthly', 'yearly'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (!target || target < 1 || target > 999) {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
  }

  const year = new Date().getFullYear()
  const month = type === 'monthly' ? new Date().getMonth() + 1 : null

  const [existing] = await db
    .select()
    .from(challenges)
    .where(and(
      eq(challenges.userId, session.user.id),
      eq(challenges.type, type),
      eq(challenges.year, year),
      month !== null
        ? eq(challenges.month, month)
        : sql`${challenges.month} is null`,
    ))
    .limit(1)

  if (existing) {
    const [updated] = await db
      .update(challenges)
      .set({ target })
      .where(eq(challenges.id, existing.id))
      .returning()
    return NextResponse.json(updated)
  }

  const [created] = await db
    .insert(challenges)
    .values({ userId: session.user.id, type, year, month, target })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
