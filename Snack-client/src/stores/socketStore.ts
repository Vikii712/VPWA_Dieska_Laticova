import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import {nextTick, ref} from 'vue'
import type { Message } from 'stores/chat'
import { Notify } from 'quasar'
import { useAuthStore } from 'stores/auth'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null)
  const connected = ref(false)

  function connect(token: string) {
    if (socket.value?.connected) return

    const auth = useAuthStore()
    const userId = auth.user?.id

    socket.value = io('http://localhost:3333', {
      auth: {
        token,
        userId
      },
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
      const authStore = useAuthStore()

      if (authStore.isOnline) {
        Notify.create({
          type: 'negative',
          message: 'Connection error. Retrying...',
          position: 'top',
        })
      }
    })

    socket.value.on('newMessage', async (data: Message & { channelName?: string }) => {
      const { useChatStore } = await import('stores/chat')
      const chatStore = useChatStore()
      const authStore = useAuthStore()

      console.log('Received new message:', data)

      if (!authStore.isOnline) {
        console.log('User is offline, ignoring message')
        return
      }

      chatStore.addMessage(data)
      await nextTick()
      window.dispatchEvent(new Event('new-message-received'))

      const isMentioned = data.mentions?.some(m => m.mentionedId === authStore.user?.id)

      const notifPref = authStore.notificationPreference

      if (notifPref === 'none' || authStore.isDND) {
        return
      }

      if (notifPref === 'mentioned' && !isMentioned) {
        return
      }

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

      // Push browser notification
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
      const authStore = useAuthStore()
      console.log('User typing:', data)

      if (!authStore.isOnline) {
        return
      }
    })

    socket.value.on('channelUsersUpdated', async (data: { channelId: number }) => {
      console.log('Channel users updated:', data.channelId)
      const authStore = useAuthStore()

      if (!authStore.isOnline) {
        return
      }

      const {useChatStore} = await import('stores/chat')
      const chatStore = useChatStore()

      if (data.channelId === chatStore.currentChannelId) {
        await chatStore.loadChannelUsers(data.channelId)
      }
    })

    socket.value.on('userStatusUpdate', async (data: { userId: number; status: string; channelId: number }) => {
      console.log('User status updated:', data)

      const {useChatStore} = await import('stores/chat')
      const chatStore = useChatStore()

      chatStore.updateUserStatus(data.userId, data.status)
    })

    socket.value.on('channelDeleted', async ({channelId}) => {
      const authStore = useAuthStore()
      const {useChatStore} = await import('stores/chat')
      const chatStore = useChatStore()

      if (chatStore.currentChannelId === channelId) {
        chatStore.currentChannelId = null
        chatStore.messages.splice(0, chatStore.messages.length)
      }

      await chatStore.fetchChannels()

      if (authStore.isOnline) {
        Notify.create({
          type: 'warning',
          message: 'Channel was deleted',
          position: 'top',
        })
      }
    })

    socket.value.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason)
    })

    socket.value.on('userWasRevoked', async ({channelId, userId}) => {
      const auth = useAuthStore()
      const {useChatStore} = await import('stores/chat')
      const chatStore = useChatStore()

      console.log('CLIENT: userWasRevoked received:', {
        channelId,
        userId,
        currentUserId: auth.user?.id,
        isMe: auth.user?.id === userId
      })

      if (auth.user?.id === userId) {
        console.log('CLIENT: I was revoked! Leaving channel...')
        if (chatStore.currentChannelId === channelId) {
          chatStore.currentChannelId = null
        }
        await chatStore.fetchChannels()

        if (auth.isOnline && !auth.isDND) {
          Notify.create({
            type: 'negative',
            message: 'You have been removed from the channel',
            position: 'top',
            timeout: 3000,
          })
        }
      } else if (chatStore.currentChannelId === channelId) {
        console.log('CLIENT: Someone else was revoked, reloading users...')
        await chatStore.loadChannelUsers(channelId)
      }
    })

    socket.value.on('userWasInvited', async ({channelId}) => {
      const auth = useAuthStore()
      const {useChatStore} = await import('stores/chat')
      const chatStore = useChatStore()

      console.log('CLIENT: userWasInvited received:', {
        channelId,
        currentUserId: auth.user?.id
      })

      await chatStore.fetchChannels()

      if (auth.isOnline && !auth.isDND) {
        Notify.create({
          type: 'info',
          color: 'orange',
          icon: 'mail',
          message: 'You have been invited to a channel',
          position: 'top',
          timeout: 4000,
        })
      }
    })

    socket.value.on('userWasKicked', async ({ channelId, userId }) => {
      const auth = useAuthStore()
      const { useChatStore } = await import('stores/chat')
      const chatStore = useChatStore()

      console.log('CLIENT: userWasKicked received:', {
        channelId,
        userId,
        currentUserId: auth.user?.id,
        isMe: auth.user?.id === userId
      })

      if (auth.user?.id === userId) {
        console.log('CLIENT: I was kicked! Leaving channel...')
        if (chatStore.currentChannelId === channelId) {
          chatStore.currentChannelId = null
        }
        await chatStore.fetchChannels()

        Notify.create({
          type: 'negative',
          message: 'You have been kicked from the channel',
          position: 'top',
          timeout: 3000,
        })
      } else if (chatStore.currentChannelId === channelId) {
        console.log('CLIENT: Someone else was kicked, reloading users...')
        await chatStore.loadChannelUsers(channelId)
      }
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

  function leaveChannel(channelId: number, userId: number) {
    socket.value?.emit('leaveChannel', { channelId , userId })
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

  const sendMessage = (channelId: number, content: string) => {
    const auth = useAuthStore()

    if (!auth.isOnline) {
      Notify.create({
        type: 'warning',
        message: 'You cannot send messages while offline',
        position: 'top',
      })
      return
    }

    if (!socket.value || !socket.value.connected) {
      console.warn('Socket not connected, dropping message.')
      return
    }

    console.log('Sending message through socket:', { channelId, content })

    socket.value.emit('sendMessage', {
      channelId,
      message: {
        content
      }
    })
  }


  const revokeUser = (channelId: number, targetNick: string) => {
    console.log('revokeUser called:', { channelId, targetNick, connected: connected.value })
    socket.value?.emit('userRevoked', { channelId, targetNick })
  }

  const kickUser = (channelId: number, targetNick: string) => {
    console.log('kickUser called:', { channelId, targetNick, connected: connected.value })
    socket.value?.emit('userKicked', { channelId, targetNick })
  }

  async function inviteUser(channelId: number, nickName: string) {
    return await new Promise((resolve, reject) => {
      if (!socket.value) return reject(new Error('Socket not connected'))

      socket.value.emit(
        'inviteUser',
        { channelId, nickName },
        (response: { status: string; message?: string }) => {
          if (response?.status === 'ok') return resolve(response)
          reject(new Error(response?.message || 'Failed to invite user'))
        }
      )
    })
  }

  async function acceptInvite(channelId: number): Promise<boolean> {
    if (!socket.value) throw new Error('Socket not connected')

    return await new Promise((resolve, reject) => {
      socket.value!.emit(
        'acceptInvite',
        { channelId },
        async (response: { status: string; message?: string }) => {
          if (response?.status === 'ok') {
            const { useChatStore } = await import('stores/chat')
            const chatStore = useChatStore()

            await chatStore.fetchChannels()
            resolve(true)
          } else {
            reject(new Error(response?.message || 'acceptInvite failed'))
          }
        }
      )
    })
  }

  function init(token?: string) {
    if (socket.value?.connected) return
    const _token = token || useAuthStore().token
    const auth = useAuthStore()
    const userId = auth.user?.id

    if (!_token) {
      console.warn('No token for socket initialization!')
      return
    }

    socket.value = io('http://localhost:3333', {
      auth: {
        token: _token,
        userId
      },
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
    revokeUser,
    kickUser,
    init,
    inviteUser,
    acceptInvite,
  }
})
