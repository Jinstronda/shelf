import { SearchBar } from '@/components/SearchBar'
import { NavScroll } from '@/components/NavScroll'
import { BookCard } from '@/components/BookCard'
import { AuthNav } from '@/components/AuthNav'

const BOOKS_ROW1 = [
  { isbn: '0679728759', title: 'Blood Meridian',         author: 'Cormac McCarthy',  rating: '★★★★★', cv: 'cv1' },
  { isbn: '0441013597', title: 'Dune',                   author: 'Frank Herbert',     rating: '★★★★½', cv: 'cv2' },
  { isbn: '0307387895', title: 'The Road',               author: 'Cormac McCarthy',  rating: '★★★★½', cv: 'cv4' },
  { isbn: '0140449132', title: 'Crime and Punishment',   author: 'Dostoyevsky',       rating: '★★★★★', cv: 'cv5' },
  { isbn: '0374529523', title: 'Moby-Dick',              author: 'Herman Melville',  rating: '★★★★',  cv: 'cv3' },
  { isbn: '0140186395', title: 'Anna Karenina',          author: 'Leo Tolstoy',      rating: '★★★★★', cv: 'cv6' },
  { isbn: '0143039431', title: 'East of Eden',           author: 'John Steinbeck',   rating: '★★★★½', cv: 'cv7' },
  { isbn: '0679720200', title: 'Brothers Karamazov',     author: 'Dostoyevsky',       rating: '★★★★',  cv: 'cv8' },
  { isbn: '0452284236', title: 'Beloved',                author: 'Toni Morrison',    rating: '★★★★',  cv: 'cv9' },
  { isbn: '0143105426', title: 'Middlemarch',            author: 'George Eliot',     rating: '★★★★',  cv: 'cvb' },
  { isbn: '0679720022', title: 'Invisible Man',          author: 'Ralph Ellison',    rating: '★★★★★', cv: 'cvc' },
  { isbn: '0679745580', title: 'The Stranger',           author: 'Albert Camus',     rating: '★★★★',  cv: 'cva' },
]

const BOOKS_ROW2 = [
  { isbn: '0061020052', title: 'The Dispossessed',  author: 'Ursula K. Le Guin',  rating: '★★★★★', cv: 'cv5' },
  { isbn: '0671746472', title: 'Lonesome Dove',     author: 'Larry McMurtry',      rating: '★★★★½', cv: 'cv2' },
  { isbn: '0312243656', title: 'Gilead',             author: 'Marilynne Robinson',  rating: '★★★★',  cv: 'cv3' },
  { isbn: '0802133908', title: 'Pedro Páramo',       author: 'Juan Rulfo',          rating: '★★★★★', cv: 'cv4' },
  { isbn: '0679724222', title: 'The Plague',         author: 'Albert Camus',        rating: '★★★★½', cv: 'cv7' },
  { isbn: '0374529019', title: '2666',               author: 'Roberto Bolaño',      rating: '★★★★★', cv: 'cv8' },
  { isbn: '0312422300', title: 'Housekeeping',       author: 'Marilynne Robinson',  rating: '★★★★',  cv: 'cva' },
  { isbn: '0811200140', title: 'The Tin Drum',       author: 'Günter Grass',        rating: '★★★★★', cv: 'cvb' },
  { isbn: '0811216004', title: 'Austerlitz',         author: 'W.G. Sebald',         rating: '★★★★',  cv: 'cvc' },
  { isbn: '0679745246', title: 'Remainder',          author: 'Tom McCarthy',        rating: '★★★★',  cv: 'cv9' },
  { isbn: '0679720200', title: 'Never Let Me Go',    author: 'Kazuo Ishiguro',      rating: '★★★★½', cv: 'cv6' },
  { isbn: '0679724260', title: 'The Stranger',       author: 'Albert Camus',        rating: '★★★★',  cv: 'cv1' },
]


const LogoSVG = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={Math.round(size * 0.83)} viewBox="0 0 44 36" fill="none">
    <rect x="0"  y="14" width="9" height="22" rx="1" fill="#C4603A"/>
    <rect x="0"  y="14" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="0"  y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="11" y="7"  width="9" height="29" rx="1" fill="#C4603A"/>
    <rect x="11" y="7"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="11" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="22" y="1"  width="9" height="35" rx="1" fill="#C4603A"/>
    <rect x="22" y="1"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="22" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="33" y="9"  width="9" height="27" rx="1" fill="#C4603A"/>
    <rect x="33" y="9"  width="9" height="2.5" fill="#9E4D2E"/>
    <rect x="33" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
  </svg>
)

export default function HomePage() {
  return (
    <>
      <NavScroll>
        <a className="nav-logo" href="/">
          <LogoSVG />
          <span className="nav-logo-text">Shelf</span>
        </a>
        <ul className="nav-links">
          <AuthNav />
          <li><a href="/books">Books</a></li>
          <li><a href="/lists">Lists</a></li>
          <li><a href="/members">Members</a></li>
          <li><a href="/journal">Journal</a></li>
        </ul>
        <SearchBar />
      </NavScroll>

      <section className="hero">
        <div className="hero-photo" />
        <div className="hero-grad" />
        <div className="hero-credit">The Library at Night — Alberto Manguel</div>
        <div className="hero-body">
          <h1 className="hero-headline">
            Log the books you&apos;ve read.<br />
            Save the ones you want to read.<br />
            Tell the world what you think.
          </h1>
          <a className="hero-cta" href="/create-account">Get started — it&apos;s free!</a>
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

      <div className="section">
        <div className="section-label">Recently logged</div>
        <div className="poster-row">
          {BOOKS_ROW1.map(b => <BookCard key={b.isbn} {...b} />)}
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
            <p>Rate books on a <strong>five-star scale</strong> with half stars to capture exactly how you felt</p>
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
            <p><strong>Compile lists</strong> on any theme and keep a reading list of what&apos;s next</p>
          </div>
          <div className="feat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            <p><strong>Share a card</strong> of your latest read — cover, rating, your words — built to go viral</p>
          </div>
        </div>
      </section>

      <div className="section">
        <div className="section-label">Popular this week</div>
        <div className="poster-row">
          {BOOKS_ROW2.map(b => <BookCard key={b.isbn + b.title} {...b} />)}
        </div>
      </div>

      <footer>
        <div className="footer-l">
          <a className="footer-logo" href="/">
            <LogoSVG size={22} />
            <span>Shelf</span>
          </a>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/books">Books</a>
            <a href="/pro">Pro</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
        <div className="footer-copy">© 2025 Shelf</div>
      </footer>
    </>
  )
}
