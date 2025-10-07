<script setup lang="ts">
  import { ref } from 'vue'
  import RightDrawer from "components/RightDrawer.vue";
  import LeftDrawer from "components/LeftDrawer.vue"
  import ChannelPage from "pages/ChannelPage.vue";
  import {useQuasar} from "quasar";
  import MemberList from "components/MemberList.vue";

  const rightDrawerOpen = ref<boolean>(false)
  const $q = useQuasar()

  const leftDrawerOpen = ref(false)
  const memberListOpen = ref(false)

  function toggleRightDrawer(): void {
    rightDrawerOpen.value = !rightDrawerOpen.value
  }

  function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  function toggleMemberList() {
    memberListOpen.value = !memberListOpen.value
  }

</script>

<template>
  <q-layout view="hHh LpR fFf" class="bg-deep-purple-1">

    <q-header elevated class="bg-purple-10 text-deep-purple-1 shadow-md">
      <q-toolbar>
        <q-toolbar-title class="flex items-center">
            <img alt=""  src="../assets/images/logo.svg" width="130" class="q-pa-md">
        </q-toolbar-title>

        <q-btn dense flat round icon="account_circle" @click="toggleRightDrawer" color="deep-purple-2"/>
      </q-toolbar>

      <q-toolbar class="flex bg-deep-purple-7">
        <q-btn
          dense flat round
          icon="list"
          @click="toggleLeftDrawer"
          v-show="$q.screen.width < 768"
        />

        <q-toolbar-title class="row text-bold text-subtitle1">
          <p class="q-ma-none q-ml-xl">Friend's of food Channel</p>
          <p class="q-ml-sm q-my-none">[private]</p>
        </q-toolbar-title>

        <q-btn
          flat dense
          :icon="memberListOpen ? 'keyboard_arrow_right' : 'group'"
          @click="toggleMemberList"
        />
      </q-toolbar>

      <LeftDrawer v-model:DrawerOpen="leftDrawerOpen" />

      <MemberList v-model:DrawerOpen="memberListOpen" />

    </q-header>

    <RightDrawer v-model="rightDrawerOpen" />

    <q-page-container class="bg-dark q-py-xl">
      <ChannelPage/>
    </q-page-container>

  </q-layout>
</template>

<style scoped>

</style>
