'use client'

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { 
  BlockNoteEditor,
  PartialBlock,
  Block as BlockNoteBlock,
  defaultBlockSpecs
} from '@blocknote/core'
import { 
  useCreateBlockNote
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/react/style.css'
import '@blocknote/mantine/style.css'
import '@/styles/blocknote-custom.css'
import { Block as AppBlockType } from '@/types'
import { generateId } from '@/lib/utils/id'
import { Save, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSocket } from '@/lib/socket/client'

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
  onBlockUpdateReceived?: (blockId: string, content: any) => void
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved'

// Convert our block types to BlockNote format
function convertToBlockNoteBlocks(blocks: AppBlockType[]): PartialBlock[] {
  if (!blocks || blocks.length === 0) {
    return [{
      type: 'paragraph',
      content: ''
    }]
  }

  const result: PartialBlock[] = []
  
  blocks.forEach(block => {
    // Handle list blocks - they need special conversion
    if (block.type === 'bulletList' || block.type === 'numberedList' || block.type === 'todoList') {
      const items = (block.properties as any)?.items || []
      const listType = block.type === 'bulletList' ? 'bulletListItem' : 
                      block.type === 'numberedList' ? 'numberedListItem' : 'checkListItem'
      
      items.forEach((item: any) => {
        const bnBlock: PartialBlock = {
          id: generateId(),
          type: listType,
          content: item.content || '',
        }
        
        if (block.type === 'todoList') {
          bnBlock.props = { checked: item.checked || false }
        }
        
        result.push(bnBlock)
      })
      return
    }
    
    // Handle other block types
    const bnBlock: PartialBlock = {
      id: block.id,
      type: mapBlockType(block.type),
      content: typeof block.content === 'string' ? block.content : '',
    }

    // Handle special properties
    if (block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3') {
      bnBlock.type = 'heading'
      bnBlock.props = {
        level: block.type === 'heading1' ? 1 : block.type === 'heading2' ? 2 : 3
      }
    }

    if (block.type === 'code') {
      bnBlock.props = {
        language: (block.properties as any)?.language || 'javascript'
      }
    }

    result.push(bnBlock)
  })
  
  return result.length > 0 ? result : [{
    type: 'paragraph',
    content: ''
  }]
}

// Convert BlockNote blocks back to our format
function convertFromBlockNoteBlocks(blocks: BlockNoteBlock[]): AppBlockType[] {
  const result: AppBlockType[] = []
  let listItems: any[] = []
  let currentListType: string | null = null
  let listStartId: string | null = null

  blocks.forEach((block, index) => {
    // Handle list aggregation
    if (block.type === 'bulletListItem' || block.type === 'numberedListItem' || block.type === 'checkListItem') {
      const listType = block.type === 'bulletListItem' ? 'bulletList' : 
                      block.type === 'numberedListItem' ? 'numberedList' : 'todoList'
      
      if (currentListType !== listType) {
        // Flush previous list if exists
        if (currentListType && listItems.length > 0) {
          result.push(createListBlock(currentListType, listItems, listStartId!))
        }
        currentListType = listType
        listItems = []
        listStartId = generateId()
      }

      const textContent = Array.isArray(block.content) 
        ? block.content.map((c: any) => c.text || '').join('')
        : block.content || ''

      listItems.push({
        id: generateId(),
        content: textContent,
        indent: 0,
        ...(block.type === 'checkListItem' ? { checked: block.props?.checked || false } : {})
      })

      // If it's the last block or next block is different type, flush the list
      if (index === blocks.length - 1 || 
          (blocks[index + 1] && !['bulletListItem', 'numberedListItem', 'checkListItem'].includes(blocks[index + 1].type))) {
        result.push(createListBlock(currentListType, listItems, listStartId))
        currentListType = null
        listItems = []
        listStartId = null
      }
      return
    }

    // Flush any pending list
    if (currentListType && listItems.length > 0) {
      result.push(createListBlock(currentListType, listItems, listStartId!))
      currentListType = null
      listItems = []
      listStartId = null
    }

    const textContent = Array.isArray(block.content) 
      ? block.content.map((c: any) => c.text || '').join('')
      : block.content || ''

    const appBlock: AppBlockType = {
      id: block.id,
      type: reverseMapBlockType(block.type, block.props),
      content: textContent,
      order: result.length,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Handle special properties
    if (block.type === 'heading' && block.props?.level) {
      appBlock.type = `heading${block.props.level}` as any
    }

    if (block.type === 'codeBlock') {
      appBlock.properties = {
        language: block.props?.language || 'javascript'
      }
    }

    result.push(appBlock)
  })

  // Flush any remaining list
  if (currentListType && listItems.length > 0) {
    result.push(createListBlock(currentListType, listItems, listStartId!))
  }

  return result
}

function createListBlock(listType: string, items: any[], id: string): AppBlockType {
  const type = listType === 'bulletList' ? 'bulletList' : 
               listType === 'numberedList' ? 'numberedList' : 'todoList'
  
  return {
    id,
    type: type as any,
    content: '',
    properties: {
      listType: listType === 'bulletList' ? 'bullet' : 
                listType === 'numberedList' ? 'numbered' : 'todo',
      items
    },
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Map our block types to BlockNote types
function mapBlockType(type: string): string {
  const mapping: Record<string, string> = {
    'paragraph': 'paragraph',
    'heading1': 'heading',
    'heading2': 'heading',
    'heading3': 'heading',
    'quote': 'paragraph', // BlockNote doesn't have quote by default
    'code': 'codeBlock',
    'divider': 'paragraph', 
    'callout': 'paragraph', 
    'toggle': 'paragraph',
    'database': 'table',
  }
  return mapping[type] || 'paragraph'
}

function reverseMapBlockType(bnType: string, props?: any): string {
  if (bnType === 'heading' && props?.level) {
    return `heading${props.level}` as any
  }
  
  const mapping: Record<string, string> = {
    'paragraph': 'paragraph',
    'codeBlock': 'code',
    'table': 'database',
  }
  
  return (mapping[bnType] || 'paragraph') as any
}

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
  onBlockUpdateReceived
}: BlockNoteEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const previousBlocksRef = useRef<AppBlockType[]>(initialBlocks)
  const isProcessingRemoteUpdate = useRef(false)
  const lastSyncedContent = useRef<string>('')
  
  const { 
    sendContentSync,
    onContentSync,
    isConnected 
  } = useSocket()

  // Create the BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: initialBlocks.length > 0 
      ? convertToBlockNoteBlocks(initialBlocks)
      : undefined,
  })

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (readOnly || isProcessingRemoteUpdate.current) return
    
    const blocks = convertFromBlockNoteBlocks(editor.document)
    
    // Check if there are actual changes
    const hasChanges = JSON.stringify(blocks) !== JSON.stringify(previousBlocksRef.current)
    
    if (!hasChanges) {
      if (saveStatus === 'unsaved') {
        setSaveStatus('saved')
      }
      return
    }
    
    setSaveStatus('saving')
    
    try {
      if (onAutoSave) {
        await onAutoSave(blocks)
      } else if (onSave) {
        onSave(blocks)
      }
      setSaveStatus('saved')
      previousBlocksRef.current = [...blocks]
      
      // Send full sync after save
      if (isConnected && userId) {
        sendContentSync(pageId, blocks, userId)
        lastSyncedContent.current = JSON.stringify(blocks)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('error')
      toast.error('Failed to save changes')
    }
  }, [editor, onAutoSave, onSave, readOnly, saveStatus, isConnected, userId, pageId, sendContentSync])

  // Handle editor changes - send real-time updates
  useEffect(() => {
    const handleChange = () => {
      if (!readOnly && !isProcessingRemoteUpdate.current) {
        setSaveStatus('unsaved')
        
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        
        // Send real-time sync immediately for collaboration
        if (isConnected && userId) {
          const blocks = convertFromBlockNoteBlocks(editor.document)
          const currentContent = JSON.stringify(blocks)
          
          // Only send if content actually changed
          if (currentContent !== lastSyncedContent.current) {
            sendContentSync(pageId, blocks, userId)
            lastSyncedContent.current = currentContent
          }
        }
        
        // Schedule auto-save
        autoSaveTimeoutRef.current = setTimeout(() => {
          performAutoSave()
        }, autoSaveInterval)
      }
    }

    editor.onChange(handleChange)
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [editor, performAutoSave, autoSaveInterval, readOnly, isConnected, userId, pageId, sendContentSync])

  // Listen for full content syncs from other users
  useEffect(() => {
    if (!onContentSync) return
    
    const cleanup = onContentSync((data: { blocks: AppBlockType[]; userId: string }) => {
      // Don't apply our own updates
      if (data.userId === userId) return
      
      isProcessingRemoteUpdate.current = true
      
      // Convert blocks to BlockNote format and replace entire document
      const bnBlocks = convertToBlockNoteBlocks(data.blocks)
      
      // Replace the entire document with the new content
      editor.replaceBlocks(editor.document, bnBlocks)
      
      // Update our tracking
      lastSyncedContent.current = JSON.stringify(data.blocks)
      previousBlocksRef.current = data.blocks
      
      // Reset flag after processing
      setTimeout(() => {
        isProcessingRemoteUpdate.current = false
      }, 500)
    })
    
    return cleanup
  }, [onContentSync, userId, editor])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return
      
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        performAutoSave()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [performAutoSave, readOnly])

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saved':
        return <Save className="w-3 h-3" />
      case 'saving':
        return <Clock className="w-3 h-3 animate-pulse" />
      case 'error':
        return <AlertCircle className="w-3 h-3" />
      case 'unsaved':
        return <Clock className="w-3 h-3" />
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

      <BlockNoteView 
        editor={editor} 
        editable={!readOnly}
        theme="light"
        className="min-h-[500px]"
      />
    </div>
  )
}