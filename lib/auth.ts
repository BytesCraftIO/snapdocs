import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/db/prisma"

export async function getServerSessionUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
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

    return user
  } catch (error) {
    console.error("Error fetching current user:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("Authentication required")
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