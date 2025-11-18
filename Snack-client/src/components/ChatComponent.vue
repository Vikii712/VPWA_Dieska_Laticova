<script setup lang="ts">
import user1 from '../assets/images/profile_pic.svg'
import user2 from '../assets/images/user_icon.svg'

import { ref, nextTick, watch } from 'vue'
import { useChatStore } from 'stores/chat'
import { useAuthStore } from 'stores/auth'
import { QScrollArea } from 'quasar'

const chat = useChatStore()
const auth = useAuthStore()

const scrollArea = ref<QScrollArea | null>(null)


/*

const activeTypingId = ref<number | null>(null)

function toggleTyping(id: number) {
  if (activeTypingId.value === id) {
    activeTypingId.value = null
  } else {
    activeTypingId.value = id
  }
}

 */

async function onLoad(index: number, done: (stop?: boolean) => void) {
  await chat.loadMessages()
  done(!chat.hasMoreMessages)
}

watch(
  () => chat.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

function scrollToBottom() {
  if (!scrollArea.value) return
  const target = scrollArea.value.getScrollTarget()
  scrollArea.value.setScrollPosition('vertical', target.scrollHeight, 300)
}
</script>

<template>
  <q-scroll-area ref="scrollArea" class="fit">

    <div
      v-if="!chat.currentChannelId"
      class="column items-center justify-center text-grey-5"
      style="height: 100%;"
    >
      <q-icon name="forum" size="80px" />
      <p class="text-h6 q-mt-md">Select a channel to start chatting</p>
    </div>

    <q-infinite-scroll
      v-else
      @load="onLoad"
      :initial-index="0"
      reverse
    >
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="deep-purple-6" size="40px" />
        </div>
      </template>

      <q-timeline color="deep-purple-6" class="q-px-lg q-pb-xl" layout="dense">
        <q-timeline-entry
          v-for="message in chat.messages"
          :key="message.id"
          :title="message.author.id === auth.user?.id ? 'You' : message.author.nick"
          :subtitle="new Date(message.createdAt).toLocaleString()"
          :color="message.author.id === auth.user?.id ? 'teal' : 'blue-grey'"
          :avatar="message.author.id === auth.user?.id ? user1 : user2"
          class="text-white"
        >
          <div
            class="q-pa-sm text-white text-body1"
            :class="message.author.id === auth.user?.id ? 'bg-teal-10' : 'bg-blue-grey-10'"
          >
            {{ message.content }}
          </div>

          <q-separator class="q-mb-0 q-mt-sm rounded-borders" />
        </q-timeline-entry>

        <!--
        <q-timeline-entry
          v-for="entry in chat.typing"
          :key="'typing-' + entry.id"
          color="blue-grey"
          :avatar=entry.user
          class="text-white"
        >
          <template #title>
              <span>
                {{entry.persona}}
              </span>
          </template>
          <div
            v-show="activeTypingId === entry.id"
            class="q-pa-sm text-white bg-grey-9 text-body1"
          >
            {{ entry.message }}
          </div>
          <q-spinner-dots
            size="2rem"
            @click="toggleTyping(entry.id)"
          />
        </q-timeline-entry>
        -->

        </q-timeline>
    </q-infinite-scroll>
  </q-scroll-area>
</template>
<style scoped>

</style>
