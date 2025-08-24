'use client'

import React, { useState, useCallback, useRef, useEffect, useReducer } from 'react'
import { DndContext, DragEndEvent, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Block as BlockType, EditorState, EditorAction, ListProperties, ListItem } from '@/types'
import BlockV2 from './BlockV2'
import SlashMenu from './SlashMenu'
import { generateId } from '@/lib/utils/id'
import { pageContentService } from '@/lib/services/page-content'
import { Save, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface NotionEditorProps {
  pageId: string
  initialBlocks?: BlockType[]
  onSave?: (blocks: BlockType[]) => void
  onAutoSave?: (blocks: BlockType[]) => Promise<void>
  readOnly?: boolean
  autoSaveInterval?: number
  showSaveStatus?: boolean
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
  initialBlocks = [], 
  onSave,
  onAutoSave,
  readOnly = false,
  autoSaveInterval = 2000,
  showSaveStatus = true
}: NotionEditorProps) {
  const [editorState, dispatch] = useReducer(editorReducer, {
    blocks: initialBlocks,
    selectedBlockId: null,
    isLoading: false,
    lastSaved: undefined
  })
  
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [draggedBlock, setDraggedBlock] = useState<BlockType | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  
  const { blocks } = editorState

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (readOnly || blocks.length === 0) return
    
    setSaveStatus('saving')
    
    try {
      if (onAutoSave) {
        await onAutoSave(blocks)
      } else if (onSave) {
        onSave(blocks)
      }
      setSaveStatus('saved')
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('error')
      toast.error('Failed to save changes')
    }
  }, [blocks, onAutoSave, onSave, readOnly])

  // Auto-save effect
  useEffect(() => {
    if (!readOnly && blocks.length > 0) {
      setSaveStatus('unsaved')
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave()
      }, autoSaveInterval)
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [blocks, performAutoSave, autoSaveInterval, readOnly])

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
    
    setShowSlashMenu(false)
    
    return newBlock.id
  }, [blocks])

  // Track if we've initialized an empty block
  const hasInitializedRef = useRef(false)
  
  // Initialize with empty block if needed (only once)
  useEffect(() => {
    if (blocks.length === 0 && !readOnly && !editorState.isLoading && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      addBlock('paragraph')
    }
  }, [blocks.length, readOnly, editorState.isLoading, addBlock])

  const updateBlock = useCallback((blockId: string, updates: Partial<BlockType>) => {
    dispatch({
      type: 'UPDATE_BLOCK',
      payload: { id: blockId, updates }
    })
  }, [])

  const deleteBlock = useCallback((blockId: string) => {
    if (blocks.length <= 1) {
      // Don't delete the last block, just clear its content
      updateBlock(blockId, { content: '', type: 'paragraph' })
    } else {
      dispatch({
        type: 'DELETE_BLOCK',
        payload: blockId
      })
    }
  }, [blocks.length, updateBlock])

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
      }
    }
  }

  const handleSlashCommand = useCallback((blockId: string, position: { top: number, left: number }) => {
    dispatch({ type: 'SELECT_BLOCK', payload: blockId })
    setSlashMenuPosition(position)
    setShowSlashMenu(true)
  }, [])

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

      <div ref={editorRef} className="notion-editor relative w-full pl-8">
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
                onFocus={(blockId) => dispatch({ type: 'SELECT_BLOCK', payload: blockId })}
                readOnly={readOnly}
                isSelected={block.id === editorState.selectedBlockId}
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
        
        {editorState.isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}