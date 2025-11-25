import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import db from '@adonisjs/lucid/services/db'
import Channel from '#models/channel'
import {DateTime} from "luxon";

export default class ChannelsController {

  async getChannels({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    await user.load('channels')

    return response.ok({
      channels: user.channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        public: channel.public,
        moderatorId: channel.moderatorId,
      }))
    })
  }

  async getChannelMessages({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channelId = params.id
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const channel = await db.from('channels').where('id', channelId).first()
    if(!channel) return response.notFound({message: 'No channel found.'})

    const users = await db
      .from('users')
      .select(['users.id', 'users.nick'])
      .join('channel_users', 'users.id', '=', 'channel_users.user_id')
      .where('channel_users.channel_id', '=', channelId)

    const isMember = users.some(u => u.id === user.id)
    if (!isMember && !channel.public) {
      return response.forbidden({ message: 'You are not a member of this channel' })
    }

    if (!isMember && !channel.public) {
      return response.forbidden({
        message: 'You are not a member of this channel'
      })
    }

    const messages = await Message.query()
      .where('channel_id', channelId)
      .preload('author')
      .orderBy('created_at', 'asc')
      .paginate(page, limit)

    return response.ok({
      messages: messages.all().map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISO(),
        channelId: channelId,
        author: {
          id: msg.author.id,
          nick: msg.author.nick,
        },
        typing: msg.typing,
      })),
      meta: messages.getMeta()
    })
  }

  async getUsersInChannel({ params, response } : HttpContext) {
    const channelId = params.channelId
    const users = await db
      .from('users')
      .select(['users.id', 'users.nick'])
      .join('channel_users', 'users.id', '=', 'channel_users.user_id')
      .where('channel_users.channel_id', channelId)
    response.json(users)
  }

  async sendMessage({auth, params, request, response} : HttpContext) {
    const user = auth.getUserOrFail()
    const channelId = params.id
    const content = request.input('content')

    const message = await Message.create({
      channelId: channelId,
      createdBy: user.id,
      content,
      typing: false
    })

    const channel = await Channel.find(channelId)
    if (channel) {
      channel.lastActiveAt = DateTime.now()
      await channel.save()
    }

    await message.load('author')

    return response.ok({
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISO(),
        channelId: channelId,
        author: {
          id: user.id,
          nick: user.nick
        },
        typing: message.typing
      }
    })
  }

  async createChannel({auth, request, response} : HttpContext) {
    const user = auth.getUserOrFail()
    const name = request.input('name')
    const type = request.input('type')

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return response.badRequest({message: 'You must provide a valid name.'})
    }

    const isPublic = (type === 'public')

    // Najdi kanál podľa mena
    let channel = await db.from('channels').where('name', name).first()

    if(channel) {
      // Najprv zisti či je užívateľ už členom
      const isMember = await db
        .from('channel_users')
        .where('channel_id', channel.id)
        .where('user_id', user.id)
        .first()

      // Ak JE členom, vráť kanál (nech je private alebo public)
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

      // Ak NIE JE členom a kanál je private, reject
      if (!channel.public) {
        return response.badRequest({ message: 'Channel is private.' })
      }

      // Ak NIE JE členom a kanál je public, pridaj ho
      await db.table('channel_users').insert({
        channel_id: channel.id,
        user_id: user.id
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

    // Ak neexistuje, vytvor kanál
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
        moderator_id: channel.moderatorId, // Zjednotené pomenovanie
      },
      joined: false
    })
  }

  async leaveOrDeleteChannel({auth, params, response}: HttpContext) {
    const user = auth.getUserOrFail()
    const channelId = params.id
    const channel = await Channel.find(channelId);

    if (!channel) { return response.ok({message: "Channel already deleted"})}

    const userInChannel = await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .first()

    if (!userInChannel) {
      return response.forbidden({ message: "You are not a member of this channel" })
    }


    if (channel.moderatorId === user.id) {
      await Message.query().where('channel_id', channelId).delete()
      await db.from('channel_users').where('channel_id', channelId).delete()
      await channel.delete()

      return response.ok({message: 'Channel deleted'});
    }

    await db
      .from('channel_users')
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .delete()

    return response.ok({ message: "Left channel" })
  }
}
