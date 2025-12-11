import app from '@adonisjs/core/services/app'
import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import db from "@adonisjs/lucid/services/db";
import {wsAuthMiddleware} from "#middleware/ws_auth";
import User from "#models/user";
import Message from "#models/message";
import Channel from "#models/channel";

export let io: Server

const userSockets: Record<number, string[]> = {};

app.ready(() => {
  io = new Server(server.getNodeServer(), {
    cors: {
      origin: '*',
    },
  })

  console.log('Socket.IO server started.')

  io.use(wsAuthMiddleware)

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
      return
    }

    socket.on('acceptInvite', async({channelId}, callback)=>{
      try {
        const userId = socket.data.userId
        if (!userId) {
          return callback?.({ status: 'error', message: 'Not authenticated' })
        }

        const channelUser = await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', userId)
          .first()


        if (!channelUser) {
          return callback?.({ status: 'error', message: 'Invitation not found.' })
        }

        if (!channelUser.invited) {
          return callback?.({ status: 'error', message: 'Already a member.' })
        }

        await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', userId)
          .update({ invited: false })

        callback?.({ status: 'ok', message: 'Invitation accepted.' })

        io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId })

        console.log(`User ${userId} accepted invite to channel ${channelId}`)
      } catch (err) {
        console.error('acceptInvite socket error', err)
        callback?.({ status: 'error', message: 'Server error' })
      }

      })



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

    socket.on('inviteUser', async ({ channelId, nickName }, callback) => {
      try {
        const targetUser = await User.query().where('nick', nickName).first()
        if (!targetUser) return callback({ status: 'error', message: 'User not found' })

        const existing = await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', targetUser.id)
          .first()

        if (existing) {
          return callback({ status: 'error', message: `${nickName} is already in the channel or invited.` })
        }

        await db.table('channel_users').insert({
          channel_id: channelId,
          user_id: targetUser.id,
          invited: true
        })

        const targetSockets = getUserSockets(targetUser.id)
        for (const socketId of targetSockets) {
          io.to(socketId).emit('userWasInvited', { channelId })
        }

        callback({ status: 'ok', targetUserId: targetUser.id })
      } catch (err) {
        console.error('inviteUser error', err)
        callback({ status: 'error', message: 'Server error' })
      }
    })

    socket.on('leaveChannel', async ({ channelId , userId}) => {
      if (!userId || !channelId) {
        console.log("No valid userId")
        return
      }
      console.log("UserId:", userId)


      const userInChannel = await db
        .from('channel_users')
        .where('channel_id', channelId)
        .where('user_id', userId)
        .first()

      if (!userInChannel) return

      const channel = await Channel.find(channelId)
      if (!channel) return

      if (channel.moderatorId === userId) {
        io.to(`channel-${channelId}`).emit('channelDeleted', { channelId })

        const socketsInRoom = await io.in(`channel-${channelId}`).fetchSockets()
        for (const s of socketsInRoom) {
          s.leave(`channel-${channelId}`)
        }

        await Message.query().where('channel_id', channelId).delete()
        await db.from('channel_users').where('channel_id', channelId).delete()
        await channel.delete()

      } else {
        await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', userId)
          .delete()

        socket.leave(`channel-${channelId}`)

        io.to(`channel-${channelId}`).emit('channelUsersUpdated', {
          channelId,
          userId,
        })
      }
    })


    socket.on('joinChannel', ({ userId: joinUserId, channelId }: { userId: number; channelId: number }) => {
      console.log(`joinChannel from user:`, userId, 'socket:', socket.id, 'channel:', channelId)
      if (!userSockets[joinUserId]) userSockets[joinUserId] = []
      if (!userSockets[joinUserId].includes(socket.id)) {
        userSockets[joinUserId].push(socket.id)
      }
      socket.join(`channel-${channelId}`)

      io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId })
    })

    socket.on('userLeftChannel', ({channelId}) => {
      io.to(`channel-${channelId}`).emit('channelUsersUpdated', {channelId})
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
      console.log('SERVER: userKicked received:', { channelId, targetUserId })

      io.to(`channel-${channelId}`).emit('userWasKicked', {
        channelId,
        userId: targetUserId
      })

      console.log('SERVER: Emitted userWasKicked to channel-' + channelId)

      io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId })
    })

    socket.on('statusChange', async (data: { status: string }) => {
      try {
        const { status } = data
        if (userId === undefined) {
          console.warn('statusChange: userId is undefined')
          return
        }

        console.log(`User ${userId} changing status to ${status}`)
        await db
          .from('users')
          .where('id', userId)
          .update({ activity_status: status })

        const userChannels = await db
          .from('channel_users')
          .where('user_id', userId)
          .select('channel_id')

        console.log(`User ${userId} is in ${userChannels.length} channels`)

        for (const { channel_id } of userChannels) {
          const channelUsers = await db
            .from('channel_users')
            .where('channel_id', channel_id)
            .select('user_id')

          console.log(`Broadcasting status to ${channelUsers.length} users in channel ${channel_id}`)
          for (const { user_id } of channelUsers) {
            const sockets = getUserSockets(user_id)
            for (const socketId of sockets) {
              io.to(socketId).emit('userStatusUpdate', {
                userId,
                status,
                channelId: channel_id
              })
              console.log(`Sent status update to socket ${socketId}`)
            }
          }
        }

        console.log(`User ${userId} status changed to ${status} successfully`)
      } catch (error) {
        console.error('Error updating user status:', error)
      }
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

