<script setup lang="ts">
import {ref, computed} from "vue";

const state = ref<string>('offline')
const props = defineProps<{modelValue: boolean}>()
const emit = defineEmits<{(e: "update:modelValue", value: boolean): void}>()

const activityBorder = computed(() => {
  let color = 'pink-10'
  if(state.value === 'active') color = 'teal'
  else if(state.value === 'away') color = '#0d47a1'
  else color = '#f06292'

  return {
    border: `3px solid ${color}`,
    borderRadius: '50%',
    transition: 'border-color 1s ease',
    display: 'inline-block'
  }
})

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
      <div class="q-pa-xs q-ma-md" :style="activityBorder">
        <q-img alt="" src="../assets/images/user_icon.svg" width="70px" height="70px" class="q-py-md"/>
      </div>
      <p class="text-bold">Cookie monster</p>

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
          <q-radio keep-color v-model="state" val="away" label="DND" color="blue-10" />
          <q-radio keep-color v-model="state" val="offline" label="Offline" color="pink-10" />
        </div>
      </div>

      <q-btn to="/register" icon="arrow_back" label="Log-out" color="purple" class="q-ma-md"/>
    </div>
  </q-drawer>
</template>

<style scoped>
</style>
