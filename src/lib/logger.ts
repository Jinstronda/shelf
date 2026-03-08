import 'server-only'
import os from 'node:os'
import type { SQL } from 'drizzle-orm'
import { and, eq, gte, ilike, lte, or } from 'drizzle-orm'
import { appLogs } from './schema'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']
const LOG_LEVEL_SET = new Set<LogLevel>(LOG_LEVELS)

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
}

const SENSITIVE_KEY_PATTERN = /(pass(word)?|secret|token|authorization|api[-_]?key|cookie|session|jwt|bearer|credential|private[-_]?key|database_url|neon_database_url)/i
const REDACTED = '[REDACTED]'
const TRUNCATED = '[Truncated]'
const CIRCULAR = '[Circular]'
const MAX_STRING_LENGTH = 4000
const MAX_DEPTH = 6
const MAX_ARRAY_LENGTH = 50
const MAX_OBJECT_KEYS = 80

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }
type LogContext = Record<string, Json | undefined>

interface SerializedError {
  name?: string
  message: string
  stack?: string
}

interface LogEvent {
  ts: string
  level: LogLevel
  msg: string
  service: string
  env: string
  pid: number
  host: string
  trace_id?: string
  span_id?: string
  trace_flags?: string
  context?: LogContext
  error?: SerializedError
}

interface LoggerState {
  consolePatched: boolean
  handlersRegistered: boolean
}

interface TraceContext {
  traceId?: string
  spanId?: string
  traceFlags?: string
}

const SERVICE = process.env.LOG_SERVICE_NAME ?? 'shelf-app'
const ENV = process.env.NODE_ENV ?? 'development'
const MIRROR_CONSOLE = process.env.LOG_MIRROR_CONSOLE === 'true' || ENV !== 'production'

const globalState = globalThis as typeof globalThis & { __SHELF_LOGGER__?: LoggerState }
if (!globalState.__SHELF_LOGGER__) {
  globalState.__SHELF_LOGGER__ = { consolePatched: false, handlersRegistered: false }
}

const originalWarn = console.warn.bind(console)
const originalError = console.error.bind(console)

function coerceLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  return value && LOG_LEVEL_SET.has(value as LogLevel) ? (value as LogLevel) : fallback
}

const DB_MIN_LEVEL = coerceLogLevel(process.env.LOG_DB_MIN_LEVEL, 'error')

