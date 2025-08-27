'use client'

import React, { useEffect, useRef, useState } from 'react'
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare,
  Quote,
  Code,
  Minus,
  AlertCircle,
  Table,
  Database,
  ChevronRight
} from 'lucide-react'
import { BlockType } from '@/types'
import { cn } from '@/lib/utils'

interface SlashMenuProps {
  position: { top: number; left: number }
  onSelect: (type: BlockType) => void
  onClose: () => void
}

const menuItems = [
  // Basic blocks
  { type: 'paragraph' as BlockType, label: 'Text', icon: Type, description: 'Just start writing with plain text.', category: 'basic', keywords: ['text', 'paragraph', 'p'] },
  
  // Headings
  { type: 'heading1' as BlockType, label: 'Heading 1', icon: Heading1, description: 'Big section heading.', category: 'basic', keywords: ['heading', 'h1', 'title'] },
  { type: 'heading2' as BlockType, label: 'Heading 2', icon: Heading2, description: 'Medium section heading.', category: 'basic', keywords: ['heading', 'h2', 'subtitle'] },
  { type: 'heading3' as BlockType, label: 'Heading 3', icon: Heading3, description: 'Small section heading.', category: 'basic', keywords: ['heading', 'h3'] },
  
  // Lists
  { type: 'bulletList' as BlockType, label: 'Bullet List', icon: List, description: 'Create a simple bullet list.', category: 'basic', keywords: ['list', 'bullet', 'ul', 'unordered'] },
  { type: 'numberedList' as BlockType, label: 'Numbered List', icon: ListOrdered, description: 'Create a numbered list.', category: 'basic', keywords: ['list', 'numbered', 'ol', 'ordered'] },
  { type: 'todoList' as BlockType, label: 'To-do List', icon: CheckSquare, description: 'Track tasks with a to-do list.', category: 'basic', keywords: ['todo', 'task', 'checkbox', 'check'] },
  
  // Advanced blocks
  { type: 'quote' as BlockType, label: 'Quote', icon: Quote, description: 'Capture a quote.', category: 'advanced', keywords: ['quote', 'blockquote', 'cite'] },
  { type: 'code' as BlockType, label: 'Code', icon: Code, description: 'Add a code snippet.', category: 'advanced', keywords: ['code', 'snippet', 'programming'] },
  { type: 'callout' as BlockType, label: 'Callout', icon: AlertCircle, description: 'Make text stand out.', category: 'advanced', keywords: ['callout', 'highlight', 'note', 'alert'] },
  { type: 'toggle' as BlockType, label: 'Toggle List', icon: ChevronRight, description: 'Create a collapsible toggle list.', category: 'advanced', keywords: ['toggle', 'collapse', 'expand', 'dropdown'] },
  
  // Layout
  { type: 'divider' as BlockType, label: 'Divider', icon: Minus, description: 'Visually divide blocks.', category: 'layout', keywords: ['divider', 'separator', 'hr', 'line'] },
  
  // Database
  { type: 'table' as BlockType, label: 'Table', icon: Table, description: 'Add a simple table.', category: 'database', keywords: ['table', 'grid', 'data'] },
  { type: 'database' as BlockType, label: 'Database', icon: Database, description: 'Add a database.', category: 'database', keywords: ['database', 'db', 'collection'] },
]

const categoryLabels = {
  basic: 'Basic blocks',
  advanced: 'Advanced blocks', 
  layout: 'Layout',
  database: 'Database'
}

export default function SlashMenu({ position, onSelect, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [search, setSearch] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const filteredItems = menuItems.filter(item => {
    const searchLower = search.toLowerCase()
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
    )
  })

  // Group filtered items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

  // Flatten grouped items for keyboard navigation
  const flattenedItems = Object.values(groupedItems).flat()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex(prev => (prev + 1) % flattenedItems.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex(prev => (prev - 1 + flattenedItems.length) % flattenedItems.length)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (flattenedItems[selectedIndex]) {
          onSelect(flattenedItems[selectedIndex].type)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [flattenedItems, selectedIndex, onClose, onSelect])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl w-72"
      style={{ 
        top: Math.min(position.top, window.innerHeight - 450), // Prevent overflow
        left: Math.min(position.left, window.innerWidth - 288), // Prevent overflow
        maxHeight: '400px'
      }}
    >
      <div className="sticky top-0 bg-white dark:bg-gray-950 p-2 border-b border-gray-100 dark:border-gray-800">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter blocks..."
          className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
          autoFocus
        />
      </div>
      
      <div className="max-h-80 overflow-y-auto p-1">
        {Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([category, items], idx) => (
            <div key={category}>
              {idx > 0 && <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />}
              {!search && (
                <div className="px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </div>
              )}
              <div>
                {items.map((item) => {
                  const itemIndex = flattenedItems.findIndex(flatItem => flatItem.type === item.type)
                  const Icon = item.icon
                  const isSelected = selectedIndex === itemIndex
                  
                  return (
                    <button
                      key={item.type}
                      onClick={() => onSelect(item.type)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-2 py-1.5 rounded text-left transition-colors",
                        isSelected
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      )}
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700">
                        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
            <div className="text-sm font-medium">No blocks found</div>
            <div className="text-xs mt-1">Try a different search term</div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-100 dark:border-gray-800 px-2 py-1.5">
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
          ↑↓ Navigate · ↵ Select · Esc Close
        </div>
      </div>
    </div>
  )
}