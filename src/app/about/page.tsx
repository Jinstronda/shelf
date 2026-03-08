import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { LogoSVG } from '@/components/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'About — Shelf' }

export default function AboutPage() {
  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 40px 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <LogoSVG size={48} />
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 42,
              fontWeight: 700, color: '#fff', marginTop: 20, marginBottom: 16,
            }}>
              Shelf
            </h1>
            <div style={{ fontSize: 15, color: '#789', lineHeight: 1.7 }}>
              The social network for book lovers.
            </div>
          </div>

          <div style={{ fontSize: 15, color: '#9ab', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 24 }}>
              Shelf is a place to track the books you read, rate them, write reviews,
              and share your taste with friends. Think of it as a diary for your reading life.
            </p>
            <p style={{ marginBottom: 24 }}>
              Log every book. Rate on a five-star scale with half stars.
              Write reviews that capture how a book made you feel.
              Build shelves on any theme. Share beautiful cards of your latest reads.
            </p>
            <p>
              Built for readers who care about books, not algorithms.
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
