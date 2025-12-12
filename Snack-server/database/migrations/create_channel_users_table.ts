import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ChannelUsers extends BaseSchema {
  protected tableName = 'channel_users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table.boolean('invited').defaultTo(false).notNullable()
      table.boolean('member').defaultTo(true).notNullable()
      table.integer('ban').unsigned().defaultTo(0).notNullable()

      table.check('ban >= 0 AND ban <= 3')

      table.unique(['user_id', 'channel_id'])

      table.timestamp('created_at').defaultTo(this.now()).notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
