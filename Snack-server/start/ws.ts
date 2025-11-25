import app from '@adonisjs/core/services/app'
import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'

app.ready(() => {
  const io = new Server(server.getNodeServer(), {
    cors: {
      origin: '*',
    },
  })

  io?.on('connection', (socket) => {
    console.log('A new connection', socket.id)

    socket.on('joinChannel', (channelId) => {
      socket.join(`channel-${channelId}`)
    })

    socket.on('sendMessage', async ({channelId, message}, callback) => {
      io.to(`channel-${channelId}`).emit('newMessage', {
        ...message,
        channelId
      });
      callback({status: 'ok'});
    });

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
  })
})
