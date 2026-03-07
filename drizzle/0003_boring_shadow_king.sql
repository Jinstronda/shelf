CREATE TABLE "re_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"book_id" uuid NOT NULL,
	"rating" integer,
	"review" text,
	"read_at" date,
	"format" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "re_reads" ADD CONSTRAINT "re_reads_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "re_reads_user_idx" ON "re_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "re_reads_book_idx" ON "re_reads" USING btree ("book_id");