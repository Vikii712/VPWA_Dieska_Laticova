import type { HttpContext } from '@adonisjs/core/http'
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

  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const channel = await Channel.query()
      .where('id', params.id)
      .preload('moderator')
      .preload('users')
      .firstOrFail()

    const isMember = channel.users.some(u => u.id === user.id)

    if (!isMember && !channel.public) {
      return response.forbidden({
        message: 'You are not a member of this channel'
      })
    }

    return response.ok({
      channel: {
        id: channel.id,
        name: channel.name,
        public: channel.public,
        moderator: {
          id: channel.moderator.id,
          nick: channel.moderator.nick,
        },
        membersCount: channel.users.length,
      }
    })
  }
}
