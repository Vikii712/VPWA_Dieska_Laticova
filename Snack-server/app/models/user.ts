import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany} from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import {DbAccessTokensProvider} from "@adonisjs/auth/access_tokens";
import Message from "#models/message"
import Channel from "#models/channel"
import Mention from "#models/mention";


const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nick: string

  @column()
  declare name: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare activity_status: string

  @hasMany(() => Mention, {
    foreignKey: 'mentionedId',
  })
  declare mentions: HasMany<typeof Mention>

  @hasMany(() => Message, {
    foreignKey: 'createdBy',
  })
  declare sentMessages: HasMany<typeof Message>

  @manyToMany(() => Channel, {
    pivotTable: 'channel_users',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'channel_id',
    pivotColumns: ['invited'],
    pivotTimestamps: true,
  })
  declare channels: ManyToMany<typeof Channel>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
