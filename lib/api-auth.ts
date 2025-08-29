import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { getCurrentUser } from "@/lib/auth"

/**
 * Validates authentication for API routes
 * Returns 403 for invalid/expired tokens
 * Returns 401 for missing authentication
 */
export async function validateApiAuth() {
  try {
    // First check if there's a session
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized - No valid session" },
          { status: 403 }
        ),
        user: null
      }
    }
    
    // Then get the full user data
    const user = await getCurrentUser()
    
    if (!user) {
      // Session exists but user not found
      return {
        error: NextResponse.json(
          { error: "Forbidden - Invalid token or user not found" },
          { status: 403 }
        ),
        user: null
      }
    }
    
    return {
      error: null,
      user
    }
  } catch (error) {
    console.error("API authentication error:", error)
    return {
      error: NextResponse.json(
        { error: "Internal authentication error" },
        { status: 500 }
      ),
      user: null
    }
  }
}

/**
 * Wrapper for API route handlers that require authentication
 */
export function withApiAuth(
  handler: (req: Request, context: any, user: any) => Promise<Response>
) {
  return async (req: Request, context: any) => {
    const { error, user } = await validateApiAuth()
    
    if (error) {
      return error
    }
    
    return handler(req, context, user)
  }
}