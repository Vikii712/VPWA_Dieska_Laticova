import { DateTime } from 'luxon'
import type {BelongsTo} from '@adonisjs/lucid/types/relations'
import {BaseModel, column, belongsTo} from '@adonisjs/lucid/orm'
import User from "#models/user"
import Message from "#models/message"


export default class Mention extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'message_id' })
  declare messageId: number;

  @column({ columnName: 'mentioned_id' })
  declare mentionedId: number;

  @belongsTo(() => Message, {
    foreignKey: "messageId",
  })
  declare message: BelongsTo<typeof Message>;

  @belongsTo(() => User, {
    foreignKey: "mentionedId",
  })
  declare mentioned: BelongsTo<typeof User>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
