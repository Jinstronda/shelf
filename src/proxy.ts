import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SENSITIVE_KEY_PATTERN = /(pass(word)?|secret|token|authorization|api[-_]?key|cookie|session|jwt|bearer|credential)/i

function parseTraceparent(header: string | null): {
  traceId?: string
  spanId?: string
  traceFlags?: string
} {
  if (!header) return {}

  const match = header.trim().match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i)
  if (!match) return {}

  return {
    traceId: match[1].toLowerCase(),
    spanId: match[2].toLowerCase(),
    traceFlags: match[3].toLowerCase(),
  }
}

function sanitizeQuery(searchParams: URLSearchParams): string {
  const safeParams = new URLSearchParams()

  for (const [key, value] of searchParams.entries()) {
    safeParams.set(key, SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : value)
  }

  const rendered = safeParams.toString()
  return rendered ? `?${rendered}` : ''
}

export function proxy(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID()
  const trace = parseTraceparent(req.headers.get('traceparent'))
  const requestHeaders = new Headers(req.headers)

  requestHeaders.set('x-request-id', requestId)
  if (trace.traceId) requestHeaders.set('x-trace-id', trace.traceId)

  // Edge-safe JSON request log for Railway ingestion.
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'info',
    msg: 'http_request',
    service: process.env.LOG_SERVICE_NAME ?? 'shelf-app',
    env: process.env.NODE_ENV ?? 'development',
    requestId,
    trace_id: trace.traceId,
    span_id: trace.spanId,
    trace_flags: trace.traceFlags,
    method: req.method,
    route: req.nextUrl.pathname,
    query: sanitizeQuery(req.nextUrl.searchParams),
  }))

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  res.headers.set('x-request-id', requestId)
  if (trace.traceId) res.headers.set('x-trace-id', trace.traceId)

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
