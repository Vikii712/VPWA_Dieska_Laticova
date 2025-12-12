<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useChatStore } from 'stores/chat'
import { useAuthStore } from 'stores/auth'
import type { QScrollArea } from 'quasar'
import { useQuasar } from 'quasar'

const chat = useChatStore()
const auth = useAuthStore()
const $q = useQuasar()

const props = defineProps<{
  mini: boolean
}>()

const scrollAreaRef = ref<QScrollArea | null>(null)
const isLoadingMore = ref(false)
const lastScrollHeight = ref(0)

const leftOffset = computed(() =>
  !$q.screen.lt.sm ? (props.mini ? 300 : 56) : 0
)

const isMessageMentioningMe = (messageId: number) => {
  const message = chat.messages.find(m => m.id === messageId)
  if (!message || !auth.user?.id) return false
  return chat.isUserMentioned(message, auth.user.id)
}

async function loadMoreMessages() {
  if (!chat.currentChannelId || isLoadingMore.value) return

  const channelId = chat.currentChannelId
  const meta = chat.channelMeta[channelId]

  if (!meta || !meta.hasMore || meta.isLoading) {
    return
  }

  isLoadingMore.value = true
  const scrollTarget = scrollAreaRef.value?.getScrollTarget()
  if (scrollTarget) {
    lastScrollHeight.value = scrollTarget.scrollHeight
  }

  const nextPage = meta.currentPage + 1
  await chat.loadMessages(channelId, nextPage)

  await nextTick()
  if (scrollTarget) {
    const newScrollHeight = scrollTarget.scrollHeight
    scrollTarget.scrollTop = newScrollHeight - lastScrollHeight.value
  }

  isLoadingMore.value = false
}

function onScroll(info: { verticalPosition: number; verticalSize: number; verticalContainerSize: number }) {
  if (info.verticalPosition < 100 && !isLoadingMore.value && chat.hasMoreMessages) {
    void loadMoreMessages()
  }
}

async function scrollToBottom(smooth = false) {
  await nextTick()
  const scrollTarget = scrollAreaRef.value?.getScrollTarget()
  if (scrollTarget) {
    if (smooth) {
      scrollTarget.scrollTo({
        top: scrollTarget.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      scrollTarget.scrollTop = scrollTarget.scrollHeight
    }
  }
}

async function handleNewMessage() {
  await nextTick()
  await scrollToBottom(true)
}

async function handleChannelSwitch() {
  await nextTick()
  await scrollToBottom(false)
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
  await handleChannelSwitch()
})
</script>

<template>
  <div
    class="chat-container"
    :style="{
    left: $q.screen.lt.sm ? '0px' : leftOffset + 'px',
    width: $q.screen.lt.sm ? '100%' : `calc(100% - ${leftOffset}px)`}">
    <div
      v-if="!chat.currentChannelId"
      class="column items-center text-grey-5 full-height justify-center"
    >
      <q-icon name="forum" size="80px"/>
      <p class="text-h6 q-mt-md">Select a channel to start chatting</p>
    </div>

    <q-scroll-area
      v-else
      ref="scrollAreaRef"
      class="chat-scroll-area"
      @scroll="onScroll"
      :thumb-style="{
        right: '2px',
        borderRadius: '5px',
        background: 'rgba(155, 89, 182, 0.5)',
        width: '8px',
      }"
    >
      <div v-if="isLoadingMore" class="text-center q-pa-md">
        <q-spinner color="deep-purple-6" size="32px" />
        <div class="text-grey-5 q-mt-sm">Loading older messages...</div>
      </div>

      <div
        v-else-if="chat.messages.length > 0 && !chat.hasMoreMessages"
        class="text-center q-pa-md text-grey-5"
      >
        <q-icon name="check_circle" size="24px" />
        <div class="q-mt-sm">Beginning of channel</div>
      </div>

      <q-timeline
        v-if="chat.messages.length > 0"
        color="deep-purple-6"
        class="q-pb-xl q-pt-md"
        :class="$q.screen.lt.sm ? 'q-px-sm' : 'q-px-lg'"
        layout="dense"
      >
        <q-timeline-entry
          v-for="message in chat.messages"
          :key="message.id"
          :title="message.author.id === auth.user?.id ? 'You' : message.author.nick"
          :subtitle="new Date(message.createdAt).toLocaleString()"
          :color="
          isMessageMentioningMe(message.id)
            ? 'deep-orange-10'
            : message.author.id === auth.user?.id
              ? 'teal'
              : 'blue-grey'
        "
          class="text-white"
        >
          <div
            class="q-pa-sm text-white text-body1 rounded-borders"
            :class="{
            'bg-deep-orange-10': isMessageMentioningMe(message.id),
            'bg-teal-10': !isMessageMentioningMe(message.id) && message.author.id === auth.user?.id,
            'bg-blue-grey-10': !isMessageMentioningMe(message.id) && message.author.id !== auth.user?.id
          }"
            style="white-space: pre-line; word-break: break-word; overflow-wrap: break-word;"
          >
            {{ message.content }}
          </div>

          <q-separator class="q-mb-0 q-mt-sm rounded-borders" />
        </q-timeline-entry>
      </q-timeline>

      <div v-else class="q-pa-md text-white text-center">
        <q-icon name="chat_bubble_outline" size="48px" class="text-grey-6" />
        <div class="q-mt-md text-grey-5">No messages yet in this channel.</div>
        <div class="q-mt-sm text-grey-6 text-caption">Be the first to say something!</div>
      </div>
    </q-scroll-area>
  </div>
</template>

<style scoped>
.chat-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 20px;
  height: 100vh;
  max-width: 100% !important;
  box-sizing: border-box;
  overflow: hidden;
  transition: left 0.3s, width 0.3s;
}

.chat-scroll-area {
  width: 100% !important;
  height: 100% !important;
  overflow-x: hidden !important;
}

.q-timeline {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

@media (min-width: 600px) {
  .q-timeline {
    padding-left: 24px !important;
    padding-right: 24px !important;
  }
}
</style>
