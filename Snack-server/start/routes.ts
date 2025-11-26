import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const ChannelsController = () => import('#controllers/channels_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/register', [AuthController, 'register']).as('auth.register')
router.post('/login', [AuthController, 'login']).as('auth.login')
router.delete('/logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())
router.get('/me', [AuthController, 'me']).as('auth.me').use(middleware.auth())

router.get('/channels', [ChannelsController, 'getChannels']).use(middleware.auth())
router.get('/channels/:id/messages', [ChannelsController, 'getChannelMessages']).as('messages.index').use(middleware.auth())

router.get('/channels/:channelId/users', [ChannelsController, 'getUsersInChannel'])

router.post('/channels/:id/messages', [ChannelsController, 'sendMessage']).use(middleware.auth())

router.post('/channels', [ChannelsController, 'createChannel']).use(middleware.auth())

router.post('/channels/:id/leave', [ChannelsController, 'leaveOrDeleteChannel']).use(middleware.auth())

router.post('/user/status', [ChannelsController, 'updateUserStatus']).use(middleware.auth())

router.delete('/channels/:id/revoke', [ChannelsController, 'revokeUser']).use(middleware.auth())
router.delete('/channels/:id/kick', [ChannelsController, 'kickUser']).use(middleware.auth())

router.post('/channels/:id/invite', [ChannelsController, 'inviteUser']).use(middleware.auth())
router.post('/channels/:id/accept-invite', [ChannelsController, 'acceptInvite']).use(middleware.auth())
