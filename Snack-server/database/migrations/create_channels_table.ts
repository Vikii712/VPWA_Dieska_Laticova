import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('moderator_id').unsigned().notNullable()
      table.string('name', 50).notNullable().unique()
      table.boolean('public').notNullable().defaultTo(false)

      table.foreign('moderator_id').references('id').inTable('users').onDelete('CASCADE')

      table.timestamp('created_at').defaultTo(this.now()).notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
