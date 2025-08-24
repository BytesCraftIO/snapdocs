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

  const pageRooms = new Map()
  const userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#A8E6CF', '#FFD3B6', '#FFAAA5'
  ]
  let colorIndex = 0

  const getUserColor = () => {
    const color = userColors[colorIndex % userColors.length]
    colorIndex++
    return color
  }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join a page room
    socket.on('join-page', async (data) => {
      console.log('User joining page:', data)
      const { pageId, workspaceId, user } = data
      const roomId = `page:${pageId}`

      // Leave previous rooms
      const rooms = Array.from(socket.rooms)
      rooms.forEach(room => {
        if (room !== socket.id && room.startsWith('page:')) {
          socket.leave(room)
          removeUserFromRoom(room, socket.id)
          
          // Notify users in the old room
          io.to(room).emit('user-left', {
            socketId: socket.id
          })
        }
      })

      // Join new room
      socket.join(roomId)

      // Initialize room if needed
      if (!pageRooms.has(roomId)) {
        pageRooms.set(roomId, {
          pageId,
          workspaceId,
          users: new Map()
        })
      }

      // Add user to room
      const room = pageRooms.get(roomId)
      const userPresence = {
        userId: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        socketId: socket.id,
        color: getUserColor()
      }
      room.users.set(socket.id, userPresence)

      // Send current users to the new user (excluding themselves)
      const currentUsers = Array.from(room.users.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, userData]) => ({
          socketId: id,
          ...userData
        }))
      socket.emit('current-users', currentUsers)

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        user: userPresence
      })
      
      console.log(`User ${user.name} joined room ${roomId}. Total users: ${room.users.size}`)
    })

    // Handle content updates
    socket.on('content-update', (data) => {
      const roomId = `page:${data.pageId}`
      const room = pageRooms.get(roomId)
      
      if (room) {
        const otherUsers = room.users.size - 1
        if (otherUsers > 0) {
          console.log(`[${new Date().toISOString()}] Content update in room ${roomId} from user ${data.userId}. Broadcasting to ${otherUsers} other users`)
          
          // Broadcast to all other users in the room
          socket.to(roomId).emit('content-updated', {
            blocks: data.blocks,
            userId: data.userId,
            timestamp: new Date().toISOString()
          })
        }
      } else {
        console.log(`Warning: Content update for non-existent room ${roomId}`)
      }
    })

    // Handle cursor movement
    socket.on('cursor-move', (data) => {
      const roomId = `page:${data.pageId}`
      const room = pageRooms.get(roomId)
      
      if (room && room.users.has(socket.id)) {
        const user = room.users.get(socket.id)
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
    socket.on('selection-change', (data) => {
      const roomId = `page:${data.pageId}`
      const room = pageRooms.get(roomId)
      
      if (room && room.users.has(socket.id)) {
        const user = room.users.get(socket.id)
        user.selection = data.selection

        // Broadcast selection to others
        socket.to(roomId).emit('selection-changed', {
          socketId: socket.id,
          selection: data.selection,
          user: user
        })
      }
    })

    // Handle typing indicator
    socket.on('typing-start', (data) => {
      const roomId = `page:${data.pageId}`
      const room = pageRooms.get(roomId)
      
      if (room && room.users.has(socket.id)) {
        const user = room.users.get(socket.id)
        
        socket.to(roomId).emit('user-typing', {
          socketId: socket.id,
          blockId: data.blockId,
          user: user
        })
      }
    })

    socket.on('typing-stop', (data) => {
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
      pageRooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          const user = room.users.get(socket.id)
          room.users.delete(socket.id)
          
          // Notify others in the room
          io.to(roomId).emit('user-left', {
            socketId: socket.id
          })
          
          console.log(`User ${user?.name} left room ${roomId}. Remaining users: ${room.users.size}`)
          
          // Clean up empty rooms
          if (room.users.size === 0) {
            pageRooms.delete(roomId)
          }
        }
      })
    })
  })

  const removeUserFromRoom = (roomId, socketId) => {
    const room = pageRooms.get(roomId)
    if (room) {
      room.users.delete(socketId)
      
      // Clean up empty rooms
      if (room.users.size === 0) {
        pageRooms.delete(roomId)
      }
    }
  }

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})