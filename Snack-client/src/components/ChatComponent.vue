<script setup lang="ts">
import { useChatStore } from 'stores/chat'
import { useAuthStore } from 'stores/auth'
import {QInfiniteScroll} from "quasar";
import {watch, nextTick, ref} from "vue";

const items = ref([ {}, {}, {}, {}, {}, {}, {} ])
const infiniteScroll = ref<QInfiniteScroll | null>(null)

const chat = useChatStore()
const auth = useAuthStore()


function onLoad(index: number, done: (stop?: boolean) => void) {
  setTimeout(() => {
    items.value.splice(0, 0, {}, {}, {}, {}, {}, {}, {})
    done()
  }, 1000)
}

watch(() => chat.messages.length, async (newLength, oldLength) => {
  if (newLength !== oldLength) {
    await nextTick(() => {
      infiniteScroll.value?.resume()
    })
  }
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
    >

      <q-timeline color="deep-purple-6" class="q-px-lg q-pb-xl" layout="dense" v-if="chat.messages.length > 0">
        <q-timeline-entry
          v-for="message in chat.messages"
          :key="message.id"
          :title="message.author.id === auth.user?.id ? 'You' : message.author.nick"
          :subtitle="new Date(message.createdAt).toLocaleString()"
          :color="message.author.id === auth.user?.id ? 'teal' : 'blue-grey'"
          class="text-white"
        >
          <div
            class="q-pa-sm text-white text-body1"
            :class="message.author.id === auth.user?.id ? 'bg-teal-10' : 'bg-blue-grey-10'"
            style="white-space: pre-line;"
          >
            {{ message.content }}
          </div>

          <q-separator class="q-mb-0 q-mt-sm rounded-borders" />
        </q-timeline-entry>

        </q-timeline>
      <div v-else class="q-pa-md text-white">
        No messages yet for this channel.
      </div>
    </q-infinite-scroll>
</template>
<style scoped>

</style>
