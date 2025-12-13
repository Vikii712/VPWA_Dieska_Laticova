<script setup lang="ts">
  import { ref } from 'vue'
  import {api} from "src/services/api";
  import { useChatStore } from 'stores/chat'

  const showDialog = ref(false)
  const channelName = ref('')
  const channelType = ref<'public' | 'private'>('public')
  const chat = useChatStore()
  const errorMessage = ref('')

  function closeDialog() {
    showDialog.value = false
    errorMessage.value = ''
    channelName.value = ''
    channelType.value = 'public'
  }

  async function createChannel() {
    errorMessage.value = ''
    if (!channelName.value.trim() || channelName.value.trim().length === 0)  {
      errorMessage.value = 'You must provide a valid name.'
      return
    }
    const exists = chat.channels.some(channel => channel.name === channelName.value.trim())
    if (exists) {
      errorMessage.value = 'You already created a channel with this name.'
      return
    }

    try {
      await api('POST', '/channels', {
        name: channelName.value,
        type: channelType.value,
      })
      closeDialog()
      await chat.fetchChannels()
    } catch (error) {
      console.log(error)
      errorMessage.value = 'Failed to create channel. Please try again.'
    }
  }
</script>

<template>

  <q-item clickable v-ripple @click="showDialog = true">
    <q-item-section avatar class="text-white">
      <q-icon name="add" />
    </q-item-section>

    <q-item-section class="text-white">
      Add Channel
    </q-item-section>
  </q-item>


  <q-dialog v-model="showDialog" persistent>
    <q-card class="q-pa-md bg-deep-purple-2" style="width: 350px;">
      <q-card-section class="text-h6">
        Create new channel
      </q-card-section>
      <q-card-section>
        <q-input
          autogrow
          maxlength="50"
          outlined
          v-model="channelName"
          label="Channel name*"
          dense
          autofocus
          @keydown.enter.prevent
          :input-style="{maxHeight: '42px'}"
        />

        <div v-if="errorMessage" class="text-negative q-mt-md">
          {{ errorMessage }}
        </div>

        <div class="q-mt-md">
          <q-option-group
            v-model="channelType"
            :options="[
            { label: 'Public', value: 'public' },
            { label: 'Private', value: 'private' }
          ]"
            type="radio"
            color="purple"
            inline
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="purple" v-close-popup />
        <q-btn label="Create" color="purple" @click="createChannel" :disable="!channelName.trim()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>


</template>

<style scoped>

</style>
