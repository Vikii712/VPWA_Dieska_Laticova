<script setup lang="ts">
import {ref, computed, watch} from "vue";
import {useAuthStore} from "stores/auth";
import {useRouter} from "vue-router";
import { onMounted } from 'vue'

const auth = useAuthStore();
const router = useRouter();

const state = ref<string>('offline')
const notifType = ref<string>('none')
const props = defineProps<{modelValue: boolean}>()
const emit = defineEmits<{(e: "update:modelValue", value: boolean): void}>()

const activityBorder = computed(() => {
  let color = 'pink-10'
  if(state.value === 'active') color = 'teal'
  else if(state.value === 'away') color = '#0d47a1'
  else color = '#f06292'

  return {
    border: `4px solid ${color}`,
    borderRadius: '50%',
    transition: 'border-color 1s ease',
    zIndex: 1,
  }
})

watch(state, async (newStatus) => {
  await auth.updateStatus(newStatus)
})

onMounted(async () => {
  await auth.me()
  if (auth.user?.activity_status) {
    state.value = auth.user.activity_status
  }
})

async function logout() {
  await auth.logout()
  void router.push('/login')
}
</script>

<template>
  <q-drawer
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    side="right"
    overlay
    behavior="mobile"
    elevated
    class="bg-deep-purple-2 text-deep-purple-10"
  >
    <div class="column fit">
      <div class="absolute-top relative-position bg-purple-10 w-full" style="height: 60px; z-index: 0;"></div>
      <div class="flex flex-column items-center" style="position: relative; z-index: 1;">
        <div :style="activityBorder" class="q-my-md q-mx-sm rounded-circle flex flex-center">
          <q-avatar size="60px">
            <q-img alt="" src="../assets/images/profile_pic.svg"/>
          </q-avatar>
        </div>
        <p class="text-bold q-mr-none text-white text-center text-italic">
          {{auth.user?.nick ?? 'x'}}
        </p>
      </div>

      <div class="q-mx-md">
        <p class="q-mb-none">Name: {{auth.user?.name ?? 'x'}}</p>
        <p class="q-mb-none">Surname: {{auth.user?.lastName ?? 'x'}}</p>
        <p class="q-mb-none">e-mail: {{auth.user?.email ?? 'x'}}</p>

      </div>

      <q-scroll-area class="col rounded-borders bg-deep-purple-3 q-ma-md q-pa-sm">
        <div contenteditable="true" style="outline: none;">
          I like cookies very much.
          But only as friends.
        </div>
      </q-scroll-area>

      <div class="text-center q-mt-md column items-center">
        <div class="q-mb-lg" style="width: 250px;">
          <p class="text-subtitle1 q-ma-none q-mb-xs text-bold">Notifications</p>
          <div class="row justify-around items-center">
            <q-radio keep-color v-model="notifType" val="all" label="All" color="teal-7" />
            <q-radio keep-color v-model="notifType" val="mentioned" label="@ tags" color="blue-7" />
            <q-radio keep-color v-model="notifType" val="none" label="None" color="pink-7" />
          </div>
        </div>

        <div style="width: 250px;">
          <p class="text-subtitle1 q-ma-none q-mb-xs text-bold">State</p>
          <div class="row justify-around items-center">
            <q-radio keep-color v-model="state" val="active" label="Online" color="teal-9" />
            <q-radio keep-color v-model="state" val="away" label="DND" color="blue-9" />
            <q-radio keep-color v-model="state" val="offline" label="Offline" color="pink-9" />
          </div>
        </div>

      </div>



      <q-btn @click="logout"  icon="arrow_back" label="Log-out" color="purple" class="q-ma-md"/>
    </div>
  </q-drawer>
</template>

<style scoped>
</style>
