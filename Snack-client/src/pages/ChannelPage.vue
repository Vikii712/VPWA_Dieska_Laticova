<script setup lang="ts">
import ChatComponent from "components/ChatComponent.vue"
import { ref, computed } from "vue"
import { useQuasar } from "quasar"
import { useChatStore } from "stores/chat"
import { useSocketStore } from "stores/socketStore"

const $q = useQuasar()
const message = ref('')
const chat = useChatStore()
const props = defineProps<{ mini: boolean }>()

const socketStore = useSocketStore()
socketStore.init()

const leftOffset = computed(() =>
  $q.screen.lt.md ? 0 : (props.mini ? 300 : 56)
)

async function sendMessage() {
  const text = message.value.trim()
  if (!text) return

  if (text.startsWith('/join ')) {
    await handleJoinCommand(text)
    message.value = ''
    return
  }

  await chat.sendMessage(text)
  message.value = ''
}

async function handleJoinCommand(cmd: string) {
  const [, channelName, typeArg] = cmd.trim().split(/\s+/)

  if (!channelName) {
    $q.notify({
      type: 'negative',
      message: 'Usage: /join channelName [private]',
      position: 'top'
    })
    return
  }

  const isPrivate = typeArg?.toLowerCase() === 'private'
  const channelType: 'public' | 'private' = isPrivate ? 'private' : 'public'

  try {
    const result = await chat.joinOrCreateChannel(channelName, channelType)

    $q.notify({
      type: 'positive',
      message: result.joined ? `Joined "${channelName}"` : `Created and joined "${channelName}"${isPrivate ? ' (private)' : ''}`,
      position: 'top'
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to join or create channel'
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top'
    })
  }
}

function handleNewline(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void sendMessage()
  }
}
</script>

<template>
  <ChatComponent/>

  <div
    class="bg-grey-9 q-pa-sm"
    :style="{position:'fixed', bottom: 0, left: leftOffset + 'px', right: 0, width: `calc(100% - ${leftOffset}px)`}"
  >
    <q-form class="q-gutter-md q-ml-md-xl q-py-none">
      <q-input
        type="textarea"
        autogrow
        dense
        v-model="message"
        outlined
        color="black"
        bg-color="grey-9"
        class="text-white"
        input-class="q-pl-lg"
        :input-style="{ maxHeight: '200px', color: 'white', scrollbarWidth: 'none'}"
        @keydown="handleNewline"
      >
        <template v-slot:append>
          <q-btn flat class="q-pl-sm q-pb-sm absolute-bottom-right" @click="sendMessage">
            <q-icon name="send" color="deep-purple-2" />
          </q-btn>
        </template>
      </q-input>
    </q-form>
  </div>
</template>

<style scoped>
</style>
