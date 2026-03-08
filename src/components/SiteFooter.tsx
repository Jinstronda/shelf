import Link from 'next/link'
import { LogoSVG } from './Logo'

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-l">
        <Link className="footer-logo" href="/">
          <LogoSVG size={22} />
          <span>Shelf</span>
        </Link>
        <div className="footer-links">
          <Link href="/about">About</Link>
          <Link href="/books">Books</Link>
          <Link href="/activity">Activity</Link>
          <Link href="/stats">Stats</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
      <div className="footer-copy" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>&copy; {new Date().getFullYear()} Shelf</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Keyboard shortcuts (?)</span>
      </div>
    </footer>
  )
}