export function isLogLevel(value: string): value is LogLevel {
  return LOG_LEVEL_SET.has(value as LogLevel)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function trimString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value
  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`
}

function normalizeErrorStack(stack?: string): string | undefined {
  if (!stack) return undefined
  return trimString(stack)
}

function serializeError(error: unknown): SerializedError | undefined {
  if (!error) return undefined
  if (error instanceof Error) {
    return {
      name: error.name,
      message: trimString(error.message),
      stack: normalizeErrorStack(error.stack),
    }
  }
  return { message: trimString(String(error)) }
}

function isSensitiveKey(key?: string): boolean {
  return !!key && SENSITIVE_KEY_PATTERN.test(key)
}

function toJsonValue(value: unknown, options?: {
  key?: string
  depth?: number
  seen?: WeakSet<object>
}): Json {
  const key = options?.key
  const depth = options?.depth ?? 0
  const seen = options?.seen ?? new WeakSet<object>()

  if (isSensitiveKey(key)) return REDACTED
  if (value == null) return null

  if (typeof value === 'string') return trimString(value)
  if (typeof value === 'number') return Number.isFinite(value) ? value : trimString(String(value))
  if (typeof value === 'boolean') return value

  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) {
    return {
      name: value.name,
      message: trimString(value.message),
      stack: normalizeErrorStack(value.stack) ?? null,
    }
  }

  if (depth >= MAX_DEPTH) return TRUNCATED

  if (Array.isArray(value)) {
    if (seen.has(value)) return CIRCULAR
    seen.add(value)

    const limited = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map(item => toJsonValue(item, { depth: depth + 1, seen }))

    if (value.length > MAX_ARRAY_LENGTH) {
      limited.push(`[+${value.length - MAX_ARRAY_LENGTH} more items]`)
    }

    seen.delete(value)
    return limited
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) return CIRCULAR
    seen.add(value)

    const out: Record<string, Json> = {}
    const entries = Object.entries(value)

    for (const [k, v] of entries.slice(0, MAX_OBJECT_KEYS)) {
      out[k] = toJsonValue(v, { key: k, depth: depth + 1, seen })
    }

    if (entries.length > MAX_OBJECT_KEYS) {
      out.__truncatedKeys = entries.length - MAX_OBJECT_KEYS
    }

    seen.delete(value)
    return out
  }

  return trimString(String(value))
}

function extractMessageAndContext(args: unknown[]): { message: string; context: LogContext; error?: SerializedError } {
  const parts: string[] = []
  const context: LogContext = {}
  let error: SerializedError | undefined

  for (const arg of args) {
    if (arg instanceof Error && !error) {
      error = serializeError(arg)
      if (!parts.length) parts.push(`${arg.name}: ${arg.message}`)
      continue
    }

    if (typeof arg === 'string') {
      parts.push(trimString(arg))
      continue
    }

    if (isPlainObject(arg)) {
      const normalized = toJsonValue(arg)
      if (isPlainObject(normalized)) {
        for (const [k, v] of Object.entries(normalized)) {
          context[k] = v as Json
        }
      } else {
        parts.push(String(normalized))
      }
      continue
    }

    parts.push(String(toJsonValue(arg)))
  }

  return {
    message: parts.join(' ').trim() || 'log',
    context,
    error,
  }
}

function readContextString(context: LogContext | undefined, keys: string[]): string | undefined {
  if (!context) return undefined

  for (const key of keys) {
    const value = context[key]
    if (typeof value === 'string' && value.length > 0) return value
  }

  return undefined
}

function extractTraceContext(context?: LogContext): TraceContext {
  const traceId = readContextString(context, ['trace_id', 'traceId'])
  const spanId = readContextString(context, ['span_id', 'spanId'])
  const traceFlags = readContextString(context, ['trace_flags', 'traceFlags'])

  return {
    traceId: traceId && /^[0-9a-f]{32}$/i.test(traceId) ? traceId.toLowerCase() : undefined,
    spanId: spanId && /^[0-9a-f]{16}$/i.test(spanId) ? spanId.toLowerCase() : undefined,
    traceFlags: traceFlags && /^[0-9a-f]{2}$/i.test(traceFlags) ? traceFlags.toLowerCase() : undefined,
  }
}

function buildEvent(level: LogLevel, message: string, context?: LogContext, error?: SerializedError): LogEvent {
  const trace = extractTraceContext(context)
  const event: LogEvent = {
    ts: new Date().toISOString(),
    level,
    msg: trimString(message),
    service: SERVICE,
    env: ENV,
    pid: process.pid,
    host: os.hostname(),
  }

  if (trace.traceId) event.trace_id = trace.traceId
  if (trace.spanId) event.span_id = trace.spanId
  if (trace.traceFlags) event.trace_flags = trace.traceFlags
  if (context && Object.keys(context).length > 0) event.context = context
  if (error) event.error = error

  return event
}

function emit(event: LogEvent) {
  process.stdout.write(`${JSON.stringify(event)}\n`)
}

function shouldPersist(level: LogLevel): boolean {
  return !!process.env.NEON_DATABASE_URL && LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[DB_MIN_LEVEL]
}

function toNullableString(value: Json | undefined): string | null {
  return typeof value === 'string' ? value : null
}

function toNullableNumber(value: Json | undefined): number | null {
  return typeof value === 'number' ? value : null
}

function readContextValue(context: LogContext, keys: string[]): Json | undefined {
  for (const key of keys) {
    const value = context[key]
    if (value !== undefined && value !== null) return value
  }
  return undefined
}

async function persist(event: LogEvent) {
  if (!shouldPersist(event.level)) return

  try {
    const { getDb } = await import('./db')
    const db = getDb()
    const context = event.context ?? {}
    const trace = extractTraceContext(context)

    await db.insert(appLogs).values({
      level: event.level,
      message: event.msg,
      service: event.service,
      env: event.env,
      requestId: toNullableString(readContextValue(context, ['requestId', 'request_id'])),
      traceId: event.trace_id ?? trace.traceId ?? null,
      spanId: event.span_id ?? trace.spanId ?? null,
      traceFlags: event.trace_flags ?? trace.traceFlags ?? null,
      route: toNullableString(readContextValue(context, ['route'])),
      method: toNullableString(readContextValue(context, ['method'])),
      statusCode: toNullableNumber(readContextValue(context, ['statusCode', 'status_code'])),
      userId: toNullableString(readContextValue(context, ['userId', 'user_id'])),
      errorName: event.error?.name ?? null,
      errorMessage: event.error?.message ?? null,
      stack: event.error?.stack ?? null,
      context,
    })
  } catch (err) {
    if (MIRROR_CONSOLE) originalError('[logger] persist failed', err)
  }
}

export function log(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const event = buildEvent(level, message, context, serializeError(error))
  emit(event)
  void persist(event)
}

export function withLogContext(baseContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) => log('debug', message, { ...baseContext, ...(context ?? {}) }),
    info: (message: string, context?: LogContext) => log('info', message, { ...baseContext, ...(context ?? {}) }),
    warn: (message: string, context?: LogContext, error?: unknown) => log('warn', message, { ...baseContext, ...(context ?? {}) }, error),
    error: (message: string, context?: LogContext, error?: unknown) => log('error', message, { ...baseContext, ...(context ?? {}) }, error),
  }
}

function patchConsoleMethod(level: LogLevel, original: (...args: unknown[]) => void) {
  return (...args: unknown[]) => {
    const { message, context, error } = extractMessageAndContext(args)
    const event = buildEvent(level, message, context, error)
    emit(event)
    void persist(event)
    if (MIRROR_CONSOLE) original(...args)
  }
}

export function initServerJsonLogging() {
  const state = globalState.__SHELF_LOGGER__
  if (!state || state.consolePatched) return

  state.consolePatched = true
  console.warn = patchConsoleMethod('warn', originalWarn)
  console.error = patchConsoleMethod('error', originalError)

  if (!state.handlersRegistered) {
    state.handlersRegistered = true

    process.on('unhandledRejection', reason => {
      log('error', 'unhandled_rejection', {}, reason)
    })

    process.on('uncaughtException', err => {
      log('fatal', 'uncaught_exception', {}, err)
    })
  }
}

export function buildLogFilters(input: {
  level?: string | null
  requestId?: string | null
  traceId?: string | null
  route?: string | null
  userId?: string | null
  q?: string | null
  from?: string | null
  to?: string | null
}) {
  const filters: SQL<unknown>[] = []

  if (input.level && isLogLevel(input.level)) filters.push(eq(appLogs.level, input.level))
  if (input.requestId) filters.push(eq(appLogs.requestId, input.requestId))
  if (input.traceId) filters.push(eq(appLogs.traceId, input.traceId.toLowerCase()))
  if (input.route) filters.push(eq(appLogs.route, input.route))
  if (input.userId) filters.push(eq(appLogs.userId, input.userId))

  if (input.q) {
    const pattern = `%${input.q}%`
    filters.push(or(ilike(appLogs.message, pattern), ilike(appLogs.errorMessage, pattern))!)
  }

  if (input.from && !Number.isNaN(Date.parse(input.from))) {
    filters.push(gte(appLogs.createdAt, new Date(input.from)))
  }

  if (input.to && !Number.isNaN(Date.parse(input.to))) {
    filters.push(lte(appLogs.createdAt, new Date(input.to)))
  }

  return filters.length > 0 ? and(...filters) : undefined
}
