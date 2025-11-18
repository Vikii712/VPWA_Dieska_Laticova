import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import Channel from '#models/channel'

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

    const channel = await Channel.query()
      .where('id', channelId)
      .preload('users')
      .firstOrFail()

    const isMember = channel.users.some(u => u.id === user.id)

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
}
