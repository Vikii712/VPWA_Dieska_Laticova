<script setup lang="ts">

  import { useChatStore} from "stores/chat";

  const props = defineProps<{DrawerOpen: boolean}>()
  const emit = defineEmits<{(e: "update:DrawerOpen", value: boolean): void}>()
  const chat = useChatStore()

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
          v-for="user in chat.currentChannelUsers"
          :key="user.id"
          clickable
          class="q-pl-md q-pr-none"
        >
          <q-avatar>
            <q-badge floating class="q-ml-lg" color="teal">Active</q-badge>
            <img alt="" src="../assets/images/user_icon.svg" width="40" />
          </q-avatar>

          <q-item-section class="q-pl-md text-white">
            {{user.nick}}
          </q-item-section>
        </q-item>

      </q-list>
    </q-scroll-area>

  </q-drawer>
</template>

<style scoped>

</style>
