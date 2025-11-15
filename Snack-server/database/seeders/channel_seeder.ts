import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Channel from '#models/channel'
import Message from '#models/message'

export default class extends BaseSeeder {
  async run() {

    const users = await User.updateOrCreateMany('email', [
      {
        nick: 'admin',
        name: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password',
      },
      {
        nick: 'Vikinka',
        name: 'Viktória',
        lastName: 'Latičová',
        email: 'viki.laticova@gmail.com',
        password: 'laticova',
      },
      {
        nick: 'mdieska',
        name: 'Marek',
        lastName: 'Dieška',
        email: 'mdieska@gmail.com',
        password: 'password123',
      },
    ])

    const [admin, viki, marek] = users

    const channels = await Channel.updateOrCreateMany('name', [
      {
        name: 'general',
        public: true,
        moderatorId: admin.id,
      },
      {
        name: 'random',
        public: true,
        moderatorId: admin.id,
      },
      {
        name: 'private-chat',
        public: false,
        moderatorId: marek.id,
      },
    ])

    const [general, random, privateChat] = channels

    await general.related('users').attach([admin.id, marek.id, viki.id])
    await random.related('users').attach([viki.id, marek.id])
    await privateChat.related('users').attach([marek.id, viki.id])


    await Message.createMany([
      {
        content: 'Welcome to the general channel!',
        createdBy: admin.id,
        channelId: general.id,
        typing: false,
      },
      {
        content: 'Hello everyone!',
        createdBy: marek.id,
        channelId: general.id,
        typing: false,
      },
      {
        content: 'Ahoojtee!',
        createdBy: viki.id,
        channelId: general.id,
        typing: false,
      },
      {
        content: 'Random skúška jedna dva trii',
        createdBy: marek.id,
        channelId: random.id,
        typing: false,
      },
      {
        content: 'Nečítajte mi správy prosím',
        createdBy: marek.id,
        channelId: privateChat.id,
        typing: true,
      },
    ])
  }
}
