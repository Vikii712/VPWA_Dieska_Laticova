<script setup lang="ts">
import ChatComponent from "components/ChatComponent.vue"
import CancelDialog from "components/cancelDialog.vue"
import { ref, computed } from "vue"
import { useQuasar } from "quasar"
import { useChatStore } from "stores/chat"
import { useSocketStore } from "stores/socketStore"
import { useCommandStore } from "stores/commandStore"

const $q = useQuasar()
const message = ref('')
const chat = useChatStore()
const props = defineProps<{ mini: boolean }>()
const socketStore = useSocketStore()
const commandStore = useCommandStore()
socketStore.init()

const leftOffset = computed(() =>
  $q.screen.lt.md ? 0 : (props.mini ? 300 : 56)
)

const showCancelDialog = ref(false)

async function sendMessage() {
  const text = message.value.trim()
  if (!text) return

  if (text.startsWith('/')) {
    const result = await commandStore.processCommand(text)
    console.log(result)
    if (result) {
      if (result.type === 'dialog') {
        if (!chat.currentChannelId) {
          $q.notify({
            type: 'warning',
            message: 'You must be in a channel to leave it',
            position: 'top'
          })
        } else {
          showCancelDialog.value = true
        }
      } else {
        $q.notify({
          type: result.type,
          message: result.message,
          position: 'top'
        })
      }
    }
    message.value = ''
    return
  }

  await chat.sendMessage(text)
  message.value = ''
}

function handleNewline(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void sendMessage()
  }
}
</script>

<template>
  <ChatComponent />

  <cancelDialog
    v-if="chat.currentChannelId !== null"
    :channelId="chat.currentChannelId"
    v-model:show="showCancelDialog"
  />

  <div
    class="bg-grey-9 q-pa-sm"
    :style="{ position: 'fixed', bottom: 0, left: leftOffset + 'px', right: 0, width: `calc(100% - ${leftOffset}px)` }"
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
        :input-style="{ maxHeight: '200px', color: 'white', scrollbarWidth: 'none' }"
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
