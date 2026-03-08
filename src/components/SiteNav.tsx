import Link from 'next/link'
import { NavScroll } from './NavScroll'
import { SearchBar } from './SearchBar'
import { AuthNav } from './AuthNav'
import { NotificationBell } from './NotificationBell'
import { LogoSVG } from './Logo'
import { MobileMenu } from './MobileMenu'

export function SiteNav() {
  return (
    <NavScroll>
      <Link className="nav-logo" href="/">
        <LogoSVG />
        <span className="nav-logo-text">Shelf</span>
      </Link>
      <MobileMenu />
      <ul className="nav-links nav-links-desktop">
        <AuthNav />
        <li><Link href="/discover">Discover</Link></li>
        <li><Link href="/books">Books</Link></li>
        <li><Link href="/shelves">Shelves</Link></li>
        <li><Link href="/library">Library</Link></li>
        <li><Link href="/journal">Journal</Link></li>
        <li><Link href="/reviews">Reviews</Link></li>
        <li><Link href="/quotes">Quotes</Link></li>
        <li><Link href="/tags">Tags</Link></li>
        <li><Link href="/import">Import</Link></li>
        <li><Link href="/members">Members</Link></li>
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
