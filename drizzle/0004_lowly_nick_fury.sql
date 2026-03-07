CREATE TABLE "shelf_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shelf_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shelves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_shelf_id_shelves_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shelf_items_shelf_idx" ON "shelf_items" USING btree ("shelf_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shelf_items_unique" ON "shelf_items" USING btree ("shelf_id","book_id");--> statement-breakpoint
CREATE INDEX "shelves_user_idx" ON "shelves" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shelves_unique_name" ON "shelves" USING btree ("user_id","name");