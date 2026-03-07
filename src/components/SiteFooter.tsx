import { LogoSVG } from './Logo'

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-l">
        <a className="footer-logo" href="/">
          <LogoSVG size={22} />
          <span>Shelf</span>
        </a>
        <div className="footer-links">
          <a href="/about">About</a>
          <a href="/books">Books</a>
          <a href="/activity">Activity</a>
          <a href="/stats">Stats</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </div>
      <div className="footer-copy">&copy; {new Date().getFullYear()} Shelf</div>
    </footer>
  )
}
