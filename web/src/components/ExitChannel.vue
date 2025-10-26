<script setup lang="ts">
import {ref} from "vue";

const exitDialog = ref<boolean>(false);
defineProps<{n: number}>()

function confirmExit() {
  exitDialog.value = false;
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
      <q-card-section class="flex justify-center text-subtitle1 text-negative" v-if="n == 2 || n == 4">
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
