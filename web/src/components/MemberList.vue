<script setup lang="ts">

  const props = defineProps<{DrawerOpen: boolean}>()
  const emit = defineEmits<{(e: "update:DrawerOpen", value: boolean): void}>()

</script>

<template>
  <q-drawer
    :model-value="props.DrawerOpen"
    @update:model-value="emit('update:DrawerOpen', $event)"

    side="right"
    overlay
    elevated
    class="bg-deep-purple-7 column"
  >

    <q-item class="text-white text-bold justify-center q-pt-md">
        Member List
    </q-item>


    <q-scroll-area class="col text-white">

      <q-list padding>

        <q-item
          v-for="n in 15"
          :key="n"
          clickable
          class="q-pl-md"
        >
          <q-avatar>
            <q-badge floating class="q-ml-lg" v-if="n === 3 || n === 10">DND</q-badge>
            <q-badge floating class="q-ml-lg" color="red" v-else-if="n === 5 || n === 6">Offline</q-badge>
            <q-badge floating class="q-ml-lg"  color="teal" v-else>Active</q-badge>
            <img alt="" src="../assets/images/user_icon.svg" width="40" />
          </q-avatar>

          <q-item-section class="q-pl-md text-white">
            User {{n}}
          </q-item-section>
        </q-item>


      </q-list>
    </q-scroll-area>

  </q-drawer>
</template>

<style scoped>

</style>
