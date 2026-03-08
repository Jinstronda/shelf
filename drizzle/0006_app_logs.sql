CREATE TABLE "app_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "level" text NOT NULL,
  "message" text NOT NULL,
  "service" text DEFAULT 'shelf-app' NOT NULL,
  "env" text,
  "request_id" text,
  "trace_id" text,
  "span_id" text,
  "trace_flags" text,
  "route" text,
  "method" text,
  "status_code" integer,
  "user_id" text,
  "error_name" text,
  "error_message" text,
  "stack" text,
  "context" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE INDEX "app_logs_created_idx" ON "app_logs" USING btree ("created_at");
CREATE INDEX "app_logs_level_created_idx" ON "app_logs" USING btree ("level","created_at");
CREATE INDEX "app_logs_request_id_idx" ON "app_logs" USING btree ("request_id");
CREATE INDEX "app_logs_trace_id_idx" ON "app_logs" USING btree ("trace_id");
CREATE INDEX "app_logs_route_created_idx" ON "app_logs" USING btree ("route","created_at");
CREATE INDEX "app_logs_context_gin_idx" ON "app_logs" USING gin ("context");
