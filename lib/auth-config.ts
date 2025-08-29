import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "name@example.com"
        },
        password: { 
          label: "Password", 
          type: "password" 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password")
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            throw new Error("No account found with this email")
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error("Invalid password")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw new Error(error instanceof Error ? error.message : "Authentication failed")
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.avatarUrl = user.avatarUrl || null
      }
      
      // Validate that user still exists in database on every request
      if (token && token.id) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true }
          })
          
          if (!existingUser) {
            // User no longer exists, clear the token
            console.error(`User ${token.id} no longer exists in database, clearing session`)
            return {} as any // Return empty token to invalidate session
          }
        } catch (error) {
          console.error('Error validating user in JWT callback:', error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Check if token is valid (has required fields)
      if (!token || !token.id || !token.email) {
        // Invalid token, return null to invalidate session
        return null as any
      }
      
      session.user.id = token.id as string
      session.user.email = token.email as string
      session.user.name = token.name as string
      session.user.avatarUrl = token.avatarUrl as string | null
      
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  secret: process.env.NEXTAUTH_SECRET,
}