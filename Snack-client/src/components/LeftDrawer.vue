<script setup lang="ts">
import AddChannel from "components/AddChannel.vue";
import ExitChannel from "components/ExitChannel.vue";
import { useChatStore } from "stores/chat";
import {computed, onMounted} from "vue";

const chat = useChatStore()

const props = defineProps<{mini: boolean}>()

onMounted(async () => {
  await chat.fetchChannels()
})

async function selectChannel(channelId: number) {
  await chat.loadChannel(channelId)
}

const sortedChannels = computed(() => {
  return [...chat.channels].sort((a, b) => {
    const unreadA = chat.unreadChannels[a.id] || 0;
    const unreadB = chat.unreadChannels[b.id] || 0;

    if (unreadA > 0 && unreadB === 0) return -1;
    if (unreadB > 0 && unreadA === 0) return 1;
    return 0;
  });
});
</script>



<template>
  <q-drawer
    :model-value="true"
    :mini = "props.mini"

    side="left"

    class="bg-deep-purple-7 column"
  >
    <q-item :class="{'bg-purple-10': !props.mini}">
      <q-item-section avatar />
      <q-item-section class="text-white text-bold text-body1">
        Channel list
      </q-item-section>
    </q-item>

    <q-scroll-area class="col text-white">
      <q-list padding>
        <q-item
          v-for="channel in sortedChannels"
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
            <q-badge v-if="chat.unreadChannels[channel.id]! > 0"
                     color="seal-10"
                     floating
                     class="q-ml-sm"
            >
              new
            </q-badge>
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
