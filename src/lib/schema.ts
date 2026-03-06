import {
  pgTable, uuid, text, integer,
  timestamp, date, boolean
} from 'drizzle-orm/pg-core'

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
  rating:    integer('rating'),   // 1-10 (maps to 0.5-5 stars)
  review:    text('review'),
  readAt:    date('read_at'),
  liked:     boolean('liked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const users = pgTable('users', {
  id:        text('id').primaryKey(),  // from auth provider
  username:  text('username').unique().notNull(),
  email:     text('email').unique().notNull(),
  name:      text('name'),
  bio:       text('bio'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
})

export type Book       = typeof books.$inferSelect
export type NewBook    = typeof books.$inferInsert
export type UserBook   = typeof userBooks.$inferSelect
export type NewUserBook = typeof userBooks.$inferInsert
