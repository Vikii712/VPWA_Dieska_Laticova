import {defineStore} from 'pinia'
import {computed, nextTick, ref} from 'vue'
import {api} from 'src/services/api'
import {useSocketStore} from "stores/socketStore";
import {useAuthStore} from "stores/auth";

export interface Channel {
  id: number
  name: string
  public: number | boolean
  moderatorId: number
  lastActiveAt?: string
}

export interface Message {
  id: number
  content: string
  createdAt: string
  channelId: number
  author: {
    id: number
    nick: string
  }
  typing?: boolean
}

interface ChannelMeta {
  currentPage: number
  hasMore: boolean
  isLoading: boolean
}

export const useChatStore = defineStore('chat', () => {
  const channels = ref<Channel[]>([])
  const currentChannelId = ref<number | null>(null)

  const channelMessages = ref<Record<number, Message[]>>({})

  const channelMeta = ref<Record<number, ChannelMeta>>({})

  const currentChannelUsers = ref<Array<{id: number; nick: string; name?: string; last_name?: string}>>([])

  const unreadChannels = ref<Record<number, number>>({})

  const currentChannel = computed(() =>
    channels.value.find(ch => ch.id === currentChannelId.value)
  )

  const moderatorId = computed(() =>
    currentChannel.value?.moderatorId ?? null
  )

  const messages = computed(() => {
    if (!currentChannelId.value) return []
    return channelMessages.value[currentChannelId.value] || []
  })

  const hasMoreMessages = computed(() => {
    if (!currentChannelId.value) return false
    return channelMeta.value[currentChannelId.value]?.hasMore ?? true
  })

  const isLoadingMessages = computed(() => {
    if (!currentChannelId.value) return false
    return channelMeta.value[currentChannelId.value]?.isLoading ?? false
  })

  function initChannelMeta(channelId: number) {
    if (!channelMeta.value[channelId]) {
      channelMeta.value[channelId] = {
        currentPage: 0,
        hasMore: true,
        isLoading: false
      }
    }
  }

  async function fetchChannels() {
    try {
      const result = await api<{channels: Channel[]}>('GET', '/channels')
      //console.log('Fetched channels:', result.channels);
      if (result && 'channels' in result && Array.isArray(result.channels)) {
        channels.value = result.channels

        if (!channels.value.some(ch => ch.id === currentChannelId.value)) {
          currentChannelId.value = null
        }

      } else {
        channels.value = []
      }
    } catch (error) {
      channels.value = []
      console.error(error)
    }
  }

  async function loadMessages(channelId: number, page: number = 1) {
    initChannelMeta(channelId)

    const meta = channelMeta.value[channelId]!

    if (meta.isLoading || !meta.hasMore) {
      return
    }

    meta.isLoading = true

    try {
      const result = await api<{
        messages: Message[]
        meta: { currentPage: number; lastPage: number; total: number }
      }>('GET', `/channels/${channelId}/messages?page=${page}&limit=20`)

      if (result && result.messages) {
        if (!channelMessages.value[channelId]) {
          channelMessages.value[channelId] = []
        }

        const existingIds = new Set(channelMessages.value[channelId].map(m => m.id))
        const newMessages = result.messages.filter(m => !existingIds.has(m.id))

        channelMessages.value[channelId] = [
          ...newMessages,
          ...channelMessages.value[channelId]
        ]

        meta.currentPage = result.meta.currentPage
        meta.hasMore = result.meta.currentPage < result.meta.lastPage

        await nextTick()
        window.dispatchEvent(new Event('messages-loaded'))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      meta.isLoading = false
    }
  }

  async function loadChannelUsers(channelId: number) {
    if (!channelId) return

    try {
      const users = await api('GET', `/channels/${channelId}/users`)
      currentChannelUsers.value = Array.isArray(users) ? users : []
    } catch (error) {
      console.error('Failed to load channel users', error)
      currentChannelUsers.value = []
    }
  }

  async function loadChannel(channelId: number) {
    if (currentChannelId.value) {
      const socketStore = useSocketStore()
      socketStore.leaveChannel(currentChannelId.value)
    }

    currentChannelId.value = channelId
    unreadChannels.value[channelId] = 0

    if (unreadChannels.value[channelId]) {
      unreadChannels.value[channelId] = 0
    }

    await loadChannelUsers(channelId)

    if (!channelMessages.value[channelId] || channelMessages.value[channelId].length === 0) {
      initChannelMeta(channelId)
      await loadMessages(channelId, 1)
    }

    const socketStore = useSocketStore()
    socketStore.joinChannel(channelId)

    await nextTick()
    window.dispatchEvent(new Event('channel-switched'))
  }

  async function createChannel(name: string, type: 'public' | 'private' = 'public') {
    if (!name.trim()) {
      throw new Error('You must provide a valid name.')
    }

    const exists = channels.value.some(channel => channel.name === name.trim())
    if (exists) {
      throw new Error('You already created a channel with this name.')
    }

    try {
      await api('POST', '/channels', {
        name: name.trim(),
        type: type,
      })

      await fetchChannels()

      return channels.value.find(ch => ch.name === name.trim())
    } catch (error) {
      console.error('Error creating channel:', error)
      throw new Error('Failed to create channel. Please try again.')
    }
  }

  function leaveChannel(channelId: number, isModerator: boolean) {
    const socketStore = useSocketStore()
    socketStore.notifyUserLeft(channelId, isModerator)
  }

  async function joinOrCreateChannel(name: string, type: 'public' | 'private' = 'public') {
    try {
      const result = await api<{
        channel: {
          id: number
          name: string
          public: boolean
          moderator_id: number
        }
        joined: boolean
      }>('POST', '/channels', {
        name: name.trim(),
        type: type,
      })

      await fetchChannels()
      const channel = channels.value.find(ch => ch.id === result.channel.id)

      if (channel) {
        await loadChannel(channel.id)

        if (result.joined && channel.public) {
          const socketStore = useSocketStore()
          socketStore.notifyUserJoined(channel.id)
        }

        return {
          channel: channel,
          joined: result.joined
        }
      }

      throw new Error('Failed to load channel after join.')
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }

      console.error('Unexpected error:', error)
      throw new Error('Failed to join or create channel.')
    }
  }

  async function sendMessage(content: string) {
    if (!currentChannelId.value) return
    const socketStore = useSocketStore()

    try {
      const { message } = await api<{ message: Message }>(
        'POST',
        `/channels/${currentChannelId.value}/messages`,
        { content }
      )

      addMessage(message)

      socketStore.sendMessage(currentChannelId.value, message)

    } catch (error) {
      console.error('Error sending message:', error)
    }
  }


  function addMessage(message: Message) {
    const channelId = message.channelId
    const auth = useAuthStore()

    if (!channelMessages.value[channelId]) {
      channelMessages.value[channelId] = []
    }

    const exists = channelMessages.value[channelId].some(m => m.id === message.id)
    if (exists) {
      console.log('Duplicate message detected, skipping:', message.id)
      return
    }

    channelMessages.value[channelId].push(message)

    console.log(`Message ${message.id} added to channel ${channelId}`)

    if (
      channelId !== currentChannelId.value &&
      message.author.id !== auth.user?.id
    ) {
      if (!unreadChannels.value[channelId]) {
        unreadChannels.value[channelId] = 0
      }
      unreadChannels.value[channelId]++
    } else if (message.channelId === currentChannelId.value) {
      setTimeout(() => {
        window.dispatchEvent(new Event('new-message-received'))
      }, 50)
    }
  }

  function clearAll() {
    currentChannelId.value = null
    channelMessages.value = {}
    channelMeta.value = {}
    unreadChannels.value = {}
    currentChannelUsers.value = []
  }

  return {
    channels,
    currentChannelId,
    channelMessages,
    channelMeta,
    currentChannelUsers,
    unreadChannels,

    currentChannel,
    moderatorId,
    messages,
    hasMoreMessages,
    isLoadingMessages,

    fetchChannels,
    loadChannel,
    loadMessages,
    loadChannelUsers,
    createChannel,
    joinOrCreateChannel,
    leaveChannel,
    sendMessage,
    addMessage,
    clearAll,
  }
})
