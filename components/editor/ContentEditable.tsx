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

export default function ContentEditable({
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

  useEffect(() => {
    if (ref.current) {
      // Only update if the element is not currently focused to avoid cursor jumping
      const isFocused = document.activeElement === ref.current
      
      if (!isFocused) {
        // If content is empty, ensure the element is completely empty
        if (!content || content === '') {
          if (ref.current.innerHTML !== '') {
            ref.current.innerHTML = ''
          }
          return
        }
        
        // Convert newlines to <br> tags for display
        const htmlContent = content
          .split('\n')
          .map((line, index, array) => {
            // Don't add <br> for empty lines at the start/end
            if (line === '' && (index === 0 || index === array.length - 1)) {
              return ''
            }
            return line || '<br>'
          })
          .join('<br>')
        
        // Only update if content actually changed
        if (ref.current.innerHTML !== htmlContent) {
          ref.current.innerHTML = htmlContent
        }
      }
    }
  }, [content])

  const handleInput = useCallback((e: Event) => {
    if (ref.current) {
      // Get the HTML content and convert <br> tags back to newlines
      const htmlContent = ref.current.innerHTML
      
      // If the content is just a <br> tag, empty, or only whitespace, treat it as empty
      if (!htmlContent || 
          htmlContent === '<br>' || 
          htmlContent === '<br/>' || 
          htmlContent === '<br />' ||
          htmlContent === '&nbsp;' ||
          htmlContent.trim() === '') {
        onChange('')
        // Clear the element to prevent phantom line breaks
        if (htmlContent !== '') {
          ref.current.innerHTML = ''
        }
        return
      }
      
      const textContent = htmlContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]*>/g, '') // Strip any other HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
      
      onChange(textContent)
    }
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (readOnly) return
    
    // Handle formatting shortcuts when allowFormatting is true
    if (allowFormatting && (e.metaKey || e.ctrlKey)) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          document.execCommand('bold', false)
          setTimeout(() => handleInput(e.nativeEvent), 0)
          return
        case 'i':
          e.preventDefault()
          document.execCommand('italic', false)
          setTimeout(() => handleInput(e.nativeEvent), 0)
          return
        case 'u':
          e.preventDefault()
          document.execCommand('underline', false)
          setTimeout(() => handleInput(e.nativeEvent), 0)
          return
      }
    }
    
    onKeyDown?.(e)
  }, [allowFormatting, onKeyDown, handleInput, readOnly])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    
    const text = e.clipboardData.getData('text/plain')
    
    if (allowFormatting) {
      // Try to get formatted HTML first, fallback to plain text
      const html = e.clipboardData.getData('text/html')
      
      if (html && html.trim()) {
        // Clean HTML and insert
        const cleanHtml = cleanPastedHTML(html)
        document.execCommand('insertHTML', false, cleanHtml)
      } else {
        // Convert newlines to <br> tags when pasting plain text
        const htmlText = text.replace(/\n/g, '<br>')
        document.execCommand('insertHTML', false, htmlText)
      }
    } else {
      // Convert newlines to <br> tags for plain text
      const htmlText = text.replace(/\n/g, '<br>')
      document.execCommand('insertHTML', false, htmlText)
    }
    
    setTimeout(() => handleInput(new Event('input')), 0)
  }, [allowFormatting, handleInput])

  const handleFocus = useCallback(() => {
    // Clean up any browser-added <br> tags on empty content
    if (ref.current && !content) {
      const html = ref.current.innerHTML
      if (html === '<br>' || html === '<br/>' || html === '<br />') {
        ref.current.innerHTML = ''
      }
    }
    onFocus?.()
  }, [onFocus, content])

  const handleBlur = useCallback(() => {
    // Clean up empty content on blur to prevent phantom line breaks
    if (ref.current) {
      const htmlContent = ref.current.innerHTML
      
      // If empty or just whitespace/br tags, clear completely
      if (!htmlContent || 
          htmlContent === '<br>' || 
          htmlContent === '<br/>' || 
          htmlContent === '<br />' ||
          htmlContent === '&nbsp;' ||
          htmlContent.trim() === '') {
        ref.current.innerHTML = ''
        onChange('')
      } else {
        // Otherwise ensure onChange is called to capture final state
        handleInput(new Event('input'))
      }
    }
    onBlur?.()
  }, [handleInput, onChange, onBlur])

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput as any}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        className,
        "focus:outline-none min-h-[1.5em]",
        !content && "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none empty:before:absolute",
        readOnly && "cursor-default"
      )}
      data-placeholder={placeholder}
      role="textbox"
      aria-label={placeholder}
      aria-readonly={readOnly}
    />
  )
}

// Helper function to clean pasted HTML
function cleanPastedHTML(html: string): string {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // Remove unwanted elements and attributes
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'br']
  const allowedAttributes = ['style']
  
  function cleanNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      
      // Remove disallowed tags
      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        // Replace with text content
        const textNode = document.createTextNode(element.textContent || '')
        element.parentNode?.replaceChild(textNode, element)
        return
      }
      
      // Remove disallowed attributes
      const attributes = Array.from(element.attributes)
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name)
        }
      })
      
      // Clean child nodes
      Array.from(element.childNodes).forEach(cleanNode)
    }
  }
  
  Array.from(tempDiv.childNodes).forEach(cleanNode)
  
  return tempDiv.innerHTML
}