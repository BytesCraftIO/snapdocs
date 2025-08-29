import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { generateId } from '@/lib/utils/id'
import CreateDatabasePage from './CreateDatabasePage'

interface CreateDatabasePageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function CreateDatabase({ params }: CreateDatabasePageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await params

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
    redirect(`/workspace/${resolvedParams.workspaceId}`)
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: resolvedParams.workspaceId },
    select: { id: true, name: true, slug: true }
  })

  if (!workspace) {
    redirect('/')
  }

  return (
    <CreateDatabasePage
      workspaceId={resolvedParams.workspaceId}
      workspace={workspace}
      user={user}
    />
  )
}