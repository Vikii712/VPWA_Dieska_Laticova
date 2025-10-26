<script setup lang="ts">

import {ref} from "vue";

const joinDialog = ref<boolean>(false);
defineProps<{name: string}>()

function confirmJoin() {
  joinDialog.value = false;
}
</script>

<template>
  <q-btn
    name="add"
    class="q-ma-none q-pa-sm"
    flat
    icon="add"
    @click="joinDialog = true"
  />

  <q-dialog v-model="joinDialog" persistent>
    <q-card class="q-px-md bg-deep-purple-2" style="min-width: 400px;">
      <q-card-section class="text-h6 flex justify-center">
        Naozaj sa chcete pridať do kanálu {{name}}?
      </q-card-section>
      <q-card-actions align="center">
        <q-btn outline label="Áno" color="negative" @click="confirmJoin"></q-btn>
        <q-btn label="Nie" color="purple" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>

</style>
