import app from '@adonisjs/core/services/app'
import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import db from "@adonisjs/lucid/services/db";
import {wsAuthMiddleware} from "#middleware/ws_auth";
import User from "#models/user";
import Message from "#models/message";
import Channel from "#models/channel";
import Mention from "#models/mention";
import ChannelUser from "#models/channel_user";
import { DateTime } from 'luxon';

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

    if (userId === undefined) {
      console.warn(`Socket ${socket.id} connected without userId`)
      socket.disconnect(true)
      return
    }

    if (userSockets[userId]) {
      const oldSockets = [...userSockets[userId]]
      for (const oldSocketId of oldSockets) {
        if (oldSocketId !== socket.id) {
          const oldSocket = io.sockets.sockets.get(oldSocketId)
          if (oldSocket && !oldSocket.connected) {
            userSockets[userId] = userSockets[userId].filter(id => id !== oldSocketId)
          }
        }
      }
    }

    if (!userSockets[userId]) userSockets[userId] = []
    if (!userSockets[userId].includes(socket.id)) {
      userSockets[userId].push(socket.id)
    }

    console.log(`User ${userId} now has ${userSockets[userId].length} active sockets`)

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

        console.log('channelUser found:', channelUser, 'channelid:', channelId, 'userid:', userId)

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
          .update({
            invited: 0,
            member: 1
          })

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
        const userId = socket.data.userId
        if (!userId) {
          console.warn('Socket missing userId')
          return callback?.({ status: 'error', error: 'Not authenticated' })
        }

        const { channelId, message } = data

        if (!message?.content?.trim()) {
          return callback?.({ status: 'error', error: 'Content missing' })
        }

        const isMember = await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', userId)
          .first()

        if (!isMember) {
          return callback?.({ status: 'error', error: 'Not a member of channel' })
        }

        const savedMessage = await Message.create({
          channelId,
          createdBy: userId,
          content: message.content,
        })

        await savedMessage.load('author')
        await processMentions(savedMessage.content, savedMessage.id)
        await savedMessage.load('mentions')


        await db
          .from('channels')
          .where('id', channelId)
          .update({
            last_active_at: DateTime.now().toSQL()
          })

        const channel = await Channel.find(channelId)

        const dto = {
          id: savedMessage.id,
          content: savedMessage.content,
          createdAt: savedMessage.createdAt.toISO(),
          channelId: channelId,
          channelName: channel?.name || '',
          author: {
            id: savedMessage.author.id,
            nick: savedMessage.author.nick
          },
          mentions: savedMessage.mentions.map(m => ({
            id: m.id,
            mentionedId: m.mentionedId
          }))
        }

        await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', '!=', userId)
          .update({ unread: true })

        const usersInChannel = await db
          .from('channel_users')
          .where('channel_id', channelId)
          .select('user_id')

        let sentCount = 0
        for (const { user_id } of usersInChannel) {
          const sockets = getUserSockets(user_id)
          for (const socketId of sockets) {
            io.to(socketId).emit('newMessage', dto)
            sentCount++
          }
        }

        callback?.({ status: 'ok', sentTo: sentCount })

      } catch (error) {
        console.error('Error broadcasting message:', error)
        callback?.({ status: 'error', error: 'Failed to broadcast message' })
      }
    })

    socket.on('markAsRead', async ({ channelId }) => {
      try {
        const userId = socket.data.userId
        if (!userId || !channelId) return

        console.log(`Marking channel ${channelId} as read for user ${userId}`)

        await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', userId)
          .update({ unread: false })

        console.log(`Channel ${channelId} marked as read for user ${userId}`)

      } catch (error) {
        console.error('Error marking channel as read:', error)
      }
    })


    async function processMentions(messageContent: string, messageId: number) {
      const mentionRegex = /@(\w+)/g
      const mentions = Array.from(messageContent.matchAll(mentionRegex), m => m[1])

      if (!mentions.length) return

      for (const nick of mentions) {
        const user = await User.query().where('nick', nick).first()
        if (!user) continue

        await Mention.create({
          messageId,
          mentionedId: user.id
        })
      }
    }

    socket.on('inviteUser', async ({ channelId, nickName, isModerator }, callback) => {
      try {
        const targetUser = await User.query().where('nick', nickName).first()
        if (!targetUser) return callback({ status: 'error', message: 'User not found' })

        const existing = await db
          .from('channel_users')
          .where('channel_id', channelId)
          .where('user_id', targetUser.id)
          .first()

        if (existing) {
          if (existing.member) {
            return callback({ status: 'error', message: `${nickName} is already a member of the channel.` })
          }

          if (existing.ban >= 3 && !isModerator) {
            return callback({ status: 'error', message: `${nickName} is permanently banned and only moderator can invite them.` })
          }

          await db
            .from('channel_users')
            .where('id', existing.id)
            .update({
              invited: 1,
              member: 0,
              ban: isModerator ? 0 : existing.ban
            })

          const targetSockets = getUserSockets(targetUser.id)
          for (const socketId of targetSockets) {
            io.to(socketId).emit('userWasInvited', { channelId })
          }

          return callback({ status: 'ok', targetUserId: targetUser.id })
        }

        await db.table('channel_users').insert({
          channel_id: channelId,
          user_id: targetUser.id,
          invited: 1,
          member: 0,
          ban: 0
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

    socket.on('leaveChannel', async ({ channelId, userId }) => {
      if (!userId || !channelId) return

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
          .update({ member: false })

        socket.leave(`channel-${channelId}`)

        io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId, userId })
      }
    })

    socket.on('declineInvite', async ({ channelId, userId }) => {
      if (!userId || !channelId) return

      const userInChannel = await db
        .from('channel_users')
        .where('channel_id', channelId)
        .where('user_id', userId)
        .first()

      if (!userInChannel) return

      await db
        .from('channel_users')
        .where('channel_id', channelId)
        .where('user_id', userId)
        .update({
          invited: false,
          member: false
        })

      socket.emit('inviteDeclined', { channelId })

      io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId, userId })
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
        const { channelId, isTyping, content } = data
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
              content
            })
          }
        }
      } catch (error) {
        console.error('Error broadcasting typing:', error)
      }
    })


    socket.on('userRevoked', async ({myId, channelId, targetNick}) => {
      console.log('web socket skusa')
      try {

        const channel = await Channel.find(channelId)
        if (!channel) return console.warn('Channel not found:', channelId)

        if (channel.public) return console.warn('Cannot revoke in public channel')
        if (channel.moderatorId !== myId) return console.warn('Only moderator can revoke')

        const targetUser = await User.query().where('nick', targetNick).first()
        if (!targetUser) return console.warn('Target user not found:', targetNick)

        if (targetUser.id === myId) return console.warn('Cannot revoke yourself')

        const channelUser = await ChannelUser.query()
          .where('channel_id', channelId)
          .where('user_id', targetUser.id)
          .first()

        console.log('web socket: channelId:', channelId, 'targetUser:', targetUser.id, 'channeluser:', channelUser)

        if (!channelUser) {
          console.warn('User not in channel')
          return
        }

        await channelUser.merge({
          member: false,
          invited: false
        }).save()

        io.to(`channel-${channelId}`).emit('userWasRevoked', {
          channelId,
          userId: targetUser.id
        })

        io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId })

      } catch (err) {
        console.error('Error revoking user:', err)
      }
    })


    socket.on('userKicked', async ({myId, channelId, targetNick }) => {
      try {
        const channel = await Channel.find(channelId)
        if (!channel) return console.warn('Channel not found:', channelId)

        if (!channel.public) return console.warn('Cannot kick in private channel')

        const targetUser = await User.query().where('nick', targetNick).first()
        if (!targetUser) return console.warn('Target user not found:', targetNick)

        if (targetUser.id === channel.moderatorId) return console.warn('Cannot kick moderator')
        if (targetUser.id === myId) return console.warn('Cannot kick yourself')

        const channelUser = await ChannelUser.query()
          .where('channel_id', channelId)
          .where('user_id', targetUser.id)
          .first()

        if (channelUser) {
          if (channelUser.ban >= 3) {
            console.warn('User is permanently banned from the channel')
            return
          }

          const newBanValue = myId === channel.moderatorId ? 3 : channelUser.ban + 1

          await channelUser.merge({
            ban: Math.min(newBanValue, 3),
            invited:false,
            member: false,
          }).save()

          io.to(`channel-${channelId}`).emit('userWasKicked', {
            channelId,
            userId: targetUser.id
          })

          io.to(`channel-${channelId}`).emit('channelUsersUpdated', { channelId })
        }
      } catch (err) {
        console.error('Error kicking user:', err)
      }
    })



    socket.on('statusChange', async (data: { status: string }, callback?: () => void) => {
      const userId = socket.data.userId

      await User.query().where('id', userId).update({ activity_status: data.status })

      const userChannels = await ChannelUser.query()
        .where('user_id', userId)
        .select('channel_id')

      for (const channel of userChannels) {
        socket.to(`channel-${channel.channelId}`).emit(`userStatusUpdate`, {
          userId: userId,
          status: data.status,
          channelId: channel.channelId
        })
      }

      if(callback) callback()
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

