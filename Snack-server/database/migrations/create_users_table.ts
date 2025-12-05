import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('nick', 24).notNullable().unique()
      table.string('name', 50).notNullable()
      table.string('last_name', 50).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('activity_status').defaultTo('online').notNullable()

      table.timestamp('created_at').defaultTo(this.now()).notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
