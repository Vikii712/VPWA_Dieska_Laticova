import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator, loginValidator } from '#validators/auth'


export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)
    const user = await User.create(data)
    const token = await User.accessTokens.create(user)

    return response.created({
      token: token.value!.release(),
      user: {
        id: user.id,
        nick: user.nick,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        activity_status: user.activity_status
      }
    })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return response.ok({
      token: token.value!.release(),
      user: {
        id: user.id,
        nick: user.nick,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        activity_status: user.activity_status
      }
    })
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)

    return response.ok({ message: 'Logged out successfully' })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    return response.ok({
      user: {
        id: user.id,
        nick: user.nick,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        activity_status: user.activity_status
      }
    })
  }
}
