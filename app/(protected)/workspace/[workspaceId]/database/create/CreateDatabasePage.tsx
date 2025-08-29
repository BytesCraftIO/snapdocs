'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreateDatabaseDialog } from '@/components/database'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Database } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface CreateDatabasePageProps {
  workspaceId: string
  workspace: {
    id: string
    name: string
    slug: string
  }
  user: {
    id: string
    email: string
    name?: string | null
  }
}

export default function CreateDatabasePage({ workspaceId, workspace, user }: CreateDatabasePageProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(true)

  const handleCreateDatabase = async (database: any) => {
    toast.success('Database created successfully!')
    router.push(`/workspace/${workspaceId}/database/${database.id}`)
  }

  const handleCancel = () => {
    router.push(`/workspace/${workspaceId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/workspace/${workspaceId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to workspace
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl font-bold">Create New Database</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Create a structured database to organize and manage your data
          </p>
        </div>

        <CreateDatabaseDialog
          open={showDialog}
          onOpenChange={(open) => {
            if (!open) handleCancel()
          }}
          workspaceId={workspaceId}
          onCreateDatabase={handleCreateDatabase}
        />
      </div>
    </div>
  )
}