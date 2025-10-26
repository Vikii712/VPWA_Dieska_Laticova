<script setup lang="ts">
  import { ref } from 'vue'

  const showDialog = ref(false)
  const channelName = ref('')
  const channelType = ref<'public' | 'private'>('public')

  function closeDialog() {
    showDialog.value = false
  }
</script>

<template>

  <q-item clickable v-ripple @click="showDialog = true">
    <q-item-section avatar>
      <q-icon name="add" />
    </q-item-section>

    <q-item-section>
      Add Channel
    </q-item-section>
  </q-item>


  <q-dialog v-model="showDialog" persistent>
    <q-card class="q-pa-md bg-deep-purple-2" style="min-width: 350px;">
      <q-card-section class="text-h6">
        Vytvoriť nový kanál
      </q-card-section>
      <q-card-section>
        <q-input
          autogrow
          maxlength="50"
          outlined
          v-model="channelName"
          label="Názov kanála"
          dense
          autofocus
          :input-style="{maxHeight: '42px'}"
        />

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
        <q-btn flat label="Zrušiť" color="purple" v-close-popup />
        <q-btn label="Vytvoriť" color="purple" @click="closeDialog" :disable="!channelName.trim()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>


</template>

<style scoped>

</style>
