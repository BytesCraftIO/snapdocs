import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/db/prisma"

export async function getServerSessionUser() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return null
    }
    
    return session.user
  } catch (error) {
    console.error("Error getting server session:", error)
    return null
  }
}

export async function getCurrentUser() {
  const sessionUser = await getServerSessionUser()
  
  if (!sessionUser?.id) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: sessionUser.id
      },
      include: {
        workspaces: {
          include: {
            workspace: true
          }
        }
      }
    })

    if (!user) {
      // Session exists but user not found in database
      // This could happen if user was deleted or session is invalid
      console.error("Session user not found in database:", sessionUser.id)
      return null
    }

    return user
  } catch (error) {
    console.error("Error fetching current user:", error)
    return null
  }
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error("Authentication required - No valid session")
  }
  
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("Authentication required - User not found")
  }
  
  return user
}

// Type definitions for auth
export type AuthUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export type UserWithWorkspaces = Awaited<ReturnType<typeof getCurrentUser>>