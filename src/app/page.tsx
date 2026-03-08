import { db } from '@/lib/db'
import { books, userBooks, users } from '@/lib/schema'
import { eq, desc, count, avg, and } from 'drizzle-orm'
import { RATING_MAP, CARD_VARIANTS as CV } from '@/lib/constants'
import { resolveCoverUrl } from '@/lib/covers'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { CurrentlyReading } from '@/components/CurrentlyReading'
import { Recommendations } from '@/components/Recommendations'
import { HeroCTA } from '@/components/HeroCTA'

const BOOKS_ROW1 = [
  { isbn: '0679728759', title: 'Blood Meridian',         author: 'Cormac McCarthy',  rating: '★★★★★', cv: 'cv1' },
  { isbn: '0441013597', title: 'Dune',                   author: 'Frank Herbert',     rating: '★★★★', cv: 'cv2' },
  { isbn: '0307387895', title: 'The Road',               author: 'Cormac McCarthy',  rating: '★★★★', cv: 'cv4' },
  { isbn: '0140449132', title: 'Crime and Punishment',   author: 'Dostoyevsky',       rating: '★★★★★', cv: 'cv5' },
  { isbn: '0374529523', title: 'Moby-Dick',              author: 'Herman Melville',  rating: '★★★★',  cv: 'cv3' },
  { isbn: '0140186395', title: 'Anna Karenina',          author: 'Leo Tolstoy',      rating: '★★★★★', cv: 'cv6' },
  { isbn: '0143039431', title: 'East of Eden',           author: 'John Steinbeck',   rating: '★★★★★', cv: 'cv7' },
  { isbn: '0679720200', title: 'Brothers Karamazov',     author: 'Dostoyevsky',       rating: '★★★★',  cv: 'cv8' },
  { isbn: '0452284236', title: 'Beloved',                author: 'Toni Morrison',    rating: '★★★★',  cv: 'cv9' },
  { isbn: '0143105426', title: 'Middlemarch',            author: 'George Eliot',     rating: '★★★★',  cv: 'cvb' },
  { isbn: '0679720022', title: 'Invisible Man',          author: 'Ralph Ellison',    rating: '★★★★★', cv: 'cvc' },
  { isbn: '0679745580', title: 'The Stranger',           author: 'Albert Camus',     rating: '★★★★',  cv: 'cva' },
]

export const revalidate = 3600

async function getPopularBooks() {
  try {
    const rows = await db
      .select({
        bookId:    books.id,
        googleId:  books.googleId,
        title:     books.title,
        coverUrl:  books.coverUrl,
        coverR2Key: books.coverR2Key,
        logs:      count(userBooks.id),
        avgRating: avg(userBooks.rating),
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .innerJoin(users, eq(userBooks.userId, users.id))
      .where(eq(users.privacy, 'public'))
      .groupBy(books.id, books.googleId, books.title, books.coverUrl, books.coverR2Key)
      .orderBy(desc(count(userBooks.id)))
      .limit(12)

    return rows
      .filter(r => r.googleId)
      .map(r => ({
        googleId: r.googleId!,
        title: r.title,
        coverUrl: resolveCoverUrl(r.coverR2Key, r.coverUrl),
        avgRating: r.avgRating ? Math.round(parseFloat(r.avgRating)) : null,
      }))
  } catch (err) {
    console.error('getPopularBooks:', err)
    return []
  }
}

async function getRecentlyLogged() {
  try {
    const rows = await db
      .select({
        googleId:   books.googleId,
        title:      books.title,
        coverUrl:   books.coverUrl,
        coverR2Key: books.coverR2Key,
        rating:     userBooks.rating,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .innerJoin(users, eq(userBooks.userId, users.id))
      .where(and(eq(userBooks.status, 'read'), eq(users.privacy, 'public')))
      .orderBy(desc(userBooks.updatedAt))
      .limit(12)

    const seen = new Set<string>()
    const deduped: typeof rows = []
    for (const r of rows) {
      if (r.googleId && !seen.has(r.googleId)) {
        seen.add(r.googleId)
        deduped.push(r)
      }
    }
    return deduped.map(r => ({
      googleId: r.googleId!,
      title: r.title,
      coverUrl: resolveCoverUrl(r.coverR2Key, r.coverUrl),
      rating: r.rating,
    }))
  } catch (err) {
    console.error('getRecentlyLogged:', err)
    return []
  }
}

export default async function HomePage() {
  const [popularBooks, recentlyLogged] = await Promise.all([
    getPopularBooks(),
    getRecentlyLogged(),
  ])

  return (
    <>
      <SiteNav />

      <section className="hero">
        <div className="hero-photo" />
        <div className="hero-grad" />
        <div className="hero-body">
          <h1 className="hero-headline">
            Log the books you&apos;ve read.<br />
            Save the ones you want to read.<br />
            Tell the world what you think.
          </h1>
          <HeroCTA />
          <div className="hero-tagline">
            <span>The social network for book lovers.</span>
            <div className="dot" />
            <span>Also available on</span>
            <strong>iOS</strong>
            <div className="dot" />
            <strong>Android</strong>
          </div>
        </div>
      </section>

      <CurrentlyReading />

      <Recommendations />

      <div className="section">
        <div className="section-label">Recently logged</div>
        <div className="poster-row">
          {recentlyLogged.length > 0
            ? recentlyLogged.map((b, i) => (
                <a key={b.googleId} href={`/book/${b.googleId}`} className={`card ${CV[i % 12]}`} style={{ textDecoration: 'none' }}>
                  {b.coverUrl && (
                    <img src={b.coverUrl} alt={b.title} />
                  )}
                  <div className="card-hover">
                    {b.rating && (
                      <span className="card-rating">{RATING_MAP[b.rating]}</span>
                    )}
                  </div>
                </a>
              ))
            : BOOKS_ROW1.map((b, i) => (
                <a key={b.isbn} href={`/book/${b.isbn}`} className={`card ${CV[i % 12]}`} style={{ textDecoration: 'none' }}>
                  <img src={`https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg`} alt={b.title} />
                  <div className="card-hover">
                    <span className="card-rating">{b.rating}</span>
                  </div>
                </a>
              ))
          }
        </div>
      </div>

      <section className="features">
        <div className="features-label">Shelf lets you…</div>
        <div className="feat-grid">
          <div className="feat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <p><strong>Track every book you&apos;ve ever read</strong> — or start fresh from the day you join</p>
          </div>
          <div className="feat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <p>Rate books on a <strong>five-star scale</strong> to capture exactly how you felt</p>
          </div>
          <div className="feat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p><strong>Write and share reviews</strong>, follow friends, and read theirs</p>
          </div>
          <div className="feat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>Keep a <strong>reading diary</strong> and track your year in books</p>
          </div>
          <div className="feat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <p><strong>Organize shelves</strong> on any theme and keep track of what&apos;s next</p>
          </div>
          <div className="feat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            <p><strong>Share a card</strong> of your latest read — cover, rating, your words — built to go viral</p>
          </div>
        </div>
      </section>

      {popularBooks.length > 0 && (
        <div className="section">
          <div className="section-label">Popular on Shelf</div>
          <div className="poster-row">
            {popularBooks.map((b, i) => (
              <a key={b.googleId} href={`/book/${b.googleId}`} className={`card ${CV[i % 12]}`} style={{ textDecoration: 'none' }}>
                {b.coverUrl && (
                  <img src={b.coverUrl} alt={b.title} />
                )}
                <div className="card-hover">
                  {b.avgRating && (
                    <span className="card-rating">{RATING_MAP[b.avgRating]}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <SiteFooter />
    </>
  )
}
