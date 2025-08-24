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
  sendContentUpdate: (pageId: string, blocks: any[], userId: string) => void
  sendCursorPosition: (pageId: string, position: { x: number; y: number }) => void
  sendSelection: (pageId: string, selection: { start: number; end: number } | null) => void
  sendTypingStart: (pageId: string, blockId: string) => void
  sendTypingStop: (pageId: string, blockId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  currentUsers: new Map(),
  currentPageId: null,
  joinPage: () => {},
  leavePage: () => {},
  sendContentUpdate: () => {},
  sendCursorPosition: () => {},
  sendSelection: () => {},
  sendTypingStart: () => {},
  sendTypingStop: () => {},
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

  const lastContentUpdate = useRef<string>('')
  
  const sendContentUpdate = useCallback((pageId: string, blocks: any[], userId: string) => {
    if (socket && socket.connected) {
      // Only send if content actually changed
      const contentHash = JSON.stringify({ pageId, blocks, userId })
      if (contentHash !== lastContentUpdate.current) {
        socket.emit('content-update', { pageId, blocks, userId })
        lastContentUpdate.current = contentHash
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
      sendContentUpdate,
      sendCursorPosition,
      sendSelection,
      sendTypingStart,
      sendTypingStop
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)