'use client'

import React from 'react'
import { Block, ToggleProperties } from '@/types'
import ContentEditableV2 from '../ContentEditable'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToggleBlockProps {
  block: Block
  onUpdate?: (content: string) => void
  onPropertyUpdate?: (properties: ToggleProperties) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  readOnly?: boolean
  children?: React.ReactNode
}

export default function ToggleBlock({
  block,
  onUpdate,
  onPropertyUpdate,
  onKeyDown,
  readOnly = false,
  children
}: ToggleBlockProps) {
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''

  const properties = block.properties as ToggleProperties || {}
  const isExpanded = properties.expanded !== false // Default to expanded

  const handleToggle = () => {
    if (!readOnly) {
      onPropertyUpdate?.({ ...properties, expanded: !isExpanded })
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-start gap-1">
        <button
          onClick={handleToggle}
          className={cn(
            "mt-0.5 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors",
            readOnly && "cursor-default"
          )}
          disabled={readOnly}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        <div className="flex-1">
          <ContentEditableV2
            content={content}
            onChange={onUpdate || (() => {})}
            onKeyDown={onKeyDown}
            className="w-full outline-none font-medium"
            placeholder="Toggle heading"
            readOnly={readOnly}
          />
        </div>
      </div>
      
      {isExpanded && children && (
        <div className="ml-6 mt-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}