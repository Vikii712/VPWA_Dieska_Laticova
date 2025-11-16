import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'src/services/api'

export const useChatStore = defineStore('chat', () => {
  const channels = ref([])

  async function fetchChannels() {
    const result = await api('GET', '/channels')
    channels.value = result.channels
  }

  return {
    channels,
    fetchChannels
  }
})
