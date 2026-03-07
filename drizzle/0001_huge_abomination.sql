CREATE TABLE "book_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"book_id" uuid NOT NULL,
	"quote" text NOT NULL,
	"page_number" integer,
	"chapter" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "book_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"book_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer,
	"target" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_books" ADD COLUMN "dnf_reason" text;--> statement-breakpoint
ALTER TABLE "book_quotes" ADD CONSTRAINT "book_quotes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_tags" ADD CONSTRAINT "book_tags_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_quotes_user_idx" ON "book_quotes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "book_quotes_book_idx" ON "book_quotes" USING btree ("book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "book_tags_unique" ON "book_tags" USING btree ("user_id","book_id","tag");--> statement-breakpoint
CREATE INDEX "book_tags_user_idx" ON "book_tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenges_unique" ON "challenges" USING btree ("user_id","type","year","month");