'use client'
import { useEffect, useRef, useState } from 'react'

export function NavScroll({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav ref={ref} className={`nav${scrolled ? ' scrolled' : ''}`}>
      {children}
    </nav>
  )
}
