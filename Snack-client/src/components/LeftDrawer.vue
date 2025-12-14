<script setup lang="ts">
import AddChannel from "components/AddChannel.vue";
import ExitChannel from "components/ExitChannel.vue";
import JoinChannel from "components/JoinChannel.vue";
import { useChatStore } from "stores/chat";
import { computed, onMounted, ref } from "vue";
import { DateTime } from 'luxon'

const chat = useChatStore()

const props = defineProps<{mini: boolean}>()
const text = ref<string>("")

onMounted(async () => {
  await chat.fetchChannels()
})

async function selectChannel(channelId: number) {
  const channel = chat.channels.find(c => c.id === channelId)

  if (channel?.invited) {
    return
  }

  await chat.loadChannel(channelId)
  await chat.fetchChannels()
}

const filteredChannels = computed(() => {
  const searchTerm = text.value.toLowerCase().trim()

  if (!searchTerm) {
    return chat.channels
  }

  return chat.channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm)
  )
})

const sortedChannels = computed(() => {
  return [...filteredChannels.value].sort((a, b) => {
    if (a.invited && !b.invited) return -1
    if (!a.invited && b.invited) return 1

    if (a.unread && !b.unread) return -1
    if (b.unread && !a.unread) return 1

    const dateA = a.lastActiveAt ? DateTime.fromISO(a.lastActiveAt).toMillis() : 0
    const dateB = b.lastActiveAt ? DateTime.fromISO(b.lastActiveAt).toMillis() : 0

    return dateB - dateA
  })
})
</script>

<template>
  <q-drawer
    :model-value="true"
    :mini="props.mini"
    side="left"
    class="bg-deep-purple-7 column"
    :breakpoint="0"
  >
    <q-item :class="{'bg-deep-purple-7': !props.mini}">
      <q-item-section avatar />
      <q-item-section class="text-white text-bold text-body1">
        Channel list
      </q-item-section>
    </q-item>

    <div v-if="!props.mini">
      <q-toolbar class="text-white rounded-borders q-px-lg">
        <q-input dark dense standout v-model="text" class="col">
          <template v-slot:append>
            <q-icon v-if="text === ''" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="text = ''" />
          </template>
        </q-input>
      </q-toolbar>
    </div>

    <q-scroll-area class="col text-white">
      <q-list padding>
        <q-item
          v-for="channel in sortedChannels"
          :key="channel.id"
          clickable
          v-ripple
          @click="selectChannel(channel.id)"
          :active="!channel.invited && chat.currentChannelId === channel.id"
          active-class="bg-purple-9"
        >
          <q-avatar class="q-pl-xs">
            <img alt="" src="../assets/images/channel_icon.svg" width="50" />

            <q-badge
              v-if="channel.invited"
              color="orange"
              floating
              class="q-ml-sm"
            >
              invite
            </q-badge>

            <q-badge
              v-else-if="channel.unread"
              color="teal-10"
              floating
              class="q-ml-sm"
            >
              new
            </q-badge>
          </q-avatar>

          <q-item-section class="q-pl-md text-body2">
            <q-item-label>{{ channel.name }}</q-item-label>
          </q-item-section>

          <JoinChannel
            v-if="channel.invited"
            :channel-id="channel.id"
            :channel-name="channel.name"
          />
          <ExitChannel
            v-else
            :n="channel.id"
          />
        </q-item>
      </q-list>
    </q-scroll-area>

    <AddChannel/>
  </q-drawer>
</template>
