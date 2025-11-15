import { DateTime } from 'luxon'
import type {  BelongsTo } from '@adonisjs/lucid/types/relations'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from "../models/user.js"
import Channel from "../models/channel.js"
import Message from "#models/message";

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number;

  @column({ columnName: 'message_id' })
  declare messageId: number;

  @column({ columnName: 'channel_id' })
  declare channelId: number;

  @column()
  declare content: string;

  @column()
  declare seen: boolean;

  @belongsTo(() => User, {
    foreignKey: "userId",
  })
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Message, {
    foreignKey: "messageId",
  })
  declare message: BelongsTo<typeof Message>;

  @belongsTo(() => Channel, {
    foreignKey: "channelId",
  })
  declare channel: BelongsTo<typeof Channel>;


  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
