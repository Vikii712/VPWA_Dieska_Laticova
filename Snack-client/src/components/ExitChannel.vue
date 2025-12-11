<script setup lang="ts">
import {computed, ref} from "vue";
import {useChatStore} from "stores/chat";
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const exitDialog = ref<boolean>(false);
const chat = useChatStore()
const auth = useAuthStore()
const router = useRouter()
const isModerator = computed(() => {
  const currentUserId = auth.user?.id;
  const moderatorId = chat.currentChannel?.moderatorId;
  return currentUserId != null && moderatorId != null && currentUserId === moderatorId;
});

async function confirmExit() {
  exitDialog.value = false;
  emit('exitDialog:show', false)

  console.log("Leaving channel:", chat.currentChannelId)
  if (!chat.currentChannelId) return

  chat.leaveChannel(chat.currentChannelId)

  chat.currentChannelId = null
  await chat.fetchChannels()
  await router.push('/main');
}

</script>

<template>
    <q-btn
      name="delete"
      class="q-ma-none q-pa-sm"
      flat
      icon="logout"
      @click="exitDialog = true"
    />

  <q-dialog v-model="exitDialog" persistent>
    <q-card class="q-px-md bg-deep-purple-2" style="width: 400px;">
      <q-card-section class="text-h6 flex justify-center">
        Do you really want to leave the channel?
      </q-card-section>
      <q-card-section class="flex justify-center text-subtitle1 text-negative" v-if="isModerator">
        Since you are the editor, the channel will be deleted
      </q-card-section>
      <q-card-actions align="center">
        <q-btn outline label="Yes" color="negative" @click="confirmExit" />
        <q-btn label="No" color="purple" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>

</style>
