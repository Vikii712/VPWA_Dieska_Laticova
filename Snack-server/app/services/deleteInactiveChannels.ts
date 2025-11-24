import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export async function deleteInactiveChannels() {
  console.log('deleteInactiveChannels called at', new Date())
  const { default: Channel } = await import('#models/channel')
  const { default: Message } = await import('#models/message')

  const cutoff = DateTime.now().minus({ days: 30 }).toSQL()

  console.log('typeof Channel.query:', typeof Channel.query)
  try {
    const q = Channel.query()
    console.log('Query created:', q)
  } catch(e) {
    console.error('Error when creating query:', e)
  }

  const channels = await Channel.query().where('last_active_at', '<', cutoff)

  if (!channels.length) {
    console.log("No inactive channels found")
    return
  }

  for (const channel of channels) {
    try {
      await Message.query().where('channel_id', channel.id).delete()
      await db.from('channel_users').where('channel_id', channel.id).delete()
      await channel.delete()
      console.log(`Deleted channel [id=${channel.id}, name=${channel.name}]`)
    } catch (e) {
      console.error(`Failed to delete channel [id=${channel.id}]`, e)
    }
  }
}
