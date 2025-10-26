<script setup lang="ts">
import user1 from '../assets/images/profile_pic.svg'
import user2 from '../assets/images/PieMan.svg'
import user3 from '../assets/images/user_icon.svg'

import { ref } from 'vue'

const activeTypingId = ref<number | null>(null)

function toggleTyping(id: number) {
  if (activeTypingId.value === id) {
    activeTypingId.value = null
  } else {
    activeTypingId.value = id
  }
}

const typingEntries = [
  { id: 1,
    message: "This is the secret message i'm typing and you are not supposed to spy on me! That is not what friends dooo do doo" ,
    persona: "ByteBurger",
    user: user3,
  },
  { id: 2,
    message: "Yet another message that you shouldn't be reading!",
    persona: "Raspberry Pi",
    user: user2,
  },
  { id: 3,
    message: "Stop spying on my typing!",
    persona: "SudoSandwich",
    user: user3,
  },
]
</script>

<template>
  <q-infinite-scroll>
    <q-timeline color="deep-purple-6" class="q-px-lg q-pb-xl" layout='dense'>
      <q-timeline-entry
        v-for="i in 10"
        :key="i"
        :title="i % 2 === 0 ? 'You' : 'Raspberry Pi'"
        :subtitle="i % 2 === 0 ? 40 - i*2 + ' minutes ago' :  40 - i*2 + ' minutes ago'"
        :color="i % 2 === 0 ? 'teal' : 'blue-grey'"
        :avatar="i % 2 === 0 ? user1 : user2"
        class="text-white"
      >
        <div
          class="q-pa-sm text-white text-body1"
          :class="i % 2 === 0 ? 'bg-teal-10' : 'bg-blue-grey-10'"
        >
          {{ i % 2 === 0 ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' : '"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.' }}
        </div>
        <q-separator class="q-mb-0 q-mt-sm sep rounded-borders"/>
      </q-timeline-entry>

      <q-timeline-entry
        v-for="entry in typingEntries"
        :key="'typing-' + entry.id"
        color="blue-grey"
        :avatar=entry.user
        class="text-white"
      >
        <template #title>
            <span>
              {{entry.persona}}
            </span>
        </template>
        <div
          v-show="activeTypingId === entry.id"
          class="q-pa-sm text-white bg-grey-9 text-body1"
        >
          {{ entry.message }}
        </div>
        <q-spinner-dots
          size="2rem"
          @click="toggleTyping(entry.id)"
        />
      </q-timeline-entry>

      </q-timeline>
  </q-infinite-scroll>
</template>
<style scoped>

</style>
