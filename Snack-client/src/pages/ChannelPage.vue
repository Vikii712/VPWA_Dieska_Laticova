<script setup lang="ts">
import ChatComponent from "components/ChatComponent.vue"
import {ref} from "vue";
import {useChatStore} from "stores/chat";

const message = ref('')
const chat = useChatStore()

async function sendMessage() {
  if (!message.value.trim()) return
  await chat.sendMessage(message.value)
  message.value = ''
}
</script>

<template>
    <ChatComponent/>

    <div class="fixed-bottom bg-grey-9 q-pa-sm">
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
          :input-style="{ maxHeight: '200px', color: 'white', scrollbarWidth: 'none'}">
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
