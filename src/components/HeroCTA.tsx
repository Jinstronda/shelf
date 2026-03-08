'use client'
import { useSession } from 'next-auth/react'

export function HeroCTA() {
  const { data: session, status } = useSession()

  if (status === 'loading') return null

  if (session?.user) {
    return (
      <a className="hero-cta" href="/library">Go to your library</a>
    )
  }

  return (
    <a className="hero-cta" href="/api/auth/signin">Get started — it&apos;s free!</a>
  )
}
