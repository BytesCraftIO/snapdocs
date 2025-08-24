'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import MentionAutocomplete from './MentionAutocomplete'
import { User } from '@prisma/client'

interface MentionData {
  [key: string]: {
    id: string
    name: string
    email: string
  }
}

interface MentionInputProps {
  content: string
  mentions?: MentionData
  onChange: (content: string, mentions?: MentionData) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  placeholder?: string
  readOnly?: boolean
  workspaceId?: string
  pageId?: string
}

interface MentionSearchState {
  active: boolean
  startIndex: number
  searchText: string
  position: { top: number; left: number }
}

export default function MentionInput({
  content,
  mentions = {},
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  className,
  placeholder = "Type '/' for commands, '@' to mention",
  readOnly = false,
  workspaceId,
  pageId
}: MentionInputProps) {
  const inputRef = useRef<HTMLDivElement>(null)
  const [localMentions, setLocalMentions] = useState(mentions)
  const [mentionSearch, setMentionSearch] = useState<MentionSearchState>({
    active: false,
    startIndex: -1,
    searchText: '',
    position: { top: 0, left: 0 }
  })
  const isComposingRef = useRef(false)
  const lastContentRef = useRef(content)
  
  // Update local mentions when prop changes
  useEffect(() => {
    setLocalMentions(mentions)
  }, [mentions])
  
  // Fetch missing mention data
  useEffect(() => {
    const fetchMissingMentions = async () => {
      const mentionPattern = /@\[user:([^\]]+)\]/g
      const userIds: string[] = []
      let match
      
      while ((match = mentionPattern.exec(content)) !== null) {
        userIds.push(match[1])
      }
      
      if (userIds.length === 0) return
      
      const missingUserIds = userIds.filter(id => !localMentions[`user:${id}`])
      
      if (missingUserIds.length > 0 && workspaceId) {
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}/members`)
          if (response.ok) {
            const { members } = await response.json()
            const newMentions = { ...localMentions }
            
            missingUserIds.forEach(userId => {
              const member = members.find((m: any) => m.id === userId)
              if (member) {
                newMentions[`user:${userId}`] = {
                  id: userId,
                  name: member.name || member.email,
                  email: member.email
                }
              }
            })
            
            if (Object.keys(newMentions).length > Object.keys(localMentions).length) {
              setLocalMentions(newMentions)
            }
          }
        } catch (error) {
          console.error('Error fetching missing mentions:', error)
        }
      }
    }
    
    fetchMissingMentions()
  }, [content, workspaceId, localMentions])
  
  // Render content with mentions highlighted
  const renderContent = useCallback(() => {
    if (!inputRef.current) return
    
    // Save current selection/cursor position
    const selection = window.getSelection()
    let savedRange: Range | null = null
    
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange()
    }
    
    // Build HTML content
    let html = ''
    let lastIndex = 0
    const mentionPattern = /@\[user:([^\]]+)\]/g
    let match
    
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    while ((match = mentionPattern.exec(content)) !== null) {
      const userId = match[1]
      const user = localMentions[`user:${userId}`]
      
      if (user) {
        // Add text before mention
        const textBefore = escapedContent.substring(lastIndex, match.index)
        html += textBefore.replace(/\n/g, '<br>')
        
        // Add mention chip
        html += `<span class="mention-chip" data-mention-id="${userId}" contenteditable="false" style="color: #0969da; background-color: rgba(9, 105, 218, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 500; cursor: pointer; display: inline-block; margin: 0 2px; user-select: none;">@${user.name}</span>`
        
        lastIndex = match.index + match[0].length
      }
    }
    
    // Add remaining text
    const remainingText = escapedContent.substring(lastIndex)
    html += remainingText.replace(/\n/g, '<br>')
    
    // Update innerHTML only if it changed
    if (inputRef.current.innerHTML !== html) {
      inputRef.current.innerHTML = html || `<span style="color: #999;">${placeholder}</span>`
      
      // Restore cursor position if we had one
      if (savedRange && selection) {
        try {
          selection.removeAllRanges()
          selection.addRange(savedRange)
        } catch (e) {
          // If restoration fails, place cursor at end
          const range = document.createRange()
          range.selectNodeContents(inputRef.current)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    }
    
    lastContentRef.current = content
  }, [content, localMentions, placeholder])
  
  // Update display when content or mentions change
  useEffect(() => {
    renderContent()
  }, [renderContent])
  
  // Get plain text with placeholders from the contenteditable
  const getPlainTextWithPlaceholders = useCallback((): string => {
    if (!inputRef.current) return ''
    
    let text = ''
    
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || ''
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        
        if (el.classList?.contains('mention-chip')) {
          const mentionId = el.dataset.mentionId
          if (mentionId) {
            text += `@[user:${mentionId}]`
          }
        } else if (el.tagName === 'BR') {
          text += '\n'
        } else {
          // Process children
          Array.from(node.childNodes).forEach(processNode)
        }
      }
    }
    
    Array.from(inputRef.current.childNodes).forEach(processNode)
    return text
  }, [])
  
  // Handle input events
  const handleInput = useCallback(() => {
    if (!inputRef.current || readOnly || isComposingRef.current) return
    
    const plainText = getPlainTextWithPlaceholders()
    
    // Check for @ mention trigger
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      
      // Get the text up to cursor position
      const tempRange = document.createRange()
      tempRange.selectNodeContents(inputRef.current)
      tempRange.setEnd(range.startContainer, range.startOffset)
      
      const textBeforeCursor = tempRange.toString()
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')
      
      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
        
        // Check if @ is at valid position (start or after space/newline)
        const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ''
        if (lastAtIndex === 0 || charBeforeAt === ' ' || charBeforeAt === '\n') {
          // Check if we're still typing (no space after @)
          if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
            // Get position for menu
            const rect = range.getBoundingClientRect()
            setMentionSearch({
              active: true,
              startIndex: lastAtIndex,
              searchText: textAfterAt,
              position: {
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX
              }
            })
          } else {
            setMentionSearch({ active: false, startIndex: -1, searchText: '', position: { top: 0, left: 0 } })
          }
        } else {
          setMentionSearch({ active: false, startIndex: -1, searchText: '', position: { top: 0, left: 0 } })
        }
      } else {
        setMentionSearch({ active: false, startIndex: -1, searchText: '', position: { top: 0, left: 0 } })
      }
    }
    
    // Update content
    onChange(plainText, localMentions)
  }, [getPlainTextWithPlaceholders, onChange, localMentions, readOnly])
  
  // Send notification for mention
  const sendMentionNotification = useCallback(async (userId: string) => {
    if (!pageId || !workspaceId) return
    
    try {
      await fetch('/api/notifications/mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          pageId,
          workspaceId,
          message: 'mentioned you in a page'
        })
      })
    } catch (error) {
      console.error('Failed to send mention notification:', error)
    }
  }, [pageId, workspaceId])
  
  // Handle mention selection
  const handleMentionSelect = useCallback((user: User) => {
    if (!inputRef.current || !mentionSearch.active) return
    
    // Get the current display text (not the content with placeholders)
    const displayText = inputRef.current.textContent || ''
    
    // Calculate the correct positions
    const beforeMention = displayText.substring(0, mentionSearch.startIndex)
    const afterMention = displayText.substring(mentionSearch.startIndex + 1 + mentionSearch.searchText.length)
    
    // Create the new display text
    const newDisplayText = beforeMention + `@${user.name || user.email} ` + afterMention
    
    // Now convert this back to content with placeholders
    // We need to maintain existing mentions and add the new one
    const currentContent = getPlainTextWithPlaceholders()
    
    // Find where to insert the mention in the actual content
    // Count how many mentions come before this position
    const mentionPattern = /@\[user:([^\]]+)\]/g
    let contentOffset = 0
    let displayOffset = 0
    let match
    
    while ((match = mentionPattern.exec(currentContent)) !== null) {
      const userId = match[1]
      const mentionUser = localMentions[`user:${userId}`]
      if (mentionUser) {
        const mentionDisplayLength = mentionUser.name.length + 1 // +1 for @
        const mentionContentLength = match[0].length
        
        if (displayOffset + mentionDisplayLength <= mentionSearch.startIndex) {
          // This mention comes before our insertion point
          contentOffset += mentionContentLength - mentionDisplayLength
          displayOffset += mentionDisplayLength
        } else {
          break
        }
      }
    }
    
    // Calculate the actual content position
    const actualContentPosition = mentionSearch.startIndex + contentOffset
    
    // Build new content with the mention placeholder
    const beforeInContent = currentContent.substring(0, actualContentPosition)
    const afterInContent = currentContent.substring(actualContentPosition + 1 + mentionSearch.searchText.length)
    const mentionPlaceholder = `@[user:${user.id}]`
    const newContent = beforeInContent + mentionPlaceholder + ' ' + afterInContent
    
    // Update mentions
    const newMentions = {
      ...localMentions,
      [`user:${user.id}`]: {
        id: user.id,
        name: user.name || user.email,
        email: user.email
      }
    }
    
    // Update state
    setLocalMentions(newMentions)
    onChange(newContent, newMentions)
    
    // Send notification
    sendMentionNotification(user.id)
    
    // Clear mention search
    setMentionSearch({ active: false, startIndex: -1, searchText: '', position: { top: 0, left: 0 } })
    
    // Focus and position cursor after mention
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        
        // Find the position after the newly inserted mention
        const selection = window.getSelection()
        const range = document.createRange()
        
        // Calculate where to place cursor in the rendered content
        const targetPosition = beforeMention.length + user.name.length + 2 // +2 for @ and space
        
        let currentPos = 0
        let targetNode: Node | null = null
        let targetOffset = 0
        
        const findPosition = (node: Node): boolean => {
          if (targetNode) return true
          
          if (node.nodeType === Node.TEXT_NODE) {
            const length = node.textContent?.length || 0
            if (currentPos + length >= targetPosition) {
              targetNode = node
              targetOffset = targetPosition - currentPos
              return true
            }
            currentPos += length
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement
            if (el.classList?.contains('mention-chip')) {
              const length = el.textContent?.length || 0
              if (currentPos + length >= targetPosition) {
                // Position after the mention chip
                targetNode = el.nextSibling || el.parentNode
                targetOffset = 0
                return true
              }
              currentPos += length
            } else {
              for (const child of Array.from(node.childNodes)) {
                if (findPosition(child)) return true
              }
            }
          }
          return false
        }
        
        for (const node of Array.from(inputRef.current.childNodes)) {
          if (findPosition(node)) break
        }
        
        if (targetNode) {
          try {
            if (targetNode.nodeType === Node.TEXT_NODE) {
              range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0))
            } else {
              range.setStartAfter(targetNode)
            }
            range.collapse(true)
            selection?.removeAllRanges()
            selection?.addRange(range)
          } catch (e) {
            console.error('Error setting cursor position:', e)
          }
        }
      }
    }, 10)
  }, [mentionSearch, localMentions, onChange, sendMentionNotification, getPlainTextWithPlaceholders])
  
  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && mentionSearch.active) {
      e.preventDefault()
      setMentionSearch({ active: false, startIndex: -1, searchText: '', position: { top: 0, left: 0 } })
      return
    }
    
    onKeyDown?.(e)
  }, [onKeyDown, mentionSearch.active])
  
  // Handle composition events (for IME)
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
  }, [])
  
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false
    handleInput()
  }, [handleInput])
  
  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    handleInput()
  }, [handleInput])
  
  // Handle focus/blur
  const handleFocus = useCallback(() => {
    if (inputRef.current && !content) {
      inputRef.current.innerHTML = ''
    }
    onFocus?.()
  }, [content, onFocus])
  
  const handleBlur = useCallback(() => {
    if (inputRef.current && !content) {
      inputRef.current.innerHTML = `<span style="color: #999;">${placeholder}</span>`
    }
    onBlur?.()
  }, [content, placeholder, onBlur])
  
  return (
    <>
      <div
        ref={inputRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          'outline-none min-h-[1.5em] whitespace-pre-wrap',
          className
        )}
        suppressContentEditableWarning
        style={{ wordBreak: 'break-word' }}
      />
      
      {mentionSearch.active && workspaceId && (
        <MentionAutocomplete
          isOpen={mentionSearch.active}
          position={mentionSearch.position}
          searchQuery={mentionSearch.searchText}
          workspaceId={workspaceId}
          onSelect={handleMentionSelect}
          onClose={() => {
            setMentionSearch({ active: false, startIndex: -1, searchText: '', position: { top: 0, left: 0 } })
          }}
        />
      )}
    </>
  )
}