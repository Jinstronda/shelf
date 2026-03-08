import {
  pgTable, uuid, text, integer,
  timestamp, date, boolean, uniqueIndex, index, jsonb
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const books = pgTable('books', {
  id:          uuid('id').primaryKey().defaultRandom(),
  googleId:    text('google_id').unique(),
  olKey:       text('ol_key'),
  isbn13:      text('isbn_13'),
  isbn10:      text('isbn_10'),
  title:       text('title').notNull(),
  authors:     text('authors').array().notNull().default([]),
  description: text('description'),
  coverR2Key:  text('cover_r2_key'),
  coverUrl:    text('cover_url'),      // original source url (fallback)
  coverSource: text('cover_source'),   // 'google' | 'openlibrary'
  published:   text('published'),
  publisher:   text('publisher'),
  pageCount:   integer('page_count'),
  genres:      text('genres').array().default([]),
  language:    text('language').default('en'),
  createdAt:   timestamp('created_at').defaultNow(),
})

export const userBooks = pgTable('user_books', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    text('user_id').notNull(),
  bookId:    uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  status:    text('status').notNull().default('read'), // 'read' | 'reading' | 'want'
  rating:    integer('rating'),   // 1-5 stars
  review:    text('review'),
  notes:     text('notes'),
  shareExcerpt: text('share_excerpt'),
  readAt:    date('read_at'),
  liked:     boolean('liked').default(false),
  spoiler:   boolean('spoiler').default(false),
  dnfReason: text('dnf_reason'),
  format:    text('format'),
  pagesRead: integer('pages_read'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  uniqueUserBook: uniqueIndex('user_books_unique').on(t.userId, t.bookId),
  bookIdx: index('user_books_book_id_idx').on(t.bookId),
  userIdx: index('user_books_user_id_idx').on(t.userId),
}))

export const users = pgTable('users', {
  id:        text('id').primaryKey(),  // from auth provider
  username:  text('username').unique().notNull(),
  email:     text('email').unique().notNull(),
  name:      text('name'),
  bio:       text('bio'),
  avatarUrl: text('avatar_url'),
  privacy:   text('privacy').default('public'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const follows = pgTable('follows', {
  id:         uuid('id').primaryKey().defaultRandom(),
  followerId: text('follower_id').notNull(),
  followingId: text('following_id').notNull(),
  createdAt:  timestamp('created_at').defaultNow(),
}, (t) => ({
  uniqueFollow: uniqueIndex('follows_unique').on(t.followerId, t.followingId),
  followingIdx: index('follows_following_id_idx').on(t.followingId),
}))

export const readingGoals = pgTable('reading_goals', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  year:   integer('year').notNull(),
  target: integer('target').notNull(),
}, (t) => ({
  uniqueGoal: uniqueIndex('goals_unique').on(t.userId, t.year),
}))

export const favoriteBooks = pgTable('favorite_books', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    text('user_id').notNull(),
  bookId:    uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  position:  integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  uniqueFav: uniqueIndex('favorite_books_unique').on(t.userId, t.bookId),
  userIdx: index('favorite_books_user_idx').on(t.userId),
}))

export const notifications = pgTable('notifications', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       text('user_id').notNull(),
  type:         text('type').notNull(),
  actorId:      text('actor_id').notNull(),
  actorName:    text('actor_name'),
  actorAvatar:  text('actor_avatar'),
  bookId:       uuid('book_id'),
  bookTitle:    text('book_title'),
  bookGoogleId: text('book_google_id'),
  read:         boolean('read').default(false),
  createdAt:    timestamp('created_at').defaultNow(),
}, (t) => ({
  userIdx: index('notifications_user_idx').on(t.userId),
}))

export const reviewLikes = pgTable('review_likes', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    text('user_id').notNull(),
  reviewId:  uuid('review_id').notNull().references(() => userBooks.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  uniqueLike: uniqueIndex('review_likes_unique').on(t.userId, t.reviewId),
  reviewIdx: index('review_likes_review_idx').on(t.reviewId),
}))

export const reviewComments = pgTable('review_comments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  reviewId:  uuid('review_id').notNull().references(() => userBooks.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull(),
  text:      text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  reviewIdx: index('review_comments_review_idx').on(t.reviewId),
}))

