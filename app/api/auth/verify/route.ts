import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or expired token" },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      authenticated: true,
      user: session.user
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json(
      { error: "Authentication verification failed" },
      { status: 500 }
    )
  }
}