'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Copy, MoreVertical } from 'lucide-react'
import { Block as BlockType, BlockType as BlockTypeEnum } from '@/types'
import { cn } from '@/lib/utils'
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

interface BlockProps {
  block: BlockType
  onUpdate?: (blockId: string, updates: Partial<BlockType>) => void
  onDelete?: (blockId: string) => void
  onAddBlock?: (type: BlockTypeEnum) => string
  onSlashCommand?: (blockId: string, position: { top: number, left: number }) => void
  readOnly?: boolean
  isSelected?: boolean
}

export default function Block({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  onSlashCommand,
  readOnly = false,
  isSelected = false
}: BlockProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: readOnly })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleContentChange = (content: string) => {
    // Check for slash command
    if (content.endsWith('/') && onSlashCommand) {
      // Get cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        onSlashCommand(block.id, {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        })
        // Clear the slash from content
        onUpdate?.(block.id, { content: content.slice(0, -1) })
        return
      }
      // Fallback to block position if cursor detection fails
      else if (blockRef.current) {
        const rect = blockRef.current.getBoundingClientRect()
        onSlashCommand(block.id, {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        })
        // Clear the slash from content
        onUpdate?.(block.id, { content: content.slice(0, -1) })
        return
      }
    }
    
    onUpdate?.(block.id, { content })
  }

  const handlePropertyUpdate = (properties: any) => {
    onUpdate?.(block.id, { properties })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't interfere with code block tab handling
    if (block.type === 'code' && e.key === 'Tab') {
      return
    }
    
    // Don't interfere with list block handling - they manage their own keyboard events
    if (block.type === 'bulletList' || block.type === 'numberedList' || block.type === 'todoList') {
      return
    }
    
    // Get current content
    const content = typeof block.content === 'string' 
      ? block.content 
      : Array.isArray(block.content) 
        ? block.content.map(rt => rt.text).join('')
        : ''
    
    if (e.key === 'Enter') {
      // For different block types, handle Enter differently
      if (block.type === 'code') {
        // Let code blocks handle their own Enter key
        return
      }
      
      // Check if we should create a new block
      const shouldCreateNewBlock = 
        e.shiftKey || // Shift+Enter always creates new block
        e.altKey || // Alt+Enter (Option+Enter on Mac) always creates new block
        (content === '' && block.type === 'paragraph') || // Empty paragraph
        (block.type === 'bulletList' || block.type === 'numberedList') || // Lists always create new items on Enter
        (block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3') || // Headings always create new block
        (block.type === 'quote' || block.type === 'callout') || // Quotes and callouts too
        (block.type === 'divider') // Dividers
      
      if (shouldCreateNewBlock) {
        e.preventDefault()
        
        const newBlockId = onAddBlock?.('paragraph')
        
        // Focus the new block after a short delay
        if (newBlockId) {
          setTimeout(() => {
            const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"]`)
            if (newBlockElement) {
              const editableElement = newBlockElement.querySelector('[contenteditable="true"]') as HTMLElement
              if (editableElement) {
                editableElement.focus()
              }
            }
          }, 10)
        }
      }
      // For regular text blocks with content, let default behavior add line break within the block
    } else if (e.key === 'Backspace') {
      if (content === '') {
        e.preventDefault()
        
        // Find and focus the previous block before deleting
        const allBlocks = document.querySelectorAll('[data-block-id]')
        let previousBlock: Element | null = null
        
        for (let i = 0; i < allBlocks.length; i++) {
          if (allBlocks[i].getAttribute('data-block-id') === block.id && i > 0) {
            previousBlock = allBlocks[i - 1]
            break
          }
        }
        
        if (previousBlock) {
          const editableElement = previousBlock.querySelector('[contenteditable="true"]') as HTMLElement
          if (editableElement) {
            editableElement.focus()
            // Place cursor at the end
            const range = document.createRange()
            const selection = window.getSelection()
            range.selectNodeContents(editableElement)
            range.collapse(false)
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
        }
        
        onDelete?.(block.id)
      }
    }
  }

  const handleDuplicate = () => {
    if (onAddBlock) {
      // Find the current block index and add the same type after it
      onAddBlock(block.type)
    }
  }

  const handleCopy = async () => {
    const content = typeof block.content === 'string' 
      ? block.content 
      : Array.isArray(block.content) 
        ? block.content.map(rt => rt.text).join('')
        : ''
    
    if (content) {
      await navigator.clipboard.writeText(content)
    }
  }

  const renderBlockContent = () => {
    const commonProps = {
      block,
      onUpdate: handleContentChange,
      onKeyDown: handleKeyDown,
      readOnly
    }

    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
        return <HeadingBlock {...commonProps} />
      
      case 'bulletList':
      case 'numberedList':
        return (
          <ListBlock
            block={block}
            onUpdate={(updates) => onUpdate?.(block.id, updates)}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
          />
        )
      
      case 'todoList':
        return (
          <ListBlock
            block={block}
            onUpdate={(updates) => onUpdate?.(block.id, updates)}
            onKeyDown={handleKeyDown}
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
          >
            {/* TODO: Render child blocks for toggle */}
          </ToggleBlock>
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
        "notion-block-wrapper relative", // Wrapper for the entire block including handles
        isDragging && "z-50"
      )}
      onMouseEnter={() => !readOnly && setShowMenu(true)}
      onMouseLeave={() => {
        setShowMenu(false)
        setShowMoreMenu(false)
      }}
    >
      {/* Block controls - positioned absolutely to the left */}
      {!readOnly && (showMenu || isSelected) && (
        <div className="notion-block-handle flex items-center gap-1 absolute -left-12 md:-left-16 top-1 z-10">
          <button
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => onAddBlock?.('paragraph')}
            title="Add block below"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <div
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-grab opacity-60 hover:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      )}
      
      <div 
        ref={blockRef} 
        className={cn(
          "block-content relative py-1",
          isSelected && "bg-blue-50 dark:bg-blue-950/20 rounded-sm"
        )} 
        data-block-id={block.id}
      >
        {renderBlockContent()}
      </div>
    </div>
  )
}