import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import {nextTick, ref} from 'vue'
import type {Message} from "stores/chat";
import {useChatStore} from 'stores/chat'
import { Notify } from 'quasar'
import { useAuthStore } from 'stores/auth'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null)
  const connected = ref(false)
  const isInitializing = ref(false)

  function setupListeners() {
    if (!socket.value) return

    socket.value.on('connect', () => {
      connected.value = true
      console.log('Socket connected')

      const chatStore = useChatStore()
      if (chatStore.currentChannelId) {
        console.log('Rejoining channel after reconnect:', chatStore.currentChannelId)
        joinChannel(chatStore.currentChannelId)
      }
    })

    socket.value.on('disconnect', (reason) => {
      connected.value = false
      console.log('Socket disconnected, reason:', reason)

      if (reason === 'io server disconnect') {
        console.log('Server disconnected, attempting to disconnect...')
        socket.value?.connect()
      }
    })

    socket.value.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
    })

    socket.value.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber)
    })

    socket.value.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error)
    })

    socket.value.on('reconnect_failed', () => {
      console.error('Reconnection failed after all attempts')
      const authStore = useAuthStore()
      if (authStore.isOnline) {
        Notify.create({
          type: 'negative',
          message: 'Connection lost. Please refresh the page.',
          position: 'top',
          timeout: 0,
          actions: [
            { label: 'Refresh', color: 'white', handler: () => window.location.reload() }
          ]
        })
      }
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
      if (error.message.includes('auth') || error.message.includes('token')) {
        console.log('Auth error, might need to re-login')
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
          html: true,
          message: isMentioned
            ? `<strong>${data.author.nick}</strong> mentioned you in <strong>${data.channelName || `channel #${data.channelId}</strong>`}`
            : `New message in <strong>${data.channelName || `channel #${data.channelId}</strong>`}`,
          position: 'top',
          timeout: isMentioned ? 5000 : 3000,
        })
      } else if (isMentioned) {
        Notify.create({
          type: 'warning',
          color: 'yellow-8',
          icon: 'alternate_email',
          message: `<strong>${data.author.nick}</strong> mentioned you!`,
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

    socket.value.on('userTyping', (data: { channelId: number; userId: number; nick: string; isTyping: boolean, content?: string }) => {
      console.log('userTyping received:', data)
      const chat = useChatStore()
      chat.setUserTyping(data.channelId, data.userId, data.isTyping, data.content || '')
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
    cleanup()
  }

  function leaveChannel(channelId: number, userId: number) {
    socket.value?.emit('leaveChannel', { channelId, userId })
  }

  function declineInvite(channelId: number, userId: number) {
    socket.value?.emit('declineInvite', { channelId, userId })
  }

  function joinChannel(channelId: number) {
    const auth = useAuthStore()
    const userId = auth.user?.id
    if (!userId) {
      console.warn('No user ID available for joinChannel!')
      return
    }
    if (!socket.value?.connected) {
      console.warn('Socket not connected, cannot join channel')
      return
    }
    socket.value.emit('joinChannel', { userId, channelId })
  }

  function emitTyping(channelId: number, isTyping: boolean, content: string = '') {
    if (!socket.value?.connected) {
      console.warn('Socket not connected, cannot emit typing')
      return
    }
    socket.value.emit('typing', { channelId, isTyping, content })
  }

  function sendMessage(channelId: number, content: string) {
    const auth = useAuthStore()

    if (!auth.isOnline) {
      Notify.create({
        type: 'warning',
        message: 'You cannot send messages while offline',
        position: 'top',
      })
      return
    }

    if (!socket.value?.connected) {
      Notify.create({
        type: 'warning',
        message: 'Connection lost. Please wait...',
        position: 'top',
      })
      return
    }

    socket.value.emit('sendMessage', {
      channelId,
      message: { content }
    })
  }


  const revokeUser = (channelId: number, targetNick: string) => {
    //console.log('revokeUser called:', { channelId, targetNick, connected: connected.value })
    socket.value?.emit('userRevoked', { channelId, targetNick })
  }

  const kickUser = (myId: number, channelId: number, targetNick: string) => {
    //console.log('kickUser called:', { channelId, targetNick })
    socket.value?.emit('userKicked', { myId, channelId, targetNick })
  }

  async function inviteUser(channelId: number, nickName: string, isModerator: boolean) {
    return new Promise((resolve, reject) => {
      if (!socket.value?.connected) {
        return reject(new Error('Socket not connected'))
      }

      socket.value.emit(
        'inviteUser',
        { channelId, nickName, isModerator },
        (response: { status: string; message?: string }) => {
          if (response?.status === 'ok') return resolve(response)
          reject(new Error(response?.message || 'Failed to invite user'))
        }
      )
    })
  }

  async function acceptInvite(channelId: number): Promise<boolean> {
    if (!socket.value?.connected) {
      throw new Error('Socket not connected')
    }

    return new Promise((resolve, reject) => {
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
    if (isInitializing.value) {
      console.log("Socket initialization already under progess")
      return
    }

    const auth = useAuthStore()
    const _token = token || auth.token

    if(!_token) {
      console.warn("No token for socket initializaiton!")
      return
    }

    if (socket.value) {
      if (socket.value.connected) {
        console.log("Socket already connected!")
        return
      }
      console.log("Cleaning up existing disconnected socket")
      cleanup()
    }

    isInitializing.value = true

    console.log("Initializing new socket connection")

    socket.value = io('http://localhost:3333', {
      auth: {
        token: _token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    })

    setupListeners()
    isInitializing.value = false
  }

  function cleanup() {
    if (socket.value) {
      socket.value.removeAllListeners()
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  return {
    socket,
    connected,
    disconnect,
    joinChannel,
    leaveChannel,
    declineInvite,
    sendMessage,
    revokeUser,
    kickUser,
    init,
    inviteUser,
    acceptInvite,
    emitTyping,
  }
})
