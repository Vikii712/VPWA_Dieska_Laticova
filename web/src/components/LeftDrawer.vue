<script setup lang="ts">

import {ref} from "vue";
import AddChannel from "components/AddChannel.vue";
import ExitChannel from "components/ExitChannel.vue";

const miniState = ref<boolean>(true)

const props = defineProps<{DrawerOpen: boolean}>()
const emit = defineEmits<{(e: "update:DrawerOpen", value: boolean): void}>()

const truncate = (str: string) => {
  return str.length > 15 ? str.slice(0, 24) + "..." : str;
};

</script>

<template>
  <q-drawer
    :model-value="props.DrawerOpen"
    @update:model-value="emit('update:DrawerOpen', $event)"

    side="left"
    show-if-above
    elevated

    :mini="miniState"
    @mouseenter="miniState = false"
    @mouseleave="miniState = true"

    class="bg-deep-purple-7 column"
  >

    <q-item>
      <q-item-section avatar>
      </q-item-section>

      <q-item-section class="text-white text-bold">
        Channel list
      </q-item-section>
    </q-item>


    <q-scroll-area class="col text-white">

      <q-list padding>

        <q-item
          v-for="n in 10"
          :key="n"

          clickable
          v-ripple
        >
          <q-avatar class="q-pl-xs">
            <q-badge floating color="red" v-if="n === 1">invite</q-badge>
            <q-badge floating  color="teal"  v-if="n === 3 || n === 7">new</q-badge>
            <img alt="" src="../assets/images/channel_icon.svg" width="50" />
          </q-avatar>

          <q-item-section class="q-pl-sm">
             {{truncate("We post really long messages that don't make sense")}}
          </q-item-section>

          <ExitChannel/>
        </q-item>


      </q-list>
    </q-scroll-area>


    <AddChannel />

  </q-drawer>
</template>

<style scoped>
</style>
