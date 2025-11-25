import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { ref } from 'vue'
import type {Message} from "stores/chat";
import { Notify } from 'quasar'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null)

  const init = () => {
    if (!socket.value) {
      socket.value = io('http://localhost:3333')

      socket.value.on('connect', () => {
        console.log('Connected', socket.value?.id)
      });

      socket.value.on('newMessage', async (message) => {
        const { useChatStore } = await import('stores/chat');
        const chatStore = useChatStore();

        if (!chatStore.channelMessages[message.channelId]) {
          chatStore.channelMessages[message.channelId] = [];
        }
        chatStore.channelMessages[message.channelId]!.push(message);

        if (message.channelId === chatStore.currentChannelId) {
          chatStore.messages.push(message);
          window.dispatchEvent(new Event('messages-loaded'));
        } else {
          if (!chatStore.unreadChannels[message.channelId]) {
            chatStore.unreadChannels[message.channelId] = 0;
          }
          chatStore.unreadChannels[message.channelId]!++;
          Notify.create({
            type: 'info',
            color: 'blue',
            message: `New message in channel ${message.channelName ?? message.channelId}`,
            position: 'bottom',
          });
        }
      });


      socket.value.on('channelUsersUpdated', async (data: { channelId: number }) => {
        console.log('Channel users updated:', data.channelId)
        const {useChatStore} = await import('stores/chat');
        const chatStore = useChatStore();

        if (data.channelId === chatStore.currentChannelId) {
          await chatStore.loadChannelUsers(data.channelId);
        }
      });

      socket.value.on('connect_error', (err) => {
        console.error('Problem with connection to the server::', err)
      });

      socket.value.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason)
      });
    }
  }

  const joinChannel = (channelId: number) => {
    socket.value?.emit('joinChannel', channelId)
  }

  const sendMessage = (channelId: number, message: Message) => {
    socket.value?.emit('sendMessage', { channelId, message })
  }

  const notifyUserJoined = (channelId: number) => {
    socket.value?.emit('userJoinedChannel', { channelId })
  }

  const notifyUserLeft = (channelId: number) => {
    socket.value?.emit('userLeftChannel', { channelId })
  }

  return { socket, init, joinChannel, sendMessage, notifyUserJoined, notifyUserLeft }
})
