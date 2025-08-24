'use client'

import React from 'react'
import { Block } from '@/types'
import MentionInput from '../MentionInput'
import { cn } from '@/lib/utils'

interface TextBlockProps {
  block: Block
  onUpdate?: (content: string, mentions?: any) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
  readOnly?: boolean
  placeholder?: string
  className?: string
  workspaceId?: string
  pageId?: string
}

export default function TextBlock({
  block,
  onUpdate,
  onKeyDown,
  onFocus,
  onBlur,
  readOnly = false,
  placeholder = "Type '/' for commands, '@' to mention",
  className,
  workspaceId,
  pageId
}: TextBlockProps) {
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''
  
  // Extract mentions from block properties
  const mentions = block.properties?.mentions || {}

  const handleChange = (newContent: string, newMentions?: any) => {
    // Pass both content and mentions to parent
    onUpdate?.(newContent, newMentions)
  }

  return (
    <MentionInput
      content={content}
      mentions={mentions}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn("w-full outline-none", className)}
      placeholder={placeholder}
      readOnly={readOnly}
      workspaceId={workspaceId}
      pageId={pageId}
    />
  )
}