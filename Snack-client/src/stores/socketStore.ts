import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { ref } from 'vue'
import type { Message } from 'stores/chat'
import { Notify } from 'quasar'
import { useAuthStore } from 'stores/auth'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null)
  const connected = ref(false)

  function connect(token: string) {
    if (socket.value?.connected) return

    socket.value = io('http://localhost:3333', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    setupListeners()
  }

  function setupListeners() {
    if (!socket.value) return

    socket.value.on('connect', () => {
      connected.value = true
      console.log('Socket connected')
    })

    socket.value.on('disconnect', () => {
      connected.value = false
      console.log('Socket disconnected')
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      Notify.create({
        type: 'negative',
        message: 'Connection error. Retrying...',
        position: 'top',
      })
    })

    socket.value.on('newMessage', async (data: Message & { channelName?: string }) => {
      const { useChatStore } = await import('stores/chat')
      const chatStore = useChatStore()
      const authStore = useAuthStore()

      console.log('Received new message:', data)

      chatStore.addMessage(data)

      const isMentioned = data.mentions?.some(m => m.mentionedId === authStore.user?.id)

      if (data.channelId !== chatStore.currentChannelId) {
        Notify.create({
          type: isMentioned ? 'warning' : 'info',
          color: isMentioned ? 'yellow-8' : 'blue',
          ...(isMentioned && { icon: 'alternate_email' }),
          message: isMentioned
            ? `${data.author.nick} mentioned you in ${data.channelName || `channel #${data.channelId}`}`
            : `New message in ${data.channelName || `channel #${data.channelId}`}`,
          position: 'top',
          timeout: isMentioned ? 5000 : 3000,
        })
      } else if (isMentioned) {
        Notify.create({
          type: 'warning',
          color: 'yellow-8',
          icon: 'alternate_email',
          message: `${data.author.nick} mentioned you!`,
          position: 'top',
          timeout: 3000,
        })
      }
      if (window.Notification && document.hidden) {
        if (Notification.permission === 'granted') {
          new Notification(
            `Nová správa v ${data.channelName || `kanál #${data.channelId}`}`,
            { body: `${data.author.nick}: ${data.content.slice(0, 80)}` }
          )
        } else if (Notification.permission !== 'denied') {
          void Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(
                `Nová správa v ${data.channelName || `kanál #${data.channelId}`}`,
                { body: `${data.author.nick}: ${data.content.slice(0, 80)}` }
              )
            }
          })
        }
      }
    })

    socket.value.on('userTyping', (data: { channelId: number; userId: number; nick: string }) => {
      console.log('User typing:', data)
    })

    socket.value.on('channelUsersUpdated', async (data: { channelId: number }) => {
      console.log('Channel users updated:', data.channelId)
      const { useChatStore } = await import('stores/chat')
      const chatStore = useChatStore()

      if (data.channelId === chatStore.currentChannelId) {
        await chatStore.loadChannelUsers(data.channelId)
      }
    });

    socket.value.on('connect_error', (err) => {
      console.error('Problem with connection to the server::', err)
    });

    socket.value.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason)
    });

    socket.value.on('channelDeleted', async ({ channelId }) => {
      const { useChatStore } = await import('stores/chat')
      const chatStore = useChatStore()

      if (chatStore.currentChannelId === channelId) {
        chatStore.currentChannelId = null
        chatStore.messages.splice(0, chatStore.messages.length)
      }

      await chatStore.fetchChannels()
    })
  }

  function disconnect() {
    if (socket.value) {
      socket.value.removeAllListeners()
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  function leaveChannel(channelId: number) {
    socket.value?.emit('leaveChannel', { channelId })
  }

  function joinChannel(channelId: number) {
    const auth = useAuthStore()
    const userId = auth.user?.id
    if (!userId) {
      console.warn('No user ID available for joinChannel!')
      return
    }
    socket.value?.emit('joinChannel', { userId, channelId })
    console.log('Emitting joinChannel', { userId, channelId })
  }

  const sendMessage = (channelId: number, message: Message) => {
    socket.value?.emit('sendMessage', { channelId, message })
  }

  const notifyUserJoined = (channelId: number) => {
    socket.value?.emit('userJoinedChannel', { channelId })
  }

  const notifyUserLeft = (channelId: number, isModerator: boolean) => {
    socket.value?.emit('userLeftChannel', { channelId })

    if (isModerator) {
      socket.value?.emit('deleteChannel', { channelId })
    }
  }

  function init(token?: string) {
    if (socket.value?.connected) return
    const _token = token || useAuthStore().token
    if (!_token) {
      console.warn('No token for socket initialization!')
      return
    }
    socket.value = io('http://localhost:3333', {
      auth: { token: _token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })
    setupListeners()
  }

  return {
    socket,
    connected,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    sendMessage,
    notifyUserJoined,
    notifyUserLeft,
    init
  }
})
