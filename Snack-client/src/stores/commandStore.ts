import { defineStore } from 'pinia'
import { useChatStore } from './chat'

export const useCommandStore = defineStore('command', () => {
  const chat = useChatStore()

  type CommandResult = {
    type: 'positive' | 'negative' | 'warning' | 'dialog'
    message: string
  } | void

  async function processCommand(input: string): Promise<CommandResult> {
    const parts = input.trim().split(/\s+/)
    if (!parts.length || !parts[0]) {
      return { type: 'warning', message: 'Empty command' }
    }

    const cmd = parts[0].toLowerCase()

    switch (cmd) {
      case '/join':
        return await handleJoin(parts)
      case '/cancel':
        return { type: 'dialog' , message: 'leave' }
      default:
        return { type: 'warning', message: `Unknown command: ${cmd}` }
    }
  }

  async function handleJoin(parts: string[]): Promise<CommandResult> {
    const [, channelName, typeArg] = parts
    console.log('handleJoin called with:', { channelName, typeArg })  // ← DEBUG

    if (!channelName) {
      return { type: 'negative', message: 'Usage: /join channelName [private]' }
    }

    const isPrivate = typeArg?.toLowerCase() === 'private'
    const channelType: 'public' | 'private' = isPrivate ? 'private' : 'public'

    try {
      console.log('Calling joinOrCreateChannel...', channelName, channelType)  // ← DEBUG
      const result = await chat.joinOrCreateChannel(channelName, channelType)
      console.log('joinOrCreateChannel result:', result)  // ← DEBUG

      if (result.joined) {
        return { type: 'positive', message: `Joined "${channelName}"` }
      } else {
        return {
          type: 'positive',
          message: `Created and joined "${channelName}"${isPrivate ? ' (private)' : ''}`
        }
      }
    } catch (e: unknown) {
      console.error('Error in handleJoin:', e)
      const msg = e instanceof Error ? e.message : 'Failed to join or create channel'
      return { type: 'negative', message: msg }
    }
  }

  return {
    processCommand,
  }
})
