import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [], // providers will be added in auth.ts
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // @ts-ignore
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        // @ts-ignore
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
} satisfies NextAuthConfig
