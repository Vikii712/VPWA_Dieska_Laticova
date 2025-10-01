<script setup lang="ts">
  import { ref } from 'vue'

  const rightDrawerOpen = ref<boolean>(false)
  const drawer = ref<boolean>(false)
  const miniState = ref<boolean>(true)

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



    <q-drawer
      v-model:dark="drawer"
      side="left"
      bordered
      show-if-above

      :mini="miniState"
      @mouseenter="miniState = false"
      @mouseleave="miniState = true"

      class="bg-deep-purple-2"
    >
      <q-scroll-area class="fit text-black">
        <q-list padding>
          <q-item active clickable v-ripple>
            <q-item-section avatar>
              <img alt="" src="../assets/images/user_icon.svg" width="50" />
            </q-item-section>

            <q-item-section>
              Channel 1
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <img alt="" src="../assets/images/user_icon.svg" width="50"/>
            </q-item-section>

            <q-item-section>
              Channel 2
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <img alt="" src="../assets/images/user_icon.svg" width="50"/>
            </q-item-section>

            <q-item-section>
              Channel 3
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>


    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      overlay
      behavior="mobile"
      elevated

      class="bg-deep-purple-2"
    >

    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<style scoped>

</style>
