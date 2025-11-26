import { defineStore } from 'pinia'
import { useChatStore } from './chat'
import { api } from 'src/services/api'
import { ref } from 'vue'
import {useAuthStore} from "stores/auth"
import {useSocketStore} from 'stores/socketStore'

export const useCommandStore = defineStore('command', () => {
  const chat = useChatStore()

  const auth =  useAuthStore()
  const socketStore =  useSocketStore()

  const memberListDrawerOpen = ref(false)

  type CommandResult = {
    type: 'positive' | 'negative' | 'warning' | 'dialog'
    message: string
  } | void | null

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
      case '/list':
        return openMemberList()
      case '/quit':
        return quitChannel()
      case '/invite':
        return await handleInvite(parts)
      case '/revoke':
        return await handleRevoke(parts)
      case '/kick':
        return await handleKick(parts)
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
      const result = await api<{ message: string; targetUserId: number }>(
        'POST',
        `/channels/${chat.currentChannelId}/invite`,
        { nickName }
      )

      if (result.targetUserId) {
        console.log('📤 Emitting userInvited:', { channelId: chat.currentChannelId, targetUserId: result.targetUserId })
        socketStore.notifyUserInvited(chat.currentChannelId, result.targetUserId)
      }

      return { type: 'positive', message: `${nickName} has been invited to the channel.` }
    } catch (error) {
      console.error(error)
      return { type: 'negative', message: 'Failed to invite user.' }
    }
  }

  async function handleRevoke(parts: string[]): Promise<CommandResult> {
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

    try {
      const targetUserId = await chat.revokeUser(chat.currentChannelId, targetNick)

      console.log('Got targetUserId from API:', targetUserId)

      if (targetUserId) {
        console.log(' Emitting userRevoked:', { channelId: chat.currentChannelId, targetUserId })
        socketStore.notifyUserRevoked(chat.currentChannelId, targetUserId)
      } else {
        console.warn('No targetUserId returned from API!')
      }

      return { type: 'positive', message: `${targetNick} has been removed from the channel.` }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to revoke user.'
      console.error(msg)
      return { type: 'negative', message: msg }
    }
  }

  async function handleKick(parts: string[]): Promise<CommandResult> {
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

    const moderator = chat.currentChannelUsers.find(u => u.id === channel.moderatorId)

    if (moderator && targetNick === moderator.nick) {
      return { type: 'negative', message: 'Cannot kick the channel moderator' }
    }

    try {
      const targetUserId = await chat.kickUser(chat.currentChannelId, targetNick)

      console.log(' Got targetUserId from API:', targetUserId)

      if (targetUserId) {
        console.log( 'Emitting userKicked:', { channelId: chat.currentChannelId, targetUserId })
        socketStore.notifyUserKicked(chat.currentChannelId, targetUserId)
      } else {
        console.warn('No targetUserId returned from API!')
      }

      return { type: 'positive', message: `${targetNick} has been kicked from the channel.` }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to kick user.'
      console.error(msg)
      return { type: 'negative', message: msg }
    }
  }

  return {
    processCommand,
    memberListDrawerOpen
  }
})
