'use client'

import React from 'react'
import { Block, HeadingProperties } from '@/types'
import ContentEditableV2 from '../ContentEditableV2'
import { cn } from '@/lib/utils'

interface HeadingBlockProps {
  block: Block
  onUpdate?: (content: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
  readOnly?: boolean
}

export default function HeadingBlock({
  block,
  onUpdate,
  onKeyDown,
  onFocus,
  onBlur,
  readOnly = false
}: HeadingBlockProps) {
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''

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

  return (
    <ContentEditableV2
      content={content}
      onChange={onUpdate || (() => {})}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn("w-full outline-none", getHeadingStyles())}
      placeholder={getPlaceholder()}
      readOnly={readOnly}
    />
  )
}