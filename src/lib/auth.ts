import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

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
})
