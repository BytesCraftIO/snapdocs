'use client'

import React from 'react'
import { Block } from '@/types'
import ContentEditableV2 from '../ContentEditableV2'

interface QuoteBlockProps {
  block: Block
  onUpdate?: (content: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  readOnly?: boolean
}

export default function QuoteBlock({
  block,
  onUpdate,
  onKeyDown,
  readOnly = false
}: QuoteBlockProps) {
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''

  return (
    <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1">
      <ContentEditableV2
        content={content}
        onChange={onUpdate || (() => {})}
        onKeyDown={onKeyDown}
        className="w-full outline-none italic text-gray-700 dark:text-gray-300"
        placeholder="Quote"
        readOnly={readOnly}
      />
    </div>
  )
}