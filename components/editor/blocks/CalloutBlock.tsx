'use client'

import React, { useState } from 'react'
import { Block, CalloutProperties } from '@/types'
import ContentEditableV2 from '../ContentEditable'
import { 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  Flame,
  Star,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalloutBlockProps {
  block: Block
  onUpdate?: (content: string) => void
  onPropertyUpdate?: (properties: CalloutProperties) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  readOnly?: boolean
}

const CALLOUT_TYPES = [
  { value: 'info', label: 'Info', icon: Info, bgColor: 'bg-blue-50 dark:bg-blue-950/30', borderColor: 'border-blue-200 dark:border-blue-800', iconColor: 'text-blue-600 dark:text-blue-400' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', borderColor: 'border-yellow-200 dark:border-yellow-800', iconColor: 'text-yellow-600 dark:text-yellow-400' },
  { value: 'error', label: 'Error', icon: AlertCircle, bgColor: 'bg-red-50 dark:bg-red-950/30', borderColor: 'border-red-200 dark:border-red-800', iconColor: 'text-red-600 dark:text-red-400' },
  { value: 'success', label: 'Success', icon: CheckCircle, bgColor: 'bg-green-50 dark:bg-green-950/30', borderColor: 'border-green-200 dark:border-green-800', iconColor: 'text-green-600 dark:text-green-400' },
  { value: 'idea', label: 'Idea', icon: Lightbulb, bgColor: 'bg-purple-50 dark:bg-purple-950/30', borderColor: 'border-purple-200 dark:border-purple-800', iconColor: 'text-purple-600 dark:text-purple-400' },
  { value: 'tip', label: 'Tip', icon: Star, bgColor: 'bg-indigo-50 dark:bg-indigo-950/30', borderColor: 'border-indigo-200 dark:border-indigo-800', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  { value: 'important', label: 'Important', icon: Flame, bgColor: 'bg-orange-50 dark:bg-orange-950/30', borderColor: 'border-orange-200 dark:border-orange-800', iconColor: 'text-orange-600 dark:text-orange-400' },
  { value: 'note', label: 'Note', icon: Zap, bgColor: 'bg-gray-50 dark:bg-gray-950/30', borderColor: 'border-gray-200 dark:border-gray-800', iconColor: 'text-gray-600 dark:text-gray-400' },
]

export default function CalloutBlock({
  block,
  onUpdate,
  onPropertyUpdate,
  onKeyDown,
  readOnly = false
}: CalloutBlockProps) {
  const [showTypeSelect, setShowTypeSelect] = useState(false)
  
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''

  const properties = block.properties as CalloutProperties || {}
  const calloutType = properties.color || 'info'
  const currentType = CALLOUT_TYPES.find(type => type.value === calloutType) || CALLOUT_TYPES[0]
  const Icon = currentType.icon

  const handleTypeChange = (newType: string) => {
    onPropertyUpdate?.({ ...properties, color: newType })
    setShowTypeSelect(false)
  }

  return (
    <div className={cn(
      "rounded-lg border-l-4 p-4 relative",
      currentType.bgColor,
      currentType.borderColor
    )}>
      <div className="flex items-start gap-3">
        <div className="relative">
          <button
            onClick={() => !readOnly && setShowTypeSelect(!showTypeSelect)}
            className={cn(
              "p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
              currentType.iconColor,
              readOnly && "cursor-default"
            )}
            disabled={readOnly}
          >
            <Icon className="w-5 h-5" />
          </button>
          
          {showTypeSelect && !readOnly && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-[120px]">
              {CALLOUT_TYPES.map((type) => {
                const TypeIcon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => handleTypeChange(type.value)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <TypeIcon className={cn("w-4 h-4", type.iconColor)} />
                    {type.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <ContentEditableV2
            content={content}
            onChange={onUpdate || (() => {})}
            onKeyDown={onKeyDown}
            className="w-full outline-none"
            placeholder="Type your callout content here..."
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  )
}