export const bookQuotes = pgTable('book_quotes', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     text('user_id').notNull(),
  bookId:     uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  quote:      text('quote').notNull(),
  pageNumber: integer('page_number'),
  chapter:    text('chapter'),
  createdAt:  timestamp('created_at').defaultNow(),
}, (t) => ({
  userIdx: index('book_quotes_user_idx').on(t.userId),
  bookIdx: index('book_quotes_book_idx').on(t.bookId),
}))

export const challenges = pgTable('challenges', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    text('user_id').notNull(),
  type:      text('type').notNull(), // 'monthly' | 'yearly'
  year:      integer('year').notNull(),
  month:     integer('month'),
  target:    integer('target').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  uniqueChallenge: uniqueIndex('challenges_unique').on(t.userId, t.type, t.year, t.month),
}))

export const bookTags = pgTable('book_tags', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    text('user_id').notNull(),
  bookId:    uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  tag:       text('tag').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  uniqueTag: uniqueIndex('book_tags_unique').on(t.userId, t.bookId, t.tag),
  userIdx: index('book_tags_user_idx').on(t.userId),
}))

export const reReads = pgTable('re_reads', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    text('user_id').notNull(),
  bookId:    uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  rating:    integer('rating'),
  review:    text('review'),
  readAt:    date('read_at'),
  format:    text('format'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  userIdx: index('re_reads_user_idx').on(t.userId),
  bookIdx: index('re_reads_book_idx').on(t.bookId),
}))

export const shelves = pgTable('shelves', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull(),
  name:        text('name').notNull(),
  description: text('description'),
  isPublic:    boolean('is_public').default(true),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
}, (t) => ({
  userIdx:    index('shelves_user_idx').on(t.userId),
  uniqueName: uniqueIndex('shelves_unique_name').on(t.userId, t.name),
}))

export const shelfItems = pgTable('shelf_items', {
  id:        uuid('id').primaryKey().defaultRandom(),
  shelfId:   uuid('shelf_id').notNull().references(() => shelves.id, { onDelete: 'cascade' }),
  bookId:    uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  position:  integer('position').notNull().default(0),
  note:      text('note'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  shelfIdx:   index('shelf_items_shelf_idx').on(t.shelfId),
  uniqueItem: uniqueIndex('shelf_items_unique').on(t.shelfId, t.bookId),
}))

export const appLogs = pgTable('app_logs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  level:       text('level').notNull(),
  message:     text('message').notNull(),
  service:     text('service').notNull().default('shelf-app'),
  env:         text('env'),
  requestId:   text('request_id'),
  traceId:     text('trace_id'),
  spanId:      text('span_id'),
  traceFlags:  text('trace_flags'),
  route:       text('route'),
  method:      text('method'),
  statusCode:  integer('status_code'),
  userId:      text('user_id'),
  errorName:   text('error_name'),
  errorMessage:text('error_message'),
  stack:       text('stack'),
  context:     jsonb('context').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
}, (t) => ({
  createdIdx: index('app_logs_created_idx').on(t.createdAt),
  levelCreatedIdx: index('app_logs_level_created_idx').on(t.level, t.createdAt),
  requestIdx: index('app_logs_request_id_idx').on(t.requestId),
  traceIdx: index('app_logs_trace_id_idx').on(t.traceId),
  routeCreatedIdx: index('app_logs_route_created_idx').on(t.route, t.createdAt),
}))

export type Book         = typeof books.$inferSelect
export type NewBook      = typeof books.$inferInsert
export type UserBook     = typeof userBooks.$inferSelect
export type NewUserBook  = typeof userBooks.$inferInsert
export type Follow       = typeof follows.$inferSelect
export type FavoriteBook = typeof favoriteBooks.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type ReviewLike    = typeof reviewLikes.$inferSelect
export type ReviewComment = typeof reviewComments.$inferSelect
export type Challenge     = typeof challenges.$inferSelect
export type BookQuote     = typeof bookQuotes.$inferSelect
export type BookTag       = typeof bookTags.$inferSelect
export type ReRead        = typeof reReads.$inferSelect
export type Shelf         = typeof shelves.$inferSelect
export type ShelfItem     = typeof shelfItems.$inferSelect
export type AppLog        = typeof appLogs.$inferSelect
