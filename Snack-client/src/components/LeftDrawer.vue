<script setup lang="ts">
import { ref, onMounted } from "vue";
import AddChannel from "components/AddChannel.vue";
import ExitChannel from "components/ExitChannel.vue";
import { useChatStore } from "stores/chat";

const chat = useChatStore()
const miniState = ref(true)

const props = defineProps<{ DrawerOpen: boolean }>()
const emit = defineEmits<{ (e: "update:DrawerOpen", value: boolean): void }>()

onMounted(async () => {
  await chat.fetchChannels()
})

async function selectChannel(channelId: number) {
  await chat.loadChannel(channelId)
}
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
    <q-item :class="{'bg-purple-10': !miniState}">
      <q-item-section avatar />
      <q-item-section class="text-white text-bold text-body1">
        Channel list
      </q-item-section>
    </q-item>

    <q-scroll-area class="col text-white">
      <q-list padding>
        <q-item
          v-for="channel in chat.channels"
          :key="channel.id"
          clickable
          v-ripple
          @click="selectChannel(channel.id)"
          :active="chat.currentChannelId === channel.id"
          active-class="bg-purple-9"
        >
          <q-avatar class="q-pl-xs">
            <!--<q-badge floating color="red" v-if="n === 1">invite</q-badge> -->
            <!--<q-badge floating  color="teal"  v-if="n === 2 || n === 3">new</q-badge>-->
            <img alt="" src="../assets/images/channel_icon.svg" width="50" />
          </q-avatar>

          <q-item-section class="q-pl-md text-body2">
            <q-item-label>{{ channel.name }}</q-item-label>
          </q-item-section>

          <ExitChannel :n="channel.id" />
         <!-- <JoinChannel v-else :name="'Channel ' + n"/> -->
        </q-item>


      </q-list>
    </q-scroll-area>


    <AddChannel />

  </q-drawer>
</template>

<style scoped>
</style>
