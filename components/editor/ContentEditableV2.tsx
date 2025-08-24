'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ContentEditableProps {
  content: string
  onChange: (content: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  placeholder?: string
  readOnly?: boolean
  allowFormatting?: boolean
}

export default function ContentEditableV2({
  content,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  className,
  placeholder,
  readOnly = false,
  allowFormatting = false
}: ContentEditableProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastKnownContent = useRef(content)
  const isComposing = useRef(false)

  // Convert content to HTML for display
  const contentToHtml = (text: string): string => {
    if (!text) return ''
    
    // Escape HTML entities
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    // Convert newlines to <br> tags
    return escaped.replace(/\n/g, '<br>')
  }

  // Convert HTML back to plain text
  const htmlToContent = (html: string): string => {
    // If empty or just whitespace/br tags, return empty
    const stripped = html.replace(/<br\s*\/?>/gi, '').trim()
    if (!stripped || stripped === '&nbsp;') {
      return ''
    }

    // Convert br tags to newlines and decode entities
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '') // Remove all other tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
  }

  // Update display when content prop changes
  useEffect(() => {
    if (!ref.current) return
    
    // Don't update if we're currently focused (to avoid cursor jump)
    if (document.activeElement === ref.current) return
    
    // If content is empty, ensure element is completely empty
    if (!content || content === '') {
      if (ref.current.innerHTML !== '') {
        ref.current.innerHTML = ''
        lastKnownContent.current = ''
      }
      return
    }
    
    const newHtml = contentToHtml(content)
    if (ref.current.innerHTML !== newHtml) {
      ref.current.innerHTML = newHtml
      lastKnownContent.current = content
    }
  }, [content, contentToHtml])

  // Handle input changes
  const handleInput = useCallback(() => {
    if (!ref.current || isComposing.current) return
    
    const html = ref.current.innerHTML
    
    // If the content is just a <br> tag, empty, or only whitespace, treat it as empty
    if (!html || 
        html === '<br>' || 
        html === '<br/>' || 
        html === '<br />' ||
        html === '&nbsp;' ||
        html.trim() === '') {
      if (lastKnownContent.current !== '') {
        lastKnownContent.current = ''
        onChange('')
        // Clear the element to prevent phantom line breaks
        if (html !== '') {
          ref.current.innerHTML = ''
        }
      }
      return
    }
    
    const newContent = htmlToContent(html)
    
    // Only trigger onChange if content actually changed
    if (newContent !== lastKnownContent.current) {
      lastKnownContent.current = newContent
      onChange(newContent)
    }
  }, [onChange, htmlToContent])

  // Handle focus - clean up any browser-added artifacts
  const handleFocus = useCallback(() => {
    if (ref.current && !content) {
      // If empty, clear any browser-added <br> tags or whitespace
      const html = ref.current.innerHTML
      if (html === '<br>' || html === '<br/>' || html === '<br />' || html === '&nbsp;' || html.trim() === '') {
        ref.current.innerHTML = ''
      }
    }
    onFocus?.()
  }, [onFocus, content])

  // Handle blur - clean up empty content to prevent phantom line breaks
  const handleBlur = useCallback(() => {
    if (ref.current) {
      const html = ref.current.innerHTML
      
      // If empty or just whitespace/br tags, clear completely
      if (!html || 
          html === '<br>' || 
          html === '<br/>' || 
          html === '<br />' ||
          html === '&nbsp;' ||
          html.trim() === '') {
        ref.current.innerHTML = ''
        lastKnownContent.current = ''
        onChange('')
        onBlur?.()
        return
      }
    }
    
    handleInput()
    onBlur?.()
  }, [handleInput, onChange, onBlur])

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (readOnly) return
    
    // Handle formatting shortcuts if enabled
    if (allowFormatting && (e.metaKey || e.ctrlKey)) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          document.execCommand('bold', false)
          handleInput()
          return
        case 'i':
          e.preventDefault()
          document.execCommand('italic', false)
          handleInput()
          return
        case 'u':
          e.preventDefault()
          document.execCommand('underline', false)
          handleInput()
          return
      }
    }
    
    // Pass through arrow keys for block navigation
    onKeyDown?.(e)
  }, [allowFormatting, onKeyDown, handleInput, readOnly])

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    
    // Insert plain text with line breaks preserved
    const html = contentToHtml(text)
    document.execCommand('insertHTML', false, html)
    
    handleInput()
  }, [handleInput])

  // Handle composition events (for IME input)
  const handleCompositionStart = useCallback(() => {
    isComposing.current = true
  }, [])

  const handleCompositionEnd = useCallback(() => {
    isComposing.current = false
    handleInput()
  }, [handleInput])

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={cn(
        className,
        "focus:outline-none min-h-[1.5em]",
        !content && "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none empty:before:absolute",
        readOnly && "cursor-default"
      )}
      data-placeholder={placeholder}
      role="textbox"
      aria-label={placeholder}
      aria-multiline="true"
    />
  )
}