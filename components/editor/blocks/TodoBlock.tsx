'use client'

import React from 'react'
import { Block, TodoProperties } from '@/types'
import ContentEditableV2 from '../ContentEditable'
import { cn } from '@/lib/utils'

interface TodoBlockProps {
  block: Block
  onUpdate?: (content: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onPropertyUpdate?: (properties: TodoProperties) => void
  readOnly?: boolean
}

export default function TodoBlock({
  block,
  onUpdate,
  onKeyDown,
  onPropertyUpdate,
  readOnly = false
}: TodoBlockProps) {
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''

  const properties = block.properties as TodoProperties || {}
  const isChecked = properties.checked || false

  const handleCheckboxChange = (checked: boolean) => {
    onPropertyUpdate?.({ ...properties, checked })
  }

  return (
    <div className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => handleCheckboxChange(e.target.checked)}
        className="mt-1 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
        disabled={readOnly}
      />
      <ContentEditableV2
        content={content}
        onChange={onUpdate || (() => {})}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full outline-none flex-1",
          isChecked && "line-through opacity-60"
        )}
        placeholder="To-do"
        readOnly={readOnly}
      />
    </div>
  )
}