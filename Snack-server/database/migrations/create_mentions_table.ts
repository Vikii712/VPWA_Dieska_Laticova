import { BaseSchema } from '@adonisjs/lucid/schema'


export default class Mentions extends BaseSchema {
  protected tableName = 'mentions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // primárny kľúč
      table.integer('message_id').unsigned().notNullable()
      table.integer('mentioned_id').unsigned().notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table
        .foreign('message_id')
        .references('id')
        .inTable('messages')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .foreign('mentioned_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
