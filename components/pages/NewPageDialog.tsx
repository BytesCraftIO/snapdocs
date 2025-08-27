'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Database, Calendar, Kanban, List, Users, BookOpen, Code, Rocket } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { PageTemplate, NewPageOptions } from '@/types'

interface NewPageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  parentPageId?: string
}

const DEFAULT_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank page',
    description: 'Start with an empty page',
    icon: '📄',
    category: 'personal',
    blocks: [
      {
        id: '1',
        type: 'paragraph',
        content: '',
        properties: {},
        order: 0
      }
    ],
    isBuiltIn: true
  },
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    description: 'Agenda, notes, and action items',
    icon: '📝',
    category: 'team',
    blocks: [
      {
        id: '1',
        type: 'heading1',
        content: 'Meeting Notes',
        properties: {},
        order: 0
      },
      {
        id: '2',
        type: 'paragraph',
        content: '',
        properties: {},
        order: 1
      },
      {
        id: '3',
        type: 'heading2',
        content: 'Agenda',
        properties: {},
        order: 2
      },
      {
        id: '4',
        type: 'bulletList',
        content: '[]',
        properties: {},
        order: 3
      },
      {
        id: '5',
        type: 'heading2',
        content: 'Action Items',
        properties: {},
        order: 4
      },
      {
        id: '6',
        type: 'todoList',
        content: '[]',
        properties: { checked: false },
        order: 5
      }
    ],
    isBuiltIn: true
  },
  {
    id: 'project-plan',
    name: 'Project plan',
    description: 'Goals, timeline, and deliverables',
    icon: '📋',
    category: 'team',
    blocks: [
      {
        id: '1',
        type: 'heading1',
        content: 'Project Plan',
        properties: {},
        order: 0
      },
      {
        id: '2',
        type: 'heading2',
        content: 'Overview',
        properties: {},
        order: 1
      },
      {
        id: '3',
        type: 'paragraph',
        content: 'Brief description of the project...',
        properties: {},
        order: 2
      },
      {
        id: '4',
        type: 'heading2',
        content: 'Goals & Objectives',
        properties: {},
        order: 3
      },
      {
        id: '5',
        type: 'bulletList',
        content: '[]',
        properties: {},
        order: 4
      },
      {
        id: '6',
        type: 'heading2',
        content: 'Timeline',
        properties: {},
        order: 5
      }
    ],
    isBuiltIn: true
  },
  {
    id: 'engineering-spec',
    name: 'Engineering spec',
    description: 'Technical requirements and architecture',
    icon: '⚙️',
    category: 'engineering',
    blocks: [
      {
        id: '1',
        type: 'heading1',
        content: 'Engineering Specification',
        properties: {},
        order: 0
      },
      {
        id: '2',
        type: 'heading2',
        content: 'Overview',
        properties: {},
        order: 1
      },
      {
        id: '3',
        type: 'paragraph',
        content: 'High-level description of the feature or system...',
        properties: {},
        order: 2
      },
      {
        id: '4',
        type: 'heading2',
        content: 'Requirements',
        properties: {},
        order: 3
      },
      {
        id: '5',
        type: 'heading2',
        content: 'Technical Design',
        properties: {},
        order: 4
      },
      {
        id: '6',
        type: 'heading2',
        content: 'Implementation Plan',
        properties: {},
        order: 5
      }
    ],
    isBuiltIn: true
  },
  {
    id: 'class-notes',
    name: 'Class notes',
    description: 'Structured notes for lectures',
    icon: '🎓',
    category: 'education',
    blocks: [
      {
        id: '1',
        type: 'heading1',
        content: 'Class Notes',
        properties: {},
        order: 0
      },
      {
        id: '2',
        type: 'paragraph',
        content: 'Course: | Date: | Topic:',
        properties: {},
        order: 1
      },
      {
        id: '3',
        type: 'divider',
        content: '',
        properties: {},
        order: 2
      },
      {
        id: '4',
        type: 'heading2',
        content: 'Key Concepts',
        properties: {},
        order: 3
      },
      {
        id: '5',
        type: 'bulletList',
        content: '[]',
        properties: {},
        order: 4
      },
      {
        id: '6',
        type: 'heading2',
        content: 'Questions',
        properties: {},
        order: 5
      }
    ],
    isBuiltIn: true
  }
]

const CATEGORY_ICONS = {
  personal: Users,
  team: Users,
  education: BookOpen,
  engineering: Code
}

const CATEGORY_LABELS = {
  personal: 'Personal',
  team: 'Team',
  education: 'Education',
  engineering: 'Engineering'
}

export function NewPageDialog({ 
  open, 
  onOpenChange, 
  workspaceId,
  parentPageId 
}: NewPageDialogProps) {
  const [title, setTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'personal' | 'team' | 'education' | 'engineering'>('all')
  const [isCreating, setIsCreating] = useState(false)
  
  const router = useRouter()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTitle('')
      setSelectedTemplate('blank')
      setSelectedCategory('all')
    }
  }, [open])

  const filteredTemplates = DEFAULT_TEMPLATES.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  )

  const handleCreatePage = async () => {
    if (!title.trim() || !selectedTemplate) return

    setIsCreating(true)
    try {
      const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate)
      
      const options: NewPageOptions = {
        title: title.trim(),
        icon: template?.icon || '📄',
        parentId: parentPageId,
        templateId: selectedTemplate,
        workspaceId
      }

      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: options.title,
          icon: options.icon,
          workspaceId: options.workspaceId,
          parentId: options.parentId,
          template: template
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create page')
      }

      const newPage = await response.json()
      
      // Navigate to the new page
      router.push(`/workspace/${workspaceId}/page/${newPage.id}`)
      
      // Close dialog
      onOpenChange(false)
      
      // Refresh the page to update sidebar
      window.location.reload() // Temporary solution

    } catch (error) {
      console.error('Failed to create page:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleCreatePage()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Create new page</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left sidebar - Categories */}
          <div className="w-48 border-r bg-muted/30 p-4">
            <div className="space-y-1">
              <Button
                variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => setSelectedCategory('all')}
              >
                All templates
              </Button>
              
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => setSelectedCategory(key as any)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Templates grid */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      className={cn(
                        "text-left p-4 rounded-lg border-2 transition-all hover:border-primary/50",
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium mb-1">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <Separator />

            {/* Bottom form */}
            <div className="p-6 border-t">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Page title</Label>
                  <Input
                    id="title"
                    placeholder="Enter page title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="mt-1"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {parentPageId 
                      ? 'This page will be created inside the selected parent page'
                      : 'This page will be created at the root level'
                    }
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePage}
                      disabled={!title.trim() || isCreating}
                    >
                      {isCreating ? (
                        <>Creating...</>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create page
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Listen for custom events to open the dialog
export function useNewPageDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpenDialog = () => setOpen(true)
    
    window.addEventListener('open-new-page-dialog', handleOpenDialog)
    return () => window.removeEventListener('open-new-page-dialog', handleOpenDialog)
  }, [])

  return { open, setOpen }
}