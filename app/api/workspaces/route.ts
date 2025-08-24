import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { requireAuth } from "@/lib/auth"

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Name too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug too long"),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    // Validate input
    const validatedData = createWorkspaceSchema.parse(body)
    let { name, slug } = validatedData

    // Check if slug is already taken and generate a unique one if needed
    let finalSlug = slug
    let counter = 1
    let existingWorkspace = await prisma.workspace.findUnique({
      where: { slug: finalSlug }
    })

    while (existingWorkspace) {
      finalSlug = `${slug}-${counter}`
      counter++
      existingWorkspace = await prisma.workspace.findUnique({
        where: { slug: finalSlug }
      })
    }

    // Create workspace and add user as owner
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug: finalSlug,
        members: {
          create: {
            userId: user.id,
            role: "OWNER"
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            pages: true
          }
        }
      }
    })

    return NextResponse.json(workspace, { status: 201 })

  } catch (error) {
    console.error("Create workspace error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: error.errors.map(err => ({
            field: err.path.join("."),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            pages: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    })

    return NextResponse.json(workspaces)

  } catch (error) {
    console.error("Get workspaces error:", error)
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}