'use client'

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { 
  BlockNoteEditor,
  Block as BlockNoteBlock,
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  filterSuggestionItems
} from '@blocknote/core'
import { 
  useCreateBlockNote,
  createReactBlockSpec,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  DefaultReactSuggestionItem
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/react/style.css'
import '@blocknote/mantine/style.css'
import { Block as AppBlockType } from '@/types'
import { Save, Clock, AlertCircle, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { 
  createCollaborationProvider, 
  generateUserColor, 
  cleanupCollaborationProvider 
} from '@/lib/collaboration/yjs-provider'
import type YPartyKitProvider from 'y-partykit/provider'
import { Mention } from './Mention'

// Dynamically import DatabaseBlock to avoid SSR issues
const DatabaseBlock = dynamic(() => import('./DatabaseBlock'), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg my-4" />
})

interface BlockNoteEditorProps {
  pageId: string
  workspaceId?: string
  initialBlocks?: AppBlockType[]
  onSave?: (blocks: AppBlockType[]) => void
  onAutoSave?: (blocks: AppBlockType[]) => Promise<void>
  readOnly?: boolean
  autoSaveInterval?: number
  showSaveStatus?: boolean
  userId?: string
  user?: {
    id: string
    name?: string | null
    email?: string | null
  }
  enableCollaboration?: boolean
  workspaceMembers?: Array<{
    id: string
    name?: string | null
    email?: string | null
  }>
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved'

export default function BlockNoteEditorComponent({
  pageId,
  workspaceId,
  initialBlocks = [],
  onSave,
  onAutoSave,
  readOnly = false,
  autoSaveInterval = 5000,
  showSaveStatus = true,
  userId,
  user,
  enableCollaboration = true,
  workspaceMembers = []
}: BlockNoteEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousBlocksRef = useRef<AppBlockType[]>(initialBlocks)
  const collaborationProviderRef = useRef<YPartyKitProvider | null>(null)
  const [userColor] = useState(() => generateUserColor())
  const [editorReady, setEditorReady] = useState(false)

  // Convert our blocks to BlockNote format
  const convertToBlockNoteFormat = useCallback((blocks: AppBlockType[]): any => {
    try {
      if (!blocks || blocks.length === 0) {
        // Return undefined to let BlockNote create default content
        return undefined
      }
      
      // If blocks already have BlockNote structure, return as is
      if (blocks[0] && 'type' in blocks[0] && 'content' in blocks[0]) {
        return blocks as any
      }
      
      // Otherwise, convert to basic BlockNote format
      return blocks.map(block => ({
        id: block.id || crypto.randomUUID(),
        type: block.type || 'paragraph',
        content: block.content || [],
        props: (block as any).props || block.properties || {},
        children: block.children || []
      }))
    } catch (error) {
      console.error('Error converting blocks:', error)
      return undefined
    }
  }, [])

  // Create React database block component
  const databaseBlockComponent = useMemo(() => createReactBlockSpec(
    {
      type: "database" as const,
      propSchema: {
        databaseId: {
          default: "" as const
        },
        workspaceId: {
          default: "" as const
        },
        pageId: {
          default: "" as const
        },
        fullPage: {
          default: false as const
        },
        maxRows: {
          default: 10 as const
        }
      } as const,
      content: "none" as const,
    },
    {
      render: (props: any) => {
        const data = {
          databaseId: props.block.props.databaseId || '',
          workspaceId: props.block.props.workspaceId || workspaceId || '',
          pageId: props.block.props.pageId || pageId || '',
          fullPage: props.block.props.fullPage || false,
          maxRows: props.block.props.maxRows || 10
        }
        return <DatabaseBlock 
          data={data} 
          editor={props.editor} 
          blockId={props.block.id}
          onPropsChange={(newProps: any) => {
            // Update the block props when database is created
            const updatedBlock = {
              ...props.block,
              props: {
                ...props.block.props,
                ...newProps
              }
            }
            props.editor.updateBlock(props.block, updatedBlock)
          }}
        />
      }
    }
  ), [workspaceId, pageId])

  // Create custom block specs
  const customBlockSpecs = useMemo(() => ({
    ...defaultBlockSpecs,
    database: databaseBlockComponent,
  }), [databaseBlockComponent])

  // Create the custom schema
  const schema = useMemo(() => {
    return BlockNoteSchema.create({
      blockSpecs: customBlockSpecs,
      inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        mention: Mention,
      },
    })
  }, [customBlockSpecs])

  // Setup collaboration if enabled
  const collaborationConfig = useMemo(() => {
    if (!enableCollaboration || !workspaceId || !user?.id) {
      return undefined
    }

    try {
      const collaboration = createCollaborationProvider(
        pageId,
        workspaceId,
        {
          id: user.id,
          name: user.name || 'Anonymous',
          color: userColor
        }
      )

      collaborationProviderRef.current = collaboration.provider

      return {
        provider: collaboration.provider,
        fragment: collaboration.fragment,
        user: collaboration.user,
        showCursorLabels: "activity" as const
      }
    } catch (error) {
      console.error('Failed to setup collaboration:', error)
      return undefined
    }
  }, [enableCollaboration, pageId, workspaceId, user, userColor])

  // Prepare initial content
  const initialContent = useMemo(() => {
    // When using collaboration, let Yjs handle initial content
    if (collaborationConfig) {
      return undefined
    }
    // Otherwise use local initial blocks
    return convertToBlockNoteFormat(initialBlocks)
  }, [collaborationConfig, initialBlocks, convertToBlockNoteFormat])

  // Create the BlockNote editor with custom schema and collaboration
  const editor = useCreateBlockNote({
    schema,
    initialContent,
    collaboration: collaborationConfig,
    uploadFile: async (file: File) => {
      // Handle file uploads
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      return data.url
    }
  } as any, [schema, initialContent, collaborationConfig])

  // Mark editor as ready
  useEffect(() => {
    setEditorReady(true)
  }, [])

  // Create custom slash menu item for database
  const insertDatabaseItem = useCallback((editor: BlockNoteEditor) => ({
    title: 'Database',
    onItemClick: () => {
      try {
        const currentBlock = editor.getTextCursorPosition().block
        if (currentBlock) {
          editor.insertBlocks(
            [{
              type: 'database',
              props: {
                databaseId: '',
                workspaceId: workspaceId || '',
                pageId: pageId || '',
                fullPage: false,
                maxRows: 10
              }
            } as any],
            currentBlock,
            'after'
          )
        }
      } catch (error) {
        console.error('Failed to insert database block:', error)
      }
    },
    aliases: ['db', 'table', 'spreadsheet', 'data', 'database'],
    group: 'Other',
    icon: <Database size={18} />,
    subtext: 'Insert a database view',
  }), [workspaceId, pageId])

  // Get custom slash menu items including database
  const getCustomSlashMenuItems = useCallback(
    (editor: BlockNoteEditor): DefaultReactSuggestionItem[] => [
      ...getDefaultReactSlashMenuItems(editor),
      insertDatabaseItem(editor),
    ],
    [insertDatabaseItem]
  )

  // Get mention menu items from workspace members
  const getMentionMenuItems = useCallback(
    (editor: any): DefaultReactSuggestionItem[] => {
      // Include the current user
      const allUsers = [
        ...(user ? [user] : []),
        ...workspaceMembers.filter(member => member.id !== user?.id)
      ]

      return allUsers.map((member) => ({
        title: member.name || member.email || 'Unknown User',
        onItemClick: async () => {
          editor.insertInlineContent([
            {
              type: "mention",
              props: {
                user: member.name || member.email || 'Unknown',
                userId: member.id,
                email: member.email || undefined
              },
            },
            " ", // add a space after the mention
          ])
          
          // Send notification for the mention
          if (member.id !== user?.id) {
            try {
              await fetch('/api/notifications/mention', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: member.id,
                  pageId,
                  workspaceId,
                  message: `mentioned you in a document`
                })
              })
            } catch (error) {
              console.error('Failed to send mention notification:', error)
            }
          }
        },
        subtext: member.email || undefined,
      }))
    },
    [user, workspaceMembers, pageId, workspaceId]
  )

  // Convert BlockNote blocks back to our storage format
  const convertFromBlockNoteFormat = useCallback((blocks: BlockNoteBlock[]): AppBlockType[] => {
    try {
      return blocks.map((block, index) => ({
        id: block.id,
        type: block.type as any,
        content: block.content as any || '',
        properties: block.props || {},
        children: block.children as any || [],
        order: index,
        createdAt: new Date(),
        updatedAt: new Date()
      })) as AppBlockType[]
    } catch (error) {
      console.error('Error converting from BlockNote format:', error)
      return []
    }
  }, [])

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (readOnly || saveStatus === 'saving' || !editorReady) return
    
    try {
      const blocks = convertFromBlockNoteFormat(editor.document)
      
      // Check if content actually changed
      const currentContent = JSON.stringify(blocks)
      const previousContent = JSON.stringify(previousBlocksRef.current)
      if (currentContent === previousContent) {
        setSaveStatus('saved')
        return
      }
      
      setSaveStatus('saving')
      
      if (onAutoSave) {
        await onAutoSave(blocks)
      } else if (onSave) {
        onSave(blocks)
      }
      setSaveStatus('saved')
      previousBlocksRef.current = [...blocks]
    } catch (error) {
      console.error('Error saving blocks:', error)
      setSaveStatus('error')
      toast.error('Failed to save changes')
    }
  }, [editor, onAutoSave, onSave, readOnly, saveStatus, editorReady, convertFromBlockNoteFormat])

  // Handle editor changes
  useEffect(() => {
    if (!editorReady) return

    const handleChange = () => {
      if (!readOnly) {
        setSaveStatus('unsaved')
        
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        
        // Set new timeout for auto-save
        autoSaveTimeoutRef.current = setTimeout(() => {
          performAutoSave()
        }, autoSaveInterval)
      }
    }

    const unsubscribe = editor.onChange(handleChange)
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      unsubscribe?.()
    }
  }, [editor, performAutoSave, autoSaveInterval, readOnly, editorReady])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up auto-save timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      // Perform final save if there are unsaved changes
      if (saveStatus === 'unsaved' && !readOnly && editorReady) {
        const blocks = convertFromBlockNoteFormat(editor.document)
        if (onSave) {
          onSave(blocks)
        }
      }
      
      // Clean up collaboration provider
      if (collaborationProviderRef.current) {
        cleanupCollaborationProvider(collaborationProviderRef.current)
      }
    }
  }, [saveStatus, readOnly, editor, onSave, editorReady, convertFromBlockNoteFormat])

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saved':
        return <Save className="h-3 w-3" />
      case 'saving':
        return <Clock className="h-3 w-3 animate-spin" />
      case 'error':
        return <AlertCircle className="h-3 w-3" />
      case 'unsaved':
        return <Clock className="h-3 w-3" />
    }
  }

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return 'Saved'
      case 'saving':
        return 'Saving...'
      case 'error':
        return 'Error saving'
      case 'unsaved':
        return 'Unsaved changes'
    }
  }

  if (!editorReady) {
    return (
      <div className="h-32 bg-gray-100 animate-pulse rounded-lg my-4" />
    )
  }

  return (
    <div className="blocknote-editor-container">
      {/* Save status indicator */}
      {showSaveStatus && (
        <div className="fixed top-4 right-4 z-50">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200",
            saveStatus === 'saved' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            saveStatus === 'saving' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            saveStatus === 'error' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            saveStatus === 'unsaved' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          )}>
            {getSaveStatusIcon()}
            <span className="hidden sm:inline">{getSaveStatusText()}</span>
          </div>
        </div>
      )}

      <div className="relative">
        <BlockNoteView 
          editor={editor} 
          editable={!readOnly}
          theme="light"
          slashMenu={false}
        >
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => 
              filterSuggestionItems(getCustomSlashMenuItems(editor), query)
            }
          />
          <SuggestionMenuController
            triggerCharacter="@"
            getItems={async (query) =>
              filterSuggestionItems(getMentionMenuItems(editor as any), query)
            }
          />
        </BlockNoteView>
      </div>
      
      {/* Custom styles to align content with title */}
      <style jsx global>{`
        .bn-container .bn-editor {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        
        .bn-container .bn-block-outer {
          margin-left: -52px !important;
          position: relative;
        }
        
        .bn-container .bn-block-content {
          margin-left: 52px !important;
        }
        
        .bn-container .bn-drag-handle-menu {
          left: 0 !important;
        }
        
        .bn-container .bn-block-side-menu {
          left: 28px !important;
        }
        
        /* Collaboration cursor styles are handled automatically by BlockNote */
      `}</style>
    </div>
  )
}