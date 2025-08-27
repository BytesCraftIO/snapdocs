import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }
    
    // Convert file to base64 for storage
    // In production, you would upload to S3/MinIO instead
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`
    
    // Update user avatar
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: base64 },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      }
    })
    
    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl
    })
    
  } catch (error) {
    console.error("Avatar upload error:", error)
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}