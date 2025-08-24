'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Block as BlockType, BlockType as BlockTypeEnum } from '@/types'
import { cn } from '@/lib/utils'
import BlockHandle from './BlockHandle'
import {
  TextBlock,
  HeadingBlock,
  ListBlock,
  TodoBlock,
  CodeBlock,
  QuoteBlock,
  DividerBlock,
  CalloutBlock,
  ToggleBlock,
  DatabaseBlock
} from './blocks'

interface BlockV2Props {
  block: BlockType
  onUpdate?: (blockId: string, updates: Partial<BlockType>) => void
  onDelete?: (blockId: string) => void
  onAddBlock?: (type: BlockTypeEnum, afterBlockId?: string) => string
  onSlashCommand?: (blockId: string, position: { top: number, left: number }) => void
  onFocus?: (blockId: string) => void
  readOnly?: boolean
  isSelected?: boolean
}

export default function BlockV2({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  onSlashCommand,
  onFocus,
  readOnly = false,
  isSelected = false
}: BlockV2Props) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: block.id, 
    disabled: readOnly 
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const showHandle = !readOnly && (isHovered || isFocused || isSelected)

  // Handle content changes and slash commands
  const handleContentChange = useCallback((content: string) => {
    // Check for slash command
    if (content.endsWith('/') && onSlashCommand) {
      const selection = window.getSelection()
      if (selection?.rangeCount && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        onSlashCommand(block.id, {
          top: rect.bottom + window.scrollY + 8,  // Increased spacing
          left: rect.left + window.scrollX
        })
      } else if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect()
        onSlashCommand(block.id, {
          top: rect.bottom + window.scrollY + 8,  // Increased spacing
          left: rect.left + window.scrollX
        })
      }
      // Remove the slash from content
      onUpdate?.(block.id, { content: content.slice(0, -1) })
      return
    }
    
    onUpdate?.(block.id, { content })
  }, [block.id, onUpdate, onSlashCommand])

  // Handle property updates (for specialized blocks)
  const handlePropertyUpdate = useCallback((properties: any) => {
    onUpdate?.(block.id, { properties })
  }, [block.id, onUpdate])

  // Focus management
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    onFocus?.(block.id)
  }, [block.id, onFocus])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const content = getBlockContent()
    const isContentEmpty = !content || content.trim() === ''
    
    // Get cursor position for backspace handling
    const selection = window.getSelection()
    const cursorAtStart = selection?.rangeCount > 0 && 
                         selection.getRangeAt(0).startOffset === 0 && 
                         selection.getRangeAt(0).endOffset === 0

    // Handle Enter key
    if (e.key === 'Enter') {
      // Special handling for different block types
      if (block.type === 'code') {
        // Let code blocks handle Enter themselves (for multi-line code)
        return
      }

      // Alt+Enter or Shift+Enter always creates new block
      if (e.altKey || e.shiftKey) {
        e.preventDefault()
        createNewBlock('paragraph')
        return
      }

      // For lists, Enter creates new list item (handled by ListBlock)
      if (block.type === 'bulletList' || block.type === 'numberedList' || block.type === 'todoList') {
        return // Let ListBlock handle this
      }

      // For headings, quotes, callouts, dividers - Enter creates new paragraph
      if (
        block.type === 'heading1' || 
        block.type === 'heading2' || 
        block.type === 'heading3' ||
        block.type === 'quote' ||
        block.type === 'callout' ||
        block.type === 'divider'
      ) {
        e.preventDefault()
        createNewBlock('paragraph')
        return
      }

      // For empty paragraphs, Enter creates new paragraph
      if (block.type === 'paragraph' && isContentEmpty) {
        e.preventDefault()
        createNewBlock('paragraph')
        return
      }

      // For paragraphs with content, let default behavior create line break
    }

    // Handle Backspace - only delete block if cursor is at start AND content is empty
    if (e.key === 'Backspace') {
      // Only delete block if it's truly empty or cursor is at the very beginning
      if (isContentEmpty || (cursorAtStart && !isContentEmpty)) {
        // If content is empty, delete the block
        if (isContentEmpty) {
          e.preventDefault()
          handleEmptyBackspace()
          return
        }
        // If cursor is at start but there's content, just merge with previous block
        // Let default behavior handle this for now
      }
      // Otherwise, let normal backspace behavior work
    }

    // Handle Tab for lists (indentation)
    if (e.key === 'Tab' && (block.type === 'bulletList' || block.type === 'numberedList' || block.type === 'todoList')) {
      // Let ListBlock handle tab indentation
      return
    }
  }, [block])

  // Get current block content
  const getBlockContent = useCallback((): string => {
    if (typeof block.content === 'string') {
      return block.content
    }
    if (Array.isArray(block.content)) {
      return block.content.map(rt => rt.text).join('')
    }
    return ''
  }, [block.content])

  // Create new block after current block
  const createNewBlock = useCallback((type: BlockTypeEnum) => {
    const newBlockId = onAddBlock?.(type, block.id)
    
    // Focus the new block
    if (newBlockId) {
      setTimeout(() => {
        focusBlock(newBlockId)
      }, 10)
    }
  }, [block.id, onAddBlock])

  // Handle backspace on empty block
  const handleEmptyBackspace = useCallback(() => {
    // Find previous block and focus it
    const allBlocks = Array.from(document.querySelectorAll('[data-block-id]'))
    const currentIndex = allBlocks.findIndex(el => el.getAttribute('data-block-id') === block.id)
    
    if (currentIndex > 0) {
      const previousBlockId = allBlocks[currentIndex - 1].getAttribute('data-block-id')
      if (previousBlockId) {
        focusBlock(previousBlockId, 'end')
      }
    }
    
    // Delete current block
    onDelete?.(block.id)
  }, [block.id, onDelete])

  // Focus a block by ID
  const focusBlock = useCallback((blockId: string, position: 'start' | 'end' = 'start') => {
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`)
    if (!blockElement) return

    const editableElement = blockElement.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editableElement) return

    editableElement.focus()

    // Set cursor position
    const selection = window.getSelection()
    const range = document.createRange()
    
    if (position === 'end') {
      range.selectNodeContents(editableElement)
      range.collapse(false)
    } else {
      range.setStart(editableElement, 0)
      range.collapse(true)
    }
    
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [])

  // Handle add block from handle with debounce
  const isAddingBlockRef = useRef(false)
  const handleAddBlock = useCallback(() => {
    if (isAddingBlockRef.current) return
    
    isAddingBlockRef.current = true
    createNewBlock('paragraph')
    
    // Reset after a short delay
    setTimeout(() => {
      isAddingBlockRef.current = false
    }, 300)
  }, [createNewBlock])

  // Mouse enter/leave handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  // Render block content based on type
  const renderBlockContent = () => {
    const commonProps = {
      block,
      onUpdate: handleContentChange,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      readOnly
    }

    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
        return <HeadingBlock {...commonProps} />
      
      case 'bulletList':
      case 'numberedList':
      case 'todoList':
        return (
          <ListBlock
            block={block}
            onUpdate={(updates) => onUpdate?.(block.id, updates)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            readOnly={readOnly}
          />
        )
      
      case 'code':
        return (
          <CodeBlock
            {...commonProps}
            onPropertyUpdate={handlePropertyUpdate}
          />
        )
      
      case 'quote':
        return <QuoteBlock {...commonProps} />
      
      case 'callout':
        return (
          <CalloutBlock
            {...commonProps}
            onPropertyUpdate={handlePropertyUpdate}
          />
        )
      
      case 'toggle':
        return (
          <ToggleBlock
            {...commonProps}
            onPropertyUpdate={handlePropertyUpdate}
          />
        )
      
      case 'divider':
        return <DividerBlock readOnly={readOnly} />
      
      case 'database':
        return (
          <DatabaseBlock
            block={block}
            isSelected={isSelected}
            onUpdate={onUpdate || (() => {})}
            onSelect={() => {}}
            editable={!readOnly}
          />
        )
      
      case 'paragraph':
      default:
        return <TextBlock {...commonProps} />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "block-wrapper group relative",
        isDragging && "z-50"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Block handle positioned with negative margin */}
      <div className="absolute -left-12 top-1 z-10">
        <BlockHandle
          isVisible={showHandle}
          onAddBlock={handleAddBlock}
          dragProps={{ attributes, listeners }}
        />
      </div>
      
      {/* Block content */}
      <div
        ref={(node) => {
          blockRef.current = node
          contentRef.current = node
        }}
        className={cn(
          "block-content relative py-1 min-h-[1.5rem]",
          isSelected && "bg-blue-50 dark:bg-blue-950/20 rounded-sm",
          isFocused && "bg-blue-25 dark:bg-blue-900/10 rounded-sm"
        )}
        data-block-id={block.id}
      >
        {renderBlockContent()}
      </div>
    </div>
  )
}