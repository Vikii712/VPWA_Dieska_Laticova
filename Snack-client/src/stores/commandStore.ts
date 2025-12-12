import { defineStore } from 'pinia'
import { useChatStore } from './chat'
import { ref } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useSocketStore } from 'stores/socketStore'

interface ChannelUser {
  id: number
  nick: string
}

export const useCommandStore = defineStore('command', () => {
  const chat = useChatStore()
  const auth = useAuthStore()
  const socketStore = useSocketStore()

  const memberListDrawerOpen = ref(false)

  type CommandResult = {
    type: 'positive' | 'negative' | 'warning' | 'dialog'
    message: string
  } | null

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
        return { type: 'dialog', message: 'leave' }
      case '/list':
        return openMemberList()
      case '/quit':
        return quitChannel()
      case '/invite':
        return await handleInvite(parts)
      case '/revoke':
        return handleRevoke(parts)
      case '/kick':
        return handleKick(parts)
      default:
        return { type: 'warning', message: `Unknown command: ${cmd}` }
    }
  }

  function quitChannel(): CommandResult {
    if (!chat.currentChannelId) {
      return { type: 'warning', message: 'You are not in a channel' }
    }

    chat.currentChannelId = null
    chat.currentChannelUsers.splice(0, chat.currentChannelUsers.length)
    memberListDrawerOpen.value = false

    return null
  }

  function openMemberList(): CommandResult | null {
    if (!chat.currentChannelId) {
      return { type: 'warning', message: 'You must be in a channel to list members' }
    }
    memberListDrawerOpen.value = true
    return null
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

    const channelId = chat.currentChannelId
    if (!channelId) {
      return { type: 'negative', message: 'You must be in a channel to invite someone.' }
    }

    const channel = chat.currentChannel
    if (!channel) {
      return { type: 'negative', message: 'Current channel not found.' }
    }

    if (channel.moderatorId !== auth.user?.id && !channel.public) {
      return { type: 'negative', message: 'Only the channel moderator can invite users.' }
    }

    const isModerator = channel.moderatorId === auth.user?.id

    try {
      await socketStore.inviteUser(channelId, nickName, isModerator)

      return {
        type: 'positive',
        message: `${nickName} has been invited to the channel.`
      }
    } catch (e: unknown) {
      console.error('Error in handleInvite:', e)
      const msg = e instanceof Error ? e.message : 'Failed to invite user.'
      return { type: 'negative', message: msg }
    }
  }

  function handleRevoke(parts: string[]): CommandResult {
    const [, targetNick] = parts

    if (!targetNick) {
      return { type: 'negative', message: 'Usage: /revoke username' }
    }

    if (!chat.currentChannelId) {
      return { type: 'negative', message: 'You are not in a channel' }
    }

    const channel = chat.currentChannel
    if (!channel) {
      return { type: 'negative', message: 'Channel not found' }
    }

    if (channel.public) {
      return { type: 'negative', message: 'Use /kick for public channels' }
    }

    if (channel.moderatorId !== auth.user?.id) {
      return { type: 'negative', message: 'Only the channel moderator can revoke users.' }
    }

    socketStore.revokeUser(chat.currentChannelId, targetNick)

    return { type: 'positive', message: `Revoke request sent for ${targetNick}.` }
  }

  function handleKick(parts: string[]): CommandResult {
    const [, targetNick] = parts

    if (!targetNick) {
      return { type: 'negative', message: 'Usage: /kick username' }
    }

    if (!chat.currentChannelId) {
      return { type: 'negative', message: 'You are not in a channel' }
    }

    const channel = chat.currentChannel
    if (!channel) {
      return { type: 'negative', message: 'Channel not found' }
    }

    if (!channel.public) {
      return { type: 'negative', message: 'Use /revoke for private channels' }
    }

    const moderator = chat.currentChannelUsers.find(
      (u: ChannelUser) => u.id === channel.moderatorId
    )

    if (moderator && targetNick === moderator.nick) {
      return { type: 'negative', message: 'Cannot kick the channel moderator' }
    }

    const myId = auth.user?.id

    if (myId === undefined) {
      return { type: 'negative', message: 'User is not authenticated' }
    }

    socketStore.kickUser(myId, chat.currentChannelId, targetNick)

    return { type: 'positive', message: ` ${targetNick} kicked.` }
  }

  return {
    processCommand,
    memberListDrawerOpen
  }
})
