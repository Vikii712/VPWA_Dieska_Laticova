<script setup lang="ts">
import ChatComponent from "components/ChatComponent.vue"
import {ref} from "vue";

const message = ref('')
</script>

<template>
  <q-layout view="hHh LpR fFf" class="bg-dark">
    <ChatComponent/>

    <q-form class=" q-gutter-md">
      <q-input
        v-model="message"
        outlined
        bg-color="grey-9"
        color="grey-9"
        class="text-white"
      />
    </q-form>
  </q-layout>
</template>

<style scoped>
</style>
