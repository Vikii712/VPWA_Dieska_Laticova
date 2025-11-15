import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({

    nick: vine.string().trim().minLength(3).maxLength(24).unique(async (db, value) => {
      const user = await db.from('users').where('nick', value).first()
      return !user
    }),

    name: vine.string().trim().minLength(2).maxLength(50),

    lastName: vine.string().trim().minLength(2).maxLength(50),

    email: vine.string().trim().email().normalizeEmail().unique(async (db, value) => {
      const user = await db.from('users').where('email', value).first()
      return !user
    }),

    password: vine.string().minLength(8).maxLength(255)
  })
)

export const loginValidator = vine.compile(
  vine.object({

    email: vine.string().trim().email().normalizeEmail(),

    password: vine.string()
  })
)
