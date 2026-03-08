# JSON Logging System

This app now emits structured JSON logs (Railway-friendly) and persists warn/error/fatal logs to Neon in `app_logs`.

## 1) Apply migration

```bash
cd shelf-app
npx drizzle-kit migrate
```

## 2) Environment variables

```bash
LOG_SERVICE_NAME=shelf-app
LOG_DB_MIN_LEVEL=error
LOG_MIRROR_CONSOLE=true
LOG_VIEWER_IDS=<comma-separated user IDs allowed to access /api/logs>
```

Notes:
- In production, `/api/logs` requires `LOG_VIEWER_IDS` to be set.
- `x-request-id` is generated in proxy and returned on all responses.
- Sensitive keys (for example `token`, `authorization`, `password`, `cookie`) are redacted in structured context.

## 3) What gets logged

- `console.warn` and `console.error` are automatically converted to JSON events.
- `unhandledRejection` and `uncaughtException` are captured.
- Warn/error/fatal logs are persisted to Neon (`app_logs`) based on `LOG_DB_MIN_LEVEL`.
- Incoming W3C trace context (`traceparent`) is parsed into `trace_id` and `span_id`.
- Logger bootstrap is centralized in `src/instrumentation.ts` so API-only traffic is covered.

## 4) Query logs via API

```bash
GET /api/logs?limit=100
GET /api/logs?level=error&limit=200
GET /api/logs?requestId=<id>
GET /api/logs?traceId=<otel-trace-id>
GET /api/logs?route=/api/import&q=timeout
GET /api/logs?from=2026-03-08T00:00:00.000Z&to=2026-03-08T23:59:59.999Z
```

## 5) Useful Neon SQL

```sql
-- Latest errors
select created_at, level, message, route, method, request_id, error_message
from app_logs
where level in ('error', 'fatal')
order by created_at desc
limit 200;

-- Group recurring failures
select route, error_message, count(*) as total
from app_logs
where level in ('error', 'fatal')
group by route, error_message
order by total desc
limit 50;

-- Trace a distributed request
select created_at, level, message, route, method, request_id, trace_id, span_id
from app_logs
where trace_id = '<trace-id>'
order by created_at asc;

-- Trace a specific request
select *
from app_logs
where request_id = '<request-id>'
order by created_at asc;
```
