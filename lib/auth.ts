import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./db"
import { verifyPassword } from "./utils"
import { z } from "zod"

// Validate required environment variables
const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
if (!authSecret) {
  throw new Error(
    'NEXTAUTH_SECRET or AUTH_SECRET must be set. ' +
    'Please add it to your Vercel environment variables.'
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        try {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials)

          if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data
            
            const user = await db.user.findUnique({
              where: { email }
            })

            if (!user) return null

            const passwordsMatch = await verifyPassword(password, user.password)

            if (passwordsMatch) {
              return {
                id: user.id,
                email: user.email,
              }
            }
          }

          return null
        } catch (error) {
          console.error('NextAuth authorize error:', error)
          // Return null on error to prevent exposing internal errors
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
    // Safe session lifetime; token invalidated after maxAge unless refreshed
    maxAge: parseInt(process.env.SESSION_MAX_AGE ?? "604800", 10), // default 7 days
    // Rolling: if user is active, token is refreshed every updateAge seconds
    updateAge: parseInt(process.env.SESSION_UPDATE_AGE ?? "86400", 10), // default 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      // On trigger === "update" (rolling refresh), preserve token; Auth.js handles iat/exp
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
})
