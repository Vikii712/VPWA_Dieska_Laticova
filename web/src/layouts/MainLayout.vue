<script setup lang="ts">
  import { ref } from 'vue'
  import RightDrawer from "components/RightDrawer.vue";
  import ChannelPage from "pages/ChannelPage.vue";

  const rightDrawerOpen = ref<boolean>(false)

  function toggleRightDrawer(): void {
    rightDrawerOpen.value = !rightDrawerOpen.value
  }

</script>

<template>
  <q-layout view="hHh LpR fFf" class="bg-deep-purple-1">

    <q-header elevated class="bg-purple-10 text-deep-purple-1">
      <q-toolbar>
        <q-toolbar-title class="flex items-center">
            <img alt=""  src="../assets/images/logo.svg" width="130" class="q-pa-md">
        </q-toolbar-title>

        <q-btn dense flat round icon="account_circle" @click="toggleRightDrawer" color="deep-purple-2"/>
      </q-toolbar>

    </q-header>

    <RightDrawer v-model="rightDrawerOpen" />

    <q-page-container>
      <ChannelPage/>
    </q-page-container>

  </q-layout>
</template>

<style scoped>

</style>
