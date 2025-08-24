'use client'

import React, { useState, useCallback, useRef, useEffect, useReducer } from 'react'
import { DndContext, DragEndEvent, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Block as BlockType, EditorState, EditorAction, ListProperties, ListItem } from '@/types'
import BlockV2 from './BlockV2'
import SlashMenu from './SlashMenu'
import MentionAutocomplete from './MentionAutocomplete'
import { generateId } from '@/lib/utils/id'
import { pageContentService } from '@/lib/services/page-content'
import { Save, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSocket } from '@/lib/socket/client'
import { User } from '@prisma/client'

interface NotionEditorProps {
  pageId: string
  workspaceId?: string
  initialBlocks?: BlockType[]
  onSave?: (blocks: BlockType[]) => void
  onAutoSave?: (blocks: BlockType[]) => Promise<void>
  readOnly?: boolean
  autoSaveInterval?: number
  showSaveStatus?: boolean
  userId?: string
  onBlockUpdateReceived?: (blockId: string, content: any) => void
}

// Editor state reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_BLOCKS':
      return { ...state, blocks: action.payload }
    case 'ADD_BLOCK':
      const newBlocks = [...state.blocks]
      newBlocks.splice(action.payload.index, 0, action.payload.block)
      // Update order for all blocks
      newBlocks.forEach((block, i) => {
        block.order = i
      })
      return { ...state, blocks: newBlocks }
    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map(block =>
          block.id === action.payload.id
            ? { ...block, ...action.payload.updates, updatedAt: new Date() }
            : block
        )
      }
    case 'DELETE_BLOCK':
      const filteredBlocks = state.blocks.filter(block => block.id !== action.payload)
      // Update order
      filteredBlocks.forEach((block, i) => {
        block.order = i
      })
      return { ...state, blocks: filteredBlocks }
    case 'MOVE_BLOCK':
      const blockIndex = state.blocks.findIndex(b => b.id === action.payload.id)
      if (blockIndex === -1) return state
      const movedBlocks = arrayMove(state.blocks, blockIndex, action.payload.newIndex)
      // Update order
      movedBlocks.forEach((block, i) => {
        block.order = i
      })
      return { ...state, blocks: movedBlocks }
    case 'SELECT_BLOCK':
      return { ...state, selectedBlockId: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved'

export default function NotionEditor({ 
  pageId,
  workspaceId, 
  initialBlocks = [], 
  onSave,
  onAutoSave,
  readOnly = false,
  autoSaveInterval = 5000, // Increased to 5s for full saves
  showSaveStatus = true,
  userId,
  onBlockUpdateReceived
}: NotionEditorProps) {
  const { 
    sendBlockUpdate, 
    sendBlockAdd, 
    sendBlockDelete, 
    sendBlockReorder,
    sendBlockFocus,
    sendBlockBlur, 
    sendContentSync, 
    onBlockUpdate, 
    onBlockAdd, 
    onBlockDelete, 
    onBlockReorder,
    onBlockFocus,
    onBlockBlur, 
    onContentSync, 
    isConnected 
  } = useSocket()
  const [editorState, dispatch] = useReducer(editorReducer, {
    blocks: initialBlocks,
    selectedBlockId: null,
    isLoading: false,
    lastSaved: undefined
  })
  
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  const [showMentionMenu, setShowMentionMenu] = useState(false)
  const [mentionMenuPosition, setMentionMenuPosition] = useState({ top: 0, left: 0 })
  const [mentionSearchQuery, setMentionSearchQuery] = useState('')
  const [currentMentionBlockId, setCurrentMentionBlockId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [draggedBlock, setDraggedBlock] = useState<BlockType | null>(null)
  const [blockUsers, setBlockUsers] = useState<Map<string, { userId: string; userName: string; userColor: string }>>(new Map())
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  
  const { blocks } = editorState
  const previousBlocksRef = useRef<BlockType[]>(initialBlocks)
  const hasLocalChanges = useRef(false)
  const isProcessingRemoteUpdate = useRef(false)
  
  // Update blocks when initialBlocks change (for real-time collaboration)
  const previousInitialBlocksRef = useRef(initialBlocks)
  useEffect(() => {
    // Only update if blocks are actually different and we don't have local changes
    // and we're not already processing a remote update
    if (!hasLocalChanges.current && !isProcessingRemoteUpdate.current) {
      const blocksChanged = JSON.stringify(initialBlocks) !== JSON.stringify(previousInitialBlocksRef.current)
      if (blocksChanged) {
        isProcessingRemoteUpdate.current = true
        dispatch({ type: 'SET_BLOCKS', payload: initialBlocks })
        previousInitialBlocksRef.current = initialBlocks
        previousBlocksRef.current = initialBlocks
        // Reset flag after a short delay
        setTimeout(() => {
          isProcessingRemoteUpdate.current = false
        }, 100)
      }
    }
  }, [initialBlocks])

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (readOnly || blocks.length === 0 || isProcessingRemoteUpdate.current) return
    
    // Deep comparison to check if there are actual content changes
    const hasContentChanges = () => {
      if (blocks.length !== previousBlocksRef.current.length) return true
      
      for (let i = 0; i < blocks.length; i++) {
        const current = blocks[i]
        const previous = previousBlocksRef.current[i]
        
        // Check if block IDs or types changed
        if (current.id !== previous.id || current.type !== previous.type) return true
        
        // Check content changes
        if (JSON.stringify(current.content) !== JSON.stringify(previous.content)) return true
        
        // Check properties changes (for lists, etc.)
        if (JSON.stringify(current.properties) !== JSON.stringify(previous.properties)) return true
      }
      
      return false
    }
    
    if (!hasContentChanges()) {
      if (saveStatus === 'unsaved') {
        setSaveStatus('saved')
      }
      return
    }
    
    setSaveStatus('saving')
    hasLocalChanges.current = true
    
    try {
      if (onAutoSave) {
        await onAutoSave(blocks)
      } else if (onSave) {
        onSave(blocks)
      }
      setSaveStatus('saved')
      previousBlocksRef.current = [...blocks] // Create a new array reference
      
      // Reset local changes flag after successful save
      setTimeout(() => {
        hasLocalChanges.current = false
      }, 100)
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('error')
      toast.error('Failed to save changes')
    }
  }, [blocks, onAutoSave, onSave, readOnly, saveStatus])

  // Auto-save effect (for persistent storage, less frequent)
  useEffect(() => {
    if (!readOnly && blocks.length > 0 && !isProcessingRemoteUpdate.current) {
      // Only check for changes if we're not processing a remote update
      const hasChanges = JSON.stringify(blocks) !== JSON.stringify(previousBlocksRef.current)
      
      if (hasChanges) {
        setSaveStatus('unsaved')
        hasLocalChanges.current = true
        
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        
        autoSaveTimeoutRef.current = setTimeout(() => {
          performAutoSave()
        }, autoSaveInterval)
      }
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [blocks, performAutoSave, autoSaveInterval, readOnly])
  
  // Send full content sync periodically (every 10 seconds)
  useEffect(() => {
    if (!readOnly && isConnected && userId && blocks.length > 0) {
      const syncInterval = setInterval(() => {
        sendContentSync(pageId, blocks, userId)
      }, 10000) // Sync every 10 seconds
      
      return () => clearInterval(syncInterval)
    }
  }, [blocks, isConnected, userId, pageId, readOnly, sendContentSync])

  // We'll initialize with empty block after addBlock is defined

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return
      
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        performAutoSave()
        return
      }
      
      // Cmd/Ctrl + Z to undo (future implementation)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        // TODO: Implement undo functionality
        return
      }
      
      // Cmd/Ctrl + Shift + Z to redo (future implementation)  
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        // TODO: Implement redo functionality
        return
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [performAutoSave, readOnly])

  const addBlock = useCallback((type: BlockType['type'], index?: number, afterBlockId?: string) => {
    // If afterBlockId is provided, find the index after that block
    let insertIndex = index
    if (afterBlockId && insertIndex === undefined) {
      const afterIndex = blocks.findIndex(b => b.id === afterBlockId)
      insertIndex = afterIndex !== -1 ? afterIndex + 1 : blocks.length
    }
    if (insertIndex === undefined) {
      insertIndex = blocks.length
    }

    const newBlock: BlockType = {
      id: generateId(),
      type,
      content: '',
      order: insertIndex,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // If creating a list, initialize with proper properties
    if (type === 'bulletList' || type === 'numberedList' || type === 'todoList') {
      const listType = type === 'bulletList' ? 'bullet' : type === 'numberedList' ? 'numbered' : 'todo'
      
      newBlock.properties = {
        listType,
        items: [{
          id: generateId(),
          content: '',
          indent: 0,
          ...(listType === 'todo' ? { checked: false } : {})
        }]
      } as ListProperties
    }
    
    dispatch({
      type: 'ADD_BLOCK',
      payload: { block: newBlock, index: insertIndex }
    })
    
    // Send real-time block addition
    if (!readOnly && isConnected && userId) {
      sendBlockAdd(pageId, newBlock, insertIndex, userId)
    }
    
    setShowSlashMenu(false)
    
    return newBlock.id
  }, [blocks, readOnly, isConnected, userId, pageId, sendBlockAdd])

  // Track if we've initialized an empty block
  const hasInitializedRef = useRef(false)
  
  // Initialize with empty block if needed (only once)
  useEffect(() => {
    if (blocks.length === 0 && !readOnly && !editorState.isLoading && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      addBlock('paragraph')
    }
  }, [blocks.length, readOnly, editorState.isLoading, addBlock])

  // Debounce helper
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Debounced function to send block updates via WebSocket
  const sendBlockUpdateDebounced = useCallback((blockId: string, content: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (isConnected && userId) {
        sendBlockUpdate(pageId, blockId, content, userId)
      }
    }, 100) // Send updates after 100ms of no typing
  }, [isConnected, userId, sendBlockUpdate, pageId])
  
  const updateBlock = useCallback((blockId: string, updates: Partial<BlockType>) => {
    // Update local state immediately
    dispatch({
      type: 'UPDATE_BLOCK',
      payload: { id: blockId, updates }
    })
    
    // Send real-time update via WebSocket for any changes
    if (!readOnly) {
      sendBlockUpdateDebounced(blockId, updates)
    }
  }, [readOnly, sendBlockUpdateDebounced])
  
  // Listen for block updates from other users
  useEffect(() => {
    if (!onBlockUpdate) return
    
    const cleanup = onBlockUpdate((data: { blockId: string; content: any; userId: string }) => {
      // Don't apply updates from ourselves
      if (data.userId === userId) return
      
      // Mark as processing remote update to prevent auto-save
      isProcessingRemoteUpdate.current = true
      
      // Update the specific block
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: {
          id: data.blockId,
          updates: data.content // This is the full updates object now
        }
      })
      
      // Reset flag after processing
      setTimeout(() => {
        isProcessingRemoteUpdate.current = false
      }, 100)
      
      // Notify parent component if needed
      onBlockUpdateReceived?.(data.blockId, data.content)
    })
    
    return cleanup
  }, [onBlockUpdate, userId, onBlockUpdateReceived])
  
  // Listen for block additions from other users
  useEffect(() => {
    if (!onBlockAdd) return
    
    const cleanup = onBlockAdd((data: { block: BlockType; index: number; userId: string }) => {
      // Don't apply additions from ourselves
      if (data.userId === userId) return
      
      // Mark as processing remote update
      isProcessingRemoteUpdate.current = true
      
      // Add the block at the specified index
      dispatch({
        type: 'ADD_BLOCK',
        payload: {
          block: data.block,
          index: data.index
        }
      })
      
      // Reset flag after processing
      setTimeout(() => {
        isProcessingRemoteUpdate.current = false
      }, 100)
    })
    
    return cleanup
  }, [onBlockAdd, userId])
  
  // Listen for block deletions from other users
  useEffect(() => {
    if (!onBlockDelete) return
    
    const cleanup = onBlockDelete((data: { blockId: string; userId: string }) => {
      // Don't apply deletions from ourselves
      if (data.userId === userId) return
      
      // Mark as processing remote update
      isProcessingRemoteUpdate.current = true
      
      // Delete the block
      dispatch({
        type: 'DELETE_BLOCK',
        payload: data.blockId
      })
      
      // Reset flag after processing
      setTimeout(() => {
        isProcessingRemoteUpdate.current = false
      }, 100)
    })
    
    return cleanup
  }, [onBlockDelete, userId])
  
  // Listen for block reorders from other users
  useEffect(() => {
    if (!onBlockReorder) return
    
    const cleanup = onBlockReorder((data: { blockId: string; newIndex: number; userId: string }) => {
      // Don't apply reorders from ourselves
      if (data.userId === userId) return
      
      // Mark as processing remote update
      isProcessingRemoteUpdate.current = true
      
      // Reorder the block
      dispatch({
        type: 'MOVE_BLOCK',
        payload: {
          id: data.blockId,
          newIndex: data.newIndex
        }
      })
      
      // Reset flag after processing
      setTimeout(() => {
        isProcessingRemoteUpdate.current = false
      }, 100)
    })
    
    return cleanup
  }, [onBlockReorder, userId])
  
  // Listen for block focus events from other users
  useEffect(() => {
    if (!onBlockFocus) return
    
    const cleanup = onBlockFocus((data: { blockId: string; userId: string; userName: string; userColor: string }) => {
      // Don't show our own focus
      if (data.userId === userId) return
      
      setBlockUsers(prev => {
        const newMap = new Map(prev)
        newMap.set(data.blockId, {
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor
        })
        return newMap
      })
    })
    
    return cleanup
  }, [onBlockFocus, userId])
  
  // Listen for block blur events from other users
  useEffect(() => {
    if (!onBlockBlur) return
    
    const cleanup = onBlockBlur((data: { blockId: string; userId: string }) => {
      // Don't process our own blur
      if (data.userId === userId) return
      
      setBlockUsers(prev => {
        const newMap = new Map(prev)
        const currentUser = newMap.get(data.blockId)
        if (currentUser?.userId === data.userId) {
          newMap.delete(data.blockId)
        }
        return newMap
      })
    })
    
    return cleanup
  }, [onBlockBlur, userId])
  
  // Listen for full content syncs
  useEffect(() => {
    if (!onContentSync) return
    
    const cleanup = onContentSync((data: { blocks: BlockType[]; userId: string }) => {
      // Don't apply syncs from ourselves
      if (data.userId === userId) return
      
      // Mark as processing remote update
      isProcessingRemoteUpdate.current = true
      
      // Full sync - replace all blocks
      dispatch({
        type: 'SET_BLOCKS',
        payload: data.blocks
      })
      
      // Reset flag after processing
      setTimeout(() => {
        isProcessingRemoteUpdate.current = false
      }, 500)
    })
    
    return cleanup
  }, [onContentSync, userId])

  const deleteBlock = useCallback((blockId: string) => {
    if (blocks.length <= 1) {
      // Don't delete the last block, just clear its content
      updateBlock(blockId, { content: '', type: 'paragraph' })
    } else {
      dispatch({
        type: 'DELETE_BLOCK',
        payload: blockId
      })
      
      // Send real-time block deletion
      if (!readOnly && isConnected && userId) {
        sendBlockDelete(pageId, blockId, userId)
      }
    }
  }, [blocks.length, updateBlock, readOnly, isConnected, userId, pageId, sendBlockDelete])

  const handleDragStart = (event: any) => {
    const block = blocks.find(b => b.id === event.active.id)
    setDraggedBlock(block || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedBlock(null)

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(block => block.id === active.id)
      const newIndex = blocks.findIndex(block => block.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch({
          type: 'MOVE_BLOCK',
          payload: { id: active.id as string, newIndex }
        })
        
        // Send real-time block reorder
        if (!readOnly && isConnected && userId) {
          sendBlockReorder(pageId, active.id as string, newIndex, userId)
        }
      }
    }
  }

  const handleSlashCommand = useCallback((blockId: string, position: { top: number, left: number }) => {
    dispatch({ type: 'SELECT_BLOCK', payload: blockId })
    setSlashMenuPosition(position)
    setShowSlashMenu(true)
  }, [])
  
  const handleMentionCommand = useCallback((blockId: string, position: { top: number, left: number }, searchQuery: string) => {
    setCurrentMentionBlockId(blockId)
    setMentionMenuPosition(position)
    setMentionSearchQuery(searchQuery)
    setShowMentionMenu(true)
  }, [])
  
  const handleMentionSelect = useCallback(async (user: User) => {
    if (!currentMentionBlockId) return
    
    // Get the current block
    const block = blocks.find(b => b.id === currentMentionBlockId)
    if (!block) return
    
    // Replace @query with @username
    let content = typeof block.content === 'string' ? block.content : ''
    const atIndex = content.lastIndexOf('@')
    if (atIndex !== -1) {
      const beforeAt = content.substring(0, atIndex)
      const mentionText = `@${user.name || user.email}`
      content = `${beforeAt}${mentionText} `
      
      // Store mention metadata in block properties
      const existingMentions = block.properties?.mentions || []
      const newMention = {
        userId: user.id,
        userName: user.name || user.email || '',
        startIndex: atIndex,
        endIndex: atIndex + mentionText.length
      }
      
      // Update block with content and mention metadata
      updateBlock(currentMentionBlockId, { 
        content,
        properties: {
          ...block.properties,
          mentions: [...existingMentions, newMention]
        }
      })
    }
    
    // Send notification to the mentioned user
    if (workspaceId) {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'MENTION',
            recipientId: user.id,
            title: `You were mentioned`,
            message: `You were mentioned in a page`,
            pageId,
            workspaceId,
            metadata: { blockId: currentMentionBlockId }
          })
        })
      } catch (error) {
        console.error('Error sending mention notification:', error)
      }
    }
    
    // Close mention menu
    setShowMentionMenu(false)
    setCurrentMentionBlockId(null)
    setMentionSearchQuery('')
  }, [currentMentionBlockId, blocks, updateBlock, pageId, workspaceId])

  const handleSlashMenuSelect = useCallback((type: BlockType['type']) => {
    if (editorState.selectedBlockId) {
      const blockIndex = blocks.findIndex(b => b.id === editorState.selectedBlockId)
      if (blockIndex !== -1) {
        const currentBlock = blocks[blockIndex]
        const currentContent = typeof currentBlock.content === 'string' 
          ? currentBlock.content 
          : Array.isArray(currentBlock.content)
            ? currentBlock.content.map(rt => rt.text).join('')
            : ''
        
        // If converting to a list, create proper list structure
        if (type === 'bulletList' || type === 'numberedList' || type === 'todoList') {
          const listType = type === 'bulletList' ? 'bullet' : type === 'numberedList' ? 'numbered' : 'todo'
          
          updateBlock(editorState.selectedBlockId, {
            type,
            content: '',
            properties: {
              listType,
              items: [{
                id: generateId(),
                content: currentContent,
                indent: 0,
                ...(listType === 'todo' ? { checked: false } : {})
              }]
            } as ListProperties
          })
        } else {
          // For non-list blocks, just change type and clear content
          updateBlock(editorState.selectedBlockId, { type, content: currentContent })
        }
        
        // Focus the newly created/converted block after a short delay
        setTimeout(() => {
          const blockElement = document.querySelector(`[data-block-id="${editorState.selectedBlockId}"]`)
          if (blockElement) {
            const editableElement = blockElement.querySelector('[contenteditable="true"]') as HTMLElement
            if (editableElement) {
              editableElement.focus()
              // Place cursor at the end of content
              const range = document.createRange()
              const selection = window.getSelection()
              range.selectNodeContents(editableElement)
              range.collapse(false)
              selection?.removeAllRanges()
              selection?.addRange(range)
            }
          }
        }, 50)
      }
    }
    setShowSlashMenu(false)
    dispatch({ type: 'SELECT_BLOCK', payload: null })
  }, [editorState.selectedBlockId, blocks, updateBlock])

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

  if (readOnly) {
    return (
      <div className="notion-editor w-full">
        {blocks.map((block) => (
          <BlockV2
            key={block.id}
            block={block}
            readOnly={true}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="notion-editor-container">
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

      <div ref={editorRef} className="notion-editor relative w-full">
        <DndContext 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <BlockV2
                key={block.id}
                block={block}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                onAddBlock={(type, afterBlockId) => addBlock(type, undefined, afterBlockId)}
                onSlashCommand={handleSlashCommand}
                onMentionCommand={handleMentionCommand}
                onFocus={(blockId) => {
                  dispatch({ type: 'SELECT_BLOCK', payload: blockId })
                  // Send focus event to other users
                  if (!readOnly && isConnected && userId) {
                    sendBlockFocus(pageId, blockId, userId)
                  }
                }}
                onBlur={(blockId) => {
                  // Send blur event to other users
                  if (!readOnly && isConnected && userId) {
                    sendBlockBlur(pageId, blockId, userId)
                  }
                }}
                readOnly={readOnly}
                isSelected={block.id === editorState.selectedBlockId}
                userPresence={blockUsers.get(block.id)}
                workspaceId={workspaceId}
              />
            ))}
          </SortableContext>
          
          <DragOverlay>
            {draggedBlock ? (
              <div className="opacity-50">
                <BlockV2
                  block={draggedBlock}
                  readOnly={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {blocks.length === 0 && !editorState.isLoading && (
          <div 
            className="text-muted-foreground cursor-text p-6 text-center"
            onClick={() => {
              if (blocks.length === 0) {
                addBlock('paragraph')
              }
            }}
          >
            <div className="text-lg mb-2">Start writing...</div>
            <div className="text-sm">Type '/' for commands, or just start typing.</div>
          </div>
        )}
        
        {showSlashMenu && (
          <SlashMenu
            position={slashMenuPosition}
            onSelect={handleSlashMenuSelect}
            onClose={() => {
              setShowSlashMenu(false)
              dispatch({ type: 'SELECT_BLOCK', payload: null })
            }}
          />
        )}
        
        {showMentionMenu && workspaceId && (
          <MentionAutocomplete
            isOpen={showMentionMenu}
            position={mentionMenuPosition}
            searchQuery={mentionSearchQuery}
            workspaceId={workspaceId}
            onSelect={handleMentionSelect}
            onClose={() => {
              setShowMentionMenu(false)
              setCurrentMentionBlockId(null)
              setMentionSearchQuery('')
            }}
          />
        )}
        
        {editorState.isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}