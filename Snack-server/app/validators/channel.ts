import vine from '@vinejs/vine'

export const createChannelValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(50).unique(async (db, value) => {
      const channel = await db.from('channels').where('name', value).first()
      return !channel
    }),
    public: vine.boolean(),
    moderatorId: vine.number().positive()
  })
)

export const createMessageValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(500),
    channelId: vine.number().positive(),
  })
)
