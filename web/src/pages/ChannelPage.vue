<script setup lang="ts">
import ChatComponent from "components/ChatComponent.vue"
import {ref} from "vue";

const message = ref('')
</script>

<template>
    <ChatComponent/>

    <div class="fixed-bottom bg-grey-9 q-pa-sm">
      <q-form class="q-gutter-md q-mx-sm-xl q-py-none">
        <q-input
          rounded
          v-model="message"
          outlined
          color="grey-8"
          bg-color="grey-8"
          class="text-white"
          :input-style="{ color: 'white' }">
          <template v-slot:append>
            <q-btn flat class="q-px-sm">
              <q-icon name="send" color="deep-purple-2" />
            </q-btn>
          </template>
        </q-input>

      </q-form>
    </div>
</template>

<style scoped>
</style>
