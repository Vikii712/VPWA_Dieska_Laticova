<script setup lang="ts">
import { ref } from "vue";
import { useChatStore } from "stores/chat";
import { useQuasar } from "quasar";

const props = defineProps<{
  channelId: number
  channelName: string
}>()

const joinDialog = ref<boolean>(false);
const chat = useChatStore()
const $q = useQuasar()

async function confirmJoin() {
  joinDialog.value = false;

  try {
    await chat.acceptInvite(props.channelId)
    await chat.loadChannel(props.channelId)

    $q.notify({
      type: 'positive',
      message: `You joined ${props.channelName}`,
      position: 'top',
      timeout: 2000
    })
  } catch (error) {
    console.error('Failed to join channel:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to join channel',
      position: 'top',
      timeout: 2000
    })
  }
}

function declineInvite() {
  joinDialog.value = false;

  try {
    chat.declineInvite(props.channelId)

    chat.channels = chat.channels.filter(c => c.id !== props.channelId)

    $q.notify({
      type: 'info',
      message: `Invitation to ${props.channelName} declined`,
      position: 'top',
      timeout: 2000
    })
  } catch (error) {
    console.error('Failed to decline invite:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to decline invitation',
      position: 'top',
      timeout: 2000
    })
  }
}
</script>

<template>
  <q-item-section side>
    <q-btn
      flat
      round
      dense
      icon="login"
      color="green"
      @click.stop="joinDialog = true"
    >
      <q-tooltip>Join channel</q-tooltip>
    </q-btn>
  </q-item-section>

  <q-dialog v-model="joinDialog" persistent>
    <q-card class="q-px-md bg-deep-purple-2" style="width: 400px;">
      <q-card-section class="text-h6 flex justify-center">
        Do you really want to join the channel {{ channelName }}?
      </q-card-section>
      <q-card-actions align="center">
        <q-btn label="Yes" color="purple" @click="confirmJoin" />
        <q-btn outline label="No" color="negative" @click="declineInvite" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
