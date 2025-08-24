import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '@/lib/db/prisma'

export interface UserPresence {
  userId: string
  name: string
  email: string
  avatarUrl?: string | null
  cursorPosition?: { x: number; y: number }
  selection?: { start: number; end: number }
  color: string
}

export interface PageRoom {
  pageId: string
  workspaceId: string
  users: Map<string, UserPresence>
}

class SocketServer {
  private io: SocketIOServer | null = null
  private pageRooms: Map<string, PageRoom> = new Map()
  private userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#A8E6CF', '#FFD3B6', '#FFAAA5'
  ]
  private colorIndex = 0

  initialize(server: HTTPServer) {
    if (this.io) return this.io

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      // Join a page room
      socket.on('join-page', async (data: { 
        pageId: string
        workspaceId: string
        user: { id: string; name: string; email: string; avatarUrl?: string }
      }) => {
        const { pageId, workspaceId, user } = data
        const roomId = `page:${pageId}`

        // Verify user has access to this page
        const hasAccess = await this.verifyPageAccess(user.id, workspaceId)
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' })
          return
        }

        // Leave previous rooms
        const rooms = Array.from(socket.rooms)
        rooms.forEach(room => {
          if (room !== socket.id && room.startsWith('page:')) {
            socket.leave(room)
            this.removeUserFromRoom(room, socket.id)
          }
        })

        // Join new room
        socket.join(roomId)

        // Initialize room if needed
        if (!this.pageRooms.has(roomId)) {
          this.pageRooms.set(roomId, {
            pageId,
            workspaceId,
            users: new Map()
          })
        }

        // Add user to room
        const room = this.pageRooms.get(roomId)!
        const userPresence: UserPresence = {
          ...user,
          color: this.getUserColor()
        }
        room.users.set(socket.id, userPresence)

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
          socketId: socket.id,
          user: userPresence
        })

        // Send current users to the new user
        const currentUsers = Array.from(room.users.entries()).map(([id, user]) => ({
          socketId: id,
          ...user
        }))
        socket.emit('current-users', currentUsers)
      })

      // Handle content updates
      socket.on('content-update', async (data: {
        pageId: string
        blocks: any[]
        userId: string
      }) => {
        const roomId = `page:${data.pageId}`
        
        // Broadcast to all other users in the room
        socket.to(roomId).emit('content-updated', {
          blocks: data.blocks,
          userId: data.userId,
          timestamp: new Date().toISOString()
        })
      })

      // Handle cursor movement
      socket.on('cursor-move', (data: {
        pageId: string
        position: { x: number; y: number }
      }) => {
        const roomId = `page:${data.pageId}`
        const room = this.pageRooms.get(roomId)
        
        if (room && room.users.has(socket.id)) {
          const user = room.users.get(socket.id)!
          user.cursorPosition = data.position

          // Broadcast cursor position to others
          socket.to(roomId).emit('cursor-moved', {
            socketId: socket.id,
            position: data.position,
            user: user
          })
        }
      })

      // Handle selection changes
      socket.on('selection-change', (data: {
        pageId: string
        selection: { start: number; end: number } | null
      }) => {
        const roomId = `page:${data.pageId}`
        const room = this.pageRooms.get(roomId)
        
        if (room && room.users.has(socket.id)) {
          const user = room.users.get(socket.id)!
          user.selection = data.selection || undefined

          // Broadcast selection to others
          socket.to(roomId).emit('selection-changed', {
            socketId: socket.id,
            selection: data.selection,
            user: user
          })
        }
      })

      // Handle typing indicator
      socket.on('typing-start', (data: { pageId: string; blockId: string }) => {
        const roomId = `page:${data.pageId}`
        const room = this.pageRooms.get(roomId)
        
        if (room && room.users.has(socket.id)) {
          const user = room.users.get(socket.id)!
          
          socket.to(roomId).emit('user-typing', {
            socketId: socket.id,
            blockId: data.blockId,
            user: user
          })
        }
      })

      socket.on('typing-stop', (data: { pageId: string; blockId: string }) => {
        const roomId = `page:${data.pageId}`
        
        socket.to(roomId).emit('user-stopped-typing', {
          socketId: socket.id,
          blockId: data.blockId
        })
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)

        // Remove from all page rooms
        const rooms = Array.from(socket.rooms)
        rooms.forEach(room => {
          if (room.startsWith('page:')) {
            this.removeUserFromRoom(room, socket.id)
            
            // Notify others
            socket.to(room).emit('user-left', {
              socketId: socket.id
            })
          }
        })
      })
    })

    return this.io
  }

  private async verifyPageAccess(userId: string, workspaceId: string): Promise<boolean> {
    try {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId
          }
        }
      })
      return !!member
    } catch (error) {
      console.error('Error verifying page access:', error)
      return false
    }
  }

  private removeUserFromRoom(roomId: string, socketId: string) {
    const room = this.pageRooms.get(roomId)
    if (room) {
      room.users.delete(socketId)
      
      // Clean up empty rooms
      if (room.users.size === 0) {
        this.pageRooms.delete(roomId)
      }
    }
  }

  private getUserColor(): string {
    const color = this.userColors[this.colorIndex % this.userColors.length]
    this.colorIndex++
    return color
  }

  getIO() {
    return this.io
  }
}

export const socketServer = new SocketServer()