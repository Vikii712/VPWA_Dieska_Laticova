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

  io?.on('connection', (socket) => {
    console.log('A new connection', socket.id)

    socket.on('joinChannel', (userId, channelId) => {
      if (!userSockets[userId]) userSockets[userId] = [];
      if (!userSockets[userId].includes(socket.id)) {
        userSockets[userId].push(socket.id);
      }
      socket.join(`channel-${channelId}`)
    })

    socket.on('sendMessage', async ({ channelId, message }, callback) => {
      const usersInChannel = await db.from('channel_users').where('channel_id', channelId).select('user_id');

      usersInChannel.forEach(({ user_id }) => {
        getUserSockets(user_id).forEach(sid => {
          io.to(sid).emit('newMessage', { ...message, channelId, channelName: message.channelName });
        });
      });

      callback({ status: 'ok' });
    });

    socket.on('userJoinedChannel', ({channelId}) => {
      io.to(`channel-${channelId}`).emit('channelUsersUpdated', {channelId})
    })

    socket.on('userLeftChannel', ({channelId}) => {
      io.to(`channel-${channelId}`).emit('channelUsersUpdated', {channelId})
    })

    socket.on('disconnect', () => {
      for (const userId in userSockets) {
        userSockets[userId] = userSockets[userId].filter(id => id !== socket.id);
        if (userSockets[userId].length === 0) delete userSockets[userId];
      }
    });

  })
})

function getUserSockets(userId: number) {
  return userSockets[userId] || [];
}
