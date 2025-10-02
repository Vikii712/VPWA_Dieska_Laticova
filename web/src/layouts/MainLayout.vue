<script setup lang="ts">
  import { ref } from 'vue'
  import LeftDrawer from "components/LeftDrawer.vue";
  import RightDrawer from "components/RightDrawer.vue";

  const rightDrawerOpen = ref<boolean>(false)

  function toggleRightDrawer(): void {
    rightDrawerOpen.value = !rightDrawerOpen.value
  }

</script>

<template>
  <q-layout view="hHr LpR fFf" class="bg-deep-purple-1">

    <q-header elevated class="bg-purple-10 text-deep-purple-1" height-hint="98">
      <q-toolbar>
        <q-toolbar-title class="flex items-center">
            <img alt=""  src="../assets/images/logo.svg" width="100">
        </q-toolbar-title>

        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>

    </q-header>

    <LeftDrawer />

    <RightDrawer v-model="rightDrawerOpen" />


    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<style scoped>

</style>
