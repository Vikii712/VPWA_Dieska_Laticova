import {defineStore} from 'pinia'
import {computed, nextTick, ref} from 'vue'
import {api} from 'src/services/api'

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
  author: {
    id: number
    nick: string
  }
}



export const useChatStore = defineStore('chat', () => {
  const channels = ref<Channel[]>([])
  const currentChannelId = ref<number | null>(null)

  const messages = ref<Message[]>([])
  const currentPage = ref(1)
  const hasMoreMessages = ref(true)
  const isLoadingMessages = ref(false)

  const currentChannelUsers = ref<Array<{id: number; nick: string; name?: string; last_name?: string}>>([])

  const currentChannel = computed(() =>
    channels.value.find(ch => ch.id === currentChannelId.value)
  )
  const moderatorId = computed(() =>
    currentChannel.value?.moderatorId ?? null
  )

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

  async function loadChannel(channelId: number) {
    currentChannelId.value = channelId
    messages.value = []
    currentPage.value = 1
    hasMoreMessages.value = true

    await loadMessages()
    await loadChannelUsers(channelId)
  }

  async function loadMessages() {
    if (!currentChannelId.value || isLoadingMessages.value) return
    isLoadingMessages.value = true

    try {
      const res = await api<{messages: Message[]}>('GET', `/channels/${currentChannelId.value}/messages?page=${currentPage.value}`)


      if (res.messages.length === 0) {
        hasMoreMessages.value = false
        isLoadingMessages.value = false
        return
      }

      messages.value = [...res.messages, ...messages.value]

      currentPage.value++
    } catch (error) {
      console.error(error)
    } finally {
      isLoadingMessages.value = false
    }

    await nextTick()
    window.dispatchEvent(new Event('messages-loaded'));
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
      console.error(error)
      throw new Error('Failed to create channel. Please try again.')
    }
  }

  async function sendMessage(content: string) {
    if (!currentChannelId.value) return

    const result = await api<{message: Message}>('POST', `/channels/${currentChannelId.value}/messages`, {content})


    if (result && result.message) {
      messages.value.push(result.message)
      await nextTick()
      window.dispatchEvent(new Event('messages-loaded'))
    }

  }

  return {
    channels,
    currentChannelId,
    messages,
    hasMoreMessages,
    isLoadingMessages,
    currentChannelUsers,
    currentChannel,
    moderatorId,
    createChannel,

    fetchChannels,
    loadChannel,
    sendMessage,
  }
})
