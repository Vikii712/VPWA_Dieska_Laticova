import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import db from '@adonisjs/lucid/services/db'
import Channel from '#models/channel'
import User from '#models/user'
import { io } from '#start/ws'

export default class ChannelsController {

  async getChannels({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    await user.load('channels', (query) => {
      query.pivotColumns(['invited'])
    })

    return response.ok({
      channels: user.channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        public: channel.public,
        moderatorId: channel.moderatorId,
        invited: channel.$extras.pivot_invited
      }))
    })
  }

  async getChannelMessages({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channelId = params.id
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const channel = await db.from('channels').where('id', channelId).first()
    if (!channel) {
      return response.notFound({ message: 'No channel found.' })
    }

    const isMember = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .first()

    if (!isMember && !channel.public) {
      return response.forbidden({
        message: 'You are not a member of this channel'
      })
    }

    const messages = await Message.query()
      .where('channel_id', channelId)
      .preload('author')
      .preload('mentions')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    const messagesArray = messages.all().reverse()

    return response.ok({
      messages: messagesArray.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISO(),
        channelId: channelId,
        author: {
          id: msg.author.id,
          nick: msg.author.nick,
        },
        typing: msg.typing,
        mentions: msg.mentions?.map(mention => ({
          id: mention.id,
          mentionedId: mention.mentionedId,
        })) || []
      })),
      meta: messages.getMeta()
    })
  }

  async getUsersInChannel({ params, response }: HttpContext) {
    const channelId = params.channelId

    const users = await db
      .from('users')
      .select(['users.id', 'users.nick', 'users.activity_status'])
      .join('channel_users', 'users.id', '=', 'channel_users.user_id')
      .where('channel_users.channel_id', channelId)
      .where('channel_users.invited', false)

    return response.json(users)
  }

  async updateUserStatus({ auth, request, response }: HttpContext) {
    const { status } = request.only(['status'])
    const user = auth.user

    await db
      .from('users')
      .where('id', user!.id)
      .update({ activity_status: status })

    return response.json({ success: true })
  }


  async createChannel({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = request.input('name')
    const type = request.input('type')

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return response.badRequest({ message: 'You must provide a valid name.' })
    }

    const isPublic = (type === 'public')

    let channel = await db.from('channels').where('name', name).first()

    if(channel) {
      const isMember = await db
        .from('channel_users')
        .where('channel_id', channel.id)
        .where('user_id', user.id)
        .first()

      if(isMember) {
        return response.ok({
          channel: {
            id: channel.id,
            name: channel.name,
            public: channel.public,
            moderator_id: channel.moderator_id,
          },
          joined: true
        })
      }

      if (!channel.public) {
        return response.badRequest({ message: 'Channel is private.' })
      }

      await db.table('channel_users').insert({
        channel_id: channel.id,
        user_id: user.id
      })

      io.emit('UserJoinedChannel', {
        channel_id: channel.id,
      })

      return response.ok({
        channel: {
          id: channel.id,
          name: channel.name,
          public: channel.public,
          moderator_id: channel.moderator_id,
        },
        joined: true
      })
    }

    channel = await Channel.create({
      name,
      public: isPublic,
      moderatorId: user.id,
    })

    await db.table('channel_users').insert({
      channel_id: channel.id,
      user_id: user.id
    })

    return response.ok({
      channel: {
        id: channel.id,
        name: channel.name,
        public: channel.public,
        moderator_id: channel.moderatorId,
      },
      joined: false
    })
  }

  async inviteUser({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channelId = params.id
    const targetNick = request.input('nickName')

    if (!targetNick) {
      return response.badRequest({ message: 'No target user specified.' })
    }

    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.notFound({ message: 'Channel not found.' })
    }

    if (!channel.public && channel.moderatorId !== user.id) {
      return response.forbidden({ message: 'Only the moderator can invite users to private channels.' })
    }

    const targetUser = await User.query().where('nick', targetNick).first()
    if (!targetUser) {
      return response.notFound({ message: 'User not found.' })
    }

    const existing = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', targetUser.id)
      .first()

    if (existing) {
      if (existing.invited) {
        return response.badRequest({ message: `${targetNick} already has a pending invitation.` })
      }
      return response.badRequest({ message: `${targetNick} is already a member.` })
    }

    await db.table('channel_users').insert({
      channel_id: channelId,
      user_id: targetUser.id,
      invited: true
    })

    return response.ok({
      message: `${targetNick} has been invited.`,
      targetUserId: targetUser.id
    })
  }

}
