'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { SidebarV2 } from '@/components/sidebar/SidebarV2'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Workspace, Page } from '@/types'
import { cn } from '@/lib/utils'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  workspace: Workspace
  pages: Page[]
}

export function WorkspaceLayout({ children, workspace, pages }: WorkspaceLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  // Get current page ID from URL
  const currentPageId = pathname.includes('/page/') 
    ? pathname.split('/page/')[1]?.split('/')[0]
    : undefined

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Cmd+\ or Ctrl+\
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Persist sidebar state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`sidebar-open-${workspace.id}`)
    if (stored !== null) {
      setSidebarOpen(JSON.parse(stored))
    }
  }, [workspace.id])

  useEffect(() => {
    localStorage.setItem(`sidebar-open-${workspace.id}`, JSON.stringify(sidebarOpen))
  }, [sidebarOpen, workspace.id])

  // Handle responsive sidebar for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setSidebarOpen(false)
      }
    }

    handleResize() // Check initial size
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <SidebarV2
          workspace={workspace}
          pages={pages}
          currentPageId={currentPageId}
          isOpen={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
        
        <main 
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out overflow-auto",
            sidebarOpen ? "md:ml-60" : "ml-0"
          )}
        >
          {children}
        </main>
      </div>
      <Toaster position="bottom-center" />
    </TooltipProvider>
  )
}