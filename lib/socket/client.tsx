'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react'
import io, { Socket } from 'socket.io-client'
import { UserPresence } from './server'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  currentUsers: Map<string, UserPresence>
  currentPageId: string | null
  joinPage: (pageId: string, workspaceId: string, user: any) => void
  leavePage: () => void
  sendBlockUpdate: (pageId: string, blockId: string, content: any, userId: string) => void
  sendBlockAdd: (pageId: string, block: any, index: number, userId: string) => void
  sendBlockDelete: (pageId: string, blockId: string, userId: string) => void
  sendBlockReorder: (pageId: string, blockId: string, newIndex: number, userId: string) => void
  sendBlockFocus: (pageId: string, blockId: string, userId: string) => void
  sendBlockBlur: (pageId: string, blockId: string, userId: string) => void
  sendContentSync: (pageId: string, blocks: any[], userId: string) => void
  sendCursorPosition: (pageId: string, position: { x: number; y: number }) => void
  sendSelection: (pageId: string, selection: { start: number; end: number } | null) => void
  sendTypingStart: (pageId: string, blockId: string) => void
  sendTypingStop: (pageId: string, blockId: string) => void
  onBlockUpdate?: (callback: (data: any) => void) => void
  onBlockAdd?: (callback: (data: any) => void) => void
  onBlockDelete?: (callback: (data: any) => void) => void
  onBlockReorder?: (callback: (data: any) => void) => void
  onBlockFocus?: (callback: (data: any) => void) => void
  onBlockBlur?: (callback: (data: any) => void) => void
  onContentSync?: (callback: (data: any) => void) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  currentUsers: new Map(),
  currentPageId: null,
  joinPage: () => {},
  leavePage: () => {},
  sendBlockUpdate: () => {},
  sendBlockAdd: () => {},
  sendBlockDelete: () => {},
  sendBlockReorder: () => {},
  sendBlockFocus: () => {},
  sendBlockBlur: () => {},
  sendContentSync: () => {},
  sendCursorPosition: () => {},
  sendSelection: () => {},
  sendTypingStart: () => {},
  sendTypingStop: () => {},
  onBlockUpdate: () => {},
  onBlockAdd: () => {},
  onBlockDelete: () => {},
  onBlockReorder: () => {},
  onBlockFocus: () => {},
  onBlockBlur: () => {},
  onContentSync: () => {},
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentUsers, setCurrentUsers] = useState<Map<string, UserPresence>>(new Map())
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Only create socket once
    if (socketRef.current) return

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    socketRef.current = socketInstance

    const handleConnect = () => {
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      setCurrentUsers(new Map())
    }

    const handleCurrentUsers = (users: any[]) => {
      if (!Array.isArray(users)) return
      
      requestAnimationFrame(() => {
        setCurrentUsers(() => {
          const userMap = new Map<string, UserPresence>()
          users.forEach(user => {
            if (user && user.userId) {
              userMap.set(user.userId, user)
            }
          })
          return userMap
        })
      })
    }

    const handleUserJoined = (data: { user: UserPresence }) => {
      if (!data?.user || !data.user.userId) return
      
      requestAnimationFrame(() => {
        setCurrentUsers(prev => {
          const newMap = new Map(prev)
          newMap.set(data.user.userId, data.user)
          return newMap
        })
      })
    }

    const handleUserLeft = (data: { userId: string }) => {
      if (!data?.userId) return
      
      requestAnimationFrame(() => {
        setCurrentUsers(prev => {
          const newMap = new Map(prev)
          newMap.delete(data.userId)
          return newMap
        })
      })
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('current-users', handleCurrentUsers)
    socketInstance.on('user-joined', handleUserJoined)
    socketInstance.on('user-left', handleUserLeft)

    setSocket(socketInstance)

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('current-users', handleCurrentUsers)
      socketInstance.off('user-joined', handleUserJoined)
      socketInstance.off('user-left', handleUserLeft)
      socketInstance.disconnect()
      socketRef.current = null
    }
  }, [])

  const joinPage = useCallback((pageId: string, workspaceId: string, user: any) => {
    if (socket && socket.connected) {
      // Clear users when joining a new page
      setCurrentUsers(new Map())
      setCurrentPageId(pageId)
      socket.emit('join-page', { pageId, workspaceId, user })
    }
  }, [socket])

  const leavePage = useCallback(() => {
    setCurrentUsers(new Map())
    setCurrentPageId(null)
    // Socket will automatically leave rooms on disconnect
  }, [])
  
  // Send individual block updates (real-time)
  const sendBlockUpdate = useCallback((pageId: string, blockId: string, content: any, userId: string) => {
    if (socket && socket.connected) {
      socket.emit('block-update', { 
        pageId, 
        blockId, 
        content, 
        userId 
      })
    }
  }, [socket])
  
  // Send block addition
  const sendBlockAdd = useCallback((pageId: string, block: any, index: number, userId: string) => {
    if (socket && socket.connected) {
      socket.emit('block-add', { 
        pageId, 
        block, 
        index, 
        userId 
      })
    }
  }, [socket])
  
  // Send block deletion
  const sendBlockDelete = useCallback((pageId: string, blockId: string, userId: string) => {
    if (socket && socket.connected) {
      socket.emit('block-delete', { 
        pageId, 
        blockId, 
        userId 
      })
    }
  }, [socket])
  
  // Send block reorder
  const sendBlockReorder = useCallback((pageId: string, blockId: string, newIndex: number, userId: string) => {
    if (socket && socket.connected) {
      socket.emit('block-reorder', { 
        pageId, 
        blockId, 
        newIndex, 
        userId 
      })
    }
  }, [socket])
  
  // Send block focus (user starts editing)
  const sendBlockFocus = useCallback((pageId: string, blockId: string, userId: string) => {
    if (socket && socket.connected) {
      socket.emit('block-focus', { 
        pageId, 
        blockId, 
        userId 
      })
    }
  }, [socket])
  
  // Send block blur (user stops editing)
  const sendBlockBlur = useCallback((pageId: string, blockId: string, userId: string) => {
    if (socket && socket.connected) {
      socket.emit('block-blur', { 
        pageId, 
        blockId, 
        userId 
      })
    }
  }, [socket])
  
  // Send full content sync (less frequent)
  const sendContentSync = useCallback((pageId: string, blocks: any[], userId: string) => {
    if (socket && socket.connected) {
      socket.emit('content-sync', { 
        pageId, 
        blocks, 
        userId 
      })
    }
  }, [socket])
  
  // Register block update listener
  const onBlockUpdate = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('block-updated', callback)
      return () => {
        socket.off('block-updated', callback)
      }
    }
  }, [socket])
  
  // Register block add listener
  const onBlockAdd = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('block-added', callback)
      return () => {
        socket.off('block-added', callback)
      }
    }
  }, [socket])
  
  // Register block delete listener
  const onBlockDelete = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('block-deleted', callback)
      return () => {
        socket.off('block-deleted', callback)
      }
    }
  }, [socket])
  
  // Register block reorder listener
  const onBlockReorder = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('block-reordered', callback)
      return () => {
        socket.off('block-reordered', callback)
      }
    }
  }, [socket])
  
  // Register block focus listener
  const onBlockFocus = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('block-focused', callback)
      return () => {
        socket.off('block-focused', callback)
      }
    }
  }, [socket])
  
  // Register block blur listener
  const onBlockBlur = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('block-blurred', callback)
      return () => {
        socket.off('block-blurred', callback)
      }
    }
  }, [socket])
  
  // Register content sync listener
  const onContentSync = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('content-synced', callback)
      return () => {
        socket.off('content-synced', callback)
      }
    }
  }, [socket])

  const sendCursorPosition = useCallback((pageId: string, position: { x: number; y: number }) => {
    if (socket && socket.connected) {
      socket.emit('cursor-move', { pageId, position })
    }
  }, [socket])

  const sendSelection = useCallback((pageId: string, selection: { start: number; end: number } | null) => {
    if (socket && socket.connected) {
      socket.emit('selection-change', { pageId, selection })
    }
  }, [socket])

  const sendTypingStart = useCallback((pageId: string, blockId: string) => {
    if (socket && socket.connected) {
      socket.emit('typing-start', { pageId, blockId })
    }
  }, [socket])

  const sendTypingStop = useCallback((pageId: string, blockId: string) => {
    if (socket && socket.connected) {
      socket.emit('typing-stop', { pageId, blockId })
    }
  }, [socket])

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      currentUsers,
      currentPageId,
      joinPage,
      leavePage,
      sendBlockUpdate,
      sendBlockAdd,
      sendBlockDelete,
      sendBlockReorder,
      sendBlockFocus,
      sendBlockBlur,
      sendContentSync,
      sendCursorPosition,
      sendSelection,
      sendTypingStart,
      sendTypingStop,
      onBlockUpdate,
      onBlockAdd,
      onBlockDelete,
      onBlockReorder,
      onBlockFocus,
      onBlockBlur,
      onContentSync
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)