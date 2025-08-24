import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { pageContentService } from '@/lib/services/page-content'
import PageEditorV2 from './PageEditorV2'

interface PageEditorPageProps {
  params: Promise<{
    workspaceId: string
    pageId: string
  }>
}

export default async function PageEditorPage({ params }: PageEditorPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await params

  try {
    // Get page metadata from PostgreSQL
    const page = await prisma.page.findFirst({
      where: {
        id: resolvedParams.pageId,
        workspaceId: resolvedParams.workspaceId,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            path: true
          }
        }
      }
    })

    if (!page) {
      notFound()
    }

    // Check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: resolvedParams.workspaceId
        }
      }
    })

    if (!workspaceMember) {
      // User is not a member of this workspace
      notFound()
    }

    // Get page content from MongoDB
    const pageContent = await pageContentService.loadPageContent(resolvedParams.pageId)

    return (
      <PageEditorV2 
        page={page}
        initialContent={pageContent}
        user={user}
      />
    )
  } catch (error) {
    console.error('Error loading page:', error)
    notFound()
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageEditorPageProps) {
  const resolvedParams = await params
  
  try {
    const page = await prisma.page.findFirst({
      where: {
        id: resolvedParams.pageId,
        isDeleted: false
      },
      select: {
        title: true,
        workspace: {
          select: {
            name: true
          }
        }
      }
    })

    if (!page) {
      return {
        title: 'Page Not Found'
      }
    }

    return {
      title: `${page.title || 'Untitled'} - ${page.workspace.name}`,
      description: `Edit page in ${page.workspace.name}`
    }
  } catch (error) {
    return {
      title: 'Page Editor'
    }
  }
}