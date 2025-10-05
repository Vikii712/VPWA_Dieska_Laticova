<script setup lang="ts">
  import { ref } from 'vue'
  import { useQuasar } from 'quasar'
  import LeftDrawer from "components/LeftDrawer.vue";
  import ChatComponent from "components/ChatComponent.vue";

  const leftDrawerOpen = ref<boolean>(false)
  const memberListOpen = ref<boolean>(false)

  function toggleLeftDrawer(): void {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  function toggleMemberList(): void {
    memberListOpen.value = !memberListOpen.value
  }

  const $q = useQuasar()

</script>

<template>
  <q-toolbar class="flex bg-deep-purple-2 text-deep-purple-10 fixed" style="z-index: 1">

    <q-btn
      dense flat round
      icon="list"
      @click="toggleLeftDrawer"
      v-show="$q.screen.width < 768"
    />

    <div class="row text-bold text-subtitle1">
      <p class="q-ma-none q-mr-sm">Friend's of food Channel</p>
      <p class="q-ma-none ">[private]</p>
    </div>

    <q-btn
      flat dense
      :icon="memberListOpen ? 'keyboard_arrow_right' : 'group'"
      @click="toggleMemberList"
      class="justify-end"
    />

    <q-drawer
      v-model="memberListOpen"
      side="right"
      absolute
      class="bg-deep-purple-2"
    >

    </q-drawer>

  </q-toolbar>
  <LeftDrawer v-model:DrawerOpen="leftDrawerOpen"/>

  <ChatComponent></ChatComponent>
</template>

<style scoped>

</style>
