'use client'

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { 
  BlockNoteEditor,
  Block as BlockNoteBlock
} from '@blocknote/core'
import { 
  useCreateBlockNote
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/react/style.css'
import '@blocknote/mantine/style.css'
import { Block as AppBlockType } from '@/types'
import { Save, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSocket } from '@/lib/socket/client'

interface BlockNoteEditorProps {
  pageId: string
  workspaceId?: string
  initialBlocks?: AppBlockType[]
  onSave?: (blocks: AppBlockType[]) => void
  onAutoSave?: (blocks: AppBlockType[]) => Promise<void>
  readOnly?: boolean
  autoSaveInterval?: number
  showSaveStatus?: boolean
  userId?: string
  user?: {
    id: string
    name?: string | null
    email?: string | null
  }
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved'

export default function BlockNoteEditorComponent({
  pageId,
  workspaceId,
  initialBlocks = [],
  onSave,
  onAutoSave,
  readOnly = false,
  autoSaveInterval = 5000,
  showSaveStatus = true,
  userId,
  user
}: BlockNoteEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [blockPresence, setBlockPresence] = useState<Map<string, { userId: string; userName: string; userColor: string }>>(new Map())
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const previousBlocksRef = useRef<AppBlockType[]>(initialBlocks)
  const isProcessingRemoteUpdate = useRef(false)
  const lastSyncedContent = useRef<string>('')
  const currentFocusedBlock = useRef<string | null>(null)
  
  // Socket integration - get all the functions we need
  const { 
    isConnected, 
    sendContentSync,
    joinPage,
    leavePage,
    onContentSync,
    onBlockUpdate,
    sendBlockUpdate,
    sendBlockFocus,
    sendBlockBlur,
    onBlockFocus,
    onBlockBlur,
    onUserLeft,
    currentUsers
  } = useSocket()

  // Convert our blocks to BlockNote format if needed (minimal conversion)
  const convertToBlockNoteFormat = (blocks: AppBlockType[]): any => {
    if (!blocks || blocks.length === 0) {
      return undefined // Let BlockNote use its default initial content
    }
    
    // If blocks already have BlockNote structure, return as is
    if (blocks[0] && 'type' in blocks[0] && 'content' in blocks[0]) {
      return blocks as any
    }
    
    // Otherwise, convert to basic BlockNote format
    return blocks.map(block => ({
      id: block.id,
      type: block.type || 'paragraph',
      content: block.content || '',
      props: block.props || {},
      children: block.children || []
    }))
  }

  // Create the BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: convertToBlockNoteFormat(initialBlocks),
    uploadFile: async (file: File) => {
      // Handle file uploads
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      return data.url
    }
  })

  // Convert BlockNote blocks back to our storage format (minimal processing)
  const convertFromBlockNoteFormat = (blocks: BlockNoteBlock[]): AppBlockType[] => {
    return blocks.map((block, index) => ({
      id: block.id,
      type: block.type as any,
      content: block.content || '',
      props: block.props,
      children: block.children as any,
      order: index,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  }

  // Join the page room on mount
  useEffect(() => {
    if (pageId && workspaceId && isConnected) {
      // Use full user object if available, otherwise fallback to userId only
      const userInfo = user || (userId ? { id: userId, name: null, email: null } : null)
      if (userInfo) {
        joinPage(pageId, workspaceId, {
          id: userInfo.id,
          name: userInfo.name || 'Anonymous',
          email: userInfo.email || ''
        })
      }
    }
    
    return () => {
      if (isConnected) {
        leavePage()
        // Clear presence on unmount
        setBlockPresence(new Map())
      }
    }
  }, [pageId, workspaceId, userId, user, isConnected, joinPage, leavePage])

  
  // Setup real-time listeners for content updates and block presence
  useEffect(() => {
    if (!isConnected || !onContentSync || !onBlockUpdate || !onBlockFocus || !onBlockBlur || !onUserLeft) return

    // Listen for full content sync from other users
    const unsubscribeContentSync = onContentSync((data: any) => {
      // Don't process our own updates
      if (data.userId === userId) return
      
      // Check if this update is for our current page
      if (data.pageId !== pageId) return
      
      isProcessingRemoteUpdate.current = true
      
      // Replace the entire document with the synced content
      if (data.blocks && Array.isArray(data.blocks)) {
        const blockNoteBlocks = convertToBlockNoteFormat(data.blocks)
        if (blockNoteBlocks) {
          editor.replaceBlocks(editor.document, blockNoteBlocks)
          previousBlocksRef.current = data.blocks
        }
      }
      
      setTimeout(() => {
        isProcessingRemoteUpdate.current = false
      }, 100)
    })

    // Listen for individual block updates
    const unsubscribeBlockUpdate = onBlockUpdate((data: any) => {
      // Don't process our own updates
      if (data.userId === userId) return
      
      // Check if this update is for our current page
      if (data.pageId !== pageId) return
      
      isProcessingRemoteUpdate.current = true
      
      // Update the specific block
      const currentBlocks = editor.document
      const updatedBlocks = currentBlocks.map(block => {
        if (block.id === data.blockId) {
          return { ...block, content: data.content }
        }
        return block
      })
      
      // Update editor with new blocks
      editor.replaceBlocks(editor.document, updatedBlocks)
      
      setTimeout(() => {
        isProcessingRemoteUpdate.current = false
      }, 100)
    })
    
    // Listen for block focus events from other users
    const unsubscribeBlockFocus = onBlockFocus((data: any) => {
      // Don't process our own focus events
      if (data.userId === userId) return
      
      setBlockPresence(prev => {
        const newPresence = new Map(prev)
        newPresence.set(data.blockId, {
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor
        })
        return newPresence
      })
    })
    
    // Listen for block blur events from other users
    const unsubscribeBlockBlur = onBlockBlur((data: any) => {
      // Don't process our own blur events
      if (data.userId === userId) return
      
      setBlockPresence(prev => {
        const newPresence = new Map(prev)
        // Only remove if this user is the one who had focus
        const presence = newPresence.get(data.blockId)
        if (presence && presence.userId === data.userId) {
          newPresence.delete(data.blockId)
        }
        return newPresence
      })
    })
    
    // Listen for user left events
    const unsubscribeUserLeft = onUserLeft((data: any) => {
      if (data.userId === userId) return
      
      // Remove all presence for the user who left
      setBlockPresence(prev => {
        const newPresence = new Map(prev)
        Array.from(newPresence.entries()).forEach(([blockId, presence]) => {
          if (presence.userId === data.userId) {
            newPresence.delete(blockId)
          }
        })
        return newPresence
      })
    })

    // Cleanup
    return () => {
      if (unsubscribeContentSync) unsubscribeContentSync()
      if (unsubscribeBlockUpdate) unsubscribeBlockUpdate()
      if (unsubscribeBlockFocus) unsubscribeBlockFocus()
      if (unsubscribeBlockBlur) unsubscribeBlockBlur()
      if (unsubscribeUserLeft) unsubscribeUserLeft()
    }
  }, [isConnected, onContentSync, onBlockUpdate, onBlockFocus, onBlockBlur, onUserLeft, userId, pageId, editor, convertToBlockNoteFormat])

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (readOnly || saveStatus === 'saving') return
    
    const blocks = convertFromBlockNoteFormat(editor.document)
    
    // Check if content actually changed
    const currentContent = JSON.stringify(blocks)
    const previousContent = JSON.stringify(previousBlocksRef.current)
    if (currentContent === previousContent) {
      setSaveStatus('saved')
      return
    }
    
    setSaveStatus('saving')
    
    try {
      if (onAutoSave) {
        await onAutoSave(blocks)
      } else if (onSave) {
        onSave(blocks)
      }
      setSaveStatus('saved')
      previousBlocksRef.current = [...blocks]
      
      // Send full sync after save (for other users)
      const currentUserId = user?.id || userId
      if (isConnected && currentUserId && !isProcessingRemoteUpdate.current) {
        sendContentSync(pageId, blocks, currentUserId)
        lastSyncedContent.current = JSON.stringify(blocks)
      }
    } catch (error) {
      console.error('Error saving blocks:', error)
      setSaveStatus('error')
      toast.error('Failed to save changes')
    }
  }, [editor, onAutoSave, onSave, readOnly, saveStatus, isConnected, userId, user, pageId, sendContentSync])

  // Handle editor changes and selection changes for block focus
  useEffect(() => {
    const handleChange = () => {
      if (!readOnly && !isProcessingRemoteUpdate.current) {
        setSaveStatus('unsaved')
        
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        
        // Set new timeout for auto-save
        autoSaveTimeoutRef.current = setTimeout(() => {
          performAutoSave()
        }, autoSaveInterval)
        
        // Send real-time updates for individual block changes
        const currentUserId = user?.id || userId
        if (isConnected && currentUserId && !isProcessingRemoteUpdate.current) {
          const blocks = convertFromBlockNoteFormat(editor.document)
          const currentContent = JSON.stringify(blocks)
          
          // Only send if content changed since last sync
          if (currentContent !== lastSyncedContent.current) {
            // For now, send full content sync
            // You could optimize this to send only changed blocks
            sendContentSync(pageId, blocks, currentUserId)
            lastSyncedContent.current = currentContent
          }
        }
      }
    }
    
    // Handle selection changes to detect block focus/blur
    const handleSelectionChange = () => {
      const currentUserId = user?.id || userId
      if (!isConnected || !currentUserId || readOnly) return
      
      const selection = editor.getTextCursorPosition()
      if (selection && selection.block) {
        const blockId = selection.block.id
        
        // If we're focusing on a new block
        if (currentFocusedBlock.current !== blockId) {
          // Blur the previous block if there was one
          if (currentFocusedBlock.current) {
            sendBlockBlur(pageId, currentFocusedBlock.current, currentUserId)
          }
          
          // Focus the new block
          sendBlockFocus(pageId, blockId, currentUserId)
          currentFocusedBlock.current = blockId
        }
      } else if (currentFocusedBlock.current) {
        // No selection, blur the current block
        sendBlockBlur(pageId, currentFocusedBlock.current, currentUserId)
        currentFocusedBlock.current = null
      }
    }

    editor.onChange(handleChange)
    editor.onSelectionChange(handleSelectionChange)
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      // Clear focus when unmounting
      const currentUserId = user?.id || userId
      if (currentFocusedBlock.current && isConnected && currentUserId) {
        sendBlockBlur(pageId, currentFocusedBlock.current, currentUserId)
      }
    }
  }, [editor, performAutoSave, autoSaveInterval, readOnly, isConnected, userId, user, pageId, sendContentSync, sendBlockFocus, sendBlockBlur])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      // Perform final save if there are unsaved changes
      if (saveStatus === 'unsaved' && !readOnly) {
        const blocks = convertFromBlockNoteFormat(editor.document)
        if (onSave) {
          onSave(blocks)
        }
      }
    }
  }, [saveStatus, readOnly, editor, onSave])

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saved':
        return <Save className="h-3 w-3" />
      case 'saving':
        return <Clock className="h-3 w-3 animate-spin" />
      case 'error':
        return <AlertCircle className="h-3 w-3" />
      case 'unsaved':
        return <Clock className="h-3 w-3" />
    }
  }

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return 'Saved'
      case 'saving':
        return 'Saving...'
      case 'error':
        return 'Error saving'
      case 'unsaved':
        return 'Unsaved changes'
    }
  }

  return (
    <div className="blocknote-editor-container">
      {/* Save status indicator */}
      {showSaveStatus && (
        <div className="fixed top-4 right-4 z-50">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200",
            saveStatus === 'saved' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            saveStatus === 'saving' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            saveStatus === 'error' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            saveStatus === 'unsaved' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          )}>
            {getSaveStatusIcon()}
            <span className="hidden sm:inline">{getSaveStatusText()}</span>
          </div>
        </div>
      )}


      <div className="relative">
        <BlockNoteView 
          editor={editor} 
          editable={!readOnly}
          theme="light"
        />
      </div>
      
      {/* Custom styles to align content with title and position presence indicators */}
      <style jsx global>{`
        .bn-container .bn-editor {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        
        .bn-container .bn-block-outer {
          margin-left: -52px !important;
          position: relative;
        }
        
        .bn-container .bn-block-content {
          margin-left: 52px !important;
        }
        
        .bn-container .bn-drag-handle-menu {
          left: 0 !important;
        }
        
        .bn-container .bn-block-side-menu {
          left: 28px !important;
        }
        
        /* Highlight blocks being edited by other users */
        ${Array.from(blockPresence.entries()).map(([blockId, presence]) => `
          .bn-block-outer[data-id="${blockId}"] {
            position: relative;
            background: linear-gradient(to right, 
              ${presence.userColor}10 0%, 
              ${presence.userColor}05 100%);
            border-left: 2px solid ${presence.userColor};
            padding-left: 8px;
            margin-left: -60px !important;
          }
          
          .bn-block-outer[data-id="${blockId}"]::before {
            content: "${presence.userName.split(' ')[0]}";
            position: absolute;
            left: -90px;
            top: 2px;
            background: ${presence.userColor};
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
          }
        `).join('')}
      `}</style>
    </div>
  )
}