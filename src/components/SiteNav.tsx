import { NavScroll } from './NavScroll'
import { SearchBar } from './SearchBar'
import { AuthNav } from './AuthNav'
import { NotificationBell } from './NotificationBell'
import { LogoSVG } from './Logo'
import { MobileMenu } from './MobileMenu'

export function SiteNav() {
  return (
    <NavScroll>
      <a className="nav-logo" href="/">
        <LogoSVG />
        <span className="nav-logo-text">Shelf</span>
      </a>
      <MobileMenu />
      <ul className="nav-links nav-links-desktop">
        <AuthNav />
        <li><a href="/discover">Discover</a></li>
        <li><a href="/books">Books</a></li>
        <li><a href="/lists">Lists</a></li>
        <li><a href="/journal">Journal</a></li>
        <li><a href="/timeline">Timeline</a></li>
        <li><a href="/reviews">Reviews</a></li>
        <li><a href="/quotes">Quotes</a></li>
        <li><a href="/tags">Tags</a></li>
        <li><a href="/import">Import</a></li>
        <li><a href="/members">Members</a></li>
      </ul>
      <div className="nav-desktop-only">
        <NotificationBell />
      </div>
      <div className="nav-desktop-only">
        <SearchBar />
      </div>
    </NavScroll>
  )
}
