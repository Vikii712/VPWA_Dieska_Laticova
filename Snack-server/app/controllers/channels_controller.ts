import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import db from '@adonisjs/lucid/services/db'

export default class ChannelsController {

  async getChannels({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    await user.load('channels')

    return response.ok({
      channels: user.channels.map(channel => ({
        id: channel.id,
        name: channel.name,
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
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return response.ok({
      messages: messages.all().map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISO(),
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
    const user = await auth.getUserOrFail()
    const channelId = params.id
    const content = request.input('content')

    const message = await Message.create({
      channelId: channelId,
      createdBy: user.id,
      content,
      typing: false
    })

    await message.load('author')

    return response.ok({
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISO(),
        author: {
          id: user.id,
          nick: user.nick
        },
        typing: message.typing
      }
    })
  }
}
