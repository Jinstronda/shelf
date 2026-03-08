import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms — Shelf' }

export default function TermsPage() {
  return (
    <>
      <SiteNav />

      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <div className="page-content" style={{ maxWidth: 820, margin: '0 auto', padding: '40px 40px 80px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 36,
            fontWeight: 700,
            color: '#fff',
            marginBottom: 18,
          }}>
            Terms
          </h1>

          <div style={{ fontSize: 14, color: '#9ab', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 16 }}>
              By using Shelf, you agree to use the service responsibly and to avoid posting unlawful
              or abusive content.
            </p>
            <p style={{ marginBottom: 16 }}>
              You are responsible for any content you add, including reviews, tags, quotes, and
              profile information.
            </p>
            <p style={{ marginBottom: 16 }}>
              Shelf may update these terms as the product evolves. Continued use of the service
              means acceptance of the latest terms.
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
