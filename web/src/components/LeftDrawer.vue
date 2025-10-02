<script setup lang="ts">

import {ref} from "vue";

const drawer = ref<boolean>(false)
const miniState = ref<boolean>(true)

</script>

<template>
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
</template>

<style scoped>

</style>
