import { DateTime } from 'luxon'
import type { HasMany, BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { BaseModel, column, hasMany, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import Message from '#models/message'
import User from '#models/user'
import Notification from '#models/notification'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'moderator_id' })
  declare moderatorId: number;

  @column()
  declare name: string;

  @column()
  declare public: boolean;

  @column.dateTime({ columnName: 'last_active_at' })
  declare lastActiveAt: DateTime | null

  @belongsTo(() => User, {
    foreignKey: "moderatorId",
  })
  declare moderator: BelongsTo<typeof User>

  @hasMany(() => Message, {
    foreignKey: "channelId",
  })
  declare messages: HasMany<typeof Message>

  @hasMany(() => Notification, {
    foreignKey: 'channelId',
  })
  declare notifications: HasMany<typeof Notification>

  @manyToMany(() => User, {
    pivotTable: 'channel_users',
    pivotForeignKey: 'channel_id',
    pivotRelatedForeignKey: 'user_id',
    pivotTimestamps: true,
  })
  declare users: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
