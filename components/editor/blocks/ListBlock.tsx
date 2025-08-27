'use client'

import React, { useRef, useEffect } from 'react'
import { Block, ListProperties, ListItem } from '@/types'
import ContentEditableV2 from '../ContentEditable'
import { Check, Square } from 'lucide-react'
import { generateId } from '@/lib/utils/id'

interface ListBlockProps {
  block: Block
  onUpdate?: (updates: Partial<Block>) => void
  onKeyDown?: (e: React.KeyboardEvent, itemId: string, itemIndex: number) => void
  onFocus?: () => void
  onBlur?: () => void
  readOnly?: boolean
}

export default function ListBlock({
  block,
  onUpdate,
  onKeyDown,
  onFocus,
  onBlur,
  readOnly = false
}: ListBlockProps) {
  const properties = block.properties as ListProperties
  const items = properties?.items || [{ id: generateId(), content: '', indent: 0 }]
  
  const updateItem = (itemId: string, updates: Partial<ListItem>) => {
    if (!onUpdate) return
    
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    )
    
    onUpdate({
      properties: {
        ...properties,
        items: updatedItems
      }
    })
  }
  
  const addItem = (afterIndex: number, content = '', indent = 0) => {
    if (!onUpdate) return
    
    const newItem: ListItem = {
      id: generateId(),
      content,
      indent
    }
    
    const updatedItems = [...items]
    updatedItems.splice(afterIndex + 1, 0, newItem)
    
    onUpdate({
      properties: {
        ...properties,
        items: updatedItems
      }
    })
    
    return newItem.id
  }
  
  const removeItem = (itemId: string) => {
    if (!onUpdate || items.length <= 1) return
    
    const updatedItems = items.filter(item => item.id !== itemId)
    
    // If we removed all items, add an empty one
    if (updatedItems.length === 0) {
      updatedItems.push({ id: generateId(), content: '', indent: 0 })
    }
    
    onUpdate({
      properties: {
        ...properties,
        items: updatedItems
      }
    })
  }
  
  const indentItem = (itemId: string, change: number) => {
    if (!onUpdate) return
    
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const newIndent = Math.max(0, Math.min(6, (item.indent || 0) + change))
        return { ...item, indent: newIndent }
      }
      return item
    })
    
    onUpdate({
      properties: {
        ...properties,
        items: updatedItems
      }
    })
  }

  const handleItemKeyDown = (e: React.KeyboardEvent, itemId: string, itemIndex: number) => {
    const item = items[itemIndex]
    
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (item.content === '') {
        // Empty item + Enter should exit the list or remove item
        if (items.length === 1) {
          // Convert to paragraph if only one empty item
          onUpdate?.({
            type: 'paragraph',
            content: '',
            properties: undefined
          })
        } else {
          // Remove this empty item
          removeItem(itemId)
        }
      } else {
        // Create new item
        const newItemId = addItem(itemIndex, '', item.indent || 0)
        
        // Focus new item after a short delay
        setTimeout(() => {
          const newItemElement = document.querySelector(`[data-item-id="${newItemId}"]`)
          if (newItemElement) {
            const editableElement = newItemElement.querySelector('[contenteditable="true"]') as HTMLElement
            if (editableElement) {
              editableElement.focus()
            }
          }
        }, 10)
      }
    } else if (e.key === 'Backspace') {
      if (item.content === '') {
        e.preventDefault()
        
        if (items.length === 1) {
          // Convert to paragraph if only one empty item
          onUpdate?.({
            type: 'paragraph',
            content: '',
            properties: undefined
          })
        } else {
          // Remove this empty item and focus previous
          const prevIndex = itemIndex - 1
          removeItem(itemId)
          
          if (prevIndex >= 0) {
            setTimeout(() => {
              const prevItem = items[prevIndex]
              if (prevItem) {
                const prevItemElement = document.querySelector(`[data-item-id="${prevItem.id}"]`)
                if (prevItemElement) {
                  const editableElement = prevItemElement.querySelector('[contenteditable="true"]') as HTMLElement
                  if (editableElement) {
                    editableElement.focus()
                    // Move cursor to end
                    const range = document.createRange()
                    const selection = window.getSelection()
                    range.selectNodeContents(editableElement)
                    range.collapse(false)
                    selection?.removeAllRanges()
                    selection?.addRange(range)
                  }
                }
              }
            }, 10)
          }
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        // Shift+Tab: outdent
        indentItem(itemId, -1)
      } else {
        // Tab: indent
        indentItem(itemId, 1)
      }
    }
    
    // Let parent handle other keys if needed
    onKeyDown?.(e, itemId, itemIndex)
  }

  const getBulletOrNumber = (index: number, item: ListItem) => {
    const indent = item.indent || 0
    const indentStyle = { marginLeft: `${indent * 1.5}rem` }
    
    if (properties?.listType === 'todo') {
      return (
        <div className="flex items-center justify-center mt-1" style={indentStyle}>
          <button
            className="w-4 h-4 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
            onClick={() => updateItem(item.id, { checked: !item.checked })}
            disabled={readOnly}
          >
            {item.checked ? (
              <Check className="w-3 h-3 text-blue-600" />
            ) : (
              <Square className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>
      )
    } else if (properties?.listType === 'numbered') {
      // Calculate the number based on items at the same indent level
      let number = 1
      for (let i = 0; i < index; i++) {
        if ((items[i].indent || 0) === indent) {
          number++
        }
      }
      return (
        <span className="mt-1 min-w-[1.5rem] text-gray-500 text-right" style={indentStyle}>
          {number}.
        </span>
      )
    } else {
      // Bullet list - different bullets for different indent levels
      const bullets = ['•', '◦', '▪', '‣', '◾', '◽', '▫']
      const bullet = bullets[indent % bullets.length]
      return (
        <span className="mt-1 min-w-[1.5rem] text-gray-500" style={indentStyle}>
          {bullet}
        </span>
      )
    }
  }

  return (
    <div className="list-block">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2 min-h-[1.5rem]" data-item-id={item.id}>
          {getBulletOrNumber(index, item)}
          <ContentEditableV2
            content={item.content}
            onChange={(content) => updateItem(item.id, { content })}
            onKeyDown={(e) => handleItemKeyDown(e, item.id, index)}
            onFocus={onFocus}
            onBlur={onBlur}
            className={`flex-1 outline-none ${
              properties?.listType === 'todo' && item.checked 
                ? 'line-through text-gray-500' 
                : ''
            }`}
            placeholder="List item"
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  )
}