import {defineStore} from 'pinia'
import {computed, nextTick, ref} from 'vue'
import {api} from 'src/services/api'
import {useSocketStore} from "stores/socketStore";

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
}



export const useChatStore = defineStore('chat', () => {
  const channels = ref<Channel[]>([])
  const currentChannelId = ref<number | null>(null)

  const messages = ref<Message[]>([])
  const currentPage = ref(1)
  const hasMoreMessages = ref(true)
  const isLoadingMessages = ref(false)

  const currentChannelUsers = ref<Array<{id: number; nick: string; name?: string; last_name?: string}>>([])
  const channelMessages = ref<Record<number, Message[]>>({});
  const unreadChannels = ref<Record<number, number>>({})

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
    messages.value = channelMessages.value[channelId] || [];
    currentPage.value = 1
    hasMoreMessages.value = true

    await loadMessages()
    await loadChannelUsers(channelId)
    const socketStore = useSocketStore()

    if (channelMessages.value[channelId]) {
      messages.value = channelMessages.value[channelId];
    }
    currentChannelId.value = channelId;

    if (unreadChannels.value[channelId]) {
      unreadChannels.value[channelId] = 0;
    }

    socketStore.joinChannel(channelId)
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

    const result = await api<{message: Message}>('POST', `/channels/${currentChannelId.value}/messages`, {content})


    if (result && result.message) {
      const { useSocketStore } = await import('stores/socketStore');
      const socketStore = useSocketStore();

      socketStore.socket?.emit('sendMessage', {
        channelId: currentChannelId.value,
        message: result.message,
      }, (response: unknown) => {
        if (response) {
          if (typeof response === 'object' && 'status' in response) {
            const resp = response as { status: string }
            if (resp.status === 'ok') {
              console.log('Message sent')
            }
          } else {
            console.warn('Error sending a message')
          }
        }
      })
    }

  }

  return {
    channels,
    currentChannelId,
    messages,
    channelMessages,
    unreadChannels,
    hasMoreMessages,
    isLoadingMessages,
    currentChannelUsers,
    currentChannel,
    moderatorId,
    createChannel,
    joinOrCreateChannel,
    leaveChannel,
    loadChannelUsers,
    fetchChannels,
    loadChannel,
    sendMessage,
  }
})
