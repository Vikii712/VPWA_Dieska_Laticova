import { DateTime } from 'luxon'
import type {BelongsTo, HasMany} from '@adonisjs/lucid/types/relations'
import {BaseModel, column, belongsTo, hasMany} from '@adonisjs/lucid/orm'
import User from "../models/user.js"
import Channel from "../models/channel.js"
import Notification from "#models/notification";

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'created_by' })
  declare createdBy: number;

  @column({ columnName: 'channel_id' })
  declare channelId: number;

  @column()
  declare content: string;

  @column()
  declare typing: boolean;

  @belongsTo(() => User, {
    foreignKey: "createdBy",
  })
  declare author: BelongsTo<typeof User>;

  @belongsTo(() => Channel, {
    foreignKey: "channelId",
  })
  declare channel: BelongsTo<typeof Channel>;

  @hasMany(() => Notification, {
    foreignKey: 'messageId',
  })
  declare notifications: HasMany<typeof Notification>


  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
