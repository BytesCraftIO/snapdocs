'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/avatar'
import { Workspace } from '@/types'

interface WorkspaceSwitcherProps {
  workspace: Workspace
  className?: string
}

export function WorkspaceSwitcher({ workspace, className }: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([workspace])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data)
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkspaceSwitch = (workspaceId: string) => {
    if (workspaceId !== workspace.id) {
      router.push(`/workspace/${workspaceId}`)
    }
  }

  const handleCreateWorkspace = () => {
    router.push('/workspace/new')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between h-8 px-2 text-left font-normal",
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {workspace.icon ? (
              <span className="text-lg shrink-0">{workspace.icon}</span>
            ) : (
              <Avatar className="w-5 h-5 shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
              </Avatar>
            )}
            <span className="truncate text-sm font-medium">
              {workspace.name}
            </span>
          </div>
          <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="start">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Workspaces
        </div>
        
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => handleWorkspaceSwitch(ws.id)}
            className="flex items-center gap-2 px-2 py-2"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {ws.icon ? (
                <span className="text-lg shrink-0">{ws.icon}</span>
              ) : (
                <Avatar className="w-6 h-6 shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                </Avatar>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {ws.name}
                </span>
                {ws.domain && (
                  <span className="text-xs text-muted-foreground truncate">
                    {ws.domain}
                  </span>
                )}
              </div>
            </div>
            
            {ws.id === workspace.id && (
              <Check className="w-4 h-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleCreateWorkspace}
          className="flex items-center gap-2 px-2 py-2"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Create workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}