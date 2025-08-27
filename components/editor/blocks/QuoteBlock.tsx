'use client'

import React from 'react'
import { Block } from '@/types'
import MentionInput from '../MentionInput'

interface QuoteBlockProps {
  block: Block
  onUpdate?: (content: string, mentions?: any) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
  readOnly?: boolean
  workspaceId?: string
  pageId?: string
  blockId?: string
}

export default function QuoteBlock({
  block,
  onUpdate,
  onKeyDown,
  onFocus,
  onBlur,
  readOnly = false,
  workspaceId,
  pageId,
  blockId
}: QuoteBlockProps) {
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''
  
  // Extract mentions from block properties
  const mentions = (block.properties as any)?.mentions || {}

  const handleChange = (newContent: string, newMentions?: any) => {
    // Pass both content and mentions to parent
    onUpdate?.(newContent, newMentions)
  }

  return (
    <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1">
      <MentionInput
        content={content}
        mentions={mentions}
        blockId={blockId || block.id}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full outline-none italic text-gray-700 dark:text-gray-300"
        placeholder="Quote"
        readOnly={readOnly}
        workspaceId={workspaceId}
        pageId={pageId}
      />
    </div>
  )
}