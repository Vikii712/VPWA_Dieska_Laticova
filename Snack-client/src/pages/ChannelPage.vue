<script setup lang="ts">
import ChatComponent from "components/ChatComponent.vue";
import CancelDialog from "components/cancelDialog.vue"
import {ref, computed, watch, onBeforeUnmount} from "vue"
import { useChatStore } from "stores/chat"
import { useCommandStore } from "stores/commandStore"
import {useQuasar} from "quasar";
import {useAuthStore} from "stores/auth";
import {useSocketStore} from "stores/socketStore";

const $q = useQuasar()
const message = ref('')
const chat = useChatStore()
const socketStore = useSocketStore()
const isSending = ref(false)
const props = defineProps<{ mini: boolean }>()
const commandStore = useCommandStore()
const auth = useAuthStore()

const leftOffset = computed(() =>
  !$q.screen.lt.sm ? (props.mini ? 300 : 56) : 0
)

const showCancelDialog = ref(false)

let isTyping = false

function onTyping(value: string | number | null) {
  if (!chat.currentChannelId) return
  const textValue = value ? String(value).trim() : ''
  const hasText = textValue.trim()

  if (hasText) {
    isTyping = true
    socketStore.emitTyping(chat.currentChannelId, true, textValue)
  } else if (!hasText && isTyping) {
    isTyping = false
    socketStore.emitTyping(chat.currentChannelId, false, '')
  }
}

watch(() => chat.currentChannelId, (newId, oldId) => {
  if (isTyping && oldId) {
    socketStore.emitTyping(oldId, false)
  }
  isTyping = false

  if ( newId && message.value.trim()) {
    isTyping = true
    socketStore.emitTyping(newId, true)
  }
})

onBeforeUnmount(() => {
  if (isTyping && chat.currentChannelId) {
    socketStore.emitTyping(chat.currentChannelId, false)
  }
})

async function sendMessage() {
  const text = message.value.trim()
  if (!text || isSending.value) return

  if (isTyping && chat.currentChannelId) {
    isTyping = false
    socketStore.emitTyping(chat.currentChannelId, false)
  }

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
        } else if(result.message === 'leave') {
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

  chat.sendMessage(text)
  message.value = ''
}

async function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    await sendMessage()
  }
}

</script>

<template>
  <ChatComponent :mini="leftOffset > 56" />

  <cancelDialog
    v-if="chat.currentChannelId !== null"
    :channelId="chat.currentChannelId"
    v-model:show="showCancelDialog"
  />

  <div
    class="bg-grey-9 q-pa-sm"
    :style="{position:'fixed', bottom: 0, left: leftOffset + 'px', right: 0, width: `calc(100% - ${leftOffset}px)`}"
  >
    <q-form class="q-gutter-md q-ml-md-xl q-py-none" @submit.prevent="sendMessage">
      <q-input
        type="textarea"
        autogrow
        dense
        v-model="message"
        @update:model-value="onTyping"
        outlined
        color="black"
        bg-color="grey-9"
        class="text-white"
        input-class="q-pl-lg"
        maxlength="1000"
        :input-style="{ maxHeight: '200px', color: 'white', scrollbarWidth: 'none'}"
        @keydown="handleKeydown"
        :disable="isSending || !auth.isOnline"
        placeholder="Type a message..."
      >
        <template v-slot:append>
          <q-btn
            flat
            class="q-pl-sm q-pb-sm absolute-bottom-right"
            @click="sendMessage"
            :disable="!message.trim() || isSending"
            :loading="isSending"
          >
            <q-icon name="send" color="deep-purple-2" />
          </q-btn>
        </template>
      </q-input>
    </q-form>
  </div>
</template>

<style scoped>
</style>
