<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import RightDrawer from 'components/RightDrawer.vue'
import LeftDrawer from 'components/LeftDrawer.vue'
import ChannelPage from 'pages/ChannelPage.vue'
import MemberList from 'components/MemberList.vue'
import { useChatStore } from 'stores/chat'
import { useSocketStore } from 'stores/socketStore'
import { useAuthStore } from 'stores/auth'
import { useCommandStore } from 'stores/commandStore'
import {useQuasar} from "quasar";

const chat = useChatStore()
const auth = useAuthStore()
const socketStore = useSocketStore()
const commandStore = useCommandStore()
const $q = useQuasar()

const rightDrawerOpen = ref(false)
const leftDrawerMini = ref(true)

const memberListOpen = computed({
  get: () => commandStore.memberListDrawerOpen,
  set: (val: boolean) => {
    commandStore.memberListDrawerOpen = val
  }
})

const miniWidth = computed(() => {
  return !$q.screen.lt.sm ? 56 : 0
})


const currentChannel = computed(() =>
  chat.channels.find(c => c.id === chat.currentChannelId)
)

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

function toggleLeftDrawer() {
  leftDrawerMini.value = !leftDrawerMini.value
}

function toggleMemberList() {
  memberListOpen.value = !memberListOpen.value
}

onMounted(() => {
  if (auth.token) {
    socketStore.init(auth.token)
  }
})
</script>

<template>
  <q-layout view="hHh LpR fFf" class="bg-dark">

    <!-- Header -->
    <q-header elevated class="bg-purple-10 text-deep-purple-1 shadow-md">
      <q-toolbar>
        <q-toolbar-title class="flex items-center">
          <img alt="" src="../assets/images/logo.svg" width="130" class="q-pa-md" />
        </q-toolbar-title>

        <q-btn dense flat round icon="account_circle" @click="toggleRightDrawer" color="deep-purple-2" />
      </q-toolbar>

      <q-toolbar class="flex bg-deep-purple-7">
        <q-btn
          flat dense
          :icon="leftDrawerMini ? 'keyboard_arrow_left' : 'list'"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="row items-center text-bold text-subtitle1">
          <q-item-label lines="1" class="q-ml-md-xl q-mr-sm">
            {{ currentChannel?.name || 'Please choose a channel' }}
          </q-item-label>
          <div>{{ currentChannel ? (currentChannel.public ? '[public]' : '[private]') : '' }}</div>
        </q-toolbar-title>

        <q-btn
          flat dense
          :icon="memberListOpen ? 'keyboard_arrow_right' : 'group'"
          @click="toggleMemberList"
        />
      </q-toolbar>
    </q-header>

    <LeftDrawer :mini="!leftDrawerMini" :mini-width="miniWidth"/>

    <MemberList v-model:DrawerOpen="memberListOpen" />

    <RightDrawer v-model="rightDrawerOpen" />

    <q-page-container class="bg-dark q-pt-xl">
      <ChannelPage :mini="leftDrawerMini" />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
</style>
