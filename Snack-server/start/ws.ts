import app from '@adonisjs/core/services/app'
import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import db from "@adonisjs/lucid/services/db";

const userSockets: Record<number, string[]> = {};

app.ready(() => {
  const io = new Server(server.getNodeServer(), {
    cors: {
      origin: '*',
    },
  })

  console.log('Socket.IO server started.')

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    console.log(`User ${userId} connected: ${socket.id}`)

    if (userId !== undefined) {
      if (!userSockets[userId]) userSockets[userId] = []
      if (!userSockets[userId].includes(socket.id)) {
        userSockets[userId].push(socket.id)
      }
    } else {
      console.warn(`Socket ${socket.id} connected without userId`)
    }

    socket.on('sendMessage', async (data, callback) => {
      try {
        const { channelId, message } = data
        const usersInChannel = await db
          .from('channel_users')
          .where('channel_id', channelId)
          .select('user_id')
        const channel = await db.from('channels').where('id', channelId).first()

        let sentCount = 0
        for (const { user_id } of usersInChannel) {
          const sockets = getUserSockets(user_id)
          for (const socketId of sockets) {
            io.to(socketId).emit('newMessage', {
              ...message,
              channelId,
              channelName: channel?.name,
            })
            sentCount++
          }
        }

        if (callback) callback({ status: 'ok', sentTo: sentCount })
      } catch (error) {
        console.error('Error broadcasting message:', error)
        if (callback) callback({ status: 'error', error: 'Failed to broadcast message' })
      }
    })

    socket.on('joinChannel', ({ userId: joinUserId, channelId }: { userId: number; channelId: number }) => {
      console.log(`joinChannel from user:`, userId, 'socket:', socket.id, 'channel:', channelId)
      if (!userSockets[joinUserId]) userSockets[joinUserId] = []
      if (!userSockets[joinUserId].includes(socket.id)) {
        userSockets[joinUserId].push(socket.id)
      }
      socket.join(`channel-${channelId}`)
    })

    socket.on('userJoinedChannel', ({channelId}) => {
      io.to(`channel-${channelId}`).emit('channelUsersUpdated', {channelId})
    })

    socket.on('userLeftChannel', ({channelId}) => {
      io.to(`channel-${channelId}`).emit('channelUsersUpdated', {channelId})
    })

    socket.on('deleteChannel', ({ channelId }) => {
      console.log('deleteChannel received for channel:', channelId)
      io.to(`channel-${channelId}`).emit('channelDeleted', { channelId })
    })

    socket.on('typing', async (data) => {
      try {
        const { channelId, isTyping } = data
        if (userId === undefined) return

        const usersInChannel = await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', '!=', userId)
          .select('user_id')

        const user = await db.from('users').where('id', userId).first()

        for (const { user_id } of usersInChannel) {
          for (const socketId of getUserSockets(user_id)) {
            io.to(socketId).emit('userTyping', {
              channelId,
              userId,
              nick: user?.nick,
              isTyping,
            })
          }
        }
      } catch (error) {
        console.error('Error broadcasting typing:', error)
      }
    })
    socket.on('userRevoked', async ({ channelId, targetUserId }) => {

      io.to(`channel-${channelId}`).emit('userWasRevoked', {
        channelId,
        userId: targetUserId
      })


      io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId })
    })

    socket.on('userKicked', async ({ channelId, targetUserId }) => {
      console.log('🟢 SERVER: userKicked received:', { channelId, targetUserId })

      io.to(`channel-${channelId}`).emit('userWasKicked', {
        channelId,
        userId: targetUserId
      })

      console.log('🟢 SERVER: Emitted userWasKicked to channel-' + channelId)

      io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId })
    })

    socket.on('disconnect', () => {
      if (userId !== undefined) {
        if (userSockets[userId]) {
          userSockets[userId] = userSockets[userId].filter(id => id !== socket.id)
          if (userSockets[userId].length === 0) {
            delete userSockets[userId]
          }
        }
      } else {
        console.log(`Unknown user disconnected: ${socket.id}`)
      }
    })


  })
})

function getUserSockets(userId: number) {
  return userSockets[userId] || [];
}

