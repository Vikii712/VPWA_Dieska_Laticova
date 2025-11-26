import type { Socket } from 'socket.io'

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: number
  }
}

export async function wsAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const { token, userId } = socket.handshake.auth

    if (!token || !userId) {
      console.error('No token or userId provided')
      return next(new Error('Authentication error: Missing credentials'))
    }
    socket.data.userId = userId
    console.log(`Socket authenticated for user ${userId}`)

    next()
  } catch (error) {
    console.error('WebSocket auth error:', error)
    next(new Error('Authentication error'))
  }
}
