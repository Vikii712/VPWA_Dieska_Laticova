<script setup lang="ts">
import { useChatStore } from "stores/chat";
import { ref, computed } from "vue";

const props = defineProps<{ DrawerOpen: boolean }>();
const emit = defineEmits<{ (e: "update:DrawerOpen", value: boolean): void }>();
const chat = useChatStore();
const text = ref<string>("");
const showOnlyTyping = ref(false);

const displayedUsers = computed(() => {
  let users = chat.currentChannelUsers;

  if (showOnlyTyping.value) {
    users = users.filter(user => chat.isUserTyping(user.id));
  }

  if (text.value) {
    users = users.filter(user =>
      user.nick.toLowerCase().includes(text.value.toLowerCase())
    );
  }

  return users;
});

function getStatusColor(status: string) {
  switch(status) {
    case 'active': return 'teal'
    case 'away': return 'blue-9'
    case 'offline': return 'pink-7'
    default: return 'grey'
  }
}

function getStatusLabel(status: string) {
  switch(status) {
    case 'active': return 'Online'
    case 'away': return 'DND'
    case 'offline': return 'Offline'
    default: return 'Unknown'
  }
}
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

    <div>
      <q-toolbar class="text-white rounded-borders q-px-lg">
        <q-btn
          round
          dense
          flat
          :icon="showOnlyTyping ? 'edit' : 'edit_off'"
          :color="showOnlyTyping ? 'amber' : 'white'"
          class="q-mr-sm"
          @click="showOnlyTyping = !showOnlyTyping"
        >
          <q-tooltip>
            {{ showOnlyTyping ? 'Show everyone' : 'Show only typing users' }}
          </q-tooltip>
        </q-btn>

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
          v-for="user in displayedUsers"
          :key="user.id"
          clickable
          class="q-pl-md q-pr-none"
        >
          <q-avatar>
            <q-badge
              floating
              class="q-ml-lg"
              :color="getStatusColor(user.activity_status || 'offline')"
            >
              {{ getStatusLabel(user.activity_status || 'offline') }}
            </q-badge>
            <img alt="" src="../assets/images/user_icon.svg" width="40" />
          </q-avatar>

          <q-item-section class="q-pl-md text-white">
            {{ user.nick }}
          </q-item-section>

          <q-badge
            v-if="chat.isUserTyping(user.id)"
            color="orange"
            class="self-center q-ma-sm"
          >
            typing...
          </q-badge>

          <q-badge
            v-if="user.id === chat.moderatorId"
            class="self-center q-ma-sm text-white"
          >
            M
          </q-badge>
        </q-item>

        <q-item v-if="showOnlyTyping && displayedUsers.length === 0">
          <q-item-section class="text-center text-grey-5">
            No one is typing at this moment
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>
