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

  function authenticate(result: AuthResponse) {
    token.value = result.token
    user.value = result.user
    localStorage.setItem('token', result.token)
  }

  async function login(payload: LoginPayload) {
    const result = await api<AuthResponse>('POST', '/login', payload)
    authenticate(result)
  }

  async function register(payload: RegisterPayload) {
    const result = await api<AuthResponse>('POST', '/register', payload)
    authenticate(result)
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

      if (socketStore.socket) {
        console.log('Emitting statusChange')
        socketStore.socket.emit('statusChange', { status })
      } else {
        console.warn('Socket is not connected')
      }

      if (oldStatus === 'offline' && status !== 'offline') {
        console.log('Coming back online, reloading data...')
        const {useChatStore} = await import('stores/chat')
        const chatStore = useChatStore()

        const currentChannelId = chatStore.currentChannelId

        await chatStore.fetchChannels()

        if (currentChannelId) {
          await chatStore.reloadCurrentChannel()
        }

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
        }
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
