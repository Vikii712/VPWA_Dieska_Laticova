import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Channel from '#models/channel'
import Message from '#models/message'
import {DateTime} from "luxon";

export default class extends BaseSeeder {
  async run() {

    const users = await User.updateOrCreateMany('email', [
      {
        nick: 'admin',
        name: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password',
        activity_status: 'active'
      },
      {
        nick: 'Vikinka',
        name: 'Viktória',
        lastName: 'Latičová',
        email: 'viki@gmail.com',
        password: 'laticova',
        activity_status: 'active'
      },
      {
        nick: 'mdieska',
        name: 'Marek',
        lastName: 'Dieška',
        email: 'mdieska@gmail.com',
        password: 'password123',
        activity_status: 'active'
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
        moderatorId: viki.id,
      },
      {
        name: 'private-chat',
        public: false,
        moderatorId: marek.id,
      },
      {
        name: 'inactive-channel',
        public: false,
        moderatorId: marek.id,
        lastActiveAt: DateTime.fromISO('2025-10-22T12:45:00')
      }
    ])

    const [general, random, privateChat, inactiveChannel] = channels

    await general.related('users').attach([admin.id, marek.id, viki.id])
    await random.related('users').attach([viki.id, marek.id])
    await privateChat.related('users').attach([marek.id, viki.id])
    await inactiveChannel.related('users').attach([marek.id, viki.id])


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
        content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
        createdBy: admin.id,
        channelId: random.id,
        typing: false,
      },
      {
        content: 'Nečítajte mi správy prosím',
        createdBy: marek.id,
        channelId: privateChat.id,
        typing: true,
      },
      {
        content: 'Táto správa bola poslaná dosť dávno',
        createdBy: viki.id,
        channelId: inactiveChannel.id,
        createdAt: DateTime.fromISO('2025-10-22T13:45:00'),
        typing: false,
      }
    ])
  }
}
