<script setup lang="ts">
import ChatComponent from "components/ChatComponent.vue"
import {ref} from "vue";

const message = ref('')
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
          :input-style="{ maxHeight: '200px', color: 'white'}">
          <template v-slot:prepend>
            <q-btn flat class="q-pl-sm q-pb-sm absolute-bottom-left">
              <q-icon name="send" color="deep-purple-2" />
            </q-btn>
          </template>
        </q-input>

      </q-form>
    </div>
</template>

<style scoped>
</style>
