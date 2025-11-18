import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'src/services/api'

export interface Channel {
  id: number
  name: string
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

interface MessagesResponse {
  messages: Message[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export const useChatStore = defineStore('chat', () => {
  const channels = ref<Channel[]>([])
  const currentChannelId = ref<number | null>(null)

  const messages = ref<Message[]>([])
  const currentPage = ref(1)
  const hasMoreMessages = ref(true)
  const isLoadingMessages = ref(false)

  async function fetchChannels() {
    const result = await api('GET', '/channels')
    channels.value = result.channels
  }

  async function loadChannel(channelId: number) {
    currentChannelId.value = channelId
    messages.value = []
    currentPage.value = 1
    hasMoreMessages.value = true

    await loadMessages()
  }

  async function loadMessages() {
    if (!currentChannelId.value || isLoadingMessages.value || !hasMoreMessages.value) {
      return
    }

    isLoadingMessages.value = true

    try {
      const result = await api<MessagesResponse>(
        'GET',
        `/channels/${currentChannelId.value}/messages?page=${currentPage.value}&limit=20`
      )
      console.log('loadMessages result', result)
      messages.value.push(...result.messages.reverse())
      hasMoreMessages.value = result.meta.currentPage < result.meta.lastPage
      currentPage.value++
    } finally {
      isLoadingMessages.value = false
    }
  }

  return {
    channels,
    currentChannelId,
    messages,
    hasMoreMessages,
    isLoadingMessages,

    fetchChannels,
    loadChannel,
    loadMessages,
  }
})
