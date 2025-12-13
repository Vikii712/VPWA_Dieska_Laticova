import type { Socket } from 'socket.io'
import db from '@adonisjs/lucid/services/db'
import { createHash } from 'node:crypto'

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: number
  }
}

export async function wsAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const { token } = socket.handshake.auth

    if (!token) {
      return next(new Error('Authentication error: Missing token'))
    }

    if (!token.startsWith('oat_')) {
      return next(new Error('Authentication error: Invalid token format'))
    }

    const tokenWithoutPrefix = token.substring(4)
    const [base64Id, base64Secret] = tokenWithoutPrefix.split('.')

    if (!base64Id || !base64Secret) {
      return next(new Error('Authentication error: Malformed token'))
    }

    const tokenId = Buffer.from(base64Id, 'base64').toString('utf-8')
    const secret = Buffer.from(base64Secret, 'base64').toString('utf-8')

    const tokenRecord = await db
      .from('auth_access_tokens')
      .where('id', tokenId)
      .first()

    if (!tokenRecord) {
      return next(new Error('Authentication error: Token not found'))
    }

    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return next(new Error('Authentication error: Token expired'))
    }
    const secretHash = createHash('sha256').update(secret).digest('hex')

    if (secretHash !== tokenRecord.hash) {
      return next(new Error('Authentication error: Invalid token'))
    }

    socket.data.userId = tokenRecord.tokenable_id

    await db
      .from('auth_access_tokens')
      .where('id', tokenId)
      .update({ last_used_at: new Date() })

    next()
  } catch (error) {
    console.error('WS Auth: Unexpected error:', error)
    next(new Error('Authentication error'))
  }
}
