import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "./db"
import { users } from "./schema"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.id = profile.sub
        token.name = profile.name
        token.email = profile.email
        token.picture = profile.picture
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.image = token.picture as string
      return session
    },
  },
  events: {
    async signIn({ user, profile }) {
      if (!user.id || !profile?.email) return
      try {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1)

        if (existing) {
          await db.update(users).set({
            name: profile.name ?? existing.name,
            avatarUrl: (profile as Record<string, unknown>).picture as string ?? existing.avatarUrl,
          }).where(eq(users.id, user.id))
        } else {
          const username = (profile.email as string).split('@')[0]
            + Math.random().toString(36).slice(2, 6)
          await db.insert(users).values({
            id: user.id,
            email: profile.email as string,
            username,
            name: profile.name ?? null,
            avatarUrl: (profile as Record<string, unknown>).picture as string ?? null,
          })
        }
      } catch (err) {
        console.error('[auth] user sync failed:', err)
      }
    },
  },
})
