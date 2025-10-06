<script setup lang="ts">

import {ref} from "vue";

const miniState = ref<boolean>(true)

const props = defineProps<{DrawerOpen: boolean}>()
const emit = defineEmits<{(e: "update:DrawerOpen", value: boolean): void}>()

</script>

<template>
  <q-drawer
    :model-value="props.DrawerOpen"
    @update:model-value="emit('update:DrawerOpen', $event)"

    side="left"
    show-if-above
    :breakpoint="768"
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
          <q-item-section avatar>
            <img alt="" src="../assets/images/user_icon.svg" width="50" />
          </q-item-section>

          <q-item-section>
            Channel {{n}}
          </q-item-section>
        </q-item>


      </q-list>
    </q-scroll-area>


    <q-item clickable v-ripple>

      <q-item-section avatar>
        <q-icon name="add" />
      </q-item-section>

      <q-item-section>
        Add Channel
      </q-item-section>

    </q-item>

  </q-drawer>
</template>

<style scoped>
</style>
