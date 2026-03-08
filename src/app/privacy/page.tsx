import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy — Shelf' }

export default function PrivacyPage() {
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
            Privacy
          </h1>

          <div style={{ fontSize: 14, color: '#9ab', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 16 }}>
              Shelf stores the profile and reading data needed to provide your library, reviews,
              shelves, and social features.
            </p>
            <p style={{ marginBottom: 16 }}>
              You control profile visibility in Settings. Choosing <strong>Public</strong> makes
              your profile discoverable. Choosing <strong>Followers Only</strong> limits full
              profile visibility to followers. Choosing <strong>Private</strong> hides your profile
              from other users.
            </p>
            <p style={{ marginBottom: 16 }}>
              You can delete your account at any time in Settings. Account deletion removes your
              user data from Shelf.
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
