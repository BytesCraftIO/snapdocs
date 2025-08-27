'use client'

import React from 'react'
import { Block, HeadingProperties } from '@/types'
import MentionInput from '../MentionInput'
import { cn } from '@/lib/utils'

interface HeadingBlockProps {
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

export default function HeadingBlock({
  block,
  onUpdate,
  onKeyDown,
  onFocus,
  onBlur,
  readOnly = false,
  workspaceId,
  pageId,
  blockId
}: HeadingBlockProps) {
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''
  
  // Extract mentions from block properties
  const mentions = (block.properties as any)?.mentions || {}

  const getHeadingStyles = () => {
    switch (block.type) {
      case 'heading1':
        return "text-3xl font-bold"
      case 'heading2':
        return "text-2xl font-semibold"
      case 'heading3':
        return "text-xl font-semibold"
      default:
        return "text-xl font-semibold"
    }
  }

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1':
        return 'Heading 1'
      case 'heading2':
        return 'Heading 2'
      case 'heading3':
        return 'Heading 3'
      default:
        return 'Heading'
    }
  }

  const handleChange = (newContent: string, newMentions?: any) => {
    // Pass both content and mentions to parent
    onUpdate?.(newContent, newMentions)
  }

  return (
    <MentionInput
      content={content}
      mentions={mentions}
      blockId={blockId || block.id}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn("w-full outline-none", getHeadingStyles())}
      placeholder={getPlaceholder()}
      readOnly={readOnly}
      workspaceId={workspaceId}
      pageId={pageId}
    />
  )
}