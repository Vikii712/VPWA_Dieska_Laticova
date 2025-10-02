<script setup lang="ts">
import {ref} from "vue";

const state = ref<string>('offline')
const props = defineProps<{modelValue: boolean}>()
const emit = defineEmits<{(e: "update:modelValue", value: boolean): void}>()

</script>

<template>
  <q-drawer
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    side="right"
    overlay
    behavior="mobile"
    elevated
    class="bg-deep-purple-2"
  >
    <div class="column fit items-center">
      <img alt="" src="../assets/images/user_icon.svg" width="70" class="q-py-md"/>
      <p>Cookie monster</p>

      <q-scroll-area class="col q-pa-md full-width">
        <div v-for="n in 100" :key="n" class="q-py-xs">
          Lorem ipsum dolor sit amet, consectetur adipisicing
          elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua.
        </div>
      </q-scroll-area>

      <div>
        <div class="q-ml-md">
          <p>State</p>
        </div>
        <div class="q-gutter-sm">
          <q-radio keep-color v-model="state" val="active" label="Active" color="teal" />
          <q-radio keep-color v-model="state" val="away" label="Away" color="blue-10" />
          <q-radio keep-color v-model="state" val="offline" label="Offline" color="pink-10" />
        </div>
      </div>

      <q-btn to="/register" icon="arrow_back" label="Log-out" color="purple" class="q-ma-md"/>
    </div>
  </q-drawer>
</template>

<style scoped>

</style>
