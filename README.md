# Shelf

Goodreads is a graveyard. Beautiful books deserve better.

Shelf is what happens when you take Letterboxd's obsession with taste and apply it to reading. Log books, write reviews, track your shelf. Then share a gorgeous card of your latest read to Instagram or X in one tap.

Built for readers who actually care about what they read.

## Stack

- **Frontend/API** — Next.js 15 (App Router), TypeScript, Tailwind
- **Database** — Neon Postgres + Drizzle ORM
- **Book data** — Google Books API (primary) + Open Library (fallback)
- **Cover storage** — Cloudflare R2 (fetch once, serve forever, zero egress fees)
- **Deployment** — Vercel (frontend) + Railway (background workers)

## How book data works

No 30M book pre-load. The catalog grows as users interact with the app:

1. User searches "dune" → hits Google Books API → returns results
2. User logs a book → we fetch full metadata + cover
3. Cover downloaded once → uploaded to Cloudflare R2
4. Book persisted in Neon Postgres permanently
5. Every future search for that book → instant, from our own DB

## Local setup

```bash
# Clone and install
git clone https://github.com/Jinstronda/shelf
cd shelf/shelf-app
bun install

# Configure environment
cp .env.local.example .env.local
# Fill in: NEON_DATABASE_URL, GOOGLE_BOOKS_API_KEY, R2_* vars

# Push DB schema
bunx dotenv-cli -e .env.local -- bunx drizzle-kit push

# Run dev server
bun dev
```

Open http://localhost:3001.

## Environment variables

```
NEON_DATABASE_URL          # Neon Postgres connection string
GOOGLE_BOOKS_API_KEY       # Google Cloud Console → Books API
R2_ACCOUNT_ID              # Cloudflare account ID
R2_ACCESS_KEY_ID           # R2 API token access key
R2_SECRET_ACCESS_KEY       # R2 API token secret
R2_BUCKET_NAME             # R2 bucket name (e.g. shelf-covers)
R2_PUBLIC_URL              # Public R2 bucket URL
```

## API routes

```
GET  /api/search?q=dune         Search books (Google Books + Open Library fallback)
POST /api/books/add             Persist a book to DB + cache cover to R2
GET  /api/books/:id             Get a book by UUID
```

## Pages

```
/                   Landing page with book strips
/book/:id           Book detail — log, rate, review, share card
/search?q=dune      Full search results page
```
