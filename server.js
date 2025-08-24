const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  // Simple page-based user tracking
  const pageRooms = new Map() // roomId -> Map(userId -> userInfo)
  const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#A8E6CF', '#FFD3B6', '#FFAAA5']
  
  io.on('connection', (socket) => {
    console.log('✅ Socket connected:', socket.id)
    let currentRoom = null
    let currentUserId = null

    socket.on('join-page', (data) => {
      console.log('📄 Join page request:', data)
      const { pageId, workspaceId, user } = data
      
      if (!pageId || !user?.id) {
        console.log('❌ Invalid join request - missing pageId or user.id')
        return
      }

      const roomId = `page:${pageId}`
      
      // Leave previous room if any
      if (currentRoom && currentRoom !== roomId) {
        socket.leave(currentRoom)
        const oldRoom = pageRooms.get(currentRoom)
        if (oldRoom) {
          oldRoom.delete(currentUserId)
          // Notify others in old room that someone left
          socket.to(currentRoom).emit('user-left', {
            userId: currentUserId
          })
          console.log(`👋 User ${currentUserId} left room ${currentRoom}`)
        }
      }

      // Join new room
      socket.join(roomId)
      currentRoom = roomId
      currentUserId = user.id

      // Initialize room if needed
      if (!pageRooms.has(roomId)) {
        pageRooms.set(roomId, new Map())
      }

      // Add user to room
      const room = pageRooms.get(roomId)
      const userInfo = {
        userId: user.id,
        name: user.name || 'Anonymous',
        email: user.email || '',
        color: userColors[Math.floor(Math.random() * userColors.length)],
        socketId: socket.id
      }
      room.set(user.id, userInfo)

      // Get all users in this room
      const allUsers = Array.from(room.values())
      
      // Send list of other users to the joining user (excluding themselves)
      const otherUsers = allUsers.filter(u => u.userId !== user.id)
      socket.emit('current-users', otherUsers)
      
      // Notify others that a new user joined
      socket.to(roomId).emit('user-joined', {
        user: userInfo
      })
      
      console.log(`✅ User ${user.name} (${user.id}) joined room ${roomId}. Total users: ${room.size}`)
    })

    // Handle individual block updates (real-time)
    socket.on('block-update', (data) => {
      if (!currentRoom) return
      
      const room = pageRooms.get(currentRoom)
      if (room && room.size > 1) {
        // Broadcast block update immediately to other users
        socket.to(currentRoom).emit('block-updated', {
          blockId: data.blockId,
          content: data.content,
          userId: data.userId,
          timestamp: new Date().toISOString()
        })
      }
    })
    
    // Handle block addition
    socket.on('block-add', (data) => {
      if (!currentRoom) return
      
      const room = pageRooms.get(currentRoom)
      if (room && room.size > 1) {
        socket.to(currentRoom).emit('block-added', {
          block: data.block,
          index: data.index,
          userId: data.userId,
          timestamp: new Date().toISOString()
        })
      }
    })
    
    // Handle block deletion
    socket.on('block-delete', (data) => {
      if (!currentRoom) return
      
      const room = pageRooms.get(currentRoom)
      if (room && room.size > 1) {
        socket.to(currentRoom).emit('block-deleted', {
          blockId: data.blockId,
          userId: data.userId,
          timestamp: new Date().toISOString()
        })
      }
    })
    
    // Handle block reorder
    socket.on('block-reorder', (data) => {
      if (!currentRoom) return
      
      const room = pageRooms.get(currentRoom)
      if (room && room.size > 1) {
        socket.to(currentRoom).emit('block-reordered', {
          blockId: data.blockId,
          newIndex: data.newIndex,
          userId: data.userId,
          timestamp: new Date().toISOString()
        })
      }
    })
    
    // Handle block focus (user starts editing a block)
    socket.on('block-focus', (data) => {
      if (!currentRoom) return
      
      const room = pageRooms.get(currentRoom)
      if (room && room.size > 1) {
        const userInfo = room.get(data.userId)
        socket.to(currentRoom).emit('block-focused', {
          blockId: data.blockId,
          userId: data.userId,
          userName: userInfo?.name || 'Anonymous',
          userColor: userInfo?.color || '#4ECDC4',
          timestamp: new Date().toISOString()
        })
      }
    })
    
    // Handle block blur (user stops editing a block)
    socket.on('block-blur', (data) => {
      if (!currentRoom) return
      
      const room = pageRooms.get(currentRoom)
      if (room && room.size > 1) {
        socket.to(currentRoom).emit('block-blurred', {
          blockId: data.blockId,
          userId: data.userId,
          timestamp: new Date().toISOString()
        })
      }
    })
    
    // Handle full content sync (periodic)
    socket.on('content-sync', (data) => {
      if (!currentRoom) return
      
      const room = pageRooms.get(currentRoom)
      if (room && room.size > 1) {
        console.log(`🔄 Syncing content in ${currentRoom}`)
        socket.to(currentRoom).emit('content-synced', {
          blocks: data.blocks,
          userId: data.userId,
          timestamp: new Date().toISOString()
        })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id)
      
      if (currentRoom && currentUserId) {
        const room = pageRooms.get(currentRoom)
        if (room) {
          room.delete(currentUserId)
          
          // Notify others in the room that someone left
          socket.to(currentRoom).emit('user-left', {
            userId: currentUserId
          })
          
          console.log(`👋 User ${currentUserId} disconnected from ${currentRoom}. Remaining: ${room.size}`)
          
          // Clean up empty rooms
          if (room.size === 0) {
            pageRooms.delete(currentRoom)
            console.log(`🧹 Cleaned up empty room ${currentRoom}`)
          }
        }
      }
    })
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log('> Socket.io server running')
  })
})