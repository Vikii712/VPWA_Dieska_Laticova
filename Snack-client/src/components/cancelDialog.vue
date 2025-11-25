<script setup lang="ts">
import {ref, watch, defineProps, defineEmits, computed} from 'vue'
import { useChatStore } from 'stores/chat'
import { useRouter } from 'vue-router'
import { api } from 'src/services/api'
import { useAuthStore } from 'stores/auth'

const auth = useAuthStore()

const props = defineProps<{ channelId: number, show: boolean }>()
const emit = defineEmits(['update:show'])

const show = ref(props.show)
const chat = useChatStore()
const router = useRouter()

watch(() => props.show, (newVal) => {
  show.value = newVal
})

function close() {
  show.value = false
  emit('update:show', false)
}

const isModerator = computed(() => {
  const currentUserId = auth.user?.id;
  const moderatorId = chat.currentChannel?.moderatorId;
  return currentUserId != null && moderatorId != null && currentUserId === moderatorId;
});

async function confirmExit() {
  show.value = false
  emit('update:show', false)
  if (!props.channelId) return

  await api('POST', `/channels/${props.channelId}/leave`)
  chat.leaveChannel(props.channelId, isModerator.value)
  chat.currentChannelId = null
  await chat.fetchChannels()
  await router.push('/main');

}

</script>

<template>
  <q-dialog v-model="show" persistent>
    <q-card class="q-px-md bg-deep-purple-2" style="width: 400px;">
      <q-card-section class="text-h6 flex justify-center">
        Do you really want to leave the channel?
      </q-card-section>

      <q-card-actions align="center">
        <q-btn outline label="Yes" color="negative" @click="confirmExit" />
        <q-btn label="No" color="purple" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
