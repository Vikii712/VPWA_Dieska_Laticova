<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useChatStore } from 'stores/chat'
import { useAuthStore } from 'stores/auth'
import type { QInfiniteScroll } from 'quasar'

const chat = useChatStore()
const auth = useAuthStore()

const infiniteScroll = ref<QInfiniteScroll | null>(null)

const isMessageMentioningMe = (messageId: number) => {
  const message = chat.messages.find(m => m.id === messageId)
  if (!message || !auth.user?.id) return false
  return chat.isUserMentioned(message, auth.user.id)
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  if (!chat.currentChannelId) {
    done(true)
    return
  }

  const channelId = chat.currentChannelId
  const meta = chat.channelMeta[channelId]

  if (!meta || !meta.hasMore || meta.isLoading) {
    done(true)
    return
  }

  const nextPage = meta.currentPage + 1
  await chat.loadMessages(channelId, nextPage)

  const updatedMeta = chat.channelMeta[channelId]
  done(!updatedMeta?.hasMore)
}

async function scrollToBottom() {
  await nextTick(() => {
    const scrollArea = infiniteScroll.value?.$el.querySelector('.q-scrollarea__container')
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  })
}

async function handleNewMessage() {
  await scrollToBottom()
}

async function handleChannelSwitch() {
  if (infiniteScroll.value) {
    infiniteScroll.value.reset()
    infiniteScroll.value.resume()
  }
  await scrollToBottom()
}

function onNewMessageEvent() {
  void handleNewMessage()
}

function onChannelSwitchedEvent() {
  void handleChannelSwitch()
}

onMounted(async () => {
  window.addEventListener('new-message-received', onNewMessageEvent)
  window.addEventListener('channel-switched', onChannelSwitchedEvent)

  await scrollToBottom()
})

onBeforeUnmount(() => {
  window.removeEventListener('new-message-received', onNewMessageEvent)
  window.removeEventListener('channel-switched', onChannelSwitchedEvent)
})

watch(() => chat.currentChannelId, async () => {
  if (infiniteScroll.value) {
    infiniteScroll.value.reset()
    infiniteScroll.value.resume()
  }
  await scrollToBottom()
})
</script>


<template>
  <div
    v-if="!chat.currentChannelId"
    class="column items-center text-grey-5"
  >
    <q-icon name="forum" size="80px"/>
    <p class="text-h6 q-mt-md ">Select a channel to start chatting</p>
  </div>

  <q-infinite-scroll
    @load="onLoad"
    v-if="chat.currentChannelId"
    reverse
    ref="infiniteScroll"
    :offset="250"
    class="full-height overflow-auto"
  >

    <q-timeline
      color="deep-purple-6"
      class="q-px-lg q-pb-xl"
      layout="dense"
      v-if="chat.messages.length > 0"
    >
      <q-timeline-entry
        v-for="message in chat.messages"
        :key="message.id"
        :title="message.author.id === auth.user?.id ? 'You' : message.author.nick"
        :subtitle="new Date(message.createdAt).toLocaleString()"
        :color="
          isMessageMentioningMe(message.id)
            ? 'yellow-8'
            : message.author.id === auth.user?.id
              ? 'teal'
              : 'blue-grey'
        "
        class="text-white"
      >
        <div
          class="q-pa-sm text-white text-body1"
          :class="{
            'bg-yellow-9': isMessageMentioningMe(message.id),
            'bg-teal-10': !isMessageMentioningMe(message.id) && message.author.id === auth.user?.id,
            'bg-blue-grey-10': !isMessageMentioningMe(message.id) && message.author.id !== auth.user?.id
          }"
          style="white-space: pre-line;"
        >
          {{ message.content }}
        </div>

        <q-separator class="q-mb-0 q-mt-sm rounded-borders" />
      </q-timeline-entry>
    </q-timeline>

    <div v-else class="q-pa-md text-white text-center">
      No messages yet for this channel.
    </div>
  </q-infinite-scroll>
</template>
<style scoped>

</style>
