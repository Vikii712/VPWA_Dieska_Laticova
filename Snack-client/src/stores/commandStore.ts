import { defineStore } from 'pinia'
import { useChatStore } from './chat'
import { api } from 'src/services/api'


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
      case '/invite':
        return await handleInvite(parts)
      case '/revoke':
        return await handleRevoke(parts)
      default:
        return { type: 'warning', message: `Unknown command: ${cmd}` }
    }
  }

  async function handleJoin(parts: string[]): Promise<CommandResult> {
    const [, channelName, typeArg] = parts

    if (!channelName) {
      return { type: 'negative', message: 'Usage: /join channelName [private]' }
    }

    const isPrivate = typeArg?.toLowerCase() === 'private'
    const channelType: 'public' | 'private' = isPrivate ? 'private' : 'public'

    try {
      const result = await chat.joinOrCreateChannel(channelName, channelType)

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

  async function handleInvite(parts: string[]): Promise<CommandResult> {
    const [, nickName] = parts

    if (!nickName) {
      return { type: 'negative', message: 'Usage: /invite username' }
    }

    if (!chat.currentChannelId) {
      return { type: 'negative', message: 'You must be in a channel to invite someone.' }
    }

    const channel = chat.currentChannel
    if (!channel) {
      return { type: 'negative', message: 'Current channel not found.' }
    }

    if (channel.moderatorId !== chat.moderatorId && !channel.public) {
      return { type: 'negative', message: 'Only the channel moderator can invite users.' }
    }

    try {
      await api('POST', `/channels/${chat.currentChannelId}/invite`, { nickName })
      return { type: 'positive', message: `${nickName} has been invited to the channel.` }
    } catch (error) {
      console.error(error)
      return { type: 'negative', message: 'Failed to invite user.' }
    }
  }

  async function handleRevoke(parts: string[]): Promise<CommandResult> {
    const [, nickName] = parts

    if (!nickName) {
      return { type: 'negative', message: 'Usage: /revoke username' }
    }

    if (!chat.currentChannelId) {
      return { type: 'negative', message: 'You must be in a channel to revoke someone.' }
    }

    const channel = chat.currentChannel
    if (!channel) {
      return { type: 'negative', message: 'Current channel not found.' }
    }

    if (channel.moderatorId !== chat.moderatorId) {
      return { type: 'negative', message: 'Only the channel moderator can revoke users.' }
    }

    try {
      await api('POST', `/channels/${chat.currentChannelId}/revoke`, { nickName })
      return { type: 'positive', message: `${nickName} has been removed from the channel.` }
    } catch (error) {
      console.error(error)
      return { type: 'negative', message: 'Failed to revoke user.' }
    }
  }


  return {
    processCommand,
  }
})
