'use client'

import React from 'react'
import { Block } from '@/types'
import ContentEditableV2 from '../ContentEditableV2'
import { cn } from '@/lib/utils'

interface TextBlockProps {
  block: Block
  onUpdate?: (content: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
  readOnly?: boolean
  placeholder?: string
  className?: string
}

export default function TextBlock({
  block,
  onUpdate,
  onKeyDown,
  onFocus,
  onBlur,
  readOnly = false,
  placeholder = "Type '/' for commands",
  className
}: TextBlockProps) {
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''

  return (
    <ContentEditableV2
      content={content}
      onChange={onUpdate || (() => {})}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn("w-full outline-none", className)}
      placeholder={placeholder}
      readOnly={readOnly}
      allowFormatting={true}
    />
  )
}