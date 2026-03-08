import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appLogs } from '@/lib/schema'
import { buildLogFilters, isLogLevel, withLogContext } from '@/lib/logger'

export const dynamic = 'force-dynamic'

function parseAllowedIds(): string[] {
  return (process.env.LOG_VIEWER_IDS ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedIds = parseAllowedIds()
  if (allowedIds.length > 0 && !allowedIds.includes(session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (process.env.NODE_ENV === 'production' && allowedIds.length === 0) {
    return NextResponse.json({
      error: 'Logs API disabled. Set LOG_VIEWER_IDS with authorized user IDs.',
    }, { status: 403 })
  }

  const p = req.nextUrl.searchParams
  const level = p.get('level')
  const traceId = p.get('traceId')

  if (level && !isLogLevel(level)) {
    return NextResponse.json({ error: `Invalid level. Use one of: debug, info, warn, error, fatal.` }, { status: 400 })
  }
  if (traceId && !/^[0-9a-f]{32}$/i.test(traceId)) {
    return NextResponse.json({ error: 'Invalid traceId. Expected a 32-char hex trace ID.' }, { status: 400 })
  }

  const limitRaw = parseInt(p.get('limit') ?? '100', 10)
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100

  const where = buildLogFilters({
    level,
    requestId: p.get('requestId'),
    traceId,
    route: p.get('route'),
    userId: p.get('userId'),
    q: p.get('q'),
    from: p.get('from'),
    to: p.get('to'),
  })

  const logger = withLogContext({
    route: '/api/logs',
    method: 'GET',
    requestId: req.headers.get('x-request-id') ?? undefined,
    traceId: req.headers.get('x-trace-id') ?? undefined,
    userId: session.user.id,
  })

  const rows = await db
    .select()
    .from(appLogs)
    .where(where)
    .orderBy(desc(appLogs.createdAt))
    .limit(limit)

  logger.info('logs_query', { count: rows.length, limit })

  return NextResponse.json({ logs: rows })
}
