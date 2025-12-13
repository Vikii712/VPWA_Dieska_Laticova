import { defineStore } from 'pinia';
import {computed, ref} from 'vue'
import { api } from 'src/services/api'

interface User {
  id: number;
  nick: string;
  name: string;
  lastName: string;
  email: string;
  activity_status: string;
  invited: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  nick: string;
  name: string;
  lastName: string;
  email: string;
  password: string;
  activity_status: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isOnline = computed(() => {
    return user.value?.activity_status !== 'offline'
  })

  const isDND = computed(() => {
    return user.value?.activity_status === 'away'
  })

  const notificationPreference = ref<'all' | 'mentioned' | 'none'>(
    localStorage.getItem('notificationPreference') as 'all' | 'mentioned' | 'none' || 'all'
  )

  async function authenticate(result: AuthResponse) {
    token.value = result.token
    user.value = result.user
    localStorage.setItem('token', result.token)

    const {useSocketStore} = await import('stores/socketStore')
    const socketStore = useSocketStore()
    socketStore.init(result.token)

    if (!user.value.activity_status || user.value.activity_status === 'offline') {
      await updateStatus('active')
    }
  }

  async function login(payload: LoginPayload) {
    const result = await api<AuthResponse>('POST', '/login', payload)
    await authenticate(result)
  }

  async function register(payload: RegisterPayload) {
    const result = await api<AuthResponse>('POST', '/register', payload)
    await authenticate(result)
  }

  async function logout() {
    await api<AuthResponse>('DELETE', '/logout')
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  async function me() {
    try {
      const result = await api<{ user: User }>('GET', '/me')
      if (result && result.user) {
        user.value = result.user
        if (!user.value.activity_status) {
          await updateStatus('active')
        }

        const {useSocketStore} = await import('stores/socketStore')
        const socketStore = useSocketStore()
        socketStore.init(token.value || undefined)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  async function updateStatus(status: string) {
    try {
      console.log('Updating status to:', status)

      await api('POST', '/user/status', { status })

      const oldStatus = user.value?.activity_status

      if (user.value) {
        user.value.activity_status = status
      }

      const { useSocketStore } = await import('stores/socketStore')
      const socketStore = useSocketStore()

      if (status === 'offline') {
        console.log('Going offline, disconnecting socket...')
        socketStore.disconnect()
      }
      else if (oldStatus === 'offline' && status !== 'offline') {
        console.log('Coming back online, reconnecting socket...')
        socketStore.init(token.value || undefined)

        await new Promise<void>((resolve) => {
          const checkConnection = setInterval(() => {
            if (socketStore.connected) {
              clearInterval(checkConnection)
              resolve()
            }
          }, 100)
          setTimeout(() => {
            clearInterval(checkConnection)
            resolve()
          }, 5000)
        })

        const { useChatStore } = await import('stores/chat')
        const chatStore = useChatStore()

        const currentChannelId = chatStore.currentChannelId

        await chatStore.fetchChannels()

        if (currentChannelId) {
          console.log(`Reloading channel ${currentChannelId}`)
          chatStore.channelMessages[currentChannelId] = []
          if (chatStore.channelMeta[currentChannelId]) {
            chatStore.channelMeta[currentChannelId] = {
              currentPage: 0,
              hasMore: true,
              isLoading: false
            }
          }
          await chatStore.loadChannel(currentChannelId)
          socketStore.joinChannel(currentChannelId)
        }
      }
      else if (socketStore.socket?.connected) {
        console.log('Emitting statusChange')
        socketStore.socket.emit('statusChange', { status })
      }

      console.log('Status updated successfully')

    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  function setNotificationPreference(pref: 'all' | 'mentioned' | 'none') {
    notificationPreference.value = pref
    localStorage.setItem('notificationPreference', pref)
  }

  return { user, token, login, register, logout, me, updateStatus, isOnline, isDND, notificationPreference, setNotificationPreference }
});
