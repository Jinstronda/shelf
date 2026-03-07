CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text,
	"ol_key" text,
	"isbn_13" text,
	"isbn_10" text,
	"title" text NOT NULL,
	"authors" text[] DEFAULT '{}' NOT NULL,
	"description" text,
	"cover_r2_key" text,
	"cover_url" text,
	"cover_source" text,
	"published" text,
	"publisher" text,
	"page_count" integer,
	"genres" text[] DEFAULT '{}',
	"language" text DEFAULT 'en',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "books_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "favorite_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"book_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"actor_id" text NOT NULL,
	"actor_name" text,
	"actor_avatar" text,
	"book_id" uuid,
	"book_title" text,
	"book_google_id" text,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reading_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"target" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"review_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"book_id" uuid NOT NULL,
	"status" text DEFAULT 'read' NOT NULL,
	"rating" integer,
	"review" text,
	"notes" text,
	"read_at" date,
	"liked" boolean DEFAULT false,
	"spoiler" boolean DEFAULT false,
	"pages_read" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "favorite_books" ADD CONSTRAINT "favorite_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_id_user_books_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."user_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_review_id_user_books_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."user_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorite_books_unique" ON "favorite_books" USING btree ("user_id","book_id");--> statement-breakpoint
CREATE INDEX "favorite_books_user_idx" ON "favorite_books" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_unique" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "follows_following_id_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "list_items_list_id_idx" ON "list_items" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "goals_unique" ON "reading_goals" USING btree ("user_id","year");--> statement-breakpoint
CREATE INDEX "review_comments_review_idx" ON "review_comments" USING btree ("review_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_likes_unique" ON "review_likes" USING btree ("user_id","review_id");--> statement-breakpoint
CREATE INDEX "review_likes_review_idx" ON "review_likes" USING btree ("review_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_books_unique" ON "user_books" USING btree ("user_id","book_id");--> statement-breakpoint
CREATE INDEX "user_books_book_id_idx" ON "user_books" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "user_books_user_id_idx" ON "user_books" USING btree ("user_id